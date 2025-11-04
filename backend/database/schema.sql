-- SmartPark Database Schema

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: spots (parking spots)
CREATE TABLE spots (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    base_price DECIMAL(10, 2) DEFAULT 5.00,
    zone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: sensors (linked to spots)
CREATE TABLE sensors (
    id SERIAL PRIMARY KEY,
    spot_id INTEGER UNIQUE NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
    is_occupied BOOLEAN DEFAULT FALSE,
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sensor_status VARCHAR(20) DEFAULT 'active' CHECK (sensor_status IN ('active', 'inactive', 'maintenance'))
);

-- Table: sensor_events (history of occupancy changes)
CREATE TABLE sensor_events (
    id SERIAL PRIMARY KEY,
    sensor_id INTEGER NOT NULL REFERENCES sensors(id) ON DELETE CASCADE,
    spot_id INTEGER NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
    is_occupied BOOLEAN NOT NULL,
    event_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    duration_minutes INTEGER -- Duration of the previous state before this event
);

-- Table: reservations
CREATE TABLE reservations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    spot_id INTEGER NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
    payment_transaction_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT no_overlap CHECK (start_time < end_time)
);

-- Table: pricing_history (record of dynamic price changes)
CREATE TABLE pricing_history (
    id SERIAL PRIMARY KEY,
    spot_id INTEGER NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
    price DECIMAL(10, 2) NOT NULL,
    occupancy_rate DECIMAL(5, 2), -- Percentage
    time_of_day INTEGER CHECK (time_of_day >= 0 AND time_of_day < 24),
    reason VARCHAR(255),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_spots_location ON spots(latitude, longitude);
CREATE INDEX idx_sensors_spot_id ON sensors(spot_id);
CREATE INDEX idx_sensor_events_sensor_id ON sensor_events(sensor_id);
CREATE INDEX idx_sensor_events_spot_id ON sensor_events(spot_id);
CREATE INDEX idx_sensor_events_time ON sensor_events(event_time DESC);
CREATE INDEX idx_reservations_spot_id ON reservations(spot_id);
CREATE INDEX idx_reservations_user_id ON reservations(user_id);
CREATE INDEX idx_reservations_time ON reservations(start_time, end_time);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_pricing_history_spot_id ON pricing_history(spot_id);
CREATE INDEX idx_pricing_history_time ON pricing_history(recorded_at DESC);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
