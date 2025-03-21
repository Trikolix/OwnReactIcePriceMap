import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './App.css';
import ToggleSwitch from "./ToggleSwitch";
import ShopMarker from "./ShopMarker";
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import 'react-leaflet-cluster/lib/assets/MarkerCluster.css';
import 'react-leaflet-cluster/lib/assets/MarkerCluster.Default.css';

const IceCreamRadar = () => {
  const [iceCreamShops, setIceCreamShops] = useState([]);
  const [userPosition, setUserPosition] = useState(null);
  const [clustering, setClustering] = useState(true);
  const [selectedOption, setSelectedOption] = useState("Alle");
  const mapRef = useRef(null);

  const fetchIceCreamShops = async (latitude, longitude, radius) => {
    try {
      const query = `https://ice-app.4lima.de/backend/get_eisdiele_nahe.php?latitude=${latitude}&longitude=${longitude}&radius=${radius}`;
      const response = await fetch(query);
      const data = await response.json();
      console.log(data);
      setIceCreamShops(data.eisdielen);
    } catch (error) {
      console.error('Fehler beim Abrufen der Eisdielen:', error);
    }
  }

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
      mapRef.current.setView(userPosition, 10);
    }
  }, [userPosition]);

  // Berechne den minimalen und maximalen Preis
  const prices = iceCreamShops.map(shop => shop.kugel_preis).concat(iceCreamShops.map(shop => shop.softeis_preis)).filter(price => price !== null);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  // Funktion zum Filtern der Eisdielen
  const filteredShops = iceCreamShops.filter(shop => {
    const hasCorrectIceType = selectedOption === "Alle" || (selectedOption === "Kugeleis" && shop.kugel_preis !== null) || (selectedOption === "Softeis" && shop.softeis_preis !== null)
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <h1>The Gourmet Cyclist</h1>

      <div className="control-container">
        <ToggleSwitch options={["Kugeleis", "Softeis", "Alle"]} onChange={handleToggleChange} />
        <button className="custom-button" onClick={centerMapOnUser}>Karte zentrieren</button>
        <button className="custom-button" onClick={() => setClustering(!clustering)}>
          {clustering ? 'Clustering deaktivieren' : 'Clustering aktivieren'}
        </button>
      </div>


      <MapContainer
        center={userPosition || [50.833707, 12.919187]}
        zoom={10}
        style={{ flex: 1, width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {clustering ? ( // show the clustered
          <MarkerClusterGroup maxClusterRadius={25}>
            {filteredShops.map((shop) => {
              return (
                <ShopMarker
                  key={shop.id}
                  shop={shop}
                  selectedOption={selectedOption}
                  minPrice={minPrice}
                  maxPrice={maxPrice}
                />
              );
            })}
          </MarkerClusterGroup>
        ) : ( // show them unclustered
          filteredShops.map((shop) => {
              return (
                <ShopMarker
                  key={shop.id}
                  shop={shop}
                  selectedOption={selectedOption}
                  minPrice={minPrice}
                  maxPrice={maxPrice}
                />
              );
            })
        )}
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