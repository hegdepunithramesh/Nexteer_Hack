import express from 'express';
import { 
  getAllSpots, 
  getSpotById, 
  updateSensorData,
  getSpotStatistics
} from '../controllers/spotController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Get all spots (with optional filters)
router.get('/', optionalAuth, getAllSpots);

// Get statistics
router.get('/statistics', getSpotStatistics);

// Get specific spot
router.get('/:id', optionalAuth, getSpotById);

// Update sensor data (for simulator or actual sensors)
router.post('/sensor-update', updateSensorData);

export default router;
