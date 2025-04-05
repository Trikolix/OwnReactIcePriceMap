import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './App.css';
import ShopMarker from "./ShopMarker";
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'react-leaflet-cluster/lib/assets/MarkerCluster.css';
import 'react-leaflet-cluster/lib/assets/MarkerCluster.Default.css';
import SubmitIceShopForm from './SubmitIceShopForm';
import Header from './Header';
import FavoritenListe from './FavoritenListe';

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
  const [showSubmitNewIceShop, setShowSubmitNewIceShop] = useState(false);
  const [message, setMessage] = useState('');
  const [userId, setUserId] = useState(null);
  const [zeigeFavoriten, setZeigeFavoriten] = useState(false);

  const fetchIceCreamShops = async (bounds) => {
    if (cachedBounds.current.some(cached =>
      bounds.minLat >= cached.minLat && bounds.maxLat <= cached.maxLat &&
      bounds.minLon >= cached.minLon && bounds.maxLon <= cached.maxLon
    )) return;

    cachedBounds.current.push(bounds);

    try {
      const query = `https://ice-app.4lima.de/backend/get_eisdielen_boundingbox.php?minLat=${bounds.minLat}&maxLat=${bounds.maxLat}&minLon=${bounds.minLon}&maxLon=${bounds.maxLon}&userId=${userId}`;
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

  // Prüft beim Laden der Seite, ob der User noch eingeloggt ist
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");

    if (storedUserId) {
      setUserId(storedUserId);
      setIsLoggedIn(true);
    }
  }, []);

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
        console.log(userId);
        setIsLoggedIn(true);
        setMessage('Login erfolgreich!');

        localStorage.setItem('userId', data.userId);

        // Schließen Sie das Modal nach 2 Sekunden
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
    localStorage.removeItem('userId');
  };

  // Funktion zum Filtern der Eisdielen
  const filteredShops = iceCreamShops.filter(shop => {
      if (selectedOption === "Kugeleis") return shop.kugel_preis !== null;
      if (selectedOption === "Softeis") return shop.softeis_preis !== null;
      if (selectedOption === "Rating") return shop.PLV !== null;
      if (selectedOption === "Favoriten") {
        console.log(shop);
        console.log(shop.is_favorit == '1');
        return shop.is_favorit == '1';
      }
      return true;
  });
  // Berechne den minimalen und maximalen Preis
  const prices = (selectedOption === "Alle" || selectedOption === "Favoriten") ? filteredShops.map(shop => shop.kugel_preis).concat(filteredShops.map(shop => shop.softeis_preis)).filter(price => price !== null) :
    selectedOption === "Kugeleis" ? filteredShops.map(shop => shop.kugel_preis).filter(price => price !== null) :
      selectedOption === "Softeis" ? filteredShops.map(shop => shop.softeis_preis).filter(price => price !== null) :
        selectedOption === "Rating" ? filteredShops.map(shop => shop.PLV).filter(plv => plv !== null) : null;
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
      <Header
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
        setShowSubmitNewIceShop={setShowSubmitNewIceShop}
        setShowLoginModal={setShowLoginModal}
        handleToggleChange={handleToggleChange}
        centerMapOnUser={centerMapOnUser}
        clustering={clustering}
        setClustering={setClustering}
        setZeigeFavoriten={setZeigeFavoriten}
      />
      {zeigeFavoriten ? (
        <FavoritenListe userId={userId} isLoggedIn={isLoggedIn} />
      ) : <></>}
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
                  isLoggedIn={isLoggedIn}
                  userId={userId}
                  plv={shop.PLV}
                  setIceCreamShops={setIceCreamShops}
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
                isLoggedIn={isLoggedIn}
                userId={userId}
                plv={shop.PLV}
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
          <div className="modal-content" style={{ position: 'relative' }}>
            <button className="close-button" style={{ position: 'relative', top: '-10px', right: '-150px', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', outlineStyle: 'none' }} onClick={() => closeLoginForm()}>x</button>
            <h2>Login</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault(); // Verhindert das Neuladen der Seite
                handleLogin();
              }}
            >
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
              /><br />
              <button type="submit">Login</button>
            </form>
            <p>{message}</p>
            {isLoggedIn && <p>Willkommen zurück, {username}!</p>}
            <button onClick={() => closeLoginForm()}>Schließen</button>
          </div>
        </div>
      )}
      {showSubmitNewIceShop && (
        <SubmitIceShopForm
          showForm={showSubmitNewIceShop}
          setShowForm={setShowSubmitNewIceShop}
          userId={userId}
        />
      )}
    </div>
  );
};

export default IceCreamRadar;