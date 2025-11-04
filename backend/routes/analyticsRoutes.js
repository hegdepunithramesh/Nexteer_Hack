import express from 'express';
import { 
  predictSpotAvailability,
  getBestSpots,
  getSpotPricing,
  getPricingTrends,
  calculateReservationPricing
} from '../controllers/analyticsController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Prediction endpoints
router.get('/predict', optionalAuth, predictSpotAvailability);
router.get('/predict/best', optionalAuth, getBestSpots);

// Pricing endpoints
router.get('/pricing', optionalAuth, getSpotPricing);
router.get('/pricing/:spotId/trends', optionalAuth, getPricingTrends);
router.get('/pricing/calculate', optionalAuth, calculateReservationPricing);

export default router;
