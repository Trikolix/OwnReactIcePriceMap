import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap, useMapEvents } from 'react-leaflet';
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
import SubmitIceShopModal from './SubmitIceShopModal';

const MIN_CONTEXT_MENU_ZOOM = 13;
const DEFAULT_CONTEXT_MENU_STATE = {
  isVisible: false,
  x: 0,
  y: 0,
  latlng: null,
  mode: 'menu',
  message: '',
};

const toNumberOrNull = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const DISPLAY_OPTIONS = [
  {
    value: 'price',
    label: 'Preis',
    invertScale: false,
    getValue: (shop) => {
      const kugel = toNumberOrNull(shop.kugel_preis_eur ?? shop.kugel_preis);
      if (kugel !== null) {
        return kugel;
      }
      const soft = toNumberOrNull(shop.softeis_preis_eur ?? shop.softeis_preis);
      return soft;
    },
    formatValue: (value) => `${value.toFixed(2)} €`,
  },
  {
    value: 'kugelPrice',
    label: 'Kugelpreis',
    invertScale: false,
    getValue: (shop) => toNumberOrNull(shop.kugel_preis_eur ?? shop.kugel_preis),
    formatValue: (value) => `${value.toFixed(2)} €`,
  },
  {
    value: 'softeisPrice',
    label: 'Softeispreis',
    invertScale: false,
    getValue: (shop) => toNumberOrNull(shop.softeis_preis_eur ?? shop.softeis_preis),
    formatValue: (value) => `${value.toFixed(2)} €`,
  },
  {
    value: 'kugelRating',
    label: 'Kugel: Rating',
    invertScale: true,
    getValue: (shop) => toNumberOrNull(shop.finaler_kugel_score),
    formatValue: (value) => value.toFixed(2),
  },
  {
    value: 'softeisRating',
    label: 'Softeis: Rating',
    invertScale: true,
    getValue: (shop) => toNumberOrNull(shop.finaler_softeis_score),
    formatValue: (value) => value.toFixed(2),
  },
  {
    value: 'eisbecherRating',
    label: 'Eisbecher: Rating',
    invertScale: true,
    getValue: (shop) => toNumberOrNull(shop.finaler_eisbecher_score),
    formatValue: (value) => value.toFixed(2),
  },
];

const createDefaultFilters = () => ({
  favorites: false,
  visited: false,
  notVisited: false,
  types: {
    kugel: false,
    softeis: false,
    eisbecher: false,
  },
});

const hasTypeData = (shop, type) => {
  switch (type) {
    case 'kugel':
      return (
        toNumberOrNull(shop.kugel_preis_eur ?? shop.kugel_preis) !== null ||
        toNumberOrNull(shop.finaler_kugel_score) !== null
      );
    case 'softeis':
      return (
        toNumberOrNull(shop.softeis_preis_eur ?? shop.softeis_preis) !== null ||
        toNumberOrNull(shop.finaler_softeis_score) !== null
      );
    case 'eisbecher':
      return (
        toNumberOrNull(shop.eisbecher_preis_eur ?? shop.eisbecher_preis) !== null ||
        toNumberOrNull(shop.finaler_eisbecher_score) !== null
      );
    default:
      return false;
  }
};

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

const ClusteringToggleControl = ({ clustering, onToggle }) => {
  const map = useMap();
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!map) return;

    const clusteringControl = L.control({ position: 'topright' });
    clusteringControl.onAdd = () => {
      const container = L.DomUtil.create('div', 'leaflet-bar');
      const button = L.DomUtil.create('a', 'leaflet-control-clustering-toggle', container);
      button.href = '#';
      buttonRef.current = button;
      button.innerHTML = clustering ? '⛶' : '◯';

      const handleClick = (event) => {
        L.DomEvent.stopPropagation(event);
        L.DomEvent.preventDefault(event);
        onToggle();
      };

      L.DomEvent.on(button, 'click', handleClick);
      L.DomEvent.disableClickPropagation(container);

      return container;
    };

    clusteringControl.addTo(map);

    return () => {
      buttonRef.current = null;
      clusteringControl.remove();
    };
  }, [map, onToggle]);

  useEffect(() => {
    if (!buttonRef.current) return;
    buttonRef.current.innerHTML = clustering ? '⛶' : '◯';
    buttonRef.current.title = clustering ? 'Clustering deaktivieren' : 'Clustering aktivieren';
    if (clustering) {
      L.DomUtil.addClass(buttonRef.current, 'leaflet-active');
    } else {
      L.DomUtil.removeClass(buttonRef.current, 'leaflet-active');
    }
  }, [clustering]);

  return null;
};

const MapContextMenuListener = ({ onOpen, onDismiss, onUserInteraction }) => {
  const map = useMapEvents({
    contextmenu(event) {
      event.originalEvent?.preventDefault?.();
      onOpen(event);
    },
    click() {
      onDismiss();
    },
    movestart() {
      onUserInteraction();
      onDismiss();
    },
    zoomstart() {
      onUserInteraction();
      onDismiss();
    },
  });

  useEffect(() => {
    if (!map) {
      return undefined;
    }
    const container = map.getContainer();
    const suppressBrowserContextMenu = (domEvent) => {
      domEvent.preventDefault();
    };
    const captureOptions = { capture: true };
    container.addEventListener('contextmenu', suppressBrowserContextMenu, captureOptions);

    return () => {
      container.removeEventListener('contextmenu', suppressBrowserContextMenu, captureOptions);
    };
  }, [map]);

  return null;
};

const IceCreamRadar = () => {
  const location = useLocation();
  const [iceCreamShops, setIceCreamShops] = useState([]);
  const [activeShop, setActiveShop] = useState(null);
  const [clustering, setClustering] = useState(true);
  const [displayMode, setDisplayMode] = useState('price');
  const [filters, setFilters] = useState(() => createDefaultFilters());
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
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [contextMenuState, setContextMenuState] = useState(() => ({ ...DEFAULT_CONTEXT_MENU_STATE }));
  const [isSubmitIceShopModalOpen, setIsSubmitIceShopModalOpen] = useState(false);
  const [submitModalCoordinates, setSubmitModalCoordinates] = useState(null);
  const handleMapInteraction = useCallback(() => {
    setHasInteractedWithMap(true);
  }, [setHasInteractedWithMap]);
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
      return;
    }
    if (value !== 'custom') {
      setOpenFilterDateTime('');
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

  const closeContextMenu = useCallback(() => {
    setContextMenuState((prev) => (prev.isVisible ? { ...DEFAULT_CONTEXT_MENU_STATE } : prev));
  }, []);

  const handleMapContextMenuOpen = useCallback((event) => {
    const { containerPoint, latlng, originalEvent } = event;
    const isTouchEvent = Boolean(
      originalEvent?.pointerType === 'touch' ||
      originalEvent?.touches?.length ||
      originalEvent?.changedTouches?.length
    );
    const mapInstance = mapRef.current;
    const currentZoom = mapInstance?.getZoom?.() ?? 0;
    const meetsZoomRequirement = currentZoom >= MIN_CONTEXT_MENU_ZOOM;

    const touchOffsetX = isTouchEvent ? 12 : 0;
    const touchOffsetY = isTouchEvent ? -80 : 0;
    const mapSize = mapInstance?.getSize?.();
    const clamp = (value, min, max) => {
      const upperBound = typeof max === 'number' ? max : value;
      return Math.max(min, Math.min(value, upperBound));
    };
    const paddedMaxX = mapSize ? mapSize.x - 12 : undefined;
    const paddedMaxY = mapSize ? mapSize.y - 12 : undefined;

    setContextMenuState({
      isVisible: true,
      x: clamp(containerPoint.x + touchOffsetX, 12, paddedMaxX),
      y: clamp(containerPoint.y + touchOffsetY, 12, paddedMaxY),
      latlng: meetsZoomRequirement ? latlng : null,
      mode: meetsZoomRequirement ? 'menu' : 'hint',
      message: meetsZoomRequirement
        ? ''
        : `Bitte näher heranzoomen (mindestens Zoomstufe ${MIN_CONTEXT_MENU_ZOOM}), um eine Eisdiele einzutragen.`,
    });
  }, []);

  const handleSubmitModalVisibility = useCallback((visible) => {
    if (!visible) {
      setIsSubmitIceShopModalOpen(false);
      setSubmitModalCoordinates(null);
      return;
    }
    setIsSubmitIceShopModalOpen(true);
  }, []);

  const handleOpenSubmitModalAt = useCallback(
    (latlng) => {
      if (!latlng) {
        return;
      }
      closeContextMenu();
      if (!isLoggedIn) {
        setShowLoginModal(true);
        return;
      }
      setSubmitModalCoordinates({ lat: latlng.lat, lng: latlng.lng });
      setIsSubmitIceShopModalOpen(true);
    },
    [closeContextMenu, isLoggedIn, setShowLoginModal]
  );
  const handleFilterToggle = (filterKey) => {
    setFilters((prev) => {
      const nextValue = !prev[filterKey];
      const updated = { ...prev, [filterKey]: nextValue };
      if (filterKey === 'visited' && nextValue) {
        updated.notVisited = false;
      } else if (filterKey === 'notVisited' && nextValue) {
        updated.visited = false;
      }
      return updated;
    });
  };

  const handleTypeFilterToggle = (typeKey) => {
    setFilters((prev) => ({
      ...prev,
      types: {
        ...prev.types,
        [typeKey]: !prev.types?.[typeKey],
      },
    }));
  };

  const handleResetFilters = () => {
    setFilters(createDefaultFilters());
    handleOpenFilterModeChange('all');
  };

  const displayDropdownOptions = useMemo(
    () => DISPLAY_OPTIONS.map(({ value, label }) => ({ value, label })),
    []
  );

  const activeDisplayConfig = useMemo(
    () => DISPLAY_OPTIONS.find((option) => option.value === displayMode) ?? DISPLAY_OPTIONS[0],
    [displayMode]
  );

  useEffect(() => {
    if (!userId) {
      setFilters((prev) => ({
        ...prev,
        favorites: false,
        visited: false,
        notVisited: false,
      }));
    }
  }, [userId]);

  const favoritesFilterActive = filters.favorites && !!userId;
  const visitedFilterActive = filters.visited && !!userId;
  const notVisitedFilterActive = filters.notVisited && !!userId;
  const typeFilters = filters.types ?? { kugel: false, softeis: false, eisbecher: false };
  const hasTypeFilter = Object.values(typeFilters).some(Boolean);

  const shopsWithDisplayValue = useMemo(() => {
    if (!activeDisplayConfig?.getValue) {
      return [];
    }
    return iceCreamShops.reduce((acc, shop) => {
      if (favoritesFilterActive && shop.is_favorit !== 1) {
        return acc;
      }
      if (visitedFilterActive && Number(shop.has_visited) !== 1) {
        return acc;
      }
      if (notVisitedFilterActive && Number(shop.has_visited) !== 0) {
        return acc;
      }
      if (hasTypeFilter) {
        const matchesType = Object.entries(typeFilters).some(
          ([typeKey, isActive]) => isActive && hasTypeData(shop, typeKey)
        );
        if (!matchesType) {
          return acc;
        }
      }
      const value = activeDisplayConfig.getValue(shop);
      acc.push({ shop, value });
      return acc;
    }, []);
  }, [
    iceCreamShops,
    activeDisplayConfig,
    favoritesFilterActive,
    visitedFilterActive,
    notVisitedFilterActive,
    hasTypeFilter,
    typeFilters,
  ]);

  const { minValue, maxValue } = useMemo(() => {
    const numericValues = shopsWithDisplayValue
      .map(({ value }) => value)
      .filter((value) => value !== null && value !== undefined && !Number.isNaN(value));
    if (!numericValues.length) {
      return { minValue: null, maxValue: null };
    }
    return {
      minValue: Math.min(...numericValues),
      maxValue: Math.max(...numericValues),
    };
  }, [shopsWithDisplayValue]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (favoritesFilterActive) count += 1;
    if (visitedFilterActive) count += 1;
    if (notVisitedFilterActive) count += 1;
    const typeCount = Object.values(typeFilters).filter(Boolean).length;
    count += typeCount;
    if (openFilterMode === 'now') count += 1;
    if (openFilterMode === 'custom' && openFilterDateTime) count += 1;
    return count;
  }, [
    favoritesFilterActive,
    visitedFilterActive,
    notVisitedFilterActive,
    typeFilters,
    openFilterMode,
    openFilterDateTime,
  ]);

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


  useEffect(() => {
    if (userId !== undefined) {
      fetchIceCreamShops();
    }
  }, [userId, openFilterQueryString]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        minHeight: '100vh',
        backgroundColor: '#ffb522',
      }}
    >
      <Header
        refreshShops={refreshShops}
      />
      <LogoContainer>
        <DropdownSelect
          options={displayDropdownOptions}
          value={displayMode}
          onChange={(value) => setDisplayMode(value)}
        />
        <FilterButton type="button" onClick={() => setIsFilterModalOpen(true)}>
          Filter
          {activeFilterCount > 0 && <FilterBadge>{activeFilterCount}</FilterBadge>}
        </FilterButton>
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
        {contextMenuState.isVisible && (
          <MapContextMenu style={{ top: contextMenuState.y, left: contextMenuState.x }}>
            {contextMenuState.mode === 'menu' ? (
              <>
                <MapContextMenuButton
                  type="button"
                  onClick={() => handleOpenSubmitModalAt(contextMenuState.latlng)}
                >
                  🍦 Eisdiele eintragen
                </MapContextMenuButton>
                {!isLoggedIn && (
                  <MapContextMenuHint>
                    Melde dich an, um neue Eisdielen einzutragen.
                  </MapContextMenuHint>
                )}
              </>
            ) : (
              <MapContextMenuHint>
                {contextMenuState.message || 'Bitte näher heranzoomen, um eine Eisdiele einzutragen.'}
              </MapContextMenuHint>
            )}
          </MapContextMenu>
        )}
        <MapContainer
          center={initialCenter}
          zoom={14}
          style={{ flex: 1, width: '100%' }}
          ref={mapRef}
          zoomControl={false}
          whenCreated={(mapInstance) => {
            mapRef.current = mapInstance;
          }}
        >
          <MapContextMenuListener
            onOpen={handleMapContextMenuOpen}
            onDismiss={closeContextMenu}
            onUserInteraction={handleMapInteraction}
          />
          <SearchToggleControl isSearchVisible={isSearchVisible} onToggle={toggleSearchVisibility} />
          <ClusteringToggleControl clustering={clustering} onToggle={() => setClustering((prev) => !prev)} />
          <ZoomControl position="topright" />
          <LocateControl userPosition={userPosition} />
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {activeShop && <MapCenterOnShop shop={activeShop} />}
          {clustering ? ( // show the clustered
            <MarkerClusterGroup maxClusterRadius={25}>
              {shopsWithDisplayValue.map(({ shop, value }) => {
                return (
                  <ShopMarker
                    key={shop.eisdielen_id}
                    shop={shop}
                    displayValue={value}
                    formatValue={activeDisplayConfig.formatValue}
                    minValue={minValue}
                    maxValue={maxValue}
                    invertScale={activeDisplayConfig.invertScale}
                    fetchShopDetails={fetchShopDetails}
                    fetchAndCenterShop={fetchAndCenterShop}
                  />
                );
              })}
            </MarkerClusterGroup>
          ) : ( // show them unclustered
            shopsWithDisplayValue.map(({ shop, value }) => {
              return (
                <ShopMarker
                  key={shop.eisdielen_id}
                  shop={shop}
                  displayValue={value}
                  formatValue={activeDisplayConfig.formatValue}
                  minValue={minValue}
                  maxValue={maxValue}
                  invertScale={activeDisplayConfig.invertScale}
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
      {isFilterModalOpen && (
        <FilterModalOverlay onClick={() => setIsFilterModalOpen(false)}>
          <FilterModalContent onClick={(event) => event.stopPropagation()}>
            <FilterModalHeader>
              <FilterModalTitle>Filter</FilterModalTitle>
              <CloseModalButton type="button" onClick={() => setIsFilterModalOpen(false)}>
                ×
              </CloseModalButton>
            </FilterModalHeader>
            <FilterSection>
              <FilterSectionTitle>Favoriten & Besuche</FilterSectionTitle>
              <FilterToggle disabled={!userId}>
                <input
                  type="checkbox"
                  checked={favoritesFilterActive}
                  disabled={!userId}
                  onChange={() => handleFilterToggle('favorites')}
                />
                <span>Favoriten</span>
              </FilterToggle>
              <FilterToggle disabled={!userId}>
                <input
                  type="checkbox"
                  checked={visitedFilterActive}
                  disabled={!userId}
                  onChange={() => handleFilterToggle('visited')}
                />
                <span>Besucht</span>
              </FilterToggle>
              <FilterToggle disabled={!userId}>
                <input
                  type="checkbox"
                  checked={notVisitedFilterActive}
                  disabled={!userId}
                  onChange={() => handleFilterToggle('notVisited')}
                />
                <span>Nicht besucht</span>
              </FilterToggle>
              {!userId && <FilterHint>Melde dich an, um diese Filter zu nutzen.</FilterHint>}
            </FilterSection>
            <FilterSection>
              <FilterSectionTitle>Sorten</FilterSectionTitle>
              <FilterToggle>
                <input
                  type="checkbox"
                  checked={!!typeFilters.kugel}
                  onChange={() => handleTypeFilterToggle('kugel')}
                />
                <span>Kugel</span>
              </FilterToggle>
              <FilterToggle>
                <input
                  type="checkbox"
                  checked={!!typeFilters.softeis}
                  onChange={() => handleTypeFilterToggle('softeis')}
                />
                <span>Softeis</span>
              </FilterToggle>
              <FilterToggle>
                <input
                  type="checkbox"
                  checked={!!typeFilters.eisbecher}
                  onChange={() => handleTypeFilterToggle('eisbecher')}
                />
                <span>Eisbecher</span>
              </FilterToggle>
            </FilterSection>
            <FilterSection>
              <FilterSectionTitle>Öffnungszeiten</FilterSectionTitle>
              <FilterToggle>
                <input
                  type="radio"
                  name="open-filter"
                  checked={openFilterMode === 'all'}
                  onChange={() => handleOpenFilterModeChange('all')}
                />
                <span>Keine Einschränkung</span>
              </FilterToggle>
              <FilterToggle>
                <input
                  type="radio"
                  name="open-filter"
                  checked={openFilterMode === 'now'}
                  onChange={() => handleOpenFilterModeChange('now')}
                />
                <span>Jetzt geöffnet</span>
              </FilterToggle>
              <FilterToggle>
                <input
                  type="radio"
                  name="open-filter"
                  checked={openFilterMode === 'custom'}
                  onChange={() => handleOpenFilterModeChange('custom')}
                />
                <span>Geöffnet am …</span>
              </FilterToggle>
              {openFilterMode === 'custom' && (
                <DateTimeInput
                  type="datetime-local"
                  value={openFilterDateTime}
                  onChange={(e) => setOpenFilterDateTime(e.target.value)}
                />
              )}
            </FilterSection>
            <FilterActions>
              <SecondaryButton type="button" onClick={handleResetFilters}>
                Zurücksetzen
              </SecondaryButton>
              <YellowButton type="button" onClick={() => setIsFilterModalOpen(false)}>
                Fertig
              </YellowButton>
            </FilterActions>
          </FilterModalContent>
        </FilterModalOverlay>
      )}
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
      {isSubmitIceShopModalOpen && (
        <SubmitIceShopModal
          showForm={isSubmitIceShopModalOpen}
          setShowForm={handleSubmitModalVisibility}
          userId={userId}
          refreshShops={refreshShops}
          userLatitude={submitModalCoordinates?.lat ?? userPosition?.[0] ?? 50.83}
          userLongitude={submitModalCoordinates?.lng ?? userPosition?.[1] ?? 12.92}
          initialLatitude={submitModalCoordinates?.lat ?? null}
          initialLongitude={submitModalCoordinates?.lng ?? null}
        />
      )}
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

const FilterButton = styled(YellowButton)`
  display: flex;
  align-items: center;
  gap: 0.4rem;
`;

const FilterBadge = styled.span`
  background: #fff;
  color: #000;
  border-radius: 999px;
  padding: 0 0.5rem;
  font-size: 0.85rem;
  font-weight: 700;
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

const MapContextMenu = styled.div`
  position: absolute;
  z-index: 1100;
  min-width: 190px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  pointer-events: auto;
`;

const MapContextMenuButton = styled.button`
  width: 100%;
  border: none;
  background: transparent;
  padding: 0.75rem 1rem;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
`;

const MapContextMenuHint = styled.p`
  margin: 0;
  padding: 0 1rem 0.75rem;
  font-size: 0.8rem;
  color: #6b6b6b;
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

const FilterModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.35);
  z-index: 1200;
`;

const FilterModalContent = styled.div`
  background: #fffbe6;
  border-radius: 16px;
  padding: 1.5rem;
  width: min(480px, 90%);
  box-shadow: 0 10px 35px rgba(0, 0, 0, 0.2);
`;

const FilterModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const FilterModalTitle = styled.h3`
  margin: 0;
  font-size: 1.4rem;
  color: #503000;
`;

const CloseModalButton = styled.button`
  border: none;
  background: transparent;
  font-size: 1.5rem;
  cursor: pointer;
`;

const FilterSection = styled.div`
  margin-bottom: 1.5rem;
`;

const FilterSectionTitle = styled.h4`
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  color: #503000;
`;

const FilterToggle = styled.label`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.95rem;
  margin-bottom: 0.4rem;
  opacity: ${(props) => (props.disabled ? 0.5 : 1)};

  input {
    transform: scale(1.2);
  }
`;

const FilterHint = styled.p`
  margin: 0.5rem 0 0;
  font-size: 0.85rem;
  color: #7a5a00;
`;

const FilterActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
`;

const SecondaryButton = styled.button`
  background: transparent;
  border: 2px solid #ffb522;
  border-radius: 12px;
  padding: 0.6rem 1rem;
  font-weight: 700;
  cursor: pointer;
  color: #503000;
`;
