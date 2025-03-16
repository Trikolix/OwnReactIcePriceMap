import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './App.css';

// Funktion zur Berechnung der Farbe basierend auf dem Preis
const getColorBasedOnPrice = (price, minPrice, maxPrice) => {
  if (price === null) {
    return 'grey'; // Grau, wenn der Preis null ist
  }
  const ratio = (price - minPrice + 0.1) / (maxPrice - minPrice);
  const r = Math.floor(255 * ratio);
  const g = Math.floor(255 * (1 - ratio));
  const b = 0; // Blau bleibt 0, da wir nur zwischen Rot und Grün interpolieren
  return `rgb(${r}, ${g}, ${b})`;
};


const IceCreamRadar = () => {
  const [iceCreamShops, setIceCreamShops] = useState([]);
  
  // useState([
  //   { id: 1, name: 'Eiscafé Eis-Zapfen', price: null, lastPriceUpdate: null, position: [50.837021, 12.90473712], adress: "Uhlichstraße 18, 09112 Chemnitz", openingHours: "Mo-Fr: 12-17 Uhr; Sa-So: 12-17 Uhr" },
  //   { id: 2, name: 'Eiscafé Kohlebunker', price: null, lastPriceUpdate: null, position: [50.824928, 12.899595], adress: "Ulmenstraße 1, 09112 Chemnitz", openingHours: "Di-Fr: 13-18 Uhr; Sa-So: 12-18 Uhr" },
  //   { id: 3, name: 'Eis-Café Lunzenau', price: 1.6, lastPriceUpdate: "2025-03-06", position: [50.961954, 12.756064], adress: "Markt 11, 09328 Lunzenau", openingHours: null },
  //   { id: 4, name: 'Softeisdiele Hartha', price: null, lastPriceUpdate: null, position: [51.093884, 12.974721], adress: "Franz-Mehring-Straße 4, 04746 Hartha", openingHours: null },
  //   { id: 5, name: 'Rüllis Eismanufaktur', price: 2.0, lastPriceUpdate: "2024-02-01", position: [50.832999, 12.874314], adress: "Limbacher Str. 212, 09116 Chemnitz", openingHours: "Mo-Fr: 13-17 Uhr" },
  //   { id: 6, name: 'Bäckerei Förster', price: null, lastPriceUpdate: null, position: [50.836005, 12.519606], adress: "Siemensstraße 8, 08371 Glauchau", openingHours: "Mo-Sa: 06-17 Uhr; So: 13-17 Uhr" },
  //   { id: 7, name: 'Bistro & Eiscafe Zur Mel', price: null, lastPriceUpdate: null, position: [50.496214, 12.596914], adress: "Schulstraße 5, 08309 Eibenstock", openingHours: "Di-So: 11-17 Uhr" },
  //   { id: 8, name: 'Bravo Eiscafe & Bistro - Vollmershain', price: 2.0, lastPriceUpdate: null, position: [50.851029, 12.306548], adress: "Dorfstraße 70, 04626 Vollmershain", openingHours: "Di-Fr: 14-22 Uhr; Sa: 13-21 Uhr; So: 12-19 Uhr" },
  //   { id: 9, name: 'Eisdiele Dietz', price: null, lastPriceUpdate: null, position: [50.780604, 12.699031], adress: "Hauptstraße 6, 09355 Gersdorf", openingHours: null },
  //   { id: 10, name: 'BELLA CIAO', price: null, lastPriceUpdate: null, position: [50.802424, 12.708078], adress: "Altmarkt 17, 09337 Hohenstein-Ernstthal", openingHours: "täglich: 10-20 Uhr" },
  //   { id: 11, name: 'Corina Heil Eiscafé Fantasy', price: 1.4, lastPriceUpdate: "2024-02-01", position: [50.802148, 12.706420], adress: "Altmarkt 32, 09337 Hohenstein-Ernstthal", openingHours: "Di: 12:30-18 Uhr; Mi: 11-18 Uhr; Do-So: 12:30-18 Uhr" },
  //   { id: 12, name: 'Hübschmann\'s Eislädl', price: null, lastPriceUpdate: null, position: [50.724041, 13.092184], adress: "Alte Marienberger Str. 2, 09432 Großolbersdorf", openingHours: "Sa-So: 14-18 Uhr" },
  //   { id: 13, name: 'Eiscafé Börner', price: null, lastPriceUpdate: null, position: [50.859117, 13.167559], adress: "Lange Str. 22, 09569 Oederan", openingHours: null },
  //   { id: 14, name: 'Eis-Cafe Bartsch', price: null, lastPriceUpdate: null, position: [50.5148685, 13.088929], adress: "Annaberger Str. 15, 09477 Jöhstadt", openingHours: "Do-Di: 13-21 Uhr" },
  //   { id: 15, name: 'Café EISMAIK', price: 1.7, lastPriceUpdate: "2024-06-01", position: [50.93346789087332, 12.70526250737209], adress: "Brückenstraße 24, 09322 Penig", openingHours: "Di-Do: 13-18 Uhr; Sa-So: 13-18 Uhr" }
  // ]);

  const [userPosition, setUserPosition] = useState(null);
  const [maxPriceFilter, setMaxPriceFilter] = useState(null);
  const [openNowFilter, setOpenNowFilter] = useState(false);
  const mapRef = useRef(null);

  const fetchIceCreamShops = async (latitude, longitude, radius) => {
    try {
      const query = `https://ice-app.4lima.de/backend/get_eisdiele_nahe.php?latitude=${latitude}&longitude=${longitude}&radius=${radius}`;
      console.log(query);
      const response = await fetch(query);
      const data = await response.json();
      console.log(data);
      setIceCreamShops(data.eisdielen);
    } catch (error) {
      console.error('Fehler beim Abrufen der Eisdielen:', error);
    }
  }

  // Funktion zum Abrufen der detaillierten Informationen für eine Eisdiele
  const fetchIceCreamShopDetails = async (eisdieleId) => {
    try {
      const response = await fetch(`https://ice-app.4lima.de/backend/get_eisdiele.php?eisdiele_id=${eisdieleId}`);
      const data = await response.json();

      return data;
    } catch (error) {
      console.error('Fehler beim Abrufen der Eisdiele-Details:', error);
      return null;
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserPosition([latitude, longitude]);
          fetchIceCreamShops(latitude, longitude, 50); // Radius kann angepasst werden
        },
        (error) => {
          console.error('Fehler beim Abrufen der Position:', error);
        }
      );
    } else {
      console.error('Geolocation wird nicht unterstützt.');
    }
  }, []);

  // Zentriere die Karte auf den Benutzerstandort, wenn die Position verfügbar ist
  useEffect(() => {
    if (mapRef.current && userPosition) {
      mapRef.current.setView(userPosition, 11);
    }
  }, [userPosition]);

  // Berechne den minimalen und maximalen Preis
  const prices = iceCreamShops.map(shop => shop.kugel_preis).filter(kugel_preis => kugel_preis !== null);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  // Funktion zum Überprüfen, ob die Eisdiele jetzt geöffnet ist
  const isOpenNowFilter = (openingHours) => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sonntag, 1 = Montag, ..., 6 = Samstag
    const hours = now.getHours();
    const minutes = now.getMinutes();

    // Hier müsstest du die Öffnungszeiten parsen und überprüfen
    // Dies ist eine vereinfachte Version und muss angepasst werden
    // Beispiel: "Mo-Fr: 12-17 Uhr; Sa-So: 12-17 Uhr"
    if (openingHours === "???") return false;

    // Dummy-Implementierung, ersetze durch echte Logik
    return true;
  };

  // Funktion zum Zurücksetzen der Filter
  const resetFilters = () => {
    setMaxPriceFilter(null);
    setOpenNowFilter(false);
  };

  // Funktion zum Filtern der Eisdielen
  const filteredShops = iceCreamShops.filter(shop => {
    const isWithinPriceRange = maxPriceFilter === null || (shop.price !== null && shop.price <= maxPriceFilter);
    const isOpenNow = openNowFilter ? isOpenNowFilter(shop.openingHours) : true;
    return isWithinPriceRange && isOpenNow;
  });

  // Funktion zum Zentrieren der Karte auf den Benutzerstandort
  const centerMapOnUser = () => {
    if (mapRef.current && userPosition) {
      mapRef.current.setView(userPosition, 11); // Zentriere die Karte auf die Benutzerposition
    }
  }; 

  return (
    <div>
      <h1>Ice-Price-Radar</h1>
      <div>
        <label>
          Maximaler Preis:
          <input
            type="number"
            step="0.1"
            value={maxPriceFilter || ''}
            onChange={(e) => setMaxPriceFilter(e.target.value)}
            placeholder="Max. Preis"
          />
        </label>
        <label>
          Nur geöffnete Eisdielen anzeigen:
          <input
            type="checkbox"
            checked={openNowFilter}
            onChange={(e) => setOpenNowFilter(e.target.checked)}
          />
        </label>
        <button onClick={resetFilters}>Filter zurücksetzen</button>
        <button onClick={centerMapOnUser}>Auf meinen Standort zentrieren</button>
      </div>
      <MapContainer
        center={userPosition || [50.833707, 12.919187]}
        zoom={11}
        style={{ height: '700px', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {filteredShops.map((shop) => {
          const backgroundColor = getColorBasedOnPrice(shop.kugel_preis, minPrice, maxPrice);
          const displayPrice = shop.kugel_preis !== null ? `${Number(shop.kugel_preis).toFixed(2)} €` : '?';
          const displayOpeningHours = shop.openingHours !== null ? shop.openingHours : '???';
          const displayLastPriceUpdate = shop.lastPriceUpdate !== null ? `(zuletzt aktualisiert: ${shop.lastPriceUpdate})` : '';

          return (

            <Marker
              key={shop.id}
              position={[shop.latitude, shop.longitude]}
              icon={L.divIcon({
                className: 'price-icon',
                html: `<div style="background-color:${backgroundColor}">${displayPrice}</div>`,
                iconSize: [38, 38],
                iconAnchor: [19, 19],
                popupAnchor: [0, -19], // Verschiebt das Popup um 19 Pixel nach oben
              })}
            >
              <Popup>
                <div>
                  <h2>{shop.name}</h2>
                  <p>Preis: {displayPrice} / Kugel <span style={{ fontSize: 'smaller', color: 'grey' }}> {displayLastPriceUpdate} </span></p>
                  <p>Adresse: {shop.adress}</p>
                  <p>Öffnungszeiten: {displayOpeningHours}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
        {userPosition && (
          <Marker
            position={userPosition}
            icon={L.divIcon({
              className: 'user-location-icon',
              html: '<div style="background-color:blue; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>',
              iconSize: [12, 12],
              iconAnchor: [6, 6],
            })}
          >
            <Popup>
              <div>
                <h2>Dein Standort</h2>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default IceCreamRadar;