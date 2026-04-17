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
import EasterMapEncounter from './features/seasonal/EasterMapEncounter';
import Seo from './components/Seo';
import { CAMPAIGN_STATUS, getCampaignDefinition, getCampaignStatus } from './features/seasonal/campaigns';
import { canUseExternalDiscovery } from './utils/featureAccess';
const MIN_CONTEXT_MENU_ZOOM = 13;
const EASTER_MAP_TOGGLE_STORAGE_KEY = 'ice-app:easter-map-visuals';
const DEFAULT_CONTEXT_MENU_STATE = {
  isVisible: false,
  x: 0,
  y: 0,
  latlng: null,
  mode: 'menu',
  message: '',
};
const DISCOVERY_SLOT_LIMIT = 5;
const DEFAULT_DISCOVERY_META = {
  hiddenExisting: 0,
  hiddenDuplicate: 0,
  hiddenFalsePositive: 0,
  truncated: false,
};

const toNumberOrNull = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const EASTER_CLUSTER_PALETTES = [
  { shell: 'linear-gradient(180deg, #ffb7c8 0%, #ff8ba7 100%)', stripeA: '#fff7b8', stripeB: '#f35b8c' },
  { shell: 'linear-gradient(180deg, #b9f3ff 0%, #72d6ff 100%)', stripeA: '#ffffff', stripeB: '#2aa9d9' },
  { shell: 'linear-gradient(180deg, #ffe08a 0%, #ffc44d 100%)', stripeA: '#ffffff', stripeB: '#ff7a59' },
  { shell: 'linear-gradient(180deg, #d8c6ff 0%, #b48cff 100%)', stripeA: '#fff6a8', stripeB: '#7b5ed8' },
  { shell: 'linear-gradient(180deg, #c8f7bf 0%, #91dc7b 100%)', stripeA: '#fff7cc', stripeB: '#3c9c68' },
];
const EASTER_CLUSTER_BUNNY_ASSET = '/assets/easter-marker-bunny.png';
const EASTER_CLUSTER_BUNNY_FALLBACK_ASSET = '/assets/easter-bunny.png';

const createClusterEggHtml = ({ left, top, width, height, rotate, palette, zIndex }) => `
  <div style="position:absolute; left:${left}px; top:${top}px; width:${width}px; height:${height}px; transform:rotate(${rotate}deg); z-index:${zIndex};">
    <div style="position:absolute; inset:0; border-radius:54% 54% 48% 48% / 63% 63% 38% 38%; background:${palette.shell}; border:3px solid #ffffff; box-shadow:0 6px 14px rgba(0,0,0,0.2); box-sizing:border-box;"></div>
    <div style="position:absolute; left:10%; top:32%; width:80%; height:11%; border-radius:999px; background:${palette.stripeA}; opacity:0.96;"></div>
    <div style="position:absolute; left:16%; top:50%; width:68%; height:10%; border-radius:999px; background:${palette.stripeB}; opacity:0.96;"></div>
    <div style="position:absolute; left:23%; top:20%; width:8px; height:8px; border-radius:50%; background:rgba(255,255,255,0.92);"></div>
    <div style="position:absolute; right:22%; top:23%; width:7px; height:7px; border-radius:50%; background:rgba(255,255,255,0.88);"></div>
  </div>
`;

const createClusterBunnyHtml = (size) => `
  <img
    src="${EASTER_CLUSTER_BUNNY_ASSET}"
    alt=""
    aria-hidden="true"
    onerror="if(this.dataset.fallbackApplied==='1'){this.style.display='none';}else{this.dataset.fallbackApplied='1';this.src='${EASTER_CLUSTER_BUNNY_FALLBACK_ASSET}';}"
    style="position:absolute; top:${Math.round(size * -0.18)}px; left:50%; transform:translateX(-50%) rotate(-3deg); width:${Math.round(size * 0.72)}px; height:auto; z-index:0; pointer-events:none; filter:drop-shadow(0 7px 14px rgba(0,0,0,0.28));"
  />
`;

const createEasterClusterIcon = (bunnyTargetShopId = null) => (cluster) => {
  const count = cluster.getChildCount();
  const size = count < 10 ? 58 : count < 100 ? 66 : 74;
  const fontSize = count < 10 ? 16 : count < 100 ? 17 : 18;
  const badgeMinWidth = count < 10 ? 28 : count < 100 ? 32 : 36;
  const paletteOffset = count % EASTER_CLUSTER_PALETTES.length;
  const showClusterBunny = bunnyTargetShopId !== null && cluster.getAllChildMarkers().some(
    (marker) => Number(marker.options?.shopId) === Number(bunnyTargetShopId)
  );
  const palettes = [
    EASTER_CLUSTER_PALETTES[paletteOffset],
    EASTER_CLUSTER_PALETTES[(paletteOffset + 1) % EASTER_CLUSTER_PALETTES.length],
    EASTER_CLUSTER_PALETTES[(paletteOffset + 2) % EASTER_CLUSTER_PALETTES.length],
  ];

  return L.divIcon({
    className: 'easter-marker-cluster',
    html: `
      <div style="position:relative; width:${size}px; height:${size}px;">
        ${showClusterBunny ? createClusterBunnyHtml(size) : ''}
        ${createClusterEggHtml({
          left: Math.round(size * 0.02),
          top: Math.round(size * 0.18),
          width: Math.round(size * 0.4),
          height: Math.round(size * 0.52),
          rotate: -18,
          palette: palettes[0],
          zIndex: 1,
        })}
        ${createClusterEggHtml({
          left: Math.round(size * 0.56),
          top: Math.round(size * 0.16),
          width: Math.round(size * 0.34),
          height: Math.round(size * 0.46),
          rotate: 16,
          palette: palettes[1],
          zIndex: 2,
        })}
        ${createClusterEggHtml({
          left: Math.round(size * 0.22),
          top: Math.round(size * 0.06),
          width: Math.round(size * 0.56),
          height: Math.round(size * 0.7),
          rotate: 3,
          palette: palettes[2],
          zIndex: 3,
        })}
        <div style="position:absolute; left:50%; bottom:${Math.round(size * 0.06)}px; transform:translateX(-50%); min-width:${badgeMinWidth}px; padding:4px 8px; border-radius:999px; background:rgba(255,255,255,0.92); color:#5f1833; border:2px solid rgba(255,255,255,0.98); box-shadow:0 4px 10px rgba(0,0,0,0.18); text-align:center; font-weight:800; font-size:${fontSize}px; line-height:1; z-index:4;">
          ${count}
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [Math.round(size / 2), Math.round(size / 2)],
  });
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

const createDiscoveryMarkerIcon = ({ flagged = false } = {}) => {
  const gradient = flagged
    ? 'linear-gradient(180deg,#b6bcc8 0%,#6e7687 100%)'
    : 'linear-gradient(180deg,#2d7ff9 0%,#1652b8 100%)';
  const shadow = flagged
    ? '0 8px 18px rgba(55, 61, 74, 0.28)'
    : '0 8px 18px rgba(10,44,99,0.35)';

  return L.divIcon({
    className: 'discovery-marker-icon',
    html: `
      <div style="position:relative; width:28px; height:28px;">
        <div style="width:28px; height:28px; border-radius:50% 50% 50% 0; transform:rotate(-45deg); background:${gradient}; border:2px solid #ffffff; box-shadow:${shadow};"></div>
        <div style="position:absolute; inset:7px auto auto 7px; width:10px; height:10px; border-radius:50%; background:#ffffff;"></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -24],
  });
};

const createDefaultFilters = () => ({
  favorites: false,
  visited: false,
  notVisited: false,
  showPermanentClosed: false,
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

const DiscoveryToggleControl = ({ isDiscoveryVisible, onToggle }) => {
  const map = useMap();
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!map) return;

    const toggleControl = L.control({ position: 'topright' });
    toggleControl.onAdd = () => {
      const container = L.DomUtil.create('div', 'leaflet-bar');
      const button = L.DomUtil.create('a', 'leaflet-control-discovery-toggle', container);
      button.href = '#';
      button.innerHTML = '🧭';
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

    button.title = isDiscoveryVisible ? 'Discovery ausblenden' : 'Discovery einblenden';
    if (isDiscoveryVisible) {
      L.DomUtil.addClass(button, 'leaflet-active');
    } else {
      L.DomUtil.removeClass(button, 'leaflet-active');
    }
  }, [isDiscoveryVisible]);

  return null;
};

const SeasonalViewToggleControl = ({ enabled, active, onToggle }) => {
  const map = useMap();
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!map || !enabled) return undefined;

    const seasonalControl = L.control({ position: 'topright' });
    seasonalControl.onAdd = () => {
      const container = L.DomUtil.create('div', 'leaflet-bar');
      const button = L.DomUtil.create('a', 'leaflet-control-seasonal-toggle', container);
      button.href = '#';
      button.textContent = 'Ei';
      button.style.fontWeight = '800';
      button.style.fontSize = '12px';
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

    seasonalControl.addTo(map);

    return () => {
      buttonRef.current = null;
      seasonalControl.remove();
    };
  }, [enabled, map, onToggle]);

  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    button.title = active ? 'Osteransicht ausblenden' : 'Osteransicht einblenden';
    if (active) {
      L.DomUtil.addClass(button, 'leaflet-active');
    } else {
      L.DomUtil.removeClass(button, 'leaflet-active');
    }
  }, [active]);

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
  const normalizedIceCreamShops = useMemo(() => (Array.isArray(iceCreamShops) ? iceCreamShops : []), [iceCreamShops]);
  const [activeShop, setActiveShop] = useState(null);
  const [clustering, setClustering] = useState(true);
  const [displayMode, setDisplayMode] = useState('price');
  const [filters, setFilters] = useState(() => createDefaultFilters());
  const mapRef = useRef(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showDetailsView, setShowDetailsView] = useState(true);
  const { userId, isLoggedIn, userPosition, login, setUserPosition } = useUser();
  const [initialCenter, setInitialCenter] = useState(userPosition || [50.833707, 12.919187]);
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
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
  const [isDiscoveryVisible, setIsDiscoveryVisible] = useState(false);
  const [isDiscoveryExpanded, setIsDiscoveryExpanded] = useState(true);

  const [contextMenuState, setContextMenuState] = useState(() => ({ ...DEFAULT_CONTEXT_MENU_STATE }));
  const [isSubmitIceShopModalOpen, setIsSubmitIceShopModalOpen] = useState(false);
  const [submitModalPrefill, setSubmitModalPrefill] = useState(null);
  const [currentZoom, setCurrentZoom] = useState(14);
  const [seasonalMapEnabled, setSeasonalMapEnabled] = useState(() => {
    if (typeof window === 'undefined') {
      return true;
    }
    return window.localStorage.getItem(EASTER_MAP_TOGGLE_STORAGE_KEY) !== 'false';
  });
  const [easterEncounterState, setEasterEncounterState] = useState({
    bunnyShopId: null,
    bunnyVisible: false,
    currentTarget: null,
    workshop: null,
    completed: false,
    loading: false,
    error: null,
  });
  const [discoveryResults, setDiscoveryResults] = useState([]);
  const [discoveryMeta, setDiscoveryMeta] = useState(() => ({ ...DEFAULT_DISCOVERY_META }));
  const [discoveryMessage, setDiscoveryMessage] = useState('');
  const [discoveryError, setDiscoveryError] = useState('');
  const [isDiscoveryLoading, setIsDiscoveryLoading] = useState(false);
  const [discoverySlots, setDiscoverySlots] = useState(null);
  const activeShopRequestRef = useRef(0);
  const canAccessExternalDiscovery = useMemo(() => canUseExternalDiscovery(userId), [userId]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(EASTER_MAP_TOGGLE_STORAGE_KEY, seasonalMapEnabled ? 'true' : 'false');
  }, [seasonalMapEnabled]);

  const handleMapInteraction = useCallback(() => {
    setHasInteractedWithMap(true);
  }, [setHasInteractedWithMap]);

  const MapEvents = () => {
    const map = useMapEvents({
      zoomend: () => {
        setCurrentZoom(map.getZoom());
      },
    });
    useEffect(() => {
      setCurrentZoom(map.getZoom());
    }, [map]);
    return null;
  };

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
  const getShopCacheKey = useCallback(
    (queryString) => `iceCreamShopsCache::user:${userId ?? 'guest'}::filter:${queryString || 'all'}`,
    [userId]
  );

  useEffect(() => {
    if (location.pathname === "/login") {
      setShowLoginModal(true);
    }
  }, [location]);

  const buildActiveShopPreview = useCallback((shopLike) => {
    if (!shopLike) return null;
    const resolvedId = shopLike.eisdiele?.id ?? shopLike.eisdielen_id ?? shopLike.id ?? null;
    if (!resolvedId) return null;
    const resolvedLatitude = shopLike.eisdiele?.latitude ?? shopLike.latitude ?? null;
    const resolvedLongitude = shopLike.eisdiele?.longitude ?? shopLike.longitude ?? null;
    return {
      ...shopLike,
      eisdiele: {
        ...(shopLike.eisdiele || {}),
        id: resolvedId,
        name: shopLike.eisdiele?.name || shopLike.eisdielen_name || shopLike.eisdiele_name || shopLike.name || '',
        adresse: shopLike.eisdiele?.adresse || shopLike.adresse || shopLike.eisdielen_adresse || '',
        latitude: resolvedLatitude,
        longitude: resolvedLongitude,
      },
    };
  }, []);

  const fetchAndCenterShop = useCallback(async (id, shopPreview = null) => {
    const requestId = ++activeShopRequestRef.current;
    const preview = buildActiveShopPreview(shopPreview)
      || buildActiveShopPreview(normalizedIceCreamShops.find((shop) => String(shop.eisdielen_id) === String(id)));

    if (preview) {
      setActiveShop(preview);
      setShowDetailsView(true);
    }

    try {
      const detailQuery = openFilterQueryString ? `&${openFilterQueryString}` : "";
      const response = await fetch(`${apiUrl}/get_eisdiele.php?eisdiele_id=${id}${detailQuery}`);
      const data = await response.json();
      if (requestId !== activeShopRequestRef.current) {
        return;
      }
      setActiveShop(data);
      setShowDetailsView(true);
    } catch (err) {
      if (requestId !== activeShopRequestRef.current) {
        return;
      }
      console.error('Fehler beim Abrufen der Shop-Details via URL:', err);
    }
  }, [apiUrl, buildActiveShopPreview, normalizedIceCreamShops, openFilterQueryString]);

  useEffect(() => {
    if (shopId) {
      fetchAndCenterShop(shopId);
    }
  }, [shopId, fetchAndCenterShop]);

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
    const matches = normalizedIceCreamShops
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
  }, [searchQuery, normalizedIceCreamShops]);

  const loadIceCreamShops = useCallback(async () => {
    const cacheKey = getShopCacheKey(openFilterQueryString);
    const fallbackCacheKey = getShopCacheKey('');
    const parseCachedShops = (key) => {
      const cachedValue = localStorage.getItem(key);
      if (!cachedValue) {
        return null;
      }
      try {
        const parsed = JSON.parse(cachedValue);
        return Array.isArray(parsed) ? parsed : null;
      } catch (parseError) {
        console.warn('Ungültiger Eisdielen-Cache wurde verworfen:', parseError);
        localStorage.removeItem(key);
        return null;
      }
    };

    if (!navigator.onLine) {
      const cachedShops = parseCachedShops(cacheKey) ?? parseCachedShops(fallbackCacheKey);
      if (cachedShops) {
        setIceCreamShops(cachedShops);
      }
      return;
    }

    try {
      const querySuffix = openFilterQueryString ? `&${openFilterQueryString}` : '';
      const query = `${apiUrl}/get_all_eisdielen.php?userId=${userId}${querySuffix}`;
      const response = await fetch(query);
      const data = await response.json();
      if (!Array.isArray(data)) {
        console.warn('Unerwartete Eisdielen-Antwort erhalten:', data);
        const cachedShops = parseCachedShops(cacheKey) ?? parseCachedShops(fallbackCacheKey);
        setIceCreamShops(cachedShops ?? []);
        return;
      }
      setIceCreamShops(data);

      if (Array.isArray(data)) {
        // Immer den Cache für den aktuellen Query-Stand komplett ersetzen.
        localStorage.setItem(cacheKey, JSON.stringify(data));
      }
    } catch (error) {
      console.error('Fehler beim Abrufen der Eisdielen:', error);
      const cachedShops = parseCachedShops(cacheKey) ?? parseCachedShops(fallbackCacheKey);
      if (cachedShops) {
        setIceCreamShops(cachedShops);
      }
    }
  }, [apiUrl, userId, openFilterQueryString, getShopCacheKey]);

  const fetchIceCreamShops = loadIceCreamShops;
  const refreshShops = loadIceCreamShops;
  const clearDiscoveryResults = useCallback(() => {
    setDiscoveryResults([]);
    setDiscoveryMeta({ ...DEFAULT_DISCOVERY_META });
    setDiscoveryMessage('');
    setDiscoveryError('');
  }, []);

  const fetchDiscoverySlots = useCallback(async () => {
    if (!isLoggedIn || !canAccessExternalDiscovery) {
      setDiscoverySlots(null);
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/discovery_slots.php`);
      const data = await response.json();
      if (data.status === 'success' && data.slots) {
        setDiscoverySlots(data.slots);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Discovery-Slots:', error);
    }
  }, [apiUrl, canAccessExternalDiscovery, isLoggedIn]);

  const refreshShopsAndDiscovery = useCallback(() => {
    refreshShops();
    if (isLoggedIn) {
      fetchDiscoverySlots();
    }
  }, [refreshShops, isLoggedIn, fetchDiscoverySlots]);
  const activeShopId =
    activeShop?.eisdiele?.id ??
    activeShop?.eisdielen_id ??
    activeShop?.id ??
    null;
  const mapRouteWithOpenFilter = openFilterQueryString ? `/map?${openFilterQueryString}` : '/map';

  const fetchShopDetails = async (shop) => {
    try {
      const querySuffix = openFilterQueryString ? `?${openFilterQueryString}` : "";
      setActiveShop(buildActiveShopPreview(shop));
      setShowDetailsView(true);
      navigate(`/map/activeShop/${shop.eisdielen_id}${querySuffix}`);
      fetchAndCenterShop(shop.eisdielen_id, shop);
    } catch (error) {
      console.error('Fehler beim Abrufen der Shop-Details:', error);
    }
  };

  const handleCloseShopDetails = useCallback(() => {
    setActiveShop(null);
    setShowDetailsView(false);
    navigate(mapRouteWithOpenFilter, { replace: true });
  }, [navigate, mapRouteWithOpenFilter]);

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

  const toggleDiscoveryVisibility = useCallback(() => {
    if (!canAccessExternalDiscovery) {
      return;
    }
    setIsDiscoveryVisible((prev) => !prev);
  }, [canAccessExternalDiscovery]);

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
      setSubmitModalPrefill(null);
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
      setSubmitModalPrefill({ lat: latlng.lat, lng: latlng.lng });
      setIsSubmitIceShopModalOpen(true);
    },
    [closeContextMenu, isLoggedIn, setShowLoginModal]
  );

  const handleDiscoverySearch = useCallback(async () => {
    if (!canAccessExternalDiscovery) {
      setDiscoveryError('Die Discovery-Funktion ist aktuell nur für freigeschaltete Admin-Nutzer verfügbar.');
      return;
    }

    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    const mapInstance = mapRef.current;
    if (!mapInstance) {
      return;
    }

    const remainingSlots = Number(discoverySlots?.remaining_slots ?? DISCOVERY_SLOT_LIMIT);
    const zoom = mapInstance.getZoom?.() ?? currentZoom;
    if (remainingSlots <= 0) {
      setDiscoveryError('Aktuell sind keine freien Discovery-Slots verfügbar.');
      return;
    }
    if (zoom < MIN_CONTEXT_MENU_ZOOM) {
      setDiscoveryError(`Bitte zoome mindestens auf Stufe ${MIN_CONTEXT_MENU_ZOOM}, bevor du den Kartenausschnitt durchsuchst.`);
      return;
    }

    const bounds = mapInstance.getBounds?.();
    if (!bounds) {
      return;
    }

    setIsDiscoveryLoading(true);
    setDiscoveryError('');
    setDiscoveryMessage('');

    try {
      const response = await fetch(`${apiUrl}/api/discovery_search_map.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
          zoom,
        }),
      });
      const data = await response.json();
      if (data.status === 'success') {
        const results = Array.isArray(data.results) ? data.results : [];
        const hiddenExisting = Number(data.meta?.hidden_existing || 0);
        const hiddenDuplicate = Number(data.meta?.hidden_duplicate || 0);
        const hiddenFalsePositive = Number(data.meta?.hidden_false_positive || 0);
        const totalHidden = hiddenExisting + hiddenDuplicate + hiddenFalsePositive;
        setDiscoveryResults(results);
        setDiscoveryMeta({
          hiddenExisting,
          hiddenDuplicate,
          hiddenFalsePositive,
          truncated: Boolean(data.meta?.truncated),
        });
        if (data.meta?.slots) {
          setDiscoverySlots(data.meta.slots);
        }
        if (results.length > 0) {
          setDiscoveryMessage(`${results.length} neue Treffer im aktuellen Kartenausschnitt gefunden.`);
        } else if (totalHidden > 0) {
          setDiscoveryMessage('Im Kartenausschnitt wurden Treffer gefunden, sie sind aber bereits bekannt, zu ähnlich oder schon als falsch markiert.');
        } else {
          setDiscoveryMessage('Im aktuellen Kartenausschnitt wurden keine neuen Eisdielen gefunden.');
        }
      } else {
        clearDiscoveryResults();
        setDiscoveryError(data.message || 'Discovery-Suche fehlgeschlagen.');
        if (data.slots) {
          setDiscoverySlots(data.slots);
        }
      }
    } catch (error) {
      console.error('Fehler bei der Discovery-Suche:', error);
      clearDiscoveryResults();
      setDiscoveryError('Discovery-Suche fehlgeschlagen.');
    } finally {
      setIsDiscoveryLoading(false);
    }
  }, [apiUrl, canAccessExternalDiscovery, clearDiscoveryResults, currentZoom, discoverySlots, isLoggedIn, setShowLoginModal]);

  const handleOpenDiscoveryImport = useCallback((result) => {
    if (!canAccessExternalDiscovery) {
      setDiscoveryError('Discovery-Import ist aktuell nur für freigeschaltete Admin-Nutzer verfügbar.');
      return;
    }

    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    if ((discoverySlots?.remaining_slots ?? 0) <= 0) {
      setDiscoveryError('Aktuell sind keine freien Discovery-Slots verfügbar.');
      return;
    }

    setSubmitModalPrefill({
      lat: result.lat,
      lng: result.lon,
      name: result.name || '',
      address: result.address || '',
      website: result.website || '',
      openingHoursStructured: result.opening_hours_structured || null,
      openingHoursNote: result.opening_hours_structured?.note || (!result.opening_hours_structured ? (result.opening_hours_note || '') : ''),
      externalSource: {
        entry_id: result.entry_id,
        provider: result.provider,
        external_id: result.external_id,
        name: result.name,
        address: result.address,
        website: result.website,
        opening_hours_note: result.opening_hours_note || '',
        lat: result.lat,
        lon: result.lon,
      },
    });
    setIsSubmitIceShopModalOpen(true);
  }, [canAccessExternalDiscovery, discoverySlots?.remaining_slots, isLoggedIn, setShowLoginModal]);

  const handleDiscoveryFeedback = useCallback(async (entryId) => {
    if (!canAccessExternalDiscovery) {
      setDiscoveryError('Discovery-Feedback ist aktuell nur für freigeschaltete Admin-Nutzer verfügbar.');
      return;
    }

    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    const confirmed = window.confirm(
      'Diesen Treffer wirklich als falsch melden?\n\nNutze das nur, wenn es sich wirklich nicht um eine passende Eisdiele handelt oder der Eintrag klar unbrauchbar ist. Einzelne Meldungen markieren den Treffer zunächst nur, mehrere unabhängige Meldungen blenden ihn später aus.'
    );
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/discovery_feedback.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry_id: entryId,
          feedback_type: 'false_positive',
        }),
      });
      const data = await response.json();
      if (data.status === 'success') {
        const falsePositiveCount = Number(data.false_positive_count || 0);
        setDiscoveryResults((prev) => prev.map((result) => {
          if (Number(result.entry_id) !== Number(entryId)) {
            return result;
          }
          if (falsePositiveCount >= 3) {
            return null;
          }
          return {
            ...result,
            classification: 'flagged_false_positive',
            feedback_false_positive_count: falsePositiveCount,
            feedback_confirmed_valid_count: Number(data.confirmed_valid_count || 0),
          };
        }).filter(Boolean));
        setDiscoveryMessage(
          falsePositiveCount >= 3
            ? 'Treffer wurde nach mehreren Meldungen ausgeblendet.'
            : 'Treffer wurde gemeldet und bleibt vorerst nur markiert sichtbar.'
        );
      } else {
        setDiscoveryError(data.message || 'Feedback konnte nicht gespeichert werden.');
      }
    } catch (error) {
      console.error('Fehler beim Discovery-Feedback:', error);
      setDiscoveryError('Feedback konnte nicht gespeichert werden.');
    }
  }, [apiUrl, isLoggedIn, setShowLoginModal]);

  const handleSubmitIceShopSuccess = useCallback((payload, responseData) => {
    const externalSource = payload?.external_source;
    if (externalSource?.external_id) {
      setDiscoveryResults((prev) => prev.filter((result) => !(
        result.provider === externalSource.provider
        && result.external_id === externalSource.external_id
      )));
    }
    if (responseData?.discovery_slots) {
      setDiscoverySlots(responseData.discovery_slots);
    } else if (isLoggedIn) {
      fetchDiscoverySlots();
    }
  }, [canAccessExternalDiscovery, fetchDiscoverySlots, isLoggedIn]);
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
  const showPermanentClosedFilterActive = !!filters.showPermanentClosed;
  const typeFilters = filters.types ?? { kugel: false, softeis: false, eisbecher: false };
  const hasTypeFilter = Object.values(typeFilters).some(Boolean);

  const shopsWithDisplayValue = useMemo(() => {
    if (!activeDisplayConfig?.getValue) {
      return [];
    }
    const filteredShops = normalizedIceCreamShops.reduce((acc, shop) => {
      if (favoritesFilterActive && shop.is_favorit !== 1) {
        return acc;
      }
      if (visitedFilterActive && Number(shop.has_visited) !== 1) {
        return acc;
      }
      if (notVisitedFilterActive && Number(shop.has_visited) !== 0) {
        return acc;
      }
      if (!showPermanentClosedFilterActive && shop.status === 'permanent_closed') {
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

    if (activeShopId === null) {
      return filteredShops;
    }

    const isFocusedAlreadyVisible = filteredShops.some(
      ({ shop }) => String(shop.eisdielen_id) === String(activeShopId)
    );
    if (isFocusedAlreadyVisible) {
      return filteredShops;
    }

    const focusedShop = normalizedIceCreamShops.find(
      (shop) => String(shop.eisdielen_id) === String(activeShopId)
    );
    if (!focusedShop || focusedShop.status !== 'permanent_closed') {
      return filteredShops;
    }

    return [
      ...filteredShops,
      { shop: focusedShop, value: activeDisplayConfig.getValue(focusedShop) },
    ];
  }, [
    normalizedIceCreamShops,
    activeDisplayConfig,
    activeShopId,
    favoritesFilterActive,
    visitedFilterActive,
    notVisitedFilterActive,
    showPermanentClosedFilterActive,
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
    if (showPermanentClosedFilterActive) count += 1;
    const typeCount = Object.values(typeFilters).filter(Boolean).length;
    count += typeCount;
    if (openFilterMode === 'now') count += 1;
    if (openFilterMode === 'custom' && openFilterDateTime) count += 1;
    return count;
  }, [
    favoritesFilterActive,
    visitedFilterActive,
    notVisitedFilterActive,
    showPermanentClosedFilterActive,
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

  useEffect(() => {
    if (!isLoggedIn || !canAccessExternalDiscovery) {
      setIsDiscoveryVisible(false);
      setDiscoverySlots(null);
      clearDiscoveryResults();
      return;
    }
    fetchDiscoverySlots();
  }, [isLoggedIn, canAccessExternalDiscovery, fetchDiscoverySlots, clearDiscoveryResults]);

  const mapDisplayShops = useMemo(
    () => shopsWithDisplayValue.map(({ shop }) => shop),
    [shopsWithDisplayValue]
  );
  const easterCampaignDefinition = getCampaignDefinition('easter_2026');
  const easterCampaignActive = getCampaignStatus('easter_2026') === CAMPAIGN_STATUS.ACTIVE;
  const easterMapRules = easterCampaignDefinition?.mapRules || {};
  const seasonalMapVisible = easterCampaignActive && seasonalMapEnabled;
  const seasonalMarkerVariant = seasonalMapVisible ? 'easter' : null;
  const clusterIconCreateFunction = seasonalMarkerVariant === 'easter'
    ? createEasterClusterIcon(easterEncounterState.bunnyShopId ?? null)
    : undefined;
  const seoKeywords = [
    'Ice-App',
    'Eispreise Deutschland',
    'Eis-App',
    'Eis',
    'Eis-Plattform',
    'Eisdielen Deutschland',
    'Eisdielen Karte',
    'Eisdielen Bewertung',
    'Kugelpreis',
    'Softeis Preis',
    'Eisbecher Bewertung',
    'Eis Ranking',
  ];

  return (
    <>
      <Seo
        title="Ice-App | Eispreise, Bewertungen und Eisdielen in Deutschland"
        description="Ice-App ist die Plattform für Eispreise in Deutschland. Finde Eisdielen auf der Karte, vergleiche Kugelpreise, entdecke Bewertungen und teile eigene Eis-Erfahrungen."
        keywords={seoKeywords}
        canonical={location.pathname === '/map' ? '/' : location.pathname || '/'}
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Ice-App',
            url: 'https://ice-app.de/',
            description: 'Plattform für Eispreise, Eisdielen-Bewertungen, Rankings und Community in Deutschland.',
          },
          {
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'Ice-App',
            applicationCategory: 'TravelApplication',
            operatingSystem: 'Web',
            url: 'https://ice-app.de/',
            description: 'Web-App für Eispreise, Eisdielen-Karte, Bewertungen und Community in Deutschland.',
          },
        ]}
      />
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
        {canAccessExternalDiscovery && isDiscoveryVisible && (
          <DiscoveryOverlay>
            <DiscoveryCard>
              <DiscoveryHeader>
                <DiscoveryTitle 
                  onClick={() => setIsDiscoveryExpanded(!isDiscoveryExpanded)} 
                  style={{ cursor: 'pointer', flex: 1 }}
                >
                  Neue Eisdielen entdecken
                </DiscoveryTitle>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {discoveryResults.length > 0 && isDiscoveryExpanded && (
                    <DiscoveryClearButton type="button" onClick={clearDiscoveryResults}>
                      Treffer ausblenden
                    </DiscoveryClearButton>
                  )}
                  <DiscoveryToggleButton 
                    type="button" 
                    onClick={() => setIsDiscoveryExpanded(!isDiscoveryExpanded)}
                    $isExpanded={isDiscoveryExpanded}
                    aria-label={isDiscoveryExpanded ? "Zuklappen" : "Aufklappen"}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </DiscoveryToggleButton>
                </div>
              </DiscoveryHeader>
              {isDiscoveryExpanded && (
                <>
                  {isLoggedIn && discoverySlots && (
                    <DiscoverySlotText>
                      Freie Discovery-Slots: {discoverySlots.remaining_slots ?? 0}/{discoverySlots.limit ?? DISCOVERY_SLOT_LIMIT}
                    </DiscoverySlotText>
                  )}
                  <DiscoveryInfoBox>
                    <DiscoveryInfoSummary>Was macht Discovery?</DiscoveryInfoSummary>
                    <DiscoveryInfoContent>
                      <p style={{ margin: '0 0 0.5rem -1rem', listStyle: 'none' }}>
                        {isLoggedIn
                          ? 'Mit diesem Modus kannst du Eisdielen finden und eintragen, die im aktuellen Kartenausschnitt liegen und noch nicht in der Ice-App vorhanden sind.'
                          : 'Melde dich an, um im aktuellen Kartenausschnitt nach Eisdielen zu suchen, die noch nicht in der Ice-App eingetragen sind.'}
                      </p>
                      <li>Die Suche nutzt den aktuellen Kartenausschnitt und blendet bereits bekannte oder sehr ähnliche Treffer aus.</li>
                      <li>Falsche Treffer kannst du direkt markieren, damit sie künftig zurückhaltender oder gar nicht mehr angezeigt werden.</li>
                      <li>Neue Treffer lassen sich direkt mit vorausgefülltem Formular als Eisdiele eintragen.</li>
                    </DiscoveryInfoContent>
                  </DiscoveryInfoBox>
                  <DiscoveryPrimaryButton type="button" onClick={handleDiscoverySearch} disabled={isDiscoveryLoading}>
                    {isDiscoveryLoading ? 'Suche läuft…' : 'Kartenausschnitt durchsuchen'}
                  </DiscoveryPrimaryButton>
                  {discoveryMessage && <DiscoveryStatusText>{discoveryMessage}</DiscoveryStatusText>}
                  {discoveryError && <DiscoveryErrorText>{discoveryError}</DiscoveryErrorText>}
                  {(discoveryMeta.hiddenExisting > 0 || discoveryMeta.hiddenDuplicate > 0 || discoveryMeta.hiddenFalsePositive > 0 || discoveryMeta.truncated) && (
                    <DiscoveryText>
                      {[
                        discoveryMeta.hiddenExisting > 0 ? `${discoveryMeta.hiddenExisting} bereits bekannte Treffer` : null,
                        discoveryMeta.hiddenDuplicate > 0 ? `${discoveryMeta.hiddenDuplicate} ähnliche Dubletten` : null,
                        discoveryMeta.hiddenFalsePositive > 0 ? `${discoveryMeta.hiddenFalsePositive} bereits gemeldete Treffer` : null,
                        discoveryMeta.truncated ? 'weitere Treffer wurden gekürzt' : null,
                      ].filter(Boolean).join(' · ')}
                    </DiscoveryText>
                  )}
                </>
              )}
            </DiscoveryCard>
          </DiscoveryOverlay>
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
          <MapEvents />
          <MapContextMenuListener
            onOpen={handleMapContextMenuOpen}
            onDismiss={closeContextMenu}
            onUserInteraction={handleMapInteraction}
          />
          <SearchToggleControl isSearchVisible={isSearchVisible} onToggle={toggleSearchVisibility} />
          {canAccessExternalDiscovery && (
            <DiscoveryToggleControl isDiscoveryVisible={isDiscoveryVisible} onToggle={toggleDiscoveryVisibility} />
          )}
          <ClusteringToggleControl clustering={clustering} onToggle={() => setClustering((prev) => !prev)} />
          <SeasonalViewToggleControl
            enabled={easterCampaignActive}
            active={seasonalMapVisible}
            onToggle={() => setSeasonalMapEnabled((previous) => !previous)}
          />
          <ZoomControl position="topright" />
          <LocateControl userPosition={userPosition} />
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            maxZoom={19}
          />
          {activeShop && <MapCenterOnShop shop={activeShop} />}
          {easterCampaignActive && (
            <EasterMapEncounter
              enabled={easterCampaignActive}
              visible={seasonalMapVisible}
              shops={mapDisplayShops}
              currentZoom={currentZoom}
              bunnyMinZoom={easterMapRules.bunnyMinZoom ?? 9}
              workshopMinZoom={easterMapRules.workshopMinZoom ?? 6}
              isLoggedIn={isLoggedIn}
              setShowLoginModal={setShowLoginModal}
              onStateChange={setEasterEncounterState}
            />
          )}
          {clustering ? ( // show the clustered
            <MarkerClusterGroup
              key={`${seasonalMapVisible ? 'cluster-easter' : 'cluster-default'}-${easterEncounterState.bunnyShopId ?? 'none'}`}
              maxClusterRadius={25}
              iconCreateFunction={clusterIconCreateFunction}
            >
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
                    isFocused={activeShopId !== null && String(activeShopId) === String(shop.eisdielen_id)}
                    seasonalVariant={seasonalMarkerVariant}
                    encounterBunny={
                      seasonalMapVisible
                      && Number(easterEncounterState.bunnyShopId) === Number(shop.eisdielen_id)
                    }
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
                  isFocused={activeShopId !== null && String(activeShopId) === String(shop.eisdielen_id)}
                  seasonalVariant={seasonalMarkerVariant}
                  encounterBunny={
                    seasonalMapVisible
                    && Number(easterEncounterState.bunnyShopId) === Number(shop.eisdielen_id)
                  }
                />
              );
            })
          )}
          {canAccessExternalDiscovery && isDiscoveryVisible && discoveryResults.map((result) => (
            <Marker
              key={`${result.provider}-${result.external_id}`}
              position={[result.lat, result.lon]}
              icon={createDiscoveryMarkerIcon({ flagged: result.classification === 'flagged_false_positive' })}
            >
              <Popup>
                <DiscoveryPopup>
                  <DiscoveryPopupTitle>{result.name}</DiscoveryPopupTitle>
                  {result.address && <DiscoveryPopupMeta>{result.address}</DiscoveryPopupMeta>}
                  {result.website && (
                    <DiscoveryPopupMeta>
                      <a href={result.website} target="_blank" rel="noreferrer">{result.website}</a>
                    </DiscoveryPopupMeta>
                  )}
                  {result.opening_hours_note && (
                    <DiscoveryPopupMeta>Öffnungszeiten: {result.opening_hours_note}</DiscoveryPopupMeta>
                  )}
                  {result.classification === 'flagged_false_positive' && (
                    <DiscoveryPopupWarning>
                      Dieser Treffer wurde bereits {result.feedback_false_positive_count || 1}x als möglicherweise falsch gemeldet und wird deshalb vorsichtiger angezeigt.
                    </DiscoveryPopupWarning>
                  )}
                  <DiscoveryPopupMeta>Quelle: OSM Discovery</DiscoveryPopupMeta>
                  <DiscoveryPopupActions>
                    <DiscoveryPopupButton
                      type="button"
                      disabled={!isLoggedIn || (discoverySlots?.remaining_slots ?? 0) <= 0}
                      onClick={() => handleOpenDiscoveryImport(result)}
                    >
                      Als Eisdiele eintragen
                    </DiscoveryPopupButton>
                    <DiscoveryPopupSecondaryButton
                      type="button"
                      onClick={() => handleDiscoveryFeedback(result.entry_id)}
                    >
                      Falscher Treffer
                    </DiscoveryPopupSecondaryButton>
                    {result.external_url && (
                      <DiscoveryPopupLink href={result.external_url} target="_blank" rel="noreferrer">
                        Externes Ergebnis ansehen
                      </DiscoveryPopupLink>
                    )}
                  </DiscoveryPopupActions>
                  {!isLoggedIn && (
                    <DiscoveryPopupMeta>Anmelden, um Treffer zu importieren oder zu melden.</DiscoveryPopupMeta>
                  )}
                </DiscoveryPopup>
              </Popup>
            </Marker>
          ))}
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
              <FilterSectionTitle>Status</FilterSectionTitle>
              <FilterToggle>
                <input
                  type="checkbox"
                  checked={showPermanentClosedFilterActive}
                  onChange={() => handleFilterToggle('showPermanentClosed')}
                />
                <span>Dauerhaft geschlossene anzeigen</span>
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
        <ResetPasswordModal resetToken={token} isOpen={true} onClose={() => (window.location.href = "/login")} />
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
          refreshShops={refreshShopsAndDiscovery}
          userLatitude={submitModalPrefill?.lat ?? userPosition?.[0] ?? 50.83}
          userLongitude={submitModalPrefill?.lng ?? userPosition?.[1] ?? 12.92}
          initialLatitude={submitModalPrefill?.lat ?? null}
          initialLongitude={submitModalPrefill?.lng ?? null}
          initialName={submitModalPrefill?.name ?? ""}
          initialAddress={submitModalPrefill?.address ?? ""}
          initialWebsite={submitModalPrefill?.website ?? ""}
          initialOpeningHoursStructured={submitModalPrefill?.openingHoursStructured ?? null}
          initialOpeningHoursNote={submitModalPrefill?.openingHoursNote ?? ""}
          initialExternalSource={submitModalPrefill?.externalSource ?? null}
          onSubmitSuccess={handleSubmitIceShopSuccess}
        />
      )}
      {showDetailsView && activeShop && (
        <ShopDetailsView
          shopId={activeShop.eisdiele.id}
          setIceCreamShops={setIceCreamShops}
          refreshMapShops={refreshShopsAndDiscovery}
          onClose={handleCloseShopDetails}
        />
      )}
      </div>
    </>
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

const DiscoveryOverlay = styled.div`
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 1000;
  width: min(90vw, 360px);
  pointer-events: none;
`;

const DiscoveryCard = styled.div`
  display: grid;
  gap: 0.45rem;
  background: rgba(255, 251, 237, 0.96);
  padding: 0.75rem;
  border-radius: 18px;
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.18);
  border: 1px solid rgba(96, 62, 0, 0.12);
  pointer-events: auto;
`;

const DiscoveryHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
`;

const DiscoveryTitle = styled.h3`
  margin: 0;
  color: #503000;
  font-size: 1rem;
`;

const DiscoveryText = styled.p`
  margin: 0;
  color: rgba(80, 48, 0, 0.78);
  font-size: 0.84rem;
  line-height: 1.35;
`;

const DiscoverySlotText = styled.p`
  margin: 0;
  color: #1652b8;
  font-size: 0.84rem;
  font-weight: 700;
`;

const DiscoveryInfoBox = styled.details`
  border: 1px solid rgba(22, 82, 184, 0.16);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.72);
  padding: 0.1rem 0.65rem 0.5rem;
`;

const DiscoveryInfoSummary = styled.summary`
  cursor: pointer;
  color: #1652b8;
  font-size: 0.84rem;
  font-weight: 700;
  padding: 0.45rem 0 0.25rem;
`;

const DiscoveryInfoContent = styled.ul`
  margin: 0.1rem 0 0;
  padding-left: 1rem;
  color: rgba(80, 48, 0, 0.78);
  font-size: 0.82rem;
  line-height: 1.4;
`;

const DiscoveryPrimaryButton = styled.button`
  border: none;
  border-radius: 12px;
  padding: 0.65rem 0.9rem;
  background: linear-gradient(180deg, #2d7ff9 0%, #1652b8 100%);
  color: #fff;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const DiscoveryClearButton = styled.button`
  border: none;
  background: transparent;
  color: #1652b8;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
`;

const DiscoveryToggleButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #503000;
  transition: transform 0.2s ease-in-out;
  transform: ${props => props.$isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'};
`;

const DiscoveryStatusText = styled.p`
  margin: 0;
  color: #1f6f43;
  font-size: 0.84rem;
  font-weight: 600;
`;

const DiscoveryErrorText = styled.p`
  margin: 0;
  color: #b00020;
  font-size: 0.84rem;
  font-weight: 600;
`;

const DiscoveryPopup = styled.div`
  min-width: 220px;
  display: grid;
  gap: 0.35rem;
`;

const DiscoveryPopupTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  color: #2d2d2d;
`;

const DiscoveryPopupMeta = styled.p`
  margin: 0;
  font-size: 0.84rem;
  color: #555;

  a {
    color: #1652b8;
    word-break: break-word;
  }
`;

const DiscoveryPopupWarning = styled.p`
  margin: 0;
  padding: 0.45rem 0.55rem;
  border-radius: 10px;
  background: rgba(182, 188, 200, 0.22);
  color: #4e5868;
  font-size: 0.82rem;
  line-height: 1.35;
`;

const DiscoveryPopupActions = styled.div`
  display: grid;
  gap: 0.45rem;
  margin-top: 0.35rem;
`;

const DiscoveryPopupButton = styled.button`
  border: none;
  border-radius: 10px;
  padding: 0.6rem 0.8rem;
  background: #ffb522;
  color: #2d2200;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const DiscoveryPopupSecondaryButton = styled.button`
  border: 1px solid rgba(45, 45, 45, 0.14);
  border-radius: 10px;
  padding: 0.55rem 0.8rem;
  background: #fff;
  color: #5a3c00;
  font-weight: 600;
  cursor: pointer;
`;

const DiscoveryPopupLink = styled.a`
  display: block;
  text-align: center;
  border: 1px solid rgba(22, 82, 184, 0.18);
  border-radius: 10px;
  padding: 0.55rem 0.8rem;
  background: #f7faff;
  color: #1652b8;
  font-weight: 600;
  text-decoration: none;
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
