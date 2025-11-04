-- SmartPark Seed Data
-- This creates ~30 parking spots in a fictional city area with sample data

-- Sample users
INSERT INTO users (email, password_hash, full_name) VALUES
('john.doe@example.com', '$2b$10$dummyhash1234567890123456789012345678901234567890', 'John Doe'),
('jane.smith@example.com', '$2b$10$dummyhash1234567890123456789012345678901234567890', 'Jane Smith'),
('admin@smartpark.com', '$2b$10$dummyhash1234567890123456789012345678901234567890', 'Admin User');

-- Sample parking spots (30 spots across different zones)
-- Using coordinates around a fictional city center (40.7128° N, -74.0060° W - NYC-like area)
INSERT INTO spots (name, latitude, longitude, base_price, zone) VALUES
-- Downtown Zone (Premium)
('DT-A1', 40.7128, -74.0060, 8.00, 'downtown'),
('DT-A2', 40.7130, -74.0062, 8.00, 'downtown'),
('DT-A3', 40.7132, -74.0064, 8.00, 'downtown'),
('DT-A4', 40.7134, -74.0066, 8.00, 'downtown'),
('DT-A5', 40.7136, -74.0068, 8.00, 'downtown'),
('DT-B1', 40.7129, -74.0070, 8.50, 'downtown'),
('DT-B2', 40.7131, -74.0072, 8.50, 'downtown'),
('DT-B3', 40.7133, -74.0074, 8.50, 'downtown'),
('DT-B4', 40.7135, -74.0076, 8.50, 'downtown'),
('DT-B5', 40.7137, -74.0078, 8.50, 'downtown'),

-- Midtown Zone (Standard)
('MT-A1', 40.7500, -73.9900, 6.00, 'midtown'),
('MT-A2', 40.7502, -73.9902, 6.00, 'midtown'),
('MT-A3', 40.7504, -73.9904, 6.00, 'midtown'),
('MT-A4', 40.7506, -73.9906, 6.00, 'midtown'),
('MT-A5', 40.7508, -73.9908, 6.00, 'midtown'),
('MT-B1', 40.7501, -73.9910, 6.50, 'midtown'),
('MT-B2', 40.7503, -73.9912, 6.50, 'midtown'),
('MT-B3', 40.7505, -73.9914, 6.50, 'midtown'),
('MT-B4', 40.7507, -73.9916, 6.50, 'midtown'),
('MT-B5', 40.7509, -73.9918, 6.50, 'midtown'),

-- Residential Zone (Economy)
('RS-A1', 40.7700, -73.9600, 4.00, 'residential'),
('RS-A2', 40.7702, -73.9602, 4.00, 'residential'),
('RS-A3', 40.7704, -73.9604, 4.00, 'residential'),
('RS-A4', 40.7706, -73.9606, 4.00, 'residential'),
('RS-A5', 40.7708, -73.9608, 4.00, 'residential'),
('RS-B1', 40.7701, -73.9610, 4.50, 'residential'),
('RS-B2', 40.7703, -73.9612, 4.50, 'residential'),
('RS-B3', 40.7705, -73.9614, 4.50, 'residential'),
('RS-B4', 40.7707, -73.9616, 4.50, 'residential'),
('RS-B5', 40.7709, -73.9618, 4.50, 'residential');

-- Create sensors for all spots (initially with random occupancy)
INSERT INTO sensors (spot_id, is_occupied, sensor_status)
SELECT 
    id, 
    (RANDOM() > 0.6)::BOOLEAN,  -- ~40% initially occupied
    'active'
FROM spots;

-- Generate historical sensor events (last 24 hours)
-- This creates a realistic pattern of occupancy changes
DO $$
DECLARE
    spot_record RECORD;
    event_time TIMESTAMP;
    is_occ BOOLEAN;
    num_events INTEGER;
    i INTEGER;
BEGIN
    FOR spot_record IN SELECT id FROM spots LOOP
        -- Generate 10-30 events per spot over the last 24 hours
        num_events := 10 + FLOOR(RANDOM() * 20)::INTEGER;
        is_occ := FALSE;
        
        FOR i IN 1..num_events LOOP
            event_time := CURRENT_TIMESTAMP - (INTERVAL '24 hours' * RANDOM());
            is_occ := NOT is_occ; -- Toggle occupancy
            
            INSERT INTO sensor_events (sensor_id, spot_id, is_occupied, event_time, duration_minutes)
            VALUES (
                spot_record.id,
                spot_record.id,
                is_occ,
                event_time,
                15 + FLOOR(RANDOM() * 120)::INTEGER -- 15-135 minutes duration
            );
        END LOOP;
    END LOOP;
END $$;

-- Sample reservations (some past, some future)
INSERT INTO reservations (user_id, spot_id, start_time, end_time, price, status, payment_status, payment_transaction_id)
VALUES
-- Completed reservations
(1, 1, CURRENT_TIMESTAMP - INTERVAL '2 hours', CURRENT_TIMESTAMP - INTERVAL '1 hour', 8.00, 'completed', 'paid', 'TXN001'),
(2, 5, CURRENT_TIMESTAMP - INTERVAL '5 hours', CURRENT_TIMESTAMP - INTERVAL '3 hours', 16.00, 'completed', 'paid', 'TXN002'),
(1, 10, CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '1 day' + INTERVAL '2 hours', 17.00, 'completed', 'paid', 'TXN003'),

-- Active reservations
(2, 3, CURRENT_TIMESTAMP - INTERVAL '30 minutes', CURRENT_TIMESTAMP + INTERVAL '1 hour', 12.00, 'active', 'paid', 'TXN004'),
(1, 15, CURRENT_TIMESTAMP - INTERVAL '15 minutes', CURRENT_TIMESTAMP + INTERVAL '2 hours', 13.00, 'active', 'paid', 'TXN005'),

-- Future reservations
(2, 7, CURRENT_TIMESTAMP + INTERVAL '1 hour', CURRENT_TIMESTAMP + INTERVAL '3 hours', 17.00, 'confirmed', 'paid', 'TXN006'),
(1, 20, CURRENT_TIMESTAMP + INTERVAL '2 hours', CURRENT_TIMESTAMP + INTERVAL '4 hours', 13.00, 'confirmed', 'paid', 'TXN007'),
(2, 25, CURRENT_TIMESTAMP + INTERVAL '3 hours', CURRENT_TIMESTAMP + INTERVAL '5 hours', 9.00, 'pending', 'pending', NULL);

-- Sample pricing history
DO $$
DECLARE
    spot_record RECORD;
    hour INTEGER;
    occ_rate DECIMAL;
BEGIN
    FOR spot_record IN SELECT id, base_price, zone FROM spots LIMIT 10 LOOP
        FOR hour IN 0..23 LOOP
            -- Simulate different occupancy rates throughout the day
            IF hour >= 8 AND hour <= 18 THEN
                occ_rate := 60 + FLOOR(RANDOM() * 30)::DECIMAL; -- Peak hours: 60-90%
            ELSE
                occ_rate := 20 + FLOOR(RANDOM() * 30)::DECIMAL; -- Off-peak: 20-50%
            END IF;
            
            INSERT INTO pricing_history (spot_id, price, occupancy_rate, time_of_day, reason, recorded_at)
            VALUES (
                spot_record.id,
                spot_record.base_price * (1 + (occ_rate / 100) * 0.5), -- Price increases with occupancy
                occ_rate,
                hour,
                'Dynamic pricing adjustment',
                CURRENT_TIMESTAMP - INTERVAL '1 day' + (hour || ' hours')::INTERVAL
            );
        END LOOP;
    END LOOP;
END $$;
