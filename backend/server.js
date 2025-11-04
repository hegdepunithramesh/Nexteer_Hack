import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './config/database.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import spotRoutes from './routes/spotRoutes.js';
import reservationRoutes from './routes/reservationRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make io accessible in routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// API Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'SmartPark API - Intelligent Real-Time Parking System',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      spots: '/api/spots',
      reservations: '/api/reservations',
      analytics: '/api/analytics'
    }
  });
});

// Health check route
app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      status: 'healthy', 
      database: 'connected',
      timestamp: result.rows[0].now 
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy', 
      database: 'disconnected',
      error: error.message 
    });
  }
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/spots', spotRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/analytics', analyticsRoutes);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  // Subscribe to specific spot updates
  socket.on('subscribe-spot', (spotId) => {
    socket.join(`spot-${spotId}`);
    console.log(`Client ${socket.id} subscribed to spot ${spotId}`);
  });

  // Unsubscribe from spot updates
  socket.on('unsubscribe-spot', (spotId) => {
    socket.leave(`spot-${spotId}`);
    console.log(`Client ${socket.id} unsubscribed from spot ${spotId}`);
  });

  // Subscribe to zone updates
  socket.on('subscribe-zone', (zone) => {
    socket.join(`zone-${zone}`);
    console.log(`Client ${socket.id} subscribed to zone ${zone}`);
  });

  // Test message handler
  socket.on('message', (data) => {
    console.log('Received message:', data);
    io.emit('message', data);
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`🚀 SmartPark API running on port ${PORT}`);
  console.log(`📡 Socket.io server ready`);
  console.log(`🌐 CORS enabled for: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('HTTP server closed');
    pool.end();
  });
});

// Export io for use in other modules if needed
export { io };
