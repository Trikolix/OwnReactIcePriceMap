import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
import TourDeGlaceMapEggs from './features/seasonal/TourDeGlaceMapEggs';
import { Capacitor } from "@capacitor/core";
import Seo from './components/Seo';
import { CAMPAIGN_STATUS, getCampaignDefinition, getCampaignStatus } from './features/seasonal/campaigns';
import { canUseExternalDiscovery } from './utils/featureAccess';
import { formatDateTimeLocalInputValue } from './utils/dateTimeLocal';
const MIN_CONTEXT_MENU_ZOOM = 7;
const EXTERNAL_DISCOVERY_MIN_ZOOM_FALLBACK = 9;
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
const SEARCH_PLACE_MIN_QUERY_LENGTH = 3;
const SEARCH_PLACE_DEBOUNCE_MS = 450;
const DEFAULT_DISCOVERY_META = {
  hiddenExisting: 0,
  hiddenDuplicate: 0,
  hiddenFalsePositive: 0,
  truncated: false,
};

const isTourDeGlaceShadowWindow = (now = new Date()) => (
  now >= new Date('2026-06-12T00:00:00+02:00')
  && now < new Date('2026-07-04T00:00:00+02:00')
);

const toNumberOrNull = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const getDistanceKm = (from, to) => {
  if (!from || !to) return Number.POSITIVE_INFINITY;
  const [fromLat, fromLon] = from.map(Number);
  const [toLat, toLon] = to.map(Number);
  if (![fromLat, fromLon, toLat, toLon].every(Number.isFinite)) {
    return Number.POSITIVE_INFINITY;
  }

  const toRad = (degrees) => degrees * (Math.PI / 180);
  const earthRadiusKm = 6371;
  const dLat = toRad(toLat - fromLat);
  const dLon = toRad(toLon - fromLon);
  const lat1 = toRad(fromLat);
  const lat2 = toRad(toLat);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const getPlaceCountryPriority = (item) => {
  const countryCode = item.address?.country_code;
  if (countryCode === 'de') return 0;
  if (['at', 'ch', 'cz', 'pl', 'nl', 'be', 'lu', 'fr', 'dk'].includes(countryCode)) return 1;
  return 2;
};

const getPlaceName = (item) => {
  const address = item.address || {};
  return item.namedetails?.['name:de']
    || item.namedetails?.name
    || item.name
    || address.city
    || address.town
    || address.village
    || address.municipality
    || address.hamlet
    || item.display_name?.split(',')[0]
    || 'Unbekannter Ort';
};

const formatPlaceLabel = (item) => {
  const address = item.address || {};
  const name = getPlaceName(item);
  const parts = [
    name,
    address.state,
    address.country,
  ].filter(Boolean);

  return [...new Set(parts)].join(', ');
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

const getClusterMarkerSummary = (cluster) => {
  const markers = cluster.getAllChildMarkers();
  return markers.reduce((summary, marker) => {
    const options = marker.options || {};
    return {
      total: summary.total + 1,
      favorites: summary.favorites + (options.isFavorite ? 1 : 0),
      personalChallenges: summary.personalChallenges + (options.hasActiveChallenge ? 1 : 0),
      teamChallenges: summary.teamChallenges + (options.hasActiveTeamChallenge ? 1 : 0),
      upcomingChallenges: summary.upcomingChallenges + (options.hasUpcomingChallenge ? 1 : 0),
    };
  }, {
    total: 0,
    favorites: 0,
    personalChallenges: 0,
    teamChallenges: 0,
    upcomingChallenges: 0,
  });
};

const createClusterStatusBadgeHtml = ({ label, count, title, background, color = '#ffffff' }) => {
  if (!count) {
    return '';
  }

  return `
    <span title="${title}" style="display:inline-flex; align-items:center; gap:2px; min-width:18px; height:18px; padding:0 5px; border-radius:999px; background:${background}; color:${color}; border:2px solid #ffffff; box-shadow:0 2px 8px rgba(0,0,0,0.2); font-size:10px; font-weight:800; line-height:1; box-sizing:border-box;">
      ${label}${count > 1 ? count : ''}
    </span>
  `;
};

const createClusterStatusBadgesHtml = (summary) => {
  const html = [
    createClusterStatusBadgeHtml({
      label: '*',
      count: summary.favorites,
      title: `${summary.favorites} Favorit${summary.favorites === 1 ? '' : 'en'} im Cluster`,
      background: '#ffd54a',
      color: '#4c3600',
    }),
    createClusterStatusBadgeHtml({
      label: 'T',
      count: summary.teamChallenges,
      title: `${summary.teamChallenges} Team-Challenge${summary.teamChallenges === 1 ? '' : 's'} im Cluster`,
      background: '#087f8c',
    }),
    createClusterStatusBadgeHtml({
      label: 'C',
      count: summary.personalChallenges,
      title: `${summary.personalChallenges} aktive Challenge${summary.personalChallenges === 1 ? '' : 's'} im Cluster`,
      background: '#ff6f00',
    }),
    createClusterStatusBadgeHtml({
      label: 'C',
      count: summary.upcomingChallenges,
      title: `${summary.upcomingChallenges} kommende Challenge${summary.upcomingChallenges === 1 ? '' : 's'} im Cluster`,
      background: '#d6d8dd',
      color: '#636a75',
    }),
  ].join('');

  return html
    ? `<div style="position:absolute; left:50%; bottom:-7px; transform:translateX(-50%); display:flex; gap:3px; justify-content:center; align-items:center; white-space:nowrap; z-index:8;">${html}</div>`
    : '';
};

const createEasterClusterIcon = (bunnyTargetShopId = null) => (cluster) => {
  const count = cluster.getChildCount();
  const summary = getClusterMarkerSummary(cluster);
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
        ${createClusterStatusBadgesHtml(summary)}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [Math.round(size / 2), Math.round(size / 2)],
  });
};

const createDefaultClusterIcon = (cluster) => {
  const count = cluster.getChildCount();
  const summary = getClusterMarkerSummary(cluster);
  const size = count < 10 ? 46 : count < 100 ? 52 : 60;
  const fontSize = count < 10 ? 17 : count < 100 ? 18 : 19;
  const accentColor = summary.teamChallenges
    ? '#087f8c'
    : summary.personalChallenges
      ? '#ff6f00'
      : summary.upcomingChallenges
        ? '#9aa1ad'
        : summary.favorites
          ? '#d59b00'
          : '#25728a';

  return L.divIcon({
    className: 'ice-marker-cluster',
    html: `
      <div style="position:relative; width:${size}px; height:${size}px;">
        <div style="position:absolute; inset:0; border-radius:50%; background:linear-gradient(145deg,#fff7df 0%,#f5b544 100%); border:3px solid #ffffff; box-shadow:0 8px 22px rgba(47,36,16,0.28), inset 0 0 0 4px rgba(255,255,255,0.35);"></div>
        <div style="position:absolute; inset:5px; border-radius:50%; border:3px solid ${accentColor}; opacity:0.9;"></div>
        <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; color:#3b2600; font-size:${fontSize}px; font-weight:900; font-family:'Segoe UI', Tahoma, Arial, sans-serif; line-height:1;">
          ${count}
        </div>
        ${createClusterStatusBadgesHtml(summary)}
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
    colorScaleMin: 1,
    colorScaleMax: 4,
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
    colorScaleMin: 1,
    colorScaleMax: 4,
    getValue: (shop) => toNumberOrNull(shop.kugel_preis_eur ?? shop.kugel_preis),
    formatValue: (value) => `${value.toFixed(2)} €`,
  },
  {
    value: 'softeisPrice',
    label: 'Softeispreis',
    invertScale: false,
    colorScaleMin: 1,
    colorScaleMax: 4,
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
  advanced: {
    type: 'kugel',
    rating: { min: 1, max: 5 },
    price: { min: '', max: '' },
  },
});

const ADVANCED_FILTER_TYPES = [
  {
    key: 'kugel',
    label: 'Kugel',
    getRating: (shop) => toNumberOrNull(shop.finaler_kugel_score ?? shop.finaler_score),
    getPrice: (shop) => toNumberOrNull(shop.kugel_preis_eur ?? shop.kugel_preis),
  },
  {
    key: 'softeis',
    label: 'Softeis',
    getRating: (shop) => toNumberOrNull(shop.finaler_softeis_score),
    getPrice: (shop) => toNumberOrNull(shop.softeis_preis_eur ?? shop.softeis_preis),
  },
  {
    key: 'eisbecher',
    label: 'Eisbecher',
    getRating: (shop) => toNumberOrNull(shop.finaler_eisbecher_score),
    getPrice: (shop) => toNumberOrNull(shop.eisbecher_preis_eur ?? shop.eisbecher_preis),
  },
];

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
  const buttonRef = useRef(null);
  const userPositionRef = useRef(userPosition);

  useEffect(() => {
    if (!map) return;

    const locateControl = L.control({ position: 'topright' });
    locateControl.onAdd = () => {
      const container = L.DomUtil.create('div', 'leaflet-bar');
      const button = L.DomUtil.create('a', 'leaflet-control-locate', container);
      button.href = '#';
      buttonRef.current = button;
      button.textContent = '📍';
      button.title = userPositionRef.current ? 'Auf meinen Standort zentrieren' : 'Standort wird geladen …';

      if (!userPositionRef.current) {
        L.DomUtil.addClass(button, 'leaflet-disabled');
      }

      const handleClick = (event) => {
        L.DomEvent.stopPropagation(event);
        L.DomEvent.preventDefault(event);
        if (userPositionRef.current) {
          map.setView(userPositionRef.current);
        }
      };

      L.DomEvent.on(button, 'click', handleClick);
      L.DomEvent.disableClickPropagation(container);

      return container;
    };

    locateControl.addTo(map);

    return () => {
      buttonRef.current = null;
      locateControl.remove();
    };
  }, [map]);

  useEffect(() => {
    userPositionRef.current = userPosition;

    const button = buttonRef.current;
    if (!button) return;

    button.title = userPosition ? 'Auf meinen Standort zentrieren' : 'Standort wird geladen …';
    if (userPosition) {
      L.DomUtil.removeClass(button, 'leaflet-disabled');
    } else {
      L.DomUtil.addClass(button, 'leaflet-disabled');
    }
  }, [userPosition]);

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

const SeasonalViewToggleControl = ({ enabled, active, onToggle, label = 'Ei', titleActive = 'Saisonansicht ausblenden', titleInactive = 'Saisonansicht einblenden' }) => {
  const map = useMap();
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!map || !enabled) return undefined;

    const seasonalControl = L.control({ position: 'topright' });
    seasonalControl.onAdd = () => {
      const container = L.DomUtil.create('div', 'leaflet-bar');
      const button = L.DomUtil.create('a', 'leaflet-control-seasonal-toggle', container);
      button.href = '#';
      button.textContent = label;
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
  }, [enabled, label, map, onToggle]);

  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    button.title = active ? titleActive : titleInactive;
    if (active) {
      L.DomUtil.addClass(button, 'leaflet-active');
    } else {
      L.DomUtil.removeClass(button, 'leaflet-active');
    }
  }, [active, titleActive, titleInactive]);

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
  const shopListRequestRef = useRef(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showDetailsView, setShowDetailsView] = useState(true);
  const { userId, isLoggedIn, userPosition, login, setUserPosition, authToken } = useUser();
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
  const [activeSearchSuggestionIndex, setActiveSearchSuggestionIndex] = useState(-1);
  const searchInputRef = useRef(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);
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
  const [externalDiscoveryMinZoom, setExternalDiscoveryMinZoom] = useState(EXTERNAL_DISCOVERY_MIN_ZOOM_FALLBACK);
  const activeShopRequestRef = useRef(0);
  const canAccessExternalDiscovery = useMemo(() => canUseExternalDiscovery(userId), [userId]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return undefined;
    }

    const html = document.documentElement;
    const body = document.body;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const previousHtmlHeight = html.style.height;
    const previousBodyHeight = body.style.height;
    const previousHtmlOverscroll = html.style.overscrollBehavior;
    const previousBodyOverscroll = body.style.overscrollBehavior;
    let frameId = null;

    const syncViewport = () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      frameId = window.requestAnimationFrame(() => {
        window.scrollTo(0, 0);
        mapRef.current?.invalidateSize?.();
        frameId = null;
      });
    };

    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    html.style.height = '100%';
    body.style.height = '100%';
    html.style.overscrollBehavior = 'none';
    body.style.overscrollBehavior = 'none';

    const visualViewport = window.visualViewport;
    visualViewport?.addEventListener('resize', syncViewport);
    visualViewport?.addEventListener('scroll', syncViewport);
    window.addEventListener('resize', syncViewport);
    window.addEventListener('orientationchange', syncViewport);
    syncViewport();

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      visualViewport?.removeEventListener('resize', syncViewport);
      visualViewport?.removeEventListener('scroll', syncViewport);
      window.removeEventListener('resize', syncViewport);
      window.removeEventListener('orientationchange', syncViewport);
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
      html.style.height = previousHtmlHeight;
      body.style.height = previousBodyHeight;
      html.style.overscrollBehavior = previousHtmlOverscroll;
      body.style.overscrollBehavior = previousBodyOverscroll;
    };
  }, []);

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
    return formatDateTimeLocalInputValue();
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
      || buildActiveShopPreview(iceCreamShops.find((shop) => String(shop.eisdielen_id) === String(id)));

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
  }, [apiUrl, buildActiveShopPreview, iceCreamShops, openFilterQueryString]);

  useEffect(() => {
    if (shopId) {
      fetchAndCenterShop(shopId);
    }
  }, [shopId, fetchAndCenterShop]);

  const getShopDisplayName = (shop) => {
    return shop.eisdielen_name || shop.eisdiele_name || shop.name || shop.eisdiele?.name || 'Unbenannte Eisdiele';
  };

  useEffect(() => {
    if (isSearchVisible) {
      window.requestAnimationFrame(() => {
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      });
    }
  }, [isSearchVisible]);

  const fetchPlaceMatches = useCallback(async (query, { signal, showNoResultError = false } = {}) => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < SEARCH_PLACE_MIN_QUERY_LENGTH) {
      setPlaceMatches([]);
      setIsGeocoding(false);
      return;
    }

    setIsGeocoding(true);
    setSearchError('');
    const params = new URLSearchParams({
      format: 'jsonv2',
      addressdetails: '1',
      namedetails: '1',
      limit: '8',
      featureType: 'settlement',
      q: trimmedQuery,
    });
    const mapBounds = mapRef.current?.getBounds?.();
    if (mapBounds) {
      const west = mapBounds.getWest();
      const north = mapBounds.getNorth();
      const east = mapBounds.getEast();
      const south = mapBounds.getSouth();
      params.set('viewbox', `${west},${north},${east},${south}`);
    }

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        signal,
        headers: {
          'Accept-Language': 'de',
        },
      });
      if (!response.ok) {
        throw new Error('Geocoding error');
      }

      const data = await response.json();
      const distanceOrigin = userPosition || (
        mapRef.current ? [mapRef.current.getCenter().lat, mapRef.current.getCenter().lng] : null
      );
      const seenPlaces = new Set();
      const formatted = data
        .map((item) => {
          const position = [Number(item.lat), Number(item.lon)];
          const name = getPlaceName(item);
          return {
            type: 'place',
            id: item.place_id,
            name: formatPlaceLabel(item),
            rawName: name,
            position,
            countryPriority: getPlaceCountryPriority(item),
            distanceKm: getDistanceKm(distanceOrigin, position),
            importance: Number(item.importance ?? 0),
          };
        })
        .filter((item) => {
          const key = `${item.rawName.toLowerCase()}|${item.position.map((value) => value.toFixed(3)).join(',')}`;
          if (seenPlaces.has(key)) return false;
          seenPlaces.add(key);
          return item.position.every(Number.isFinite);
        })
        .sort((a, b) => {
          const queryLower = trimmedQuery.toLowerCase();
          const aStartsWithQuery = a.rawName.toLowerCase().startsWith(queryLower) ? 0 : 1;
          const bStartsWithQuery = b.rawName.toLowerCase().startsWith(queryLower) ? 0 : 1;
          if (aStartsWithQuery !== bStartsWithQuery) {
            return aStartsWithQuery - bStartsWithQuery;
          }
          if (a.countryPriority !== b.countryPriority) {
            return a.countryPriority - b.countryPriority;
          }
          if (a.distanceKm !== b.distanceKm) {
            return a.distanceKm - b.distanceKm;
          }
          return b.importance - a.importance;
        })
        .slice(0, 5);
      setPlaceMatches(formatted);
      if (showNoResultError && !formatted.length) {
        setSearchError('Kein Ort gefunden.');
      }
    } catch (error) {
      if (error?.name === 'AbortError') {
        return;
      }
      console.error('Fehler bei der Ortssuche:', error);
      setSearchError('Ortssuche fehlgeschlagen.');
    } finally {
      if (!signal?.aborted) {
        setIsGeocoding(false);
      }
    }
  }, [userPosition]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setShopMatches([]);
      setPlaceMatches([]);
      setSearchError('');
      setIsGeocoding(false);
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
  }, [searchQuery, iceCreamShops]);

  useEffect(() => {
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery.length < SEARCH_PLACE_MIN_QUERY_LENGTH) {
      setPlaceMatches([]);
      setIsGeocoding(false);
      return undefined;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      fetchPlaceMatches(trimmedQuery, { signal: controller.signal });
    }, SEARCH_PLACE_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [fetchPlaceMatches, searchQuery]);

  const loadIceCreamShops = useCallback(async () => {
    const requestId = ++shopListRequestRef.current;
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
    const safeWriteShopCache = (key, shops) => {
      const serializedShops = JSON.stringify(shops);
      const writeCache = () => localStorage.setItem(key, serializedShops);

      try {
        writeCache();
        return;
      } catch (storageError) {
        if (storageError?.name !== 'QuotaExceededError') {
          console.warn('Eisdielen-Cache konnte nicht gespeichert werden:', storageError);
          return;
        }
      }

      try {
        Object.keys(localStorage)
          .filter((storageKey) => storageKey.startsWith('iceCreamShopsCache::') && storageKey !== key)
          .forEach((storageKey) => localStorage.removeItem(storageKey));
        writeCache();
      } catch (storageError) {
        console.warn('Eisdielen-Cache ist zu groÃŸ und wurde nicht gespeichert:', storageError);
      }
    };

    const cachedShops = parseCachedShops(cacheKey) ?? parseCachedShops(fallbackCacheKey);
    if (cachedShops) {
      setIceCreamShops(cachedShops);
    }

    if (!navigator.onLine) {
      return;
    }

    try {
      const querySuffix = openFilterQueryString ? `&${openFilterQueryString}` : '';
      const query = `${apiUrl}/get_all_eisdielen.php?userId=${userId}${querySuffix}`;
      const response = await fetch(query);
      if (!response.ok) {
        throw new Error(`Eisdielen-Request fehlgeschlagen: ${response.status}`);
      }
      const data = await response.json();
      if (requestId !== shopListRequestRef.current) {
        return;
      }
      if (!Array.isArray(data)) {
        throw new Error('Eisdielen-Response ist keine Liste.');
      }
      setIceCreamShops(data);

        // Immer den Cache für den aktuellen Query-Stand komplett ersetzen.
      safeWriteShopCache(cacheKey, data);
    } catch (error) {
      if (requestId !== shopListRequestRef.current) {
        return;
      }
      console.error('Fehler beim Abrufen der Eisdielen:', error);
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
        const minZoom = Number(data.config?.min_zoom ?? data.slots?.min_zoom);
        if (Number.isFinite(minZoom)) {
          setExternalDiscoveryMinZoom(minZoom);
        }
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
    await fetchPlaceMatches(searchQuery, { showNoResultError: true });
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

  const searchSuggestions = useMemo(() => [
    ...shopMatches.map((match) => ({ ...match, suggestionType: 'shop' })),
    ...placeMatches.map((match) => ({ ...match, suggestionType: 'place' })),
  ], [placeMatches, shopMatches]);

  useEffect(() => {
    setActiveSearchSuggestionIndex(-1);
  }, [searchQuery]);

  useEffect(() => {
    setActiveSearchSuggestionIndex((currentIndex) => (
      searchSuggestions.length ? Math.min(Math.max(currentIndex, -1), searchSuggestions.length - 1) : -1
    ));
  }, [searchSuggestions.length]);

  const handleSelectSearchSuggestion = useCallback((suggestion) => {
    if (!suggestion) return;

    if (suggestion.suggestionType === 'shop') {
      handleSelectShop(suggestion);
      return;
    }

    handleSelectPlace(suggestion);
  }, [handleSelectPlace, handleSelectShop]);

  const handleSearchKeyDown = (event) => {
    if (!searchSuggestions.length) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveSearchSuggestionIndex((currentIndex) => (
        currentIndex >= searchSuggestions.length - 1 ? 0 : currentIndex + 1
      ));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveSearchSuggestionIndex((currentIndex) => (
        currentIndex <= 0 ? searchSuggestions.length - 1 : currentIndex - 1
      ));
      return;
    }

    if (event.key === 'Enter' && activeSearchSuggestionIndex >= 0) {
      event.preventDefault();
      handleSelectSearchSuggestion(searchSuggestions[activeSearchSuggestionIndex]);
      return;
    }

    if (event.key === 'Escape') {
      setActiveSearchSuggestionIndex(-1);
    }
  };

  const toggleSearchVisibility = useCallback(() => {
    setIsSearchVisible((prev) => !prev);
  }, []);

  const closeSearch = useCallback(() => {
    setIsSearchVisible(false);
    setActiveSearchSuggestionIndex(-1);
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
    if (zoom < externalDiscoveryMinZoom) {
      setDiscoveryError(`Bitte zoome mindestens auf Stufe ${externalDiscoveryMinZoom}, bevor du den Kartenausschnitt durchsuchst.`);
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
          const minZoom = Number(data.meta.slots?.min_zoom);
          if (Number.isFinite(minZoom)) {
            setExternalDiscoveryMinZoom(minZoom);
          }
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
          const minZoom = Number(data.config?.min_zoom ?? data.slots?.min_zoom);
          if (Number.isFinite(minZoom)) {
            setExternalDiscoveryMinZoom(minZoom);
          }
        }
      }
    } catch (error) {
      console.error('Fehler bei der Discovery-Suche:', error);
      clearDiscoveryResults();
      setDiscoveryError('Discovery-Suche fehlgeschlagen.');
    } finally {
      setIsDiscoveryLoading(false);
    }
  }, [apiUrl, canAccessExternalDiscovery, clearDiscoveryResults, currentZoom, discoverySlots, externalDiscoveryMinZoom, isLoggedIn, setShowLoginModal]);

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

  const handleAdvancedTypeChange = (value) => {
    setFilters((prev) => ({
      ...prev,
      advanced: {
        type: value,
        rating: { min: 1, max: 5 },
        price: { min: '', max: '' },
      },
    }));
  };

  const handleAdvancedRangeChange = (group, bound, value) => {
    const numericValue = Number(value);
    setFilters((prev) => {
      const currentRange = group === 'rating'
        ? (prev.advanced?.rating ?? { min: 1, max: 5 })
        : {
            min: prev.advanced?.price?.min === '' ? advancedPriceRange.min : prev.advanced?.price?.min,
            max: prev.advanced?.price?.max === '' ? advancedPriceRange.max : prev.advanced?.price?.max,
          };
      const nextRange = { ...currentRange, [bound]: numericValue };

      if (bound === 'min' && numericValue > Number(nextRange.max)) {
        nextRange.max = numericValue;
      }
      if (bound === 'max' && numericValue < Number(nextRange.min)) {
        nextRange.min = numericValue;
      }

      return {
        ...prev,
        advanced: {
          ...(prev.advanced ?? createDefaultFilters().advanced),
          [group]: nextRange,
        },
      };
    });
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
  const advancedFilters = filters.advanced ?? createDefaultFilters().advanced;
  const activeAdvancedType = ADVANCED_FILTER_TYPES.find((type) => type.key === advancedFilters.type) ?? ADVANCED_FILTER_TYPES[0];
  const supportsAdvancedPriceFilter = activeAdvancedType.key !== 'eisbecher';
  const isAdvancedRatingActive = Number(advancedFilters.rating?.min) > 1 || Number(advancedFilters.rating?.max) < 5;
  const isAdvancedPriceActive = supportsAdvancedPriceFilter && (
    advancedFilters.price?.min !== '' || advancedFilters.price?.max !== ''
  );
  const hasAdvancedFilter = isAdvancedRatingActive || isAdvancedPriceActive;

  const advancedPriceBounds = useMemo(() => {
    const values = iceCreamShops
      .map((shop) => activeAdvancedType.getPrice(shop))
      .filter((value) => value !== null && !Number.isNaN(value));

    if (!values.length) {
      return { min: 0, max: 10 };
    }

    return {
      min: Math.floor(Math.min(...values) * 10) / 10,
      max: Math.ceil(Math.max(...values) * 10) / 10,
    };
  }, [iceCreamShops, activeAdvancedType]);

  const advancedPriceRange = {
    min: advancedFilters.price?.min === '' ? advancedPriceBounds.min : Number(advancedFilters.price.min),
    max: advancedFilters.price?.max === '' ? advancedPriceBounds.max : Number(advancedFilters.price.max),
  };
  const getRangePercent = (value, min, max) => {
    if (max <= min) {
      return 0;
    }
    return ((Number(value) - min) / (max - min)) * 100;
  };
  const ratingRangeStyle = {
    '--range-min': `${getRangePercent(advancedFilters.rating.min, 1, 5)}%`,
    '--range-max': `${getRangePercent(advancedFilters.rating.max, 1, 5)}%`,
  };
  const priceRangeStyle = {
    '--range-min': `${getRangePercent(advancedPriceRange.min, advancedPriceBounds.min, advancedPriceBounds.max)}%`,
    '--range-max': `${getRangePercent(advancedPriceRange.max, advancedPriceBounds.min, advancedPriceBounds.max)}%`,
  };

  const shopsWithDisplayValue = useMemo(() => {
    if (!activeDisplayConfig?.getValue) {
      return [];
    }
    const filteredShops = iceCreamShops.reduce((acc, shop) => {
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
      if (hasAdvancedFilter) {
        const ratingValue = activeAdvancedType.getRating(shop);
        const priceValue = activeAdvancedType.getPrice(shop);

        if (isAdvancedRatingActive && (
          ratingValue === null ||
          ratingValue < Number(advancedFilters.rating.min) ||
          ratingValue > Number(advancedFilters.rating.max)
        )) {
          return acc;
        }

        if (isAdvancedPriceActive && (
          priceValue === null ||
          priceValue < advancedPriceRange.min ||
          priceValue > advancedPriceRange.max
        )) {
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

    const focusedShop = iceCreamShops.find(
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
    iceCreamShops,
    activeDisplayConfig,
    activeShopId,
    favoritesFilterActive,
    visitedFilterActive,
    notVisitedFilterActive,
    showPermanentClosedFilterActive,
    hasTypeFilter,
    typeFilters,
    hasAdvancedFilter,
    isAdvancedRatingActive,
    isAdvancedPriceActive,
    supportsAdvancedPriceFilter,
    activeAdvancedType,
    advancedFilters,
    advancedPriceRange.min,
    advancedPriceRange.max,
  ]);

  const { minValue, maxValue } = useMemo(() => {
    const numericValues = iceCreamShops
      .map((shop) => activeDisplayConfig.getValue(shop))
      .filter((value) => value !== null && value !== undefined && !Number.isNaN(value));
    if (!numericValues.length) {
      return { minValue: null, maxValue: null };
    }
    return {
      minValue: Math.min(...numericValues),
      maxValue: Math.max(...numericValues),
    };
  }, [iceCreamShops, activeDisplayConfig]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (favoritesFilterActive) count += 1;
    if (visitedFilterActive) count += 1;
    if (notVisitedFilterActive) count += 1;
    if (showPermanentClosedFilterActive) count += 1;
    const typeCount = Object.values(typeFilters).filter(Boolean).length;
    count += typeCount;
    if (hasAdvancedFilter) count += 1;
    if (openFilterMode === 'now') count += 1;
    if (openFilterMode === 'custom' && openFilterDateTime) count += 1;
    return count;
  }, [
    favoritesFilterActive,
    visitedFilterActive,
    notVisitedFilterActive,
    showPermanentClosedFilterActive,
    typeFilters,
    hasAdvancedFilter,
    openFilterMode,
    openFilterDateTime,
  ]);

  // Geoposition des Nutzers laden
  useEffect(() => {
    const fetchPosition = async () => {
      if (!userPosition && navigator.geolocation) {
        try {
          if (Capacitor.isNativePlatform()) {
            const { Geolocation } = await import('@capacitor/geolocation');
            const permissions = await Geolocation.checkPermissions();
            if (permissions.location !== 'granted') {
              const request = await Geolocation.requestPermissions();
              if (request.location !== 'granted') return;
            }
          }
        } catch (e) {
          console.error("Geolocation init error:", e);
        }

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
    };
    fetchPosition();
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
  }, [userId, openFilterQueryString, fetchIceCreamShops]);

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
  const isTourDeGlaceAdmin = Number(userId) === 1;
  const tourDeGlaceActive = getCampaignStatus('tour_de_glace_2026') === CAMPAIGN_STATUS.ACTIVE
    || (isTourDeGlaceAdmin && isTourDeGlaceShadowWindow());
  const tourDeGlaceAdminVisible = tourDeGlaceActive && isTourDeGlaceAdmin;
  const easterMapRules = easterCampaignDefinition?.mapRules || {};
  const seasonalMapVisible = easterCampaignActive && seasonalMapEnabled;
  const easterMapVisible = easterCampaignActive && seasonalMapVisible;
  const tourDeGlaceMapVisible = tourDeGlaceAdminVisible;
  const seasonalMarkerVariant = easterMapVisible ? 'easter' : null;
  const clusterIconCreateFunction = seasonalMarkerVariant === 'easter'
    ? createEasterClusterIcon(easterEncounterState.bunnyShopId ?? null)
    : createDefaultClusterIcon;
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
      <MapPageShell>
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
                ref={searchInputRef}
                type="text"
                placeholder="Ort oder Eisdiele suchen"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={handleSearchKeyDown}
                aria-autocomplete="list"
                aria-controls="map-search-results"
                aria-expanded={shopMatches.length > 0 || placeMatches.length > 0}
              />
              <SearchButton type="submit" disabled={isGeocoding}>
                {isGeocoding ? 'Suche…' : 'Suchen'}
              </SearchButton>
              <SearchCloseButton type="button" onClick={closeSearch} aria-label="Suche schlieÃŸen">
                ×
              </SearchCloseButton>
            </SearchCard>
            {(shopMatches.length > 0 || placeMatches.length > 0 || searchError || isGeocoding) && (
              <SearchResults id="map-search-results">
                {isGeocoding && (
                  <SearchStatusText>Ort wird gesucht …</SearchStatusText>
                )}
                {shopMatches.length > 0 && (
                  <>
                    <SearchGroupLabel>Eisdielen</SearchGroupLabel>
                    {shopMatches.map((match, index) => (
                      <SearchResultButton
                        key={`shop-${match.id}`}
                        type="button"
                        $active={activeSearchSuggestionIndex === index}
                        onClick={() => handleSelectShop(match)}
                      >
                        {match.name}
                      </SearchResultButton>
                    ))}
                  </>
                )}
                {placeMatches.length > 0 && (
                  <>
                    <SearchGroupLabel>Orte</SearchGroupLabel>
                    {placeMatches.map((match, index) => (
                      <SearchResultButton
                        key={`place-${match.id}`}
                        type="button"
                        $active={activeSearchSuggestionIndex === shopMatches.length + index}
                        onClick={() => handleSelectPlace(match)}
                      >
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
            label="Ei"
            titleActive="Osteransicht ausblenden"
            titleInactive="Osteransicht einblenden"
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
              visible={easterMapVisible}
              shops={mapDisplayShops}
              currentZoom={currentZoom}
              bunnyMinZoom={easterMapRules.bunnyMinZoom ?? 9}
              workshopMinZoom={easterMapRules.workshopMinZoom ?? 6}
              isLoggedIn={isLoggedIn}
              setShowLoginModal={setShowLoginModal}
              onStateChange={setEasterEncounterState}
            />
          )}
          <TourDeGlaceMapEggs
            enabled={tourDeGlaceMapVisible}
            currentZoom={currentZoom}
            isLoggedIn={isLoggedIn}
            authToken={authToken}
            setShowLoginModal={setShowLoginModal}
          />
          {clustering ? ( // show the clustered
            <MarkerClusterGroup
              key={`${easterMapVisible ? 'cluster-easter' : 'cluster-default'}-${easterEncounterState.bunnyShopId ?? 'none'}`}
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
                    colorScaleMin={activeDisplayConfig.colorScaleMin}
                    colorScaleMax={activeDisplayConfig.colorScaleMax}
                    invertScale={activeDisplayConfig.invertScale}
                    fetchShopDetails={fetchShopDetails}
                    fetchAndCenterShop={fetchAndCenterShop}
                    isFocused={activeShopId !== null && String(activeShopId) === String(shop.eisdielen_id)}
                    seasonalVariant={seasonalMarkerVariant}
                    encounterBunny={
                      easterMapVisible
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
                  colorScaleMin={activeDisplayConfig.colorScaleMin}
                  colorScaleMax={activeDisplayConfig.colorScaleMax}
                  invertScale={activeDisplayConfig.invertScale}
                  fetchShopDetails={fetchShopDetails}
                  fetchAndCenterShop={fetchAndCenterShop}
                  isFocused={activeShopId !== null && String(activeShopId) === String(shop.eisdielen_id)}
                  seasonalVariant={seasonalMarkerVariant}
                  encounterBunny={
                    easterMapVisible
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
              <AdvancedFilterToggle
                type="button"
                onClick={() => setIsAdvancedFilterOpen((prev) => !prev)}
                aria-expanded={isAdvancedFilterOpen}
              >
                <span>Erweiterte Filtereinstellungen</span>
                <span>{isAdvancedFilterOpen ? '−' : '+'}</span>
              </AdvancedFilterToggle>
              {isAdvancedFilterOpen && (
                <AdvancedFilterPanel>
                  <FilterField>
                    <FilterSectionTitle as="label" htmlFor="advanced-filter-type">Sorte</FilterSectionTitle>
                    <AdvancedSelect
                      id="advanced-filter-type"
                      value={advancedFilters.type}
                      onChange={(event) => handleAdvancedTypeChange(event.target.value)}
                    >
                      {ADVANCED_FILTER_TYPES.map((type) => (
                        <option key={type.key} value={type.key}>{type.label}</option>
                      ))}
                    </AdvancedSelect>
                  </FilterField>

                  <RangeControl>
                    <RangeControlHeader>
                      <span>Rating</span>
                      <strong>{Number(advancedFilters.rating.min).toFixed(1)} bis {Number(advancedFilters.rating.max).toFixed(1)}</strong>
                    </RangeControlHeader>
                    <RangeInputs style={ratingRangeStyle}>
                      <RangeInput
                        type="range"
                        min="1"
                        max="5"
                        step="0.1"
                        value={advancedFilters.rating.min}
                        aria-label="Minimales Rating"
                        onChange={(event) => handleAdvancedRangeChange('rating', 'min', event.target.value)}
                      />
                      <RangeInput
                        type="range"
                        min="1"
                        max="5"
                        step="0.1"
                        value={advancedFilters.rating.max}
                        aria-label="Maximales Rating"
                        onChange={(event) => handleAdvancedRangeChange('rating', 'max', event.target.value)}
                      />
                    </RangeInputs>
                    <RangeScale>
                      <span>1.0</span>
                      <span>5.0</span>
                    </RangeScale>
                  </RangeControl>

                  {supportsAdvancedPriceFilter && (
                  <RangeControl>
                    <RangeControlHeader>
                      <span>Preis</span>
                      <strong>{advancedPriceRange.min.toFixed(2)} € bis {advancedPriceRange.max.toFixed(2)} €</strong>
                    </RangeControlHeader>
                    <RangeInputs style={priceRangeStyle}>
                      <RangeInput
                        type="range"
                        min={advancedPriceBounds.min}
                        max={advancedPriceBounds.max}
                        step="0.1"
                        value={advancedPriceRange.min}
                        aria-label="Minimaler Preis"
                        onChange={(event) => handleAdvancedRangeChange('price', 'min', event.target.value)}
                      />
                      <RangeInput
                        type="range"
                        min={advancedPriceBounds.min}
                        max={advancedPriceBounds.max}
                        step="0.1"
                        value={advancedPriceRange.max}
                        aria-label="Maximaler Preis"
                        onChange={(event) => handleAdvancedRangeChange('price', 'max', event.target.value)}
                      />
                    </RangeInputs>
                    <RangeScale>
                      <span>{advancedPriceBounds.min.toFixed(2)} €</span>
                      <span>{advancedPriceBounds.max.toFixed(2)} €</span>
                    </RangeScale>
                  </RangeControl>
                  )}
                </AdvancedFilterPanel>
              )}
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
      </MapPageShell>
    </>
  );
};

export default IceCreamRadar;

const MapPageShell = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-height: 100vh;
  min-height: 0;
  overflow: hidden;
  background-color: #ffb522;
  overscroll-behavior: none;

  @supports (height: 100dvh) {
    height: 100dvh;
    max-height: 100dvh;
  }
`;

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
  min-height: 0;
  width: 100%;
  display: flex;
  overflow: hidden;
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

  @media (max-width: 520px) {
    left: 12px;
    right: 58px;
    transform: none;
    width: auto;
  }

  @media (max-width: 360px) {
    left: 8px;
    right: 52px;
  }
`;

const SearchCard = styled.form`
  display: flex;
  gap: 0.4rem;
  background: rgba(255, 255, 255, 0.95);
  padding: 0.4rem;
  border-radius: 16px;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.15);
  pointer-events: auto;

  @media (max-width: 380px) {
    gap: 0.3rem;
    padding: 0.35rem;
  }
`;

const SearchInput = styled.input`
  flex: 1;
  border: none;
  border-radius: 12px;
  padding: 0.5rem 0.75rem;
  font-size: 0.95rem;
  background: #f7f7f7;
  min-width: 0;

  @media (max-width: 380px) {
    padding: 0.48rem 0.58rem;
    font-size: 0.88rem;
  }
`;

const SearchButton = styled.button`
  background-color: #ffb522;
  color: #000;
  border: none;
  border-radius: 12px;
  padding: 0.5rem 0.9rem;
  font-weight: 700;
  cursor: pointer;
  flex: 0 0 auto;

  &:disabled {
    opacity: 0.7;
    cursor: progress;
  }

  @media (max-width: 380px) {
    padding: 0.48rem 0.65rem;
    font-size: 0.88rem;
  }
`;

const SearchCloseButton = styled.button`
  width: 2.15rem;
  min-width: 2.15rem;
  border: none;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.08);
  color: #2f2100;
  font-size: 1.35rem;
  line-height: 1;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(0, 0, 0, 0.14);
  }

  @media (max-width: 380px) {
    width: 1.9rem;
    min-width: 1.9rem;
    font-size: 1.2rem;
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
  background: ${({ $active }) => ($active ? 'rgba(255, 181, 34, 0.22)' : 'transparent')};
  border: none;
  padding: 0.45rem 0.75rem;
  font-size: 0.9rem;
  cursor: pointer;

  &:hover {
    background: ${({ $active }) => ($active ? 'rgba(255, 181, 34, 0.3)' : 'rgba(0, 0, 0, 0.05)')};
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
  z-index: 2200;
`;

const FilterModalContent = styled.div`
  background: #fffbe6;
  border-radius: 16px;
  padding: 1.5rem;
  width: min(480px, 90%);
  max-height: min(86vh, 760px);
  overflow-y: auto;
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

const AdvancedFilterToggle = styled.button`
  width: 100%;
  border: 1px solid rgba(80, 48, 0, 0.22);
  border-radius: 12px;
  padding: 0.75rem 0.85rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.72);
  color: #503000;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
`;

const AdvancedFilterPanel = styled.div`
  display: grid;
  gap: 1rem;
  margin-top: 0.9rem;
  padding: 1rem;
  border: 1px solid rgba(80, 48, 0, 0.16);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.52);
`;

const FilterField = styled.div`
  display: grid;
  gap: 0.45rem;
`;

const AdvancedSelect = styled.select`
  width: 100%;
  border: 1px solid rgba(80, 48, 0, 0.28);
  border-radius: 10px;
  padding: 0.55rem 0.65rem;
  background: #fff;
  color: #503000;
  font: inherit;
`;

const RangeControl = styled.div`
  display: grid;
  gap: 0.45rem;
`;

const RangeControlHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  color: #503000;
  font-size: 0.95rem;

  strong {
    white-space: nowrap;
  }
`;

const RangeInputs = styled.div`
  position: relative;
  height: 28px;

  &::before,
  &::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: 12px;
    height: 4px;
    border-radius: 999px;
    pointer-events: none;
  }

  &::before {
    background: rgba(80, 48, 0, 0.18);
  }

  &::after {
    left: var(--range-min, 0%);
    right: calc(100% - var(--range-max, 100%));
    background: #ffb522;
  }
`;

const RangeInput = styled.input`
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 28px;
  margin: 0;
  appearance: none;
  background: transparent;
  pointer-events: none;

  &::-webkit-slider-runnable-track {
    height: 4px;
    background: transparent;
  }

  &::-moz-range-track {
    height: 4px;
    background: transparent;
  }

  &::-webkit-slider-thumb {
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid #fff;
    background: #ffb522;
    box-shadow: 0 1px 5px rgba(80, 48, 0, 0.32);
    cursor: pointer;
    pointer-events: auto;
    margin-top: -7px;
  }

  &::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid #fff;
    background: #ffb522;
    box-shadow: 0 1px 5px rgba(80, 48, 0, 0.32);
    cursor: pointer;
    pointer-events: auto;
  }
`;

const RangeScale = styled.div`
  display: flex;
  justify-content: space-between;
  color: #7a5a00;
  font-size: 0.8rem;
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
