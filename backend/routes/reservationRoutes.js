import express from 'express';
import { 
  createReservation,
  getUserReservations,
  getReservationById,
  cancelReservation,
  confirmPayment,
  getAllReservations
} from '../controllers/reservationController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All reservation routes require authentication
router.use(authenticateToken);

// Create new reservation
router.post('/', createReservation);

// Get user's reservations
router.get('/', getUserReservations);

// Get all reservations (admin)
router.get('/all', getAllReservations);

// Get specific reservation
router.get('/:id', getReservationById);

// Cancel reservation
router.delete('/:id', cancelReservation);

// Confirm payment
router.post('/:id/payment', confirmPayment);

export default router;
