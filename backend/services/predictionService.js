import { pool } from '../config/database.js';

/**
 * EWMA (Exponentially Weighted Moving Average) Prediction
 * Predicts the probability that a spot will be free in the next N minutes
 */
export class PredictionService {
  constructor() {
    this.alpha = 0.3; // Smoothing factor (0 < alpha < 1)
  }

  /**
   * Predict availability for a specific spot
   * @param {number} spotId - The spot ID
   * @param {number} horizonMinutes - Prediction horizon in minutes (default: 15)
   * @returns {Promise<Object>} - Prediction result
   */
  async predictAvailability(spotId, horizonMinutes = 15) {
    try {
      // Get historical events for the last 1 hour
      const historyQuery = `
        SELECT is_occupied, event_time, duration_minutes
        FROM sensor_events
        WHERE spot_id = $1 
          AND event_time > NOW() - INTERVAL '1 hour'
        ORDER BY event_time DESC
        LIMIT 50
      `;
      
      const historyResult = await pool.query(historyQuery, [spotId]);
      const events = historyResult.rows;

      if (events.length === 0) {
        // No history, use current state
        const currentState = await this.getCurrentState(spotId);
        return {
          spotId,
          horizonMinutes,
          probFree: currentState.is_occupied ? 0.3 : 0.7,
          confidence: 'low',
          currentlyOccupied: currentState.is_occupied
        };
      }

      // Calculate EWMA
      const ewmaScore = this.calculateEWMA(events);
      
      // Get current state
      const currentState = await this.getCurrentState(spotId);
      
      // Calculate average occupancy duration
      const avgDuration = this.calculateAverageDuration(events);
      
      // Adjust prediction based on time horizon
      let probFree = 1 - ewmaScore;
      
      if (currentState.is_occupied) {
        // If currently occupied, factor in average duration
        if (horizonMinutes > avgDuration) {
          probFree = Math.min(probFree * 1.5, 0.95);
        } else {
          probFree = Math.max(probFree * 0.5, 0.1);
        }
      } else {
        // If currently free, higher probability it stays free
        probFree = Math.max(probFree, 0.6);
      }

      // Determine confidence level
      const confidence = this.determineConfidence(events.length, ewmaScore);

      return {
        spotId,
        horizonMinutes,
        probFree: Math.round(probFree * 100) / 100, // Round to 2 decimal places
        confidence,
        currentlyOccupied: currentState.is_occupied,
        avgOccupancyDuration: Math.round(avgDuration),
        historicalDataPoints: events.length
      };
    } catch (error) {
      console.error('Prediction error:', error);
      throw error;
    }
  }

  /**
   * Calculate EWMA score from historical events
   */
  calculateEWMA(events) {
    if (events.length === 0) return 0.5;

    let ewma = events[0].is_occupied ? 1 : 0;
    
    for (let i = 1; i < events.length; i++) {
      const value = events[i].is_occupied ? 1 : 0;
      ewma = this.alpha * value + (1 - this.alpha) * ewma;
    }

    return ewma;
  }

  /**
   * Calculate average duration of occupancy
   */
  calculateAverageDuration(events) {
    const occupiedEvents = events.filter(e => e.duration_minutes && e.is_occupied);
    
    if (occupiedEvents.length === 0) return 60; // Default 60 minutes

    const totalDuration = occupiedEvents.reduce((sum, e) => sum + e.duration_minutes, 0);
    return totalDuration / occupiedEvents.length;
  }

  /**
   * Get current state of a spot
   */
  async getCurrentState(spotId) {
    const result = await pool.query(
      'SELECT is_occupied, last_update FROM sensors WHERE spot_id = $1',
      [spotId]
    );
    
    return result.rows[0] || { is_occupied: false, last_update: new Date() };
  }

  /**
   * Determine confidence level based on data quality
   */
  determineConfidence(dataPoints, ewmaScore) {
    if (dataPoints < 5) return 'low';
    if (dataPoints < 15) return 'medium';
    
    // If EWMA is very close to 0 or 1, high confidence
    if (ewmaScore < 0.2 || ewmaScore > 0.8) return 'high';
    
    return 'medium';
  }

  /**
   * Batch prediction for multiple spots
   */
  async predictMultipleSpots(spotIds, horizonMinutes = 15) {
    const predictions = await Promise.all(
      spotIds.map(spotId => this.predictAvailability(spotId, horizonMinutes))
    );
    
    return predictions;
  }

  /**
   * Get best available spots based on prediction
   */
  async getBestAvailableSpots(limit = 5, horizonMinutes = 15) {
    // Get all spots
    const spotsResult = await pool.query('SELECT id FROM spots LIMIT 50');
    const spotIds = spotsResult.rows.map(row => row.id);

    // Get predictions
    const predictions = await this.predictMultipleSpots(spotIds, horizonMinutes);

    // Sort by probability of being free
    const sorted = predictions
      .sort((a, b) => b.probFree - a.probFree)
      .slice(0, limit);

    return sorted;
  }
}

export default new PredictionService();
