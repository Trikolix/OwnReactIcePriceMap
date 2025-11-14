import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './App.css';
import ShopMarker from "./ShopMarker";
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'react-leaflet-cluster/lib/assets/MarkerCluster.css';
import 'react-leaflet-cluster/lib/assets/MarkerCluster.Default.css';
import LoginModal from './LoginModal';
import Header from './Header';
import DropdownSelect from './components/DropdownSelect';
import styled from 'styled-components';
import { useUser } from './context/UserContext';
import ShopDetailsView from './ShopDetailsView';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import MapCenterOnShop from './components/MapCenterOnShop';
import ResetPasswordModal from "./components/ResetPasswordModal";

const LocateControl = ({ userPosition }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const locateControl = L.control({ position: 'topright' });
    locateControl.onAdd = () => {
      const container = L.DomUtil.create('div', 'leaflet-bar');
      const button = L.DomUtil.create('a', 'leaflet-control-locate', container);
      button.href = '#';
      button.textContent = '📍';
      button.title = userPosition ? 'Auf meinen Standort zentrieren' : 'Standort wird geladen …';

      if (!userPosition) {
        L.DomUtil.addClass(button, 'leaflet-disabled');
      }

      const handleClick = (event) => {
        L.DomEvent.stopPropagation(event);
        L.DomEvent.preventDefault(event);
        if (userPosition) {
          map.setView(userPosition);
        }
      };

      L.DomEvent.on(button, 'click', handleClick);
      L.DomEvent.disableClickPropagation(container);

      return container;
    };

    locateControl.addTo(map);

    return () => {
      locateControl.remove();
    };
  }, [map, userPosition]);

  return null;
};

const SearchToggleControl = ({ isSearchVisible, onToggle }) => {
  const map = useMap();
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!map) return;

    const toggleControl = L.control({ position: 'topright' });
    toggleControl.onAdd = () => {
      const container = L.DomUtil.create('div', 'leaflet-bar');
      const button = L.DomUtil.create('a', 'leaflet-control-search-toggle', container);
      button.href = '#';
      button.innerHTML = '🔍';
      buttonRef.current = button;

      const handleClick = (event) => {
        L.DomEvent.stopPropagation(event);
        L.DomEvent.preventDefault(event);
        onToggle();
      };

      L.DomEvent.on(button, 'click', handleClick);
      L.DomEvent.disableClickPropagation(container);

      return container;
    };

    toggleControl.addTo(map);

    return () => {
      buttonRef.current = null;
      toggleControl.remove();
    };
  }, [map, onToggle]);

  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    button.title = isSearchVisible ? 'Suchleiste schließen' : 'Suchleiste öffnen';
    if (isSearchVisible) {
      L.DomUtil.addClass(button, 'leaflet-active');
    } else {
      L.DomUtil.removeClass(button, 'leaflet-active');
    }
  }, [isSearchVisible]);

  return null;
};

const IceCreamRadar = () => {
  const location = useLocation();
  const [iceCreamShops, setIceCreamShops] = useState([]);
  const [activeShop, setActiveShop] = useState(null);
  const [clustering, setClustering] = useState(true);
  const [selectedOption, setSelectedOption] = useState("Alle");
  const mapRef = useRef(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showDetailsView, setShowDetailsView] = useState(true);
  const { userId, isLoggedIn, userPosition, login, setUserPosition } = useUser();
  const [initialCenter, setInitialCenter] = useState(userPosition || [50.833707, 12.919187]);
  const apiUrl = process.env.REACT_APP_API_BASE_URL;
  const [hasInteractedWithMap, setHasInteractedWithMap] = useState(false);
  const [openFilterMode, setOpenFilterMode] = useState('all');
  const [openFilterDateTime, setOpenFilterDateTime] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [shopMatches, setShopMatches] = useState([]);
  const [placeMatches, setPlaceMatches] = useState([]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchLocation, setSearchLocation] = useState(null);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const buildDefaultDateTimeValue = () => {
    const date = new Date();
    date.setMinutes(date.getMinutes() + 60);
    date.setSeconds(0, 0);
    return date.toISOString().slice(0, 16);
  };
const handleOpenFilterModeChange = (value) => {
    setOpenFilterMode(value);
    if (value === 'custom' && !openFilterDateTime) {
      setOpenFilterDateTime(buildDefaultDateTimeValue());
    }
  };
  const openFilterQueryString = useMemo(() => {
    if (openFilterMode === 'now') {
      return 'open_now=1';
    }
    if (openFilterMode === 'custom' && openFilterDateTime) {
      return `open_at=${encodeURIComponent(openFilterDateTime)}`;
    }
    return '';
  }, [openFilterMode, openFilterDateTime]);
  const openFilterOptions = useMemo(() => [
    { value: 'all', label: 'Jederzeit geöffnet' },
    { value: 'now', label: 'Jetzt geöffnet' },
    { value: 'custom', label: 'Geöffnet am …' },
  ], []);

  const { shopId, token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === "/login") {
      setShowLoginModal(true);
    }
  }, [location]);

  const fetchAndCenterShop = async (id) => {
    try {
      const detailQuery = openFilterQueryString ? `&${openFilterQueryString}` : "";
      const response = await fetch(`${apiUrl}/get_eisdiele.php?eisdiele_id=${id}${detailQuery}`);
      const data = await response.json();
      console.log('fetchAndCenterShop', data)
      setActiveShop(data);
      setShowDetailsView(true);
    } catch (err) {
      console.error('Fehler beim Abrufen der Shop-Details via URL:', err);
    }
  };

  useEffect(() => {
    if (shopId) {
      fetchAndCenterShop(shopId);
    }
  }, [shopId]);

  const getShopDisplayName = (shop) => {
    return shop.eisdielen_name || shop.eisdiele_name || shop.name || shop.eisdiele?.name || 'Unbenannte Eisdiele';
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setShopMatches([]);
      setPlaceMatches([]);
      setSearchError('');
      return;
    }

    const normalized = searchQuery.toLowerCase();
    const matches = iceCreamShops
      .filter((shop) => getShopDisplayName(shop)?.toLowerCase().includes(normalized))
      .slice(0, 5)
      .map((shop) => ({
        type: 'shop',
        id: shop.eisdielen_id,
        name: getShopDisplayName(shop),
        position: [shop.latitude, shop.longitude],
        raw: shop,
      }));

    setShopMatches(matches);
    setPlaceMatches([]);
  }, [searchQuery, iceCreamShops]);

  const fetchIceCreamShops = async () => {
    try {
      const querySuffix = openFilterQueryString ? `&${openFilterQueryString}` : "";
      const query = `${apiUrl}/get_all_eisdielen.php?userId=${userId}${querySuffix}`;
      const response = await fetch(query);
      const data = await response.json();
      setIceCreamShops(data);
    } catch (error) {
      console.error('Fehler beim Abrufen der Eisdielen:', error);
    }
  };

  const refreshShops = async () => {
    console.log("refreshShops");

    try {
      const querySuffix = openFilterQueryString ? `&${openFilterQueryString}` : "";
      const query = `${apiUrl}/get_all_eisdielen.php?&userId=${userId}${querySuffix}`;
      const response = await fetch(query);
      const data = await response.json();
      console.log(data);
      setIceCreamShops(data);
    } catch (error) {
      console.error('Fehler beim Abrufen der Eisdielen:', error);
    }
  };

  const fetchShopDetails = async (shop) => {
    try {
      const querySuffix = openFilterQueryString ? `?${openFilterQueryString}` : "";
      navigate(`/map/activeShop/${shop.eisdielen_id}${querySuffix}`);
      setShowDetailsView(false); // Reset the state to ensure re-rendering
      setTimeout(() => setShowDetailsView(true), 0); // Reopen the view after resetting
    } catch (error) {
      console.error('Fehler beim Abrufen der Shop-Details:', error);
    }
  };

  const handleSearchSubmit = async (event) => {
    event.preventDefault();
    if (!searchQuery.trim()) {
      return;
    }
    setIsGeocoding(true);
    setSearchError('');
    setPlaceMatches([]);

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'Accept-Language': 'de',
        },
      });
      if (!response.ok) {
        throw new Error('Geocoding error');
      }
      const data = await response.json();
      const formatted = data.map((item) => ({
        type: 'place',
        id: item.place_id,
        name: item.display_name,
        position: [Number(item.lat), Number(item.lon)],
      }));
      setPlaceMatches(formatted);
      if (!formatted.length) {
        setSearchError('Kein Ort gefunden.');
      }
    } catch (error) {
      console.error('Fehler bei der Ortssuche:', error);
      setSearchError('Ortssuche fehlgeschlagen.');
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSelectShop = (shopMatch) => {
    setSearchQuery(shopMatch.name);
    fetchAndCenterShop(shopMatch.id);
    setSearchLocation(null);
  };

  const handleSelectPlace = (placeMatch) => {
    if (mapRef.current) {
      mapRef.current.setView(placeMatch.position, 14);
    }
    setSearchQuery(placeMatch.name);
    setSearchLocation(placeMatch);
  };

  const toggleSearchVisibility = useCallback(() => {
    setIsSearchVisible((prev) => !prev);
  }, []);

  // Geoposition des Nutzers laden
  useEffect(() => {
    if (!userPosition && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newPos = [latitude, longitude];
          setUserPosition(newPos); // speichert im localStorage
          setInitialCenter(newPos); // nur einmal fürs initiale Laden
        },
        (error) => {
          console.error('Fehler beim Abrufen der Position:', error);
        }
      );
    }
  }, [userPosition, setUserPosition]);

  // Zentriere die Karte auf den Benutzerstandort, wenn die Position verfügbar ist
  useEffect(() => {
    if (mapRef.current && userPosition && !shopId && !hasInteractedWithMap) {
      mapRef.current.setView(userPosition, 14);
    }
  }, [userPosition, shopId, hasInteractedWithMap]);


  // Funktion zum Filtern der Eisdielen
  const filteredShops = iceCreamShops.filter(shop => {
    if (selectedOption === "Kugel: Preis") return shop.kugel_preis !== null;
    if (selectedOption === "Softeis: Preis") return shop.softeis_preis !== null;
    if (selectedOption === "Kugel: Rating") return shop.finaler_kugel_score !== null;
    if (selectedOption === "Softeis: Rating") return shop.finaler_softeis_score !== null;
    if (selectedOption === "Eisbecher: Rating") return shop.finaler_eisbecher_score !== null;
    if (selectedOption === "Favoriten") return shop.is_favorit === 1;
    if (selectedOption === "Besucht") return Number(shop.has_visited) === 1;
    if (selectedOption === "Nicht besucht") return Number(shop.has_visited) === 0;
    return true;
  });
  // Berechne den minimalen und maximalen Preis
  const prices = (selectedOption === "Alle" || selectedOption === "Favoriten" || selectedOption === "Besucht" || selectedOption === "Nicht besucht") ? filteredShops.map(shop => shop.kugel_preis_eur).concat(filteredShops.map(shop => shop.softeis_preis_eur)).filter(price => price !== null) :
    selectedOption === "Kugel: Preis" ? filteredShops.map(shop => shop.kugel_preis_eur).filter(price => price !== null) :
      selectedOption === "Softeis: Preis" ? filteredShops.map(shop => shop.softeis_preis_eur).filter(price => price !== null) :
        selectedOption === "Kugel: Rating" ? filteredShops.map(shop => shop.finaler_kugel_score).filter(kugelscore => kugelscore !== null) :
          selectedOption === "Softeis: Rating" ? filteredShops.map(shop => shop.finaler_softeis_score).filter(softeisscore => softeisscore !== null) :
            selectedOption === "Eisbecher: Rating" ? filteredShops.map(shop => shop.finaler_eisbecher_score).filter(becherscore => becherscore !== null) : null;
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  useEffect(() => {
    if (userId !== undefined) {
      fetchIceCreamShops();
    }
  }, [userId, openFilterQueryString]);

  const baseOptions = [
    "Alle",
    "Kugel: Preis",
    "Softeis: Preis",
    "Kugel: Rating",
    "Softeis: Rating",
    "Eisbecher: Rating"
  ];
  // Nur wenn userId gesetzt ist, Favoriten hinzufügen
  const userOptions = userId ? ["Favoriten", "Besucht", "Nicht besucht"] : [];

  const options = [...baseOptions, ...userOptions];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#ffb522' }}>
      <Header
        refreshShops={refreshShops}
      />
      <LogoContainer>
        <DropdownSelect
          options={options}
          onChange={(selectedOption) => {
            setSelectedOption(selectedOption);
          }}
        />
        <YellowButton onClick={() => setClustering(!clustering)}>
          {clustering ? 'Clustering: An' : 'Clustering: Aus'}
        </YellowButton>
        <FilterControls>
          <DropdownSelect
            options={openFilterOptions}
            value={openFilterMode}
            onChange={handleOpenFilterModeChange}
          />
          {openFilterMode === 'custom' && (
            <>
              <DateTimeInput
                type="datetime-local"
                value={openFilterDateTime}
                onChange={(e) => setOpenFilterDateTime(e.target.value)}
              />
            </>
          )}
        </FilterControls>
      </LogoContainer>

      <MapSection>
        {isSearchVisible && (
          <SearchOverlay>
            <SearchCard onSubmit={handleSearchSubmit}>
              <SearchInput
                type="text"
                placeholder="Ort oder Eisdiele suchen"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
              <SearchButton type="submit" disabled={isGeocoding}>
                {isGeocoding ? 'Suche…' : 'Suchen'}
              </SearchButton>
            </SearchCard>
            {(shopMatches.length > 0 || placeMatches.length > 0 || searchError || isGeocoding) && (
              <SearchResults>
                {isGeocoding && (
                  <SearchStatusText>Ort wird gesucht …</SearchStatusText>
                )}
                {shopMatches.length > 0 && (
                  <>
                    <SearchGroupLabel>Eisdielen</SearchGroupLabel>
                    {shopMatches.map((match) => (
                      <SearchResultButton key={`shop-${match.id}`} type="button" onClick={() => handleSelectShop(match)}>
                        {match.name}
                      </SearchResultButton>
                    ))}
                  </>
                )}
                {placeMatches.length > 0 && (
                  <>
                    <SearchGroupLabel>Orte</SearchGroupLabel>
                    {placeMatches.map((match) => (
                      <SearchResultButton key={`place-${match.id}`} type="button" onClick={() => handleSelectPlace(match)}>
                        {match.name}
                      </SearchResultButton>
                    ))}
                  </>
                )}
                {searchError && <SearchErrorText>{searchError}</SearchErrorText>}
              </SearchResults>
            )}
          </SearchOverlay>
        )}
        <MapContainer
          center={initialCenter}
          zoom={14}
          style={{ flex: 1, width: '100%' }}
          ref={mapRef}
          zoomControl={false}
          whenCreated={(mapInstance) => {
            mapInstance.on('dragstart zoomstart', () => {
              setHasInteractedWithMap(true);
            });
          }}
        >
          <SearchToggleControl isSearchVisible={isSearchVisible} onToggle={toggleSearchVisibility} />
          <ZoomControl position="topright" />
          <LocateControl userPosition={userPosition} />
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
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
          {searchLocation && (
            <Marker
              position={searchLocation.position}
              icon={L.divIcon({
                className: 'search-location-icon',
                html: '<div style="background-color:#ff5722; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>',
                iconSize: [12, 12],
                iconAnchor: [6, 6],
              })}
            >
              <Popup>
                <div>
                  <h2>{searchLocation.name}</h2>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </MapSection>
      {token && (
        <ResetPasswordModal resetToken={token} isOpen={true} onClose={() => (window.location.href = "/#/login")} />
      )}
      {showLoginModal &&
        <LoginModal
          userId={userId}
          isLoggedIn={isLoggedIn}
          login={login}
          setShowLoginModal={setShowLoginModal}
        />
      }
      {showDetailsView && activeShop && (
        <ShopDetailsView
          shopId={activeShop.eisdiele.id}
          setIceCreamShops={setIceCreamShops}
          refreshMapShops={refreshShops}
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
  @media (max-width: 768px) {
    display: flex;
    flex-wrap: wrap;
    flex-direction: row;
    align-content: center;
    justify-content: center;
  }
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
  @media (max-width: 768px) {
    font-size: 0.9rem;
  }
`;

const FilterControls = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  padding: 0rem 0.6rem;
  border-radius: 14px;
`;

const DateTimeInput = styled.input`
  padding: 0.45rem 0.7rem;
  border-radius: 12px;
  border: 2px solid #ffb522;
  background: #fff8e1;
  font-size: 0.9rem;
  font-weight: 500;
  color: #503000;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.06);
`;

const MapSection = styled.div`
  position: relative;
  flex: 1;
  width: 100%;
  display: flex;
`;

const SearchOverlay = styled.div`
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  width: min(90%, 420px);
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  pointer-events: none;
`;

const SearchCard = styled.form`
  display: flex;
  gap: 0.4rem;
  background: rgba(255, 255, 255, 0.95);
  padding: 0.4rem;
  border-radius: 16px;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.15);
  pointer-events: auto;
`;

const SearchInput = styled.input`
  flex: 1;
  border: none;
  border-radius: 12px;
  padding: 0.5rem 0.75rem;
  font-size: 0.95rem;
  background: #f7f7f7;
`;

const SearchButton = styled.button`
  background-color: #ffb522;
  color: #000;
  border: none;
  border-radius: 12px;
  padding: 0.5rem 0.9rem;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.7;
    cursor: progress;
  }
`;

const SearchResults = styled.div`
  background: rgba(255, 255, 255, 0.95);
  border-radius: 14px;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.15);
  pointer-events: auto;
  max-height: 260px;
  overflow-y: auto;
`;

const SearchGroupLabel = styled.div`
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #555;
  padding: 0.35rem 0.75rem;
`;

const SearchResultButton = styled.button`
  display: block;
  width: 100%;
  text-align: left;
  background: transparent;
  border: none;
  padding: 0.45rem 0.75rem;
  font-size: 0.9rem;
  cursor: pointer;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
`;

const SearchErrorText = styled.p`
  margin: 0;
  padding: 0.45rem 0.75rem;
  color: #b00020;
  font-size: 0.85rem;
`;

const SearchStatusText = styled.p`
  margin: 0;
  padding: 0.45rem 0.75rem;
  color: #555;
  font-size: 0.85rem;
`;
