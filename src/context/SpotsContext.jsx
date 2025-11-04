import React, { createContext, useState, useEffect } from 'react';
import { getSpots } from '../api';
import { io } from 'socket.io-client';

export const SpotsContext = createContext();

export function SpotsProvider({ children }) {
  const [spots, setSpots] = useState([]);
  useEffect(() => {
    getSpots().then(resp => setSpots(resp.data));
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000/sensors');
    socket.on('sensor:update', ({ sensorId, isOccupied }) => {
      setSpots(prev => prev.map(spot => spot.sensorId === sensorId ? {...spot, isOccupied} : spot));
    });
    return () => socket.disconnect();
  }, []);
  return (
    <SpotsContext.Provider value={{ spots, setSpots }}>
      {children}
    </SpotsContext.Provider>
  );
}
