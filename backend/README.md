# SmartPark Backend API

Backend for SmartPark - Intelligent Real-Time Parking System with AI predictions, dynamic pricing, and real-time updates.

## 🚀 Features

- **Real-time Updates** - Socket.io for live occupancy changes
- **AI Predictions** - EWMA algorithm for availability forecasting
- **Dynamic Pricing** - Multi-factor pricing engine
- **Reservations** - Complete booking system with conflict detection
- **Authentication** - JWT-based auth with bcrypt
- **Sensor Simulator** - Test data generator

## 📋 Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **PostgreSQL** 13+ 

### Install PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo service postgresql start
```

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Arch Linux:**
```bash
sudo pacman -S postgresql
sudo systemctl start postgresql
```

## ⚡ Quick Setup (3 Steps)

```bash
# 1. Install dependencies
npm install

# 2. Setup database (creates DB, schema, and seed data)
npm run db:setup

# 3. Start server
npm run dev
```

**In another terminal, start the simulator:**
```bash
npm run simulator
```

✅ **API running at:** http://localhost:3001

## 🧪 Test Installation

```bash
# Health check
curl http://localhost:3001/health

# Get parking spots
curl http://localhost:3001/api/spots

# Should return 30 spots
```

## 📡 API Endpoints

**30+ endpoints across 4 categories:**

- **Auth** - Signup, login, profile management
- **Spots** - List, filter, statistics, sensor updates
- **Reservations** - Create, view, cancel, payment (JWT protected)
- **Analytics** - Predictions, pricing, trends

📖 **Full API Reference:** See [API_DOCS.md](./API_DOCS.md)

## ⚡ Real-time Updates

Socket.IO events for live updates:
- `sensor-update` - Broadcasts when spot occupancy changes
- `subscribe-spot` - Subscribe to specific spot
- `subscribe-zone` - Subscribe to zone updates

## 📦 Import Postman Collection

Import `SmartPark_API.postman_collection.json` into Postman to test all endpoints easily.

## � Project Structure

```
backend/
├── config/           # Database configuration
├── controllers/      # API logic (auth, spots, reservations, analytics)
├── database/         # SQL schema & seed data
├── middleware/       # JWT authentication
├── routes/           # API route definitions
├── services/         # Business logic (prediction, pricing)
├── server.js         # Main Express + Socket.IO server
├── simulator.js      # Sensor data generator
└── package.json      # Dependencies & scripts
```

## 🤖 AI Features

**EWMA Prediction Algorithm:**
- Analyzes last hour of sensor events
- Returns probability (0-1) with confidence level
- Considers average occupancy duration

**Dynamic Pricing:**
- Base price by zone (Downtown: $8, Midtown: $6, Residential: $4)
- Peak hour multiplier (1.5x from 8 AM - 6 PM)
- Occupancy-based adjustment (high: 1.8x, low: 0.8x)
- Demand-based pricing

## � Database

**6 Tables:**
- `users` - Authentication
- `spots` - 30 parking locations
- `sensors` - Real-time status
- `sensor_events` - Historical data (for predictions)
- `reservations` - Bookings
- `pricing_history` - Price tracking

## �️ Available Commands

```bash
npm install          # Install dependencies
npm run dev          # Start server (development with auto-reload)
npm start            # Start server (production)
npm run simulator    # Start sensor simulator
npm run db:create    # Create database
npm run db:schema    # Run schema
npm run db:seed      # Add seed data
npm run db:setup     # Do all DB setup at once
```

## 🐛 Troubleshooting

**PostgreSQL not running?**
```bash
sudo service postgresql start  # Linux
brew services start postgresql # macOS
```

**Database connection fails?**
- Check credentials in `.env`
- Default user: `postgres`, password usually empty or `postgres`

**Port 3001 in use?**
```bash
lsof -ti:3001 | xargs kill -9
```

**Need to reset database?**
```bash
npm run db:setup  # Recreates everything
```

## 📚 Documentation

- **API_DOCS.md** - Complete API reference with examples
- **GETTING_STARTED.md** - Quick setup guide
- **SmartPark_API.postman_collection.json** - Postman collection

## � License

ISC

