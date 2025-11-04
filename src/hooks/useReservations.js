import { useEffect, useState } from 'react';
import { getReservations } from '../api';

export default function useReservations(userId = 1) {
  const [reservations, setReservations] = useState([]);
  useEffect(() => {
    getReservations(userId).then(resp => setReservations(resp.data));
  }, [userId]);
  return { reservations, setReservations };
}
