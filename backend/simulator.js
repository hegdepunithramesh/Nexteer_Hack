import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:3001';
const UPDATE_INTERVAL = parseInt(process.env.SIMULATOR_INTERVAL) || 5000; // 5 seconds
const CHANGE_PROBABILITY = parseFloat(process.env.CHANGE_PROBABILITY) || 0.15; // 15% chance of change

/**
 * Sensor Simulator - Simulates random parking spot occupancy changes
 */
class SensorSimulator {
  constructor() {
    this.spots = [];
    this.running = false;
  }

  /**
   * Initialize - fetch all spots from API
   */
  async initialize() {
    try {
      console.log('🔄 Initializing sensor simulator...');
      const response = await axios.get(`${API_URL}/api/spots`);
      this.spots = response.data.spots;
      console.log(`✅ Loaded ${this.spots.length} parking spots`);
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize:', error.message);
      return false;
    }
  }

  /**
   * Simulate a sensor update for a random spot
   */
  async simulateUpdate() {
    if (this.spots.length === 0) {
      console.log('⚠️  No spots available');
      return;
    }

    // Randomly select spots to update (based on probability)
    const spotsToUpdate = this.spots.filter(() => Math.random() < CHANGE_PROBABILITY);

    if (spotsToUpdate.length === 0) {
      console.log('⏭️  No changes this cycle');
      return;
    }

    console.log(`🔄 Updating ${spotsToUpdate.length} spots...`);

    for (const spot of spotsToUpdate) {
      try {
        // Toggle occupancy status
        const newStatus = !spot.is_occupied;
        
        const response = await axios.post(`${API_URL}/api/spots/sensor-update`, {
          spotId: spot.id,
          isOccupied: newStatus
        });

        if (response.data.changed) {
          const emoji = newStatus ? '🚗' : '🅿️';
          console.log(`${emoji} Spot ${spot.name} (${spot.id}): ${spot.is_occupied ? 'OCCUPIED' : 'FREE'} → ${newStatus ? 'OCCUPIED' : 'FREE'}`);
          
          // Update local state
          spot.is_occupied = newStatus;
        }
      } catch (error) {
        console.error(`❌ Error updating spot ${spot.id}:`, error.message);
      }
    }
  }

  /**
   * Start the simulator
   */
  async start() {
    const initialized = await this.initialize();
    
    if (!initialized) {
      console.error('❌ Failed to start simulator - initialization failed');
      process.exit(1);
    }

    this.running = true;
    console.log(`\n🚀 Sensor simulator started!`);
    console.log(`📊 Monitoring ${this.spots.length} spots`);
    console.log(`⏱️  Update interval: ${UPDATE_INTERVAL}ms`);
    console.log(`🎲 Change probability: ${(CHANGE_PROBABILITY * 100).toFixed(1)}%`);
    console.log(`🌐 API URL: ${API_URL}\n`);

    // Run simulation loop
    while (this.running) {
      await this.simulateUpdate();
      await this.sleep(UPDATE_INTERVAL);
    }
  }

  /**
   * Stop the simulator
   */
  stop() {
    console.log('\n🛑 Stopping sensor simulator...');
    this.running = false;
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Show statistics
   */
  showStatistics() {
    const occupied = this.spots.filter(s => s.is_occupied).length;
    const available = this.spots.length - occupied;
    const occupancyRate = (occupied / this.spots.length * 100).toFixed(1);

    console.log('\n📊 Current Statistics:');
    console.log(`   Total Spots: ${this.spots.length}`);
    console.log(`   Occupied: ${occupied} (${occupancyRate}%)`);
    console.log(`   Available: ${available}`);
    console.log('');
  }
}

// Create and start simulator
const simulator = new SensorSimulator();

// Handle shutdown gracefully
process.on('SIGINT', () => {
  console.log('\n\n📊 Final Statistics:');
  simulator.showStatistics();
  simulator.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  simulator.stop();
  process.exit(0);
});

// Show statistics every 30 seconds
setInterval(() => {
  if (simulator.running) {
    simulator.showStatistics();
  }
}, 30000);

// Start the simulator
simulator.start();
