import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './App.css';

// Funktion zur Berechnung der Farbe basierend auf dem Preis
const getColorBasedOnPrice = (price, minPrice, maxPrice) => {
  if (price === null) {
    return 'grey'; // Grau, wenn der Preis null ist
  }
  const ratio = (price - minPrice) / (maxPrice - minPrice);
  const r = Math.floor(255 * ratio);
  const g = Math.floor(255 * (1 - ratio));
  const b = 0; // Blau bleibt 0, da wir nur zwischen Rot und Grün interpolieren
  return `rgb(${r}, ${g}, ${b})`;
};

// Erstelle ein benutzerdefiniertes DivIcon für den Preis
const priceIcon = (price) => L.divIcon({
  className: 'price-icon',
  html: `<div>${price} €</div>`,
  iconSize: [38, 38],
  iconAnchor: [19, 38],
});

// TODO: will be retrieved from a backend in the future
const IceCreamRadar = () => {
  const [iceCreamShops, setIceCreamShops] = useState([
    { id: 1, name: 'Eiscafé Eis-Zapfen', price: null, position: [50.837021, 12.90473712], adress: "Uhlichstraße 18, 09112 Chemnitz", openingHours: "Mo-Fr: 12-17 Uhr; Sa-So: 12-17 Uhr" },
    { id: 2, name: 'Eiscafé Kohlebunker', price: null, position: [50.824928, 12.899595], adress: "Ulmenstraße 1, 09112 Chemnitz", openingHours: "Di-Fr: 13-18 Uhr; Sa-So: 12-18 Uhr" },
    { id: 3, name: 'Eis-Café Lunzenau', price: 1.6, position: [50.961954, 12.756064], adress: "Markt 11, 09328 Lunzenau", openingHours: "???" },
    { id: 4, name: 'Softeisdiele Hartha', price: null, position: [51.093884, 12.974721], adress: "Franz-Mehring-Straße 4, 04746 Hartha", openingHours: "???" },
    { id: 5, name: 'Rüllis Eismanufaktur', price: 2.0, position: [50.832999, 12.874314], adress: "Limbacher Str. 212, 09116 Chemnitz", openingHours: "Mo-Fr: 13-17 Uhr" },
    { id: 6, name: 'Bäckerei Förster', price: null, position: [50.836005, 12.519606], adress: "Siemensstraße 8, 08371 Glauchau", openingHours: "Mo-Sa: 06-17 Uhr; So: 13-17 Uhr" },
    { id: 7, name: 'Bistro & Eiscafe Zur Mel', price: null, position: [50.496214, 12.596914], adress: "Schulstraße 5, 08309 Eibenstock", openingHours: "Di-So: 11-17 Uhr" },
    { id: 8, name: 'Bravo Eiscafe & Bistro - Vollmershain', price: 2.0, position: [50.851029, 12.306548], adress: "Dorfstraße 70, 04626 Vollmershain", openingHours: "Di-Fr: 14-22 Uhr; Sa: 13-21 Uhr; So: 12-19 Uhr" }
  ]);

  const [userPosition, setUserPosition] = useState(null);

  useEffect(() => {
    // Geolocation-API verwenden, um die Position des Nutzers zu erhalten
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserPosition([latitude, longitude]);
        },
        (error) => {
          console.error('Fehler beim Abrufen der Position:', error);
        }
      );
    } else {
      console.error('Geolocation wird nicht unterstützt.');
    }
  }, []);

  // Berechne den minimalen und maximalen Preis
  const minPrice = Math.min(...iceCreamShops.map(shop => shop.price));
  const maxPrice = Math.max(...iceCreamShops.map(shop => shop.price));

  return (
    <div>
      <h1>Ice-Price-Radar</h1>
      <MapContainer
        center={userPosition || [50.83370726457212, 12.919187149585742]}
        zoom={13}
        style={{ height: '500px', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {iceCreamShops.map((shop) => {
          const backgroundColor = getColorBasedOnPrice(shop.price, minPrice, maxPrice);
          const displayPrice = shop.price !== null ? `${Number(shop.price).toFixed(2)} €` : '? €';
          return (

            <Marker
              key={shop.id}
              position={shop.position}
              icon={L.divIcon({
                className: 'price-icon',
                html: `<div style="background-color:${backgroundColor}">${displayPrice}</div>`,
                iconSize: [38, 38],
                iconAnchor: [19, 2],
              })}
            >
              <Popup>
                <div>
                  <h2>{shop.name}</h2>
                  <p>Preis pro Kugel: {Number(shop.price).toFixed(2)} €</p>
                  <p>Adresse: {shop.adress}</p>
                  <p>Öffnungszeiten: {shop.openingHours}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default IceCreamRadar;