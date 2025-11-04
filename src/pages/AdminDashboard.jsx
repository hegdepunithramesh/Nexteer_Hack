import { useContext } from 'react';
import { SpotsContext } from '../context/SpotsContext';
import useReservations from '../hooks/useReservations';

export default function AdminDashboard() {
  const { spots } = useContext(SpotsContext);
  const { reservations } = useReservations();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="font-bold mb-2">Live Sensor Status</h2>
          <ul>
            {spots.map(s => (
              <li key={s.id} className="mb-1">
                {s.name}: {s.isOccupied ? 'Occupied' : 'Free'}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-bold mb-2">Reservations</h2>
          <ul>
            {reservations.map(r => (
              <li key={r.id}>
                Spot {r.spotId}, from {r.startTs} to {r.endTs}, Status: {r.status}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
