import { pool } from '../config/database.js';
import pricingService from '../services/pricingService.js';

/**
 * Create a new reservation
 */
export const createReservation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { spotId, startTime, endTime } = req.body;

    // Validate input
    if (!spotId || !startTime || !endTime) {
      return res.status(400).json({ error: 'spotId, startTime, and endTime are required' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return res.status(400).json({ error: 'Start time must be before end time' });
    }

    if (start < new Date()) {
      return res.status(400).json({ error: 'Start time cannot be in the past' });
    }

    // Check if spot exists
    const spotCheck = await pool.query('SELECT id FROM spots WHERE id = $1', [spotId]);
    if (spotCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Spot not found' });
    }

    // Check for conflicting reservations
    const conflictCheck = await pool.query(`
      SELECT id FROM reservations
      WHERE spot_id = $1
        AND status NOT IN ('cancelled', 'completed')
        AND (
          (start_time <= $2 AND end_time > $2) OR
          (start_time < $3 AND end_time >= $3) OR
          (start_time >= $2 AND end_time <= $3)
        )
    `, [spotId, start, end]);

    if (conflictCheck.rows.length > 0) {
      return res.status(409).json({ 
        error: 'Time slot conflicts with existing reservation',
        conflictingReservations: conflictCheck.rows.length
      });
    }

    // Calculate price
    const priceInfo = await pricingService.calculateReservationPrice(spotId, start, end);

    // Create reservation
    const result = await pool.query(`
      INSERT INTO reservations (user_id, spot_id, start_time, end_time, price, status, payment_status)
      VALUES ($1, $2, $3, $4, $5, 'pending', 'pending')
      RETURNING *
    `, [userId, spotId, start, end, priceInfo.totalPrice]);

    const reservation = result.rows[0];

    res.status(201).json({
      message: 'Reservation created successfully',
      reservation: {
        id: reservation.id,
        spotId: reservation.spot_id,
        startTime: reservation.start_time,
        endTime: reservation.end_time,
        price: reservation.price,
        status: reservation.status,
        paymentStatus: reservation.payment_status,
        createdAt: reservation.created_at
      },
      pricing: priceInfo
    });
  } catch (error) {
    console.error('Create reservation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get user's reservations
 */
export const getUserReservations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    let query = `
      SELECT 
        r.*,
        sp.name as spot_name,
        sp.latitude,
        sp.longitude,
        sp.zone
      FROM reservations r
      JOIN spots sp ON r.spot_id = sp.id
      WHERE r.user_id = $1
    `;

    const params = [userId];

    if (status) {
      query += ' AND r.status = $2';
      params.push(status);
    }

    query += ' ORDER BY r.start_time DESC';

    const result = await pool.query(query, params);

    res.json({
      count: result.rows.length,
      reservations: result.rows
    });
  } catch (error) {
    console.error('Get reservations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get a specific reservation
 */
export const getReservationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await pool.query(`
      SELECT 
        r.*,
        sp.name as spot_name,
        sp.latitude,
        sp.longitude,
        sp.zone,
        sp.base_price
      FROM reservations r
      JOIN spots sp ON r.spot_id = sp.id
      WHERE r.id = $1 AND r.user_id = $2
    `, [id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    res.json({ reservation: result.rows[0] });
  } catch (error) {
    console.error('Get reservation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Cancel a reservation
 */
export const cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if reservation exists and belongs to user
    const reservationCheck = await pool.query(
      'SELECT status, start_time FROM reservations WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (reservationCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    const reservation = reservationCheck.rows[0];

    if (reservation.status === 'cancelled') {
      return res.status(400).json({ error: 'Reservation already cancelled' });
    }

    if (reservation.status === 'completed') {
      return res.status(400).json({ error: 'Cannot cancel completed reservation' });
    }

    // Update reservation status
    await pool.query(
      'UPDATE reservations SET status = $1, payment_status = $2 WHERE id = $3',
      ['cancelled', 'refunded', id]
    );

    res.json({ message: 'Reservation cancelled successfully' });
  } catch (error) {
    console.error('Cancel reservation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Confirm payment (mock)
 */
export const confirmPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { paymentMethod } = req.body;

    // Check reservation
    const reservationCheck = await pool.query(
      'SELECT status, payment_status, price FROM reservations WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (reservationCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    const reservation = reservationCheck.rows[0];

    if (reservation.payment_status === 'paid') {
      return res.status(400).json({ error: 'Payment already completed' });
    }

    // Mock payment processing
    const transactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Update reservation
    await pool.query(
      'UPDATE reservations SET status = $1, payment_status = $2, payment_transaction_id = $3 WHERE id = $4',
      ['confirmed', 'paid', transactionId, id]
    );

    res.json({
      message: 'Payment successful',
      transactionId,
      amount: reservation.price,
      paymentMethod: paymentMethod || 'mock_payment'
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get all reservations (admin only)
 */
export const getAllReservations = async (req, res) => {
  try {
    const { status, spotId } = req.query;

    let query = `
      SELECT 
        r.*,
        sp.name as spot_name,
        sp.zone,
        u.email as user_email,
        u.full_name as user_name
      FROM reservations r
      JOIN spots sp ON r.spot_id = sp.id
      JOIN users u ON r.user_id = u.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (status) {
      query += ` AND r.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (spotId) {
      query += ` AND r.spot_id = $${paramCount}`;
      params.push(spotId);
      paramCount++;
    }

    query += ' ORDER BY r.created_at DESC LIMIT 100';

    const result = await pool.query(query, params);

    res.json({
      count: result.rows.length,
      reservations: result.rows
    });
  } catch (error) {
    console.error('Get all reservations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
