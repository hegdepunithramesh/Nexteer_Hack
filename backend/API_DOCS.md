# SmartPark API Documentation

Base URL: `http://localhost:3001`

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Auth Endpoints

### POST /api/auth/signup
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "fullName": "John Doe"
}
```

**Response (201):**
```json
{
  "message": "User created successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "fullName": "John Doe",
    "createdAt": "2025-11-04T10:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### POST /api/auth/login
Login to existing account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "fullName": "John Doe"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### GET /api/auth/profile
Get current user profile. **[Protected]**

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "created_at": "2025-11-04T10:00:00.000Z"
  }
}
```

---

## Spots Endpoints

### GET /api/spots
Get all parking spots with live occupancy status.

**Query Parameters:**
- `zone` (optional): Filter by zone (e.g., "downtown", "midtown", "residential")
- `available` (optional): Filter available spots (true/false)

**Example:** `/api/spots?zone=downtown&available=true`

**Response (200):**
```json
{
  "count": 30,
  "spots": [
    {
      "id": 1,
      "name": "DT-A1",
      "latitude": "40.71280000",
      "longitude": "-74.00600000",
      "base_price": "8.00",
      "zone": "downtown",
      "is_occupied": false,
      "last_update": "2025-11-04T10:30:00.000Z",
      "sensor_status": "active",
      "currentPrice": 12.00,
      "isPeakHour": true
    }
  ]
}
```

### GET /api/spots/:id
Get detailed information about a specific spot.

**Response (200):**
```json
{
  "id": 1,
  "name": "DT-A1",
  "latitude": "40.71280000",
  "longitude": "-74.00600000",
  "base_price": "8.00",
  "zone": "downtown",
  "is_occupied": false,
  "last_update": "2025-11-04T10:30:00.000Z",
  "sensor_status": "active",
  "pricing": {
    "spotId": 1,
    "spotName": "DT-A1",
    "basePrice": 8.00,
    "currentPrice": 12.00,
    "zone": "downtown",
    "isPeakHour": true,
    "occupancyRate": 75,
    "factors": [...]
  }
}
```

### GET /api/spots/statistics
Get overall parking statistics.

**Response (200):**
```json
{
  "overall": {
    "total_spots": "30",
    "occupied_spots": "18",
    "available_spots": "12",
    "occupancy_rate": "60.00"
  },
  "byZone": [
    {
      "zone": "downtown",
      "total": "10",
      "occupied": "8",
      "occupancy_rate": "80.00"
    }
  ]
}
```

### POST /api/spots/sensor-update
Update sensor occupancy data (used by simulator or actual sensors).

**Request Body:**
```json
{
  "spotId": 1,
  "isOccupied": true
}
```

**Response (200):**
```json
{
  "message": "Sensor updated successfully",
  "spotId": 1,
  "isOccupied": true,
  "changed": true
}
```

---

## Analytics Endpoints

### GET /api/analytics/predict
Predict availability for a specific spot using EWMA algorithm.

**Query Parameters:**
- `spotId` (required): Spot ID
- `horizon` (optional): Prediction horizon in minutes (default: 15, max: 120)

**Example:** `/api/analytics/predict?spotId=1&horizon=30`

**Response (200):**
```json
{
  "spotId": 1,
  "horizonMinutes": 30,
  "probFree": 0.75,
  "confidence": "high",
  "currentlyOccupied": false,
  "avgOccupancyDuration": 45,
  "historicalDataPoints": 25
}
```

### GET /api/analytics/predict/best
Get best available spots based on prediction.

**Query Parameters:**
- `limit` (optional): Number of spots to return (default: 5)
- `horizon` (optional): Prediction horizon in minutes (default: 15)

**Response (200):**
```json
{
  "count": 5,
  "predictions": [
    {
      "spotId": 15,
      "probFree": 0.92,
      "confidence": "high",
      "currentlyOccupied": false
    }
  ]
}
```

### GET /api/analytics/pricing
Get dynamic pricing for a specific spot.

**Query Parameters:**
- `spotId` (required): Spot ID

**Example:** `/api/analytics/pricing?spotId=1`

**Response (200):**
```json
{
  "spotId": 1,
  "spotName": "DT-A1",
  "basePrice": 8.00,
  "currentPrice": 12.00,
  "zone": "downtown",
  "isPeakHour": true,
  "occupancyRate": 75,
  "factors": [
    {
      "factor": "peak_hour",
      "multiplier": 1.5
    },
    {
      "factor": "normal_occupancy",
      "multiplier": 1.0,
      "rate": 0.75
    }
  ],
  "timestamp": "2025-11-04T10:30:00.000Z"
}
```

### GET /api/analytics/pricing/calculate
Calculate total price for a reservation period.

**Query Parameters:**
- `spotId` (required): Spot ID
- `startTime` (required): Start time (ISO 8601)
- `endTime` (required): End time (ISO 8601)

**Example:** `/api/analytics/pricing/calculate?spotId=1&startTime=2025-11-04T14:00:00Z&endTime=2025-11-04T16:00:00Z`

**Response (200):**
```json
{
  "spotId": 1,
  "spotName": "DT-A1",
  "basePrice": 8.00,
  "currentPrice": 12.00,
  "durationHours": 2,
  "totalPrice": 24.00,
  "pricePerHour": 12.00
}
```

### GET /api/analytics/pricing/:spotId/trends
Get pricing history trends for a spot.

**Query Parameters:**
- `hours` (optional): Hours back to retrieve (default: 24)

**Response (200):**
```json
{
  "spotId": 1,
  "hoursBack": 24,
  "dataPoints": 48,
  "trends": [
    {
      "price": "12.00",
      "occupancy_rate": "75.00",
      "time_of_day": 14,
      "recorded_at": "2025-11-04T14:00:00.000Z"
    }
  ]
}
```

---

## Reservations Endpoints

All reservation endpoints require authentication.

### POST /api/reservations
Create a new reservation. **[Protected]**

**Request Body:**
```json
{
  "spotId": 1,
  "startTime": "2025-11-04T14:00:00Z",
  "endTime": "2025-11-04T16:00:00Z"
}
```

**Response (201):**
```json
{
  "message": "Reservation created successfully",
  "reservation": {
    "id": 1,
    "spotId": 1,
    "startTime": "2025-11-04T14:00:00.000Z",
    "endTime": "2025-11-04T16:00:00.000Z",
    "price": "24.00",
    "status": "pending",
    "paymentStatus": "pending",
    "createdAt": "2025-11-04T10:30:00.000Z"
  },
  "pricing": {
    "totalPrice": 24.00,
    "pricePerHour": 12.00,
    "durationHours": 2
  }
}
```

### GET /api/reservations
Get current user's reservations. **[Protected]**

**Query Parameters:**
- `status` (optional): Filter by status ("pending", "confirmed", "active", "completed", "cancelled")

**Response (200):**
```json
{
  "count": 5,
  "reservations": [
    {
      "id": 1,
      "user_id": 1,
      "spot_id": 1,
      "spot_name": "DT-A1",
      "latitude": "40.71280000",
      "longitude": "-74.00600000",
      "zone": "downtown",
      "start_time": "2025-11-04T14:00:00.000Z",
      "end_time": "2025-11-04T16:00:00.000Z",
      "price": "24.00",
      "status": "confirmed",
      "payment_status": "paid",
      "payment_transaction_id": "TXN123456",
      "created_at": "2025-11-04T10:30:00.000Z"
    }
  ]
}
```

### GET /api/reservations/:id
Get a specific reservation. **[Protected]**

**Response (200):**
```json
{
  "reservation": {
    "id": 1,
    "user_id": 1,
    "spot_id": 1,
    "spot_name": "DT-A1",
    "latitude": "40.71280000",
    "longitude": "-74.00600000",
    "zone": "downtown",
    "base_price": "8.00",
    "start_time": "2025-11-04T14:00:00.000Z",
    "end_time": "2025-11-04T16:00:00.000Z",
    "price": "24.00",
    "status": "confirmed",
    "payment_status": "paid"
  }
}
```

### DELETE /api/reservations/:id
Cancel a reservation. **[Protected]**

**Response (200):**
```json
{
  "message": "Reservation cancelled successfully"
}
```

### POST /api/reservations/:id/payment
Confirm payment for a reservation (mock). **[Protected]**

**Request Body:**
```json
{
  "paymentMethod": "credit_card"
}
```

**Response (200):**
```json
{
  "message": "Payment successful",
  "transactionId": "TXN1730713800ABC123",
  "amount": "24.00",
  "paymentMethod": "credit_card"
}
```

### GET /api/reservations/all
Get all reservations (admin view). **[Protected]**

**Query Parameters:**
- `status` (optional): Filter by status
- `spotId` (optional): Filter by spot ID

**Response (200):**
```json
{
  "count": 50,
  "reservations": [
    {
      "id": 1,
      "spot_name": "DT-A1",
      "zone": "downtown",
      "user_email": "user@example.com",
      "user_name": "John Doe",
      "start_time": "2025-11-04T14:00:00.000Z",
      "end_time": "2025-11-04T16:00:00.000Z",
      "price": "24.00",
      "status": "confirmed"
    }
  ]
}
```

---

## Socket.IO Events

Connect to: `ws://localhost:3001`

### Client → Server Events

**subscribe-spot**
Subscribe to updates for a specific spot.
```javascript
socket.emit('subscribe-spot', 1); // spotId
```

**unsubscribe-spot**
Unsubscribe from spot updates.
```javascript
socket.emit('unsubscribe-spot', 1);
```

**subscribe-zone**
Subscribe to all spots in a zone.
```javascript
socket.emit('subscribe-zone', 'downtown');
```

### Server → Client Events

**sensor-update**
Sent when a spot's occupancy changes.
```javascript
socket.on('sensor-update', (data) => {
  console.log(data);
  // {
  //   spotId: 1,
  //   isOccupied: true,
  //   timestamp: "2025-11-04T10:30:00.000Z"
  // }
});
```

**connection**
```javascript
socket.on('connect', () => {
  console.log('Connected to SmartPark');
});
```

**disconnect**
```javascript
socket.on('disconnect', () => {
  console.log('Disconnected');
});
```

---

## Error Responses

All endpoints may return these error formats:

**400 Bad Request:**
```json
{
  "error": "spotId and isOccupied are required"
}
```

**401 Unauthorized:**
```json
{
  "error": "Access token required"
}
```

**403 Forbidden:**
```json
{
  "error": "Invalid or expired token"
}
```

**404 Not Found:**
```json
{
  "error": "Spot not found"
}
```

**409 Conflict:**
```json
{
  "error": "Time slot conflicts with existing reservation",
  "conflictingReservations": 1
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error"
}
```

---

## Rate Limiting

Currently no rate limiting is implemented. For production, consider adding rate limiting middleware.

## CORS

CORS is enabled for the frontend URL specified in `.env` (`CLIENT_URL`). Default: `http://localhost:5173`
