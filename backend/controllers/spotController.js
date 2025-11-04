import { pool } from '../config/database.js';
import pricingService from '../services/pricingService.js';

/**
 * Get all parking spots with live occupancy
 */
export const getAllSpots = async (req, res) => {
  try {
    const { zone, available } = req.query;

    let query = `
      SELECT 
        sp.id,
        sp.name,
        sp.latitude,
        sp.longitude,
        sp.base_price,
        sp.zone,
        s.is_occupied,
        s.last_update,
        s.sensor_status
      FROM spots sp
      LEFT JOIN sensors s ON sp.id = s.spot_id
    `;

    const conditions = [];
    const params = [];
    let paramCount = 1;

    if (zone) {
      conditions.push(`sp.zone = $${paramCount}`);
      params.push(zone);
      paramCount++;
    }

    if (available === 'true') {
      conditions.push(`s.is_occupied = false`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY sp.id';

    const result = await pool.query(query, params);

    // Get dynamic pricing for all spots
    const spotIds = result.rows.map(row => row.id);
    const prices = await pricingService.calculateMultiplePrices(spotIds);
    
    // Merge pricing info
    const spotsWithPricing = result.rows.map(spot => {
      const priceInfo = prices.find(p => p.spotId === spot.id);
      return {
        ...spot,
        currentPrice: priceInfo ? priceInfo.currentPrice : spot.base_price,
        isPeakHour: priceInfo ? priceInfo.isPeakHour : false
      };
    });

    res.json({
      count: spotsWithPricing.length,
      spots: spotsWithPricing
    });
  } catch (error) {
    console.error('Get spots error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get a specific spot by ID
 */
export const getSpotById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        sp.id,
        sp.name,
        sp.latitude,
        sp.longitude,
        sp.base_price,
        sp.zone,
        s.is_occupied,
        s.last_update,
        s.sensor_status
      FROM spots sp
      LEFT JOIN sensors s ON sp.id = s.spot_id
      WHERE sp.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Spot not found' });
    }

    const spot = result.rows[0];
    
    // Get dynamic pricing
    const priceInfo = await pricingService.calculatePrice(spot.id);

    res.json({
      ...spot,
      pricing: priceInfo
    });
  } catch (error) {
    console.error('Get spot error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update sensor data (occupancy status)
 */
export const updateSensorData = async (req, res) => {
  try {
    const { spotId, isOccupied } = req.body;

    if (spotId === undefined || isOccupied === undefined) {
      return res.status(400).json({ error: 'spotId and isOccupied are required' });
    }

    // Get current state
    const currentState = await pool.query(
      'SELECT is_occupied FROM sensors WHERE spot_id = $1',
      [spotId]
    );

    if (currentState.rows.length === 0) {
      return res.status(404).json({ error: 'Sensor not found for this spot' });
    }

    const wasOccupied = currentState.rows[0].is_occupied;

    // Update sensor
    await pool.query(
      'UPDATE sensors SET is_occupied = $1, last_update = CURRENT_TIMESTAMP WHERE spot_id = $2',
      [isOccupied, spotId]
    );

    // Record event if state changed
    if (wasOccupied !== isOccupied) {
      const sensorResult = await pool.query('SELECT id FROM sensors WHERE spot_id = $1', [spotId]);
      const sensorId = sensorResult.rows[0].id;

      await pool.query(
        'INSERT INTO sensor_events (sensor_id, spot_id, is_occupied) VALUES ($1, $2, $3)',
        [sensorId, spotId, isOccupied]
      );

      // Emit Socket.IO event (handled in server.js)
      req.io.emit('sensor-update', {
        spotId,
        isOccupied,
        timestamp: new Date()
      });
    }

    res.json({
      message: 'Sensor updated successfully',
      spotId,
      isOccupied,
      changed: wasOccupied !== isOccupied
    });
  } catch (error) {
    console.error('Update sensor error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get spot statistics
 */
export const getSpotStatistics = async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_spots,
        SUM(CASE WHEN s.is_occupied THEN 1 ELSE 0 END) as occupied_spots,
        SUM(CASE WHEN NOT s.is_occupied THEN 1 ELSE 0 END) as available_spots,
        ROUND(AVG(CASE WHEN s.is_occupied THEN 1 ELSE 0 END) * 100, 2) as occupancy_rate
      FROM spots sp
      LEFT JOIN sensors s ON sp.id = s.spot_id
    `);

    const zoneStats = await pool.query(`
      SELECT 
        sp.zone,
        COUNT(*) as total,
        SUM(CASE WHEN s.is_occupied THEN 1 ELSE 0 END) as occupied,
        ROUND(AVG(CASE WHEN s.is_occupied THEN 1 ELSE 0 END) * 100, 2) as occupancy_rate
      FROM spots sp
      LEFT JOIN sensors s ON sp.id = s.spot_id
      GROUP BY sp.zone
      ORDER BY sp.zone
    `);

    res.json({
      overall: stats.rows[0],
      byZone: zoneStats.rows
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
