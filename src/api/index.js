import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const getSpots = () => axios.get(`${API_BASE}/spots`);
export const getSpot = (id) => axios.get(`${API_BASE}/spots/${id}`);
export const createReservation = (data) => axios.post(`${API_BASE}/reservations`, data);
export const getReservations = (userId) => axios.get(`${API_BASE}/reservations?userId=${userId}`);
export const getPredict = (spotId, horizon) => axios.get(`${API_BASE}/predict?spotId=${spotId}&horizon=${horizon}`);
export const getPricing = (spotId) => axios.get(`${API_BASE}/pricing?spotId=${spotId}`);
