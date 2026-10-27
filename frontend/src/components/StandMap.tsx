import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default marker icon path issue in Webpack/Vite
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface StandMapProps {
  stands: Array<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    availableBikes: number;
    capacity: number;
    returnRadiusMeters: number;
  }>;
  userLocation: { lat: number; lng: number } | null;
  onSelectStand: (standId: string) => void;
}

export default function StandMap({ stands, userLocation, onSelectStand }: StandMapProps) {
  const defaultCenter = [12.7528, 80.1978] as [number, number];
  const center = userLocation ? [userLocation.lat, userLocation.lng] as [number, number] : defaultCenter;

  return (
    <div className="w-full h-80 sm:h-96 rounded-xl overflow-hidden border border-[var(--color-border)] shadow-sm">
      <MapContainer
        center={center}
        zoom={16}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {userLocation && (
          <Circle
            center={[userLocation.lat, userLocation.lng]}
            radius={25}
            pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.3 }}
          />
        )}

        {stands.map((stand) => (
          <React.Fragment key={stand.id}>
            <Circle
              center={[stand.latitude, stand.longitude]}
              radius={stand.returnRadiusMeters || 40}
              pathOptions={{
                color: stand.availableBikes > 0 ? '#2d8a4e' : '#ef4444',
                fillColor: stand.availableBikes > 0 ? '#2d8a4e' : '#ef4444',
                fillOpacity: 0.15,
              }}
            />
            <Marker
              position={[stand.latitude, stand.longitude]}
              icon={defaultIcon}
            >
              <Popup>
                <div className="p-1">
                  <h4 className="font-bold text-sm text-[var(--color-primary)]">{stand.name}</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    Available: <strong className="text-green-700">{stand.availableBikes}</strong> / {stand.capacity}
                  </p>
                  <button
                    onClick={() => onSelectStand(stand.id)}
                    className="mt-2 w-full text-xs bg-[var(--color-primary)] text-white py-1 px-2 rounded hover:opacity-90"
                  >
                    View Bikes
                  </button>
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
        ))}
      </MapContainer>
    </div>
  );
}
