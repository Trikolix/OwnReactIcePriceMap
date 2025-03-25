import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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
  const cachedBounds = useRef([]);
  const [userPosition, setUserPosition] = useState(null);
  const [clustering, setClustering] = useState(true);
  const [selectedOption, setSelectedOption] = useState("Alle");
  const mapRef = useRef(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [message, setMessage] = useState('');
  const [userId, setUserId] = useState(null);

  const fetchIceCreamShops = async (bounds) => {
    const boundsKey = `${bounds.minLat},${bounds.maxLat},${bounds.minLon},${bounds.maxLon}`;
    if (cachedBounds.current.some(cached =>
      bounds.minLat >= cached.minLat && bounds.maxLat <= cached.maxLat &&
      bounds.minLon >= cached.minLon && bounds.maxLon <= cached.maxLon
    )) return;

    cachedBounds.current.push(bounds);

    try {
      const query = `https://ice-app.4lima.de/backend/get_eisdielen_boundingbox.php?minLat=${bounds.minLat}&maxLat=${bounds.maxLat}&minLon=${bounds.minLon}&maxLon=${bounds.maxLon}`;
      const response = await fetch(query);
      const data = await response.json();
      console.log(data);
      setIceCreamShops(data);
    } catch (error) {
      console.error('Fehler beim Abrufen der Eisdielen:', error);
    }
  };

  /* const fetchIceCreamShops = async (latitude, longitude, radius) => {
    try {
      const query = `https://ice-app.4lima.de/backend/get_eisdiele_nahe.php?latitude=${latitude}&longitude=${longitude}&radius=${radius}`;
      const response = await fetch(query);
      const data = await response.json();
      console.log(data);
      setIceCreamShops(data.eisdielen);
    } catch (error) {
      console.error('Fehler beim Abrufen der Eisdielen:', error);
    }
  } */

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserPosition([latitude, longitude]);
          //fetchIceCreamShops(latitude, longitude, 50); // Radius kann angepasst werden
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

  const MapEventHandler = () => {
    const map = useMap();
    useEffect(() => {
      const onMoveEnd = () => {
        const bounds = map.getBounds();
        const newBounds = {
          minLat: bounds.getSouth(),
          maxLat: bounds.getNorth(),
          minLon: bounds.getWest(),
          maxLon: bounds.getEast()
        };
        fetchIceCreamShops(newBounds);
      };
      map.on('moveend', onMoveEnd);
      return () => map.off('moveend', onMoveEnd);
    }, [map]);
    return null;
  };

  const handleLogin = async () => {
    try {
      const response = await fetch('https://ice-app.4lima.de/backend/login.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          password
        })
      });

      const data = await response.json();
      console.log(data);
      if (data.status === 'success') {
        setUserId(data.userId);
        setIsLoggedIn(true);
        setMessage('Login erfolgreich!');
        // Schließen Sie das Modal nach 3 Sekunden
        setTimeout(() => {
          setShowLoginModal(false); // Angenommen, Sie haben einen State für das Modal
          setMessage('');
          setPassword('');
        }, 2000);
      } else {
        setMessage(`Login fehlgeschlagen: ${data.message}`);
      }
    } catch (error) {
      console.error("Error during login:", error); // Debugging
      setMessage('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };



  // Funktion zum Filtern der Eisdielen
  const filteredShops = iceCreamShops.filter(shop => {
    const hasCorrectIceType = selectedOption === "Alle" || (selectedOption === "Kugeleis" && shop.kugel_preis !== null) || (selectedOption === "Softeis" && shop.softeis_preis !== null)
    return hasCorrectIceType;
  });
  // Berechne den minimalen und maximalen Preis
  const prices = selectedOption === "Alle" ? filteredShops.map(shop => shop.kugel_preis).concat(filteredShops.map(shop => shop.softeis_preis)).filter(price => price !== null) :
    selectedOption === "Kugeleis" ? filteredShops.map(shop => shop.kugel_preis).filter(price => price !== null) :
      selectedOption === "Softeis" ? filteredShops.map(shop => shop.softeis_preis).filter(price => price !== null) : null;
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

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

  const closeLoginForm = () => {
    setShowLoginModal(false);
    setMessage('');
    setUsername('');
    setPassword('');
  };


  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#ffb522' }}>


      <div className="control-container">
        <img src={require('./header.png')} alt="Header" style={{ height: '150px', width: '150px', alignSelf: 'center' }} />
        <ToggleSwitch options={["Kugeleis", "Softeis", "Alle"]} onChange={handleToggleChange} />
        <button className="custom-button" onClick={centerMapOnUser}>Karte zentrieren</button>
        <button className="custom-button" onClick={() => setClustering(!clustering)}>
          {clustering ? 'Clustering deaktivieren' : 'Clustering aktivieren'}
        </button>
        <button
          className="custom-button"
          style={{ position: 'absolute', top: '10px', right: '10px' }}
          onClick={() => isLoggedIn ? handleLogout() : setShowLoginModal(true)}
        >
          {isLoggedIn ? 'Logout' : 'Login'}
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
        <MapEventHandler />
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
                key={shop.eisdielen_id}
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
      {showLoginModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Login</h2>
            <input
              type="text"
              placeholder="Benutzername"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              type="password"
              placeholder="Passwort"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            /><br></br>
            <button onClick={handleLogin}>Login</button>
            <p>{message}</p>
            {isLoggedIn && <p>Willkommen zurück, {username}!</p>}
            <button onClick={() => closeLoginForm()}>Schließen</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IceCreamRadar;