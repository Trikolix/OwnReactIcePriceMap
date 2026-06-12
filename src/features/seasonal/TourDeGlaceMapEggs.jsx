import { useCallback, useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import { Marker, Popup, useMap } from 'react-leaflet';
import {
  fetchTourDeGlaceProgress,
  findTourDeGlaceEasterEgg,
} from './tourDeGlaceApi';

const TOUR_EGG_IMAGE = '/assets/tour-de-glace/tour_egg.png';
const TOUR_EGG_MIN_ZOOM = 8;

const eggIcon = L.divIcon({
  className: 'tour-de-glace-egg-marker',
  html: `
    <div style="position:relative; width:74px; height:86px;">
      <div style="position:absolute; left:50%; top:0; transform:translateX(-50%); width:54px; height:68px; border-radius:50% 50% 46% 46%; background:linear-gradient(160deg,#ffffff 0%,#f7d758 34%,#59b96b 35%,#59b96b 54%,#f08caf 55%,#f08caf 74%,#ffffff 75%); border:3px solid #202124; box-shadow:0 12px 20px rgba(0,0,0,0.26);"></div>
      <img
        src="${TOUR_EGG_IMAGE}"
        alt=""
        onerror="this.style.display='none'"
        style="position:absolute; left:50%; top:-2px; transform:translateX(-50%); width:62px; height:70px; object-fit:contain; filter:drop-shadow(0 12px 18px rgba(0,0,0,0.28));"
      />
      <div style="position:absolute; left:50%; bottom:0; transform:translateX(-50%); padding:4px 9px; border-radius:999px; background:#202124; color:#ffffff; font-size:11px; font-weight:800; white-space:nowrap;">Tour</div>
    </div>
  `,
  iconSize: [74, 86],
  iconAnchor: [37, 78],
  popupAnchor: [0, -72],
});

const TourDeGlaceMapEggs = ({
  enabled,
  currentZoom,
  isLoggedIn,
  authToken,
  setShowLoginModal,
}) => {
  const map = useMap();
  const [state, setState] = useState({ loading: false, error: '', data: null });
  const [message, setMessage] = useState('');

  const loadProgress = useCallback(async () => {
    if (!enabled) {
      setState({ loading: false, error: '', data: null });
      return;
    }

    setState((previous) => ({ ...previous, loading: true, error: '' }));
    try {
      const data = await fetchTourDeGlaceProgress(authToken);
      setState({ loading: false, error: '', data });
    } catch (error) {
      setState({ loading: false, error: error.message || 'Tour-Easter-Egg konnte nicht geladen werden.', data: null });
    }
  }, [authToken, enabled]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  useEffect(() => {
    const handleUpdate = () => loadProgress();
    window.addEventListener('seasonal:tour-de-glace-progress-updated', handleUpdate);
    return () => {
      window.removeEventListener('seasonal:tour-de-glace-progress-updated', handleUpdate);
    };
  }, [loadProgress]);

  const egg = state.data?.easter_egg || null;
  const position = useMemo(() => {
    const lat = Number(egg?.latitude);
    const lng = Number(egg?.longitude);
    if (!enabled || Number(currentZoom) < TOUR_EGG_MIN_ZOOM || !egg || egg.found || Number.isNaN(lat) || Number.isNaN(lng)) {
      return null;
    }
    return [lat, lng];
  }, [currentZoom, egg, enabled]);

  const handleFind = async () => {
    if (!isLoggedIn) {
      setShowLoginModal?.(true);
      return;
    }
    if (!egg?.stage_number || !egg?.map_secret_code) {
      return;
    }

    setMessage('');
    try {
      await findTourDeGlaceEasterEgg(authToken, egg.stage_number, egg.map_secret_code);
      setMessage('Etappen-Easter-Egg gefunden.');
      window.dispatchEvent(new CustomEvent('seasonal:tour-de-glace-progress-updated'));
      await loadProgress();
    } catch (error) {
      setMessage(error.message || 'Easter-Egg konnte nicht gespeichert werden.');
    }
  };

  const handleCenter = () => {
    if (position) {
      map.flyTo(position, Math.max(map.getZoom(), 12), { duration: 0.8 });
    }
  };

  if (!enabled || !position) {
    return null;
  }

  return (
    <Marker position={position} icon={eggIcon} eventHandlers={{ click: handleCenter }}>
      <Popup>
        <div style={{ minWidth: '210px' }}>
          <strong>Tour de Glace Easter-Egg</strong>
          <p style={{ margin: '0.45rem 0' }}>
            Etappe {egg.stage_number}: {egg.start_location} &rarr; {egg.finish_location}
          </p>
          <p style={{ margin: '0 0 0.65rem', color: '#5b6270' }}>{egg.hint_text}</p>
          {state.error && <p style={{ color: '#b42318' }}>{state.error}</p>}
          {message && <p style={{ color: '#14532d', fontWeight: 800 }}>{message}</p>}
          <button
            type="button"
            onClick={handleFind}
            disabled={state.loading}
            style={{
              border: 0,
              borderRadius: '8px',
              padding: '0.5rem 0.7rem',
              background: '#1f6feb',
              color: '#ffffff',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            {isLoggedIn ? 'Easter-Egg einsammeln' : 'Einloggen zum Einsammeln'}
          </button>
        </div>
      </Popup>
    </Marker>
  );
};

export default TourDeGlaceMapEggs;
