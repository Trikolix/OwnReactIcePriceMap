import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './App.css';
import ToggleSwitch from "./ToggleSwitch";

// Funktion zur Berechnung der Farbe basierend auf dem Preis
const getColorBasedOnPrice = (price, minPrice, maxPrice) => {
  if (price === null) {
    return 'grey'; // Grau, wenn der Preis null ist
  }
  const ratio = (price - minPrice) / (maxPrice - minPrice);
  const r = Math.floor(200 * ratio);
  const g = Math.floor(200 * (1 - ratio));
  const b = 0; // Blau bleibt 0, da wir nur zwischen Rot und Grün interpolieren
  return `rgb(${r}, ${g}, ${b})`;
};


const IceCreamRadar = () => {
  const [iceCreamShops, setIceCreamShops] = useState([]);
  const [userPosition, setUserPosition] = useState(null);
  const [maxPriceFilter, setMaxPriceFilter] = useState(null);
  const [openNowFilter, setOpenNowFilter] = useState(false);
  const [selectedOption, setSelectedOption] = useState("Alle Eisdielen");
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
    setSelectedOption("Alle Eisdielen");
  };

  // Funktion zum Filtern der Eisdielen
  const filteredShops = iceCreamShops.filter(shop => {
    const hasCorrectIceType = selectedOption === "Alle Eisdielen" || (selectedOption === "Kugeleis" && shop.kugel_preis !== null) || (selectedOption === "Softeis" && shop.softeis_preis !== null)
    return hasCorrectIceType;
  });

  // Funktion zum Zentrieren der Karte auf den Benutzerstandort
  const centerMapOnUser = () => {
    if (mapRef.current && userPosition) {
      mapRef.current.setView(userPosition); // Zentriere die Karte auf die Benutzerposition
    }
  };

  const handleToggleChange = (selectedOption) => {
    console.log("Ausgewählt:", selectedOption);
    setSelectedOption(selectedOption);
  };

  return (
    <div>
      <h1>Ice-Price-Radar</h1>

      <div className="control-container">
        <button className="custom-button" onClick={centerMapOnUser}>Auf meinen Standort zentrieren</button>
        <ToggleSwitch options={["Alle Eisdielen", "Kugeleis", "Softeis"]} onChange={handleToggleChange} />
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
          const displayPrice = selectedOption === "Softeis" ? `${Number(shop.softeis_preis).toFixed(2)} €`: shop.kugel_preis !== null ? `${Number(shop.kugel_preis).toFixed(2)} €` : '?';
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
                  <p>Adresse: {shop.adresse}</p>
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