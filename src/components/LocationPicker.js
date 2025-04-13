import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Leaflet Marker Icons fix (sonst fehlen sie manchmal)
import 'leaflet/dist/leaflet.css';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png'
});

const LocationPicker = ({ latitude, longitude, setLatitude, setLongitude }) => {
  const [markerPosition, setMarkerPosition] = useState([latitude, longitude]);

  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setMarkerPosition([lat, lng]);
        setLatitude(lat.toFixed(6));
        setLongitude(lng.toFixed(6));
      }
    });
    return null;
  };

  return (
    <MapContainer center={[latitude, longitude]} zoom={15} style={{ height: '300px', width: '100%' }}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler />
      <Marker
        position={markerPosition}
        draggable={true}
        eventHandlers={{
          dragend: (e) => {
            const { lat, lng } = e.target.getLatLng();
            setMarkerPosition([lat, lng]);
            setLatitude(lat.toFixed(6));
            setLongitude(lng.toFixed(6));
          }
        }}
      />
    </MapContainer>
  );
};

export default LocationPicker;
