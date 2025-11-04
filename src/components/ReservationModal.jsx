import React, { useState, useEffect } from 'react';
import { createReservation, getPredict, getPricing } from '../api';

export default function ReservationModal({ spot, onClose }) {
  const [loading, setLoading] = useState(false);
  const [reserved, setReserved] = useState(false);
  const [horizon, setHorizon] = useState(15);
  const [prediction, setPrediction] = useState(null);
  const [price, setPrice] = useState(null);

  useEffect(() => {
    getPredict(spot.id, horizon)
      .then(res => setPrediction(res.data.prob_free))
      .catch(err => console.error('Prediction error:', err));

    getPricing(spot.id)
      .then(res => setPrice(res.data.current_price))
      .catch(err => console.error('Pricing error:', err));
  }, [spot, horizon]);

  const handleReserve = async () => {
    setLoading(true);
    try {
      await createReservation({
        userId: 1, // Replace with actual user ID
        spotId: spot.id,
        startTs: new Date().toISOString(),
        endTs: new Date(Date.now() + horizon * 60000).toISOString(),
      });
      setReserved(true);
    } catch (err) {
      console.error('Reservation failed:', err);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-30 z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
        <h2 className="text-xl font-bold mb-2">{spot.name}</h2>
        <p>{spot.isOccupied ? 'Currently occupied.' : 'Currently free.'}</p>
        <p className="text-yellow-500">
          Prediction:{' '}
          {prediction !== null
            ? `${(prediction * 100).toFixed(0)}% likely free in ${horizon} min`
            : 'Loading...'}
        </p>
        <p className="text-green-600">
          Price: {price !== null ? `₹${price}` : 'Loading...'}
        </p>

        <input
          type="number"
          min="15"
          max="120"
          value={horizon}
          onChange={e => setHorizon(Number(e.target.value))}
          className="border mt-2 p-1 w-full"
        />

        <button
          className="bg-blue-500 text-white py-2 px-4 rounded w-full mt-3"
          onClick={handleReserve}
          disabled={spot.isOccupied || loading || reserved}
        >
          {reserved ? 'Reserved!' : loading ? 'Reserving...' : 'Reserve'}
        </button>

        <button className="mt-2 text-gray-500 w-full" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}
