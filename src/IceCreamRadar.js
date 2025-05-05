import { React, useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import throttle from 'lodash.throttle';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './App.css';
import ShopMarker from "./ShopMarker";
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'react-leaflet-cluster/lib/assets/MarkerCluster.css';
import 'react-leaflet-cluster/lib/assets/MarkerCluster.Default.css';
import SubmitPriceModal from './SubmitPriceModal';
import SubmitReviewModal from './SubmitReviewModal';
import LoginModal from './LoginModal';
import CheckinFrom from './CheckinForm';
import Header from './Header';
import DropdownSelect from './components/DropdownSelect';
import styled from 'styled-components';
import { useUser } from './context/UserContext';
import ShopDetailsView from './ShopDetailsView';
import { useParams, useNavigate } from 'react-router-dom';
import MapCenterOnShop from './components/MapCenterOnShop';

const IceCreamRadar = () => {
  const [iceCreamShops, setIceCreamShops] = useState([]);
  const [activeShop, setActiveShop] = useState(null);
  const cachedBounds = useRef([]);
  const [clustering, setClustering] = useState(true);
  const [selectedOption, setSelectedOption] = useState("Alle");
  const mapRef = useRef(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPriceForm, setShowPriceForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showCheckinForm, setShowCheckinForm] = useState(false);
  const [showDetailsView, setShowDetailsView] = useState(true);
  const { userId, isLoggedIn, userPosition, login, setUserPosition } = useUser();

  const { shopId } = useParams();
  const navigate = useNavigate();

  const fetchAndCenterShop = async (id) => {
    try {
      const response = await fetch(`https://ice-app.4lima.de/backend/get_eisdiele.php?eisdiele_id=${id}`);
      const data = await response.json();
      console.log('fetchAndCenterShop', data)
      setActiveShop(data);
      setShowDetailsView(false);
      setTimeout(() => setShowDetailsView(true), 0);

      if (mapRef.current) {
        mapRef.current.setView([data.eisdiele.latitude, data.eisdiele.longitude]);
      }
    } catch (err) {
      console.error('Fehler beim Abrufen der Shop-Details via URL:', err);
    }
  };

  useEffect(() => {
    if (shopId) {
      fetchAndCenterShop(shopId);
    }
  }, [shopId]);

  const fetchIceCreamShops = async (bounds) => {
    if (cachedBounds.current.some(cached =>
      bounds.minLat >= cached.minLat && bounds.maxLat <= cached.maxLat &&
      bounds.minLon >= cached.minLon && bounds.maxLon <= cached.maxLon
    )) return;

    cachedBounds.current.push(bounds);

    try {
      const query = `https://ice-app.de/backend/get_eisdielen_boundingbox.php?minLat=${bounds.minLat}&maxLat=${bounds.maxLat}&minLon=${bounds.minLon}&maxLon=${bounds.maxLon}&userId=${userId}`;
      const response = await fetch(query);
      const data = await response.json();
      setIceCreamShops(data);
    } catch (error) {
      console.error('Fehler beim Abrufen der Eisdielen:', error);
    }
  };

  const refreshShops = async () => {
    console.log("refreshShops");
    const bounds = mapRef.current?.getBounds();
    if (!bounds) return;

    try {
      const query = `https://ice-app.de/backend/get_eisdielen_boundingbox.php?minLat=${bounds.getSouth()}&maxLat=${bounds.getNorth()}&minLon=${bounds.getWest()}&maxLon=${bounds.getEast()}&userId=${userId}`;
      const response = await fetch(query);
      const data = await response.json();
      console.log(data);
      setIceCreamShops(data);
      cachedBounds.current = [];
    } catch (error) {
      console.error('Fehler beim Abrufen der Eisdielen:', error);
    }
  };

  const fetchShopDetails = async (shop) => {
    try {
      navigate(`/map/activeShop/${shop.eisdielen_id}`);
      setShowDetailsView(false); // Reset the state to ensure re-rendering
      setTimeout(() => setShowDetailsView(true), 0); // Reopen the view after resetting
    } catch (error) {
      console.error('Fehler beim Abrufen der Shop-Details:', error);
    }
  };

  // Geoposition des Nutzers laden
  useEffect(() => {
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
  }, [setUserPosition]);

  // Zentriere die Karte auf den Benutzerstandort, wenn die Position verfügbar ist
  useEffect(() => {
    if (mapRef.current && userPosition && !shopId) {
      mapRef.current.setView(userPosition, 14);
    }
  }, [userPosition, shopId]);

  const MapEventHandler = () => {
    const map = useMap();

    // useMemo, damit die throttled Funktion nicht bei jedem Render neu erstellt wird
    const throttledFetch = useMemo(() => {
      return throttle((bounds) => {
        fetchIceCreamShops(bounds);
      }, 1000); // 1000 ms = 1 Sekunde
    }, []);

    useEffect(() => {
      const onMoveEnd = () => {
        const bounds = map.getBounds();
        const newBounds = {
          minLat: bounds.getSouth(),
          maxLat: bounds.getNorth(),
          minLon: bounds.getWest(),
          maxLon: bounds.getEast()
        };
        throttledFetch(newBounds);
      };
      map.on('moveend', onMoveEnd);
      return () => map.off('moveend', onMoveEnd);
    }, [map, throttledFetch]);
    return null;
  };

  // Funktion zum Filtern der Eisdielen
  const filteredShops = iceCreamShops.filter(shop => {
    if (selectedOption === "Kugeleis") return shop.kugel_preis !== null;
    if (selectedOption === "Softeis") return shop.softeis_preis !== null;
    if (selectedOption === "Rating") return shop.PLV !== null;
    if (selectedOption === "Favoriten") return shop.is_favorit === 1;
    if (selectedOption === "Geschmack") return shop.avg_geschmack !== null;
    return true;
  });
  // Berechne den minimalen und maximalen Preis
  const prices = (selectedOption === "Alle" || selectedOption === "Favoriten") ? filteredShops.map(shop => shop.kugel_preis).concat(filteredShops.map(shop => shop.softeis_preis)).filter(price => price !== null) :
    selectedOption === "Kugeleis" ? filteredShops.map(shop => shop.kugel_preis).filter(price => price !== null) :
      selectedOption === "Softeis" ? filteredShops.map(shop => shop.softeis_preis).filter(price => price !== null) :
        selectedOption === "Rating" ? filteredShops.map(shop => shop.PLV).filter(plv => plv !== null) :
          selectedOption === "Geschmack" ? filteredShops.map(shop => shop.avg_geschmack).filter(avg_geschmack => avg_geschmack !== null) : null;
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  // Funktion zum Zentrieren der Karte auf den Benutzerstandort
  const centerMapOnUser = () => {
    if (mapRef.current && userPosition) {
      mapRef.current.setView(userPosition); // Zentriere die Karte auf die Benutzerposition
    }
  };

  const InitialFetch = ({ onInitialFetch }) => {
    const map = useMap();

    useEffect(() => {
      const bounds = map.getBounds();
      onInitialFetch({
        minLat: bounds.getSouth(),
        maxLat: bounds.getNorth(),
        minLon: bounds.getWest(),
        maxLon: bounds.getEast(),
      });
    }, [map, onInitialFetch]);

    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#ffb522' }}>
      <Header
        refreshShops={refreshShops}
      />
      <LogoContainer>
        <DropdownSelect
          options={["Alle", "Kugeleis", "Softeis", "Rating", "Favoriten", "Geschmack"]}
          onChange={(selectedOption) => {
            console.log("Ausgewählt:", selectedOption);
            setSelectedOption(selectedOption);
          }}
        />
        <YellowButton onClick={centerMapOnUser}>📍 Standort</YellowButton>
        <YellowButton onClick={() => setClustering(!clustering)}>
          {clustering ? 'Clustering: An' : 'Clustering: Aus'}
        </YellowButton>
      </LogoContainer>

      <MapContainer
        center={userPosition || [50.833707, 12.919187]}
        zoom={14}
        style={{ flex: 1, width: '100%' }}
        ref={mapRef}
      >

        <InitialFetch onInitialFetch={fetchIceCreamShops} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        <MapEventHandler />
        {activeShop && <MapCenterOnShop shop={activeShop} />}
        {clustering ? ( // show the clustered
          <MarkerClusterGroup maxClusterRadius={25}>
            {filteredShops.map((shop) => {
              return (
                <ShopMarker
                  key={shop.eisdielen_id}
                  shop={shop}
                  selectedOption={selectedOption}
                  minPrice={minPrice}
                  maxPrice={maxPrice}
                  plv={shop.PLV}
                  fetchShopDetails={fetchShopDetails}
                  fetchAndCenterShop={fetchAndCenterShop}
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
                plv={shop.PLV}
                fetchShopDetails={fetchShopDetails}
                fetchAndCenterShop={fetchAndCenterShop}
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
      {showLoginModal &&
        <LoginModal
          userId={userId}
          isLoggedIn={isLoggedIn}
          login={login}
          setShowLoginModal={setShowLoginModal}
        />
      }
      {showPriceForm && (<SubmitPriceModal
        shop={activeShop}
        userId={userId}
        showPriceForm={showPriceForm}
        setShowPriceForm={setShowPriceForm}
        refreshShops={refreshShops}
      />)}
      {showReviewForm && (<SubmitReviewModal
        shop={activeShop}
        userId={userId}
        showForm={showReviewForm}
        setShowForm={setShowReviewForm}
        refreshShops={refreshShops}
        setShowPriceForm={setShowPriceForm}
      />)}
      {showCheckinForm && (<CheckinFrom
        shop={activeShop}
        userId={userId}
        showCheckinForm={showCheckinForm}
        setShowCheckinForm={setShowCheckinForm}
      />)}
      {showDetailsView && activeShop && (
        <ShopDetailsView
          shop={activeShop}
          setShowPriceForm={setShowPriceForm}
          setShowReviewForm={setShowReviewForm}
          setShowCheckinForm={setShowCheckinForm}
          setIceCreamShops={setIceCreamShops}
          onClose={() => {
            setActiveShop(null);
            setShowDetailsView(false);
          }}
        />
      )}
    </div>
  );
};

export default IceCreamRadar;

const LogoContainer = styled.div`
  display: ruby;
  align-items: center;
  margin: 5px auto;
  color: black;
`;

const YellowButton = styled.button`
  background-color: #ffb522;
  color: black;
  padding: 0.6rem 1rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #ffcb4c;
  }
`;