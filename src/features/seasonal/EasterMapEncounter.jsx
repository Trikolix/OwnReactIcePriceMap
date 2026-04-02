import { useCallback, useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import { Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import SystemModal from '../../components/SystemModal';
import {
  advanceEasterBunnyHop,
  discoverEasterWorkshop,
  fetchEasterCampaignProgress,
} from './easterApi';

const DEFAULT_WORKSHOP_LOCATION = {
  name: 'Osterhasenwerkstatt auf der Osterinsel',
  lat: -27.1219,
  lng: -109.3663,
  found: false,
};

const workshopIcon = L.divIcon({
  className: 'easter-workshop-marker',
  html: `
    <div style="position:relative; width:94px; height:104px;">
      <img
        src="/assets/Osterwerkstatt.png"
        alt=""
        style="position:absolute; left:50%; top:0; transform:translateX(-50%); width:84px; height:84px; object-fit:contain; filter:drop-shadow(0 10px 16px rgba(0,0,0,0.28));"
      />
      <div style="position:absolute; left:50%; bottom:0; transform:translateX(-50%); padding:4px 10px; border-radius:999px; background:rgba(255,255,255,0.96); border:2px solid rgba(255,255,255,0.98); box-shadow:0 4px 12px rgba(0,0,0,0.18); color:#5f1833; font-size:12px; font-weight:800; white-space:nowrap;">Werkstatt</div>
    </div>
  `,
  iconSize: [94, 104],
  iconAnchor: [47, 94],
  popupAnchor: [0, -88],
});

const EMPTY_STATE = {
  loading: false,
  error: null,
  data: null,
};

const normalizeShopCandidate = (shop) => {
  if (!shop) {
    return null;
  }

  const shopId = shop.eisdielen_id ?? shop.shop_id ?? shop.id ?? null;
  const lat = Number(shop.latitude ?? shop.lat);
  const lng = Number(shop.longitude ?? shop.lng);
  if (shopId === null || Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }

  return {
    shop_id: Number(shopId),
    name: String(shop.name || shop.eisdielen_name || 'Eisdiele'),
    lat,
    lng,
  };
};

const distanceInKm = (latA, lngA, latB, lngB) => {
  const earthRadiusKm = 6371;
  const latDelta = ((latB - latA) * Math.PI) / 180;
  const lngDelta = ((lngB - lngA) * Math.PI) / 180;
  const latARad = (latA * Math.PI) / 180;
  const latBRad = (latB * Math.PI) / 180;
  const a = Math.sin(latDelta / 2) ** 2
    + Math.cos(latARad) * Math.cos(latBRad) * Math.sin(lngDelta / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.min(1, Math.sqrt(a)));
};

const createMapContext = (map, shops) => {
  if (!map || !Array.isArray(shops) || !shops.length) {
    return null;
  }

  const bounds = map.getBounds();
  const center = map.getCenter();
  const zoom = map.getZoom();
  const nearbyRadiusKm = zoom >= 14 ? 18 : zoom >= 12 ? 28 : zoom >= 10 ? 44 : 64;
  const normalizedShops = shops
    .map(normalizeShopCandidate)
    .filter(Boolean)
    .map((shop) => ({
      ...shop,
      distanceKm: distanceInKm(center.lat, center.lng, shop.lat, shop.lng),
      visible: bounds.contains([shop.lat, shop.lng]),
    }));

  const visibleShops = normalizedShops
    .filter((shop) => shop.visible)
    .sort((left, right) => left.distanceKm - right.distanceKm)
    .slice(0, 70)
    .map(({ distanceKm, visible, ...shop }) => shop);

  const nearbyShops = normalizedShops
    .filter((shop) => shop.distanceKm <= nearbyRadiusKm)
    .sort((left, right) => left.distanceKm - right.distanceKm)
    .slice(0, 110)
    .map(({ distanceKm, visible, ...shop }) => shop);

  return {
    center: {
      lat: Number(center.lat),
      lng: Number(center.lng),
    },
    visible_shops: visibleShops,
    nearby_shops: nearbyShops,
  };
};

const dispatchProgressEvent = (detail) => {
  window.dispatchEvent(new CustomEvent('seasonal:easter-progress-updated', { detail }));
};

const EasterMapEncounter = ({
  enabled,
  visible,
  shops = [],
  currentZoom,
  bunnyMinZoom = 9,
  workshopMinZoom = 6,
  isLoggedIn,
  setShowLoginModal,
  onStateChange,
}) => {
  const map = useMap();
  const [viewTick, setViewTick] = useState(0);
  const [state, setState] = useState(EMPTY_STATE);
  const [dialog, setDialog] = useState({ open: false, title: '', message: '' });

  useMapEvents({
    moveend: () => setViewTick((tick) => tick + 1),
    zoomend: () => setViewTick((tick) => tick + 1),
  });

  const loadProgress = useCallback(async (withContext = true) => {
    if (!enabled || !isLoggedIn || !shops.length) {
      return;
    }

    setState((previous) => ({ ...previous, loading: true, error: null }));
    try {
      const payload = withContext ? createMapContext(map, shops) : null;
      const data = await fetchEasterCampaignProgress(payload);
      setState({ loading: false, error: null, data });
    } catch (error) {
      setState({ loading: false, error: error.message, data: null });
    }
  }, [enabled, isLoggedIn, map, shops]);

  useEffect(() => {
    if (!enabled || !isLoggedIn || !shops.length) {
      setState(EMPTY_STATE);
      return;
    }

    loadProgress(true);
  }, [enabled, isLoggedIn, shops.length, loadProgress]);

  useEffect(() => {
    if (!enabled || !isLoggedIn || !shops.length) {
      return;
    }

    if (!state.data?.progress?.current_target) {
      loadProgress(true);
    }
  }, [enabled, isLoggedIn, shops.length, state.data?.progress?.current_target, viewTick, loadProgress]);

  useEffect(() => {
    const handleUpdate = (event) => {
      if (event.detail?.data) {
        setState({ loading: false, error: null, data: event.detail.data });
        return;
      }
      loadProgress(true);
    };

    window.addEventListener('seasonal:easter-progress-updated', handleUpdate);
    return () => {
      window.removeEventListener('seasonal:easter-progress-updated', handleUpdate);
    };
  }, [loadProgress]);

  const currentTarget = state.data?.progress?.current_target || null;
  const workshop = state.data?.workshop
    || state.data?.progress?.workshop
    || DEFAULT_WORKSHOP_LOCATION;
  const bunnyVisible = useMemo(() => {
    if (!enabled || !visible || !isLoggedIn || !currentTarget || currentZoom < bunnyMinZoom) {
      return false;
    }

    return map.getBounds().contains([Number(currentTarget.lat), Number(currentTarget.lng)]);
  }, [enabled, visible, isLoggedIn, currentTarget, currentZoom, bunnyMinZoom, map, viewTick]);

  useEffect(() => {
    if (!onStateChange) {
      return;
    }

    onStateChange({
      bunnyShopId: bunnyVisible ? Number(currentTarget?.shop_id) : null,
      bunnyVisible,
      currentTarget,
      workshop,
      completed: Boolean(state.data?.progress?.completed),
      loading: state.loading,
      error: state.error,
    });
  }, [bunnyVisible, currentTarget, onStateChange, state.data?.progress?.completed, state.error, state.loading, workshop]);

  useEffect(() => () => {
    if (!onStateChange) {
      return;
    }

    onStateChange({
      bunnyShopId: null,
      bunnyVisible: false,
      currentTarget: null,
      workshop: DEFAULT_WORKSHOP_LOCATION,
      completed: false,
      loading: false,
      error: null,
    });
  }, [onStateChange]);

  const openDialog = useCallback((title, message) => {
    setDialog({
      open: true,
      title,
      message,
    });
  }, []);

  const handleHop = useCallback(async () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    try {
      const data = await advanceEasterBunnyHop(createMapContext(map, shops) || {});
      if (data?.progress) {
        setState({ loading: false, error: null, data });
        dispatchProgressEvent({ data });
      }
      openDialog('Der Hase ist entwischt', data?.message || 'Der Osterhase war schneller.');
      if (Array.isArray(data?.achievements) && data.achievements.length > 0) {
        window.dispatchEvent(new CustomEvent('new-awards', { detail: data.achievements }));
      }
    } catch (error) {
      openDialog('Hasenspur verloren', error.message || 'Die Hasenjagd konnte gerade nicht fortgesetzt werden.');
    }
  }, [isLoggedIn, map, openDialog, setShowLoginModal, shops]);

  useEffect(() => {
    const handleBunnyClick = (event) => {
      const clickedShopId = Number(event.detail?.shopId);
      if (!clickedShopId || !bunnyVisible || !currentTarget) {
        return;
      }
      if (clickedShopId !== Number(currentTarget.shop_id)) {
        return;
      }

      handleHop();
    };

    window.addEventListener('seasonal:easter-bunny-click', handleBunnyClick);
    return () => {
      window.removeEventListener('seasonal:easter-bunny-click', handleBunnyClick);
    };
  }, [bunnyVisible, currentTarget, handleHop]);

  const handleWorkshopClick = useCallback(async () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    try {
      const data = await discoverEasterWorkshop();
      if (data?.progress) {
        setState({ loading: false, error: null, data });
        dispatchProgressEvent({ data });
      }
      openDialog('Werkstatt gefunden', data?.message || 'Du hast die Osterhasenwerkstatt entdeckt.');
      if (Array.isArray(data?.achievements) && data.achievements.length > 0) {
        window.dispatchEvent(new CustomEvent('new-awards', { detail: data.achievements }));
      }
    } catch (error) {
      openDialog('Werkstatt verschlossen', error.message || 'Die Werkstatt konnte gerade nicht betreten werden.');
    }
  }, [isLoggedIn, openDialog, setShowLoginModal]);

  if (!enabled || !visible) {
    return null;
  }

  const workshopVisible = currentZoom >= workshopMinZoom;
  const workshopPosition = [Number(workshop.lat), Number(workshop.lng)];

  return (
    <>
      {workshopVisible && (
        <Marker position={workshopPosition} icon={workshopIcon} eventHandlers={{ click: handleWorkshopClick }}>
          <Popup>
            <div style={{ textAlign: 'center', minWidth: 210 }}>
              <h3 style={{ margin: '0 0 6px' }}>Osterhasenwerkstatt</h3>
              <p style={{ margin: 0, lineHeight: 1.45 }}>
                Zwischen Vulkanen und Moai klappert die geheime Backstube des Osterhasen. Klick sie an, um den Secret Award zu sichern.
              </p>
            </div>
          </Popup>
        </Marker>
      )}

      <SystemModal
        isOpen={dialog.open}
        onClose={() => setDialog({ open: false, title: '', message: '' })}
        title={dialog.title}
        message={dialog.message}
      />
    </>
  );
};

export default EasterMapEncounter;
