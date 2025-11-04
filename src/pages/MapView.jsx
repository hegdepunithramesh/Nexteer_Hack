import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import React, { useContext, useState } from 'react';
import { SpotsContext } from '../context/SpotsContext';
import ReservationModal from '../components/ReservationModal';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet'; // ✅ ADD THIS LINE

export default function MapView() {
  const { spots } = useContext(SpotsContext);
  const [selectedSpot, setSelectedSpot] = useState(null);

  return (
    <div className="h-[calc(100vh-4rem)] w-full">
      <MapContainer
        center={[19.076, 72.877]}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {spots.map(spot => (
          <Marker
            key={spot.id}
            position={[spot.latitude, spot.longitude]}
            icon={L.icon({
              iconUrl: getMarkerIcon(spot.isOccupied, spot.prediction),
              iconSize: [24, 24],
            })}
            eventHandlers={{ click: () => setSelectedSpot(spot) }}
          >
            <Popup>
              <div>
                <h2>{spot.name}</h2>
                <p>{spot.isOccupied ? 'Occupied' : 'Free'}</p>
                <button
                  className="btn btn-primary mt-2"
                  onClick={() => setSelectedSpot(spot)}
                  disabled={spot.isOccupied}
                >
                  Reserve
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {selectedSpot && (
        <ReservationModal
          spot={selectedSpot}
          onClose={() => setSelectedSpot(null)}
        />
      )}
    </div>
  );
}

function getMarkerIcon(isOccupied, prediction) {
  if (isOccupied) return '/assets/red-marker.svg';
  if (prediction > 0.7) return '/assets/yellow-marker.svg';
  return '/assets/green-marker.svg';
}
