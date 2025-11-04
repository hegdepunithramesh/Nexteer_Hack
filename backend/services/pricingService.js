import { pool } from '../config/database.js';

/**
 * Dynamic Pricing Service
 * Adjusts prices based on occupancy rate, time of day, and demand
 */
export class PricingService {
  constructor() {
    // Pricing multipliers
    this.peakHourMultiplier = 1.5;
    this.highOccupancyMultiplier = 1.8;
    this.lowOccupancyDiscount = 0.8;
    
    // Peak hours (8 AM - 6 PM)
    this.peakHours = { start: 8, end: 18 };
  }

  /**
   * Calculate dynamic price for a spot
   * @param {number} spotId - The spot ID
   * @returns {Promise<Object>} - Price information
   */
  async calculatePrice(spotId) {
    try {
      // Get spot base price
      const spotResult = await pool.query(
        'SELECT id, name, base_price, zone FROM spots WHERE id = $1',
        [spotId]
      );

      if (spotResult.rows.length === 0) {
        throw new Error('Spot not found');
      }

      const spot = spotResult.rows[0];
      let price = parseFloat(spot.base_price);
      const factors = [];

      // Factor 1: Time of day
      const currentHour = new Date().getHours();
      const isPeakHour = currentHour >= this.peakHours.start && currentHour < this.peakHours.end;
      
      if (isPeakHour) {
        price *= this.peakHourMultiplier;
        factors.push({ factor: 'peak_hour', multiplier: this.peakHourMultiplier });
      }

      // Factor 2: Zone-based occupancy rate
      const occupancyRate = await this.getZoneOccupancyRate(spot.zone);
      
      if (occupancyRate > 0.8) {
        // High demand
        price *= this.highOccupancyMultiplier;
        factors.push({ factor: 'high_occupancy', multiplier: this.highOccupancyMultiplier, rate: occupancyRate });
      } else if (occupancyRate < 0.3) {
        // Low demand - offer discount
        price *= this.lowOccupancyDiscount;
        factors.push({ factor: 'low_occupancy', multiplier: this.lowOccupancyDiscount, rate: occupancyRate });
      } else {
        factors.push({ factor: 'normal_occupancy', multiplier: 1.0, rate: occupancyRate });
      }

      // Factor 3: Individual spot recent demand
      const recentReservations = await this.getRecentReservations(spotId);
      if (recentReservations > 3) {
        const demandMultiplier = 1.2;
        price *= demandMultiplier;
        factors.push({ factor: 'high_demand', multiplier: demandMultiplier, reservations: recentReservations });
      }

      // Round to 2 decimal places
      price = Math.round(price * 100) / 100;

      // Record pricing history
      await this.recordPricingHistory(spotId, price, occupancyRate, currentHour, factors);

      return {
        spotId,
        spotName: spot.name,
        basePrice: parseFloat(spot.base_price),
        currentPrice: price,
        zone: spot.zone,
        isPeakHour,
        occupancyRate: Math.round(occupancyRate * 100),
        factors,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Pricing calculation error:', error);
      throw error;
    }
  }

  /**
   * Get occupancy rate for a zone
   */
  async getZoneOccupancyRate(zone) {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN s.is_occupied THEN 1 ELSE 0 END) as occupied
      FROM spots sp
      JOIN sensors s ON sp.id = s.spot_id
      WHERE sp.zone = $1
    `, [zone]);

    const { total, occupied } = result.rows[0];
    return total > 0 ? occupied / total : 0;
  }

  /**
   * Get number of recent reservations for a spot (last 24 hours)
   */
  async getRecentReservations(spotId) {
    const result = await pool.query(`
      SELECT COUNT(*) as count
      FROM reservations
      WHERE spot_id = $1
        AND created_at > NOW() - INTERVAL '24 hours'
    `, [spotId]);

    return parseInt(result.rows[0].count);
  }

  /**
   * Record pricing history
   */
  async recordPricingHistory(spotId, price, occupancyRate, timeOfDay, factors) {
    const reason = factors.map(f => f.factor).join(', ');
    
    await pool.query(`
      INSERT INTO pricing_history (spot_id, price, occupancy_rate, time_of_day, reason)
      VALUES ($1, $2, $3, $4, $5)
    `, [spotId, price, Math.round(occupancyRate * 100), timeOfDay, reason]);
  }

  /**
   * Calculate price for a reservation period
   */
  async calculateReservationPrice(spotId, startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationHours = (end - start) / (1000 * 60 * 60);

    if (durationHours <= 0) {
      throw new Error('Invalid time range');
    }

    // Get current dynamic price
    const priceInfo = await this.calculatePrice(spotId);
    
    // Calculate total price
    const totalPrice = Math.round(priceInfo.currentPrice * durationHours * 100) / 100;

    return {
      ...priceInfo,
      durationHours: Math.round(durationHours * 100) / 100,
      totalPrice,
      pricePerHour: priceInfo.currentPrice
    };
  }

  /**
   * Get pricing trends for a spot
   */
  async getPricingTrends(spotId, hoursBack = 24) {
    const result = await pool.query(`
      SELECT 
        price,
        occupancy_rate,
        time_of_day,
        recorded_at
      FROM pricing_history
      WHERE spot_id = $1
        AND recorded_at > NOW() - INTERVAL '${hoursBack} hours'
      ORDER BY recorded_at DESC
      LIMIT 50
    `, [spotId]);

    return result.rows;
  }

  /**
   * Batch pricing for multiple spots
   */
  async calculateMultiplePrices(spotIds) {
    const prices = await Promise.all(
      spotIds.map(spotId => this.calculatePrice(spotId).catch(err => null))
    );
    
    return prices.filter(p => p !== null);
  }
}

export default new PricingService();
