import predictionService from '../services/predictionService.js';
import pricingService from '../services/pricingService.js';

/**
 * Predict availability for a specific spot
 */
export const predictSpotAvailability = async (req, res) => {
  try {
    const { spotId, horizon } = req.query;

    if (!spotId) {
      return res.status(400).json({ error: 'spotId query parameter is required' });
    }

    const horizonMinutes = horizon ? parseInt(horizon) : 15;

    if (isNaN(horizonMinutes) || horizonMinutes < 1 || horizonMinutes > 120) {
      return res.status(400).json({ error: 'horizon must be between 1 and 120 minutes' });
    }

    const prediction = await predictionService.predictAvailability(
      parseInt(spotId),
      horizonMinutes
    );

    res.json(prediction);
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get best available spots
 */
export const getBestSpots = async (req, res) => {
  try {
    const { limit, horizon } = req.query;

    const limitNum = limit ? parseInt(limit) : 5;
    const horizonMinutes = horizon ? parseInt(horizon) : 15;

    const predictions = await predictionService.getBestAvailableSpots(
      limitNum,
      horizonMinutes
    );

    res.json({
      count: predictions.length,
      predictions
    });
  } catch (error) {
    console.error('Get best spots error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get dynamic pricing for a spot
 */
export const getSpotPricing = async (req, res) => {
  try {
    const { spotId } = req.query;

    if (!spotId) {
      return res.status(400).json({ error: 'spotId query parameter is required' });
    }

    const pricing = await pricingService.calculatePrice(parseInt(spotId));

    res.json(pricing);
  } catch (error) {
    console.error('Pricing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get pricing trends for a spot
 */
export const getPricingTrends = async (req, res) => {
  try {
    const { spotId } = req.params;
    const { hours } = req.query;

    const hoursBack = hours ? parseInt(hours) : 24;

    const trends = await pricingService.getPricingTrends(
      parseInt(spotId),
      hoursBack
    );

    res.json({
      spotId: parseInt(spotId),
      hoursBack,
      dataPoints: trends.length,
      trends
    });
  } catch (error) {
    console.error('Pricing trends error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Calculate reservation pricing
 */
export const calculateReservationPricing = async (req, res) => {
  try {
    const { spotId, startTime, endTime } = req.query;

    if (!spotId || !startTime || !endTime) {
      return res.status(400).json({ 
        error: 'spotId, startTime, and endTime query parameters are required' 
      });
    }

    const pricing = await pricingService.calculateReservationPrice(
      parseInt(spotId),
      startTime,
      endTime
    );

    res.json(pricing);
  } catch (error) {
    console.error('Calculate reservation pricing error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};
