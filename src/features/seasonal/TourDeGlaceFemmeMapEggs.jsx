import { useCallback, useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import { Marker, Popup, useMap } from 'react-leaflet';
import { fetchTourDeGlaceFemmeProgress, findTourDeGlaceFemmeEgg } from './tourDeGlaceFemmeApi';

const TOUR_EGG_IMAGE = '/assets/tour-de-glace/TourDeGlaceFemmes.png';
const TOUR_EGG_MIN_ZOOM = 8;

const eggIcon = L.divIcon({
  className: 'tour-de-glace-femme-egg-marker',
  html: `<div style="width:82px;height:92px;"><img src="${TOUR_EGG_IMAGE}" alt="" onerror="this.style.display='none'" style="width:82px;height:92px;object-fit:contain;filter:drop-shadow(0 12px 18px rgba(0,0,0,.28));"/></div>`,
  iconSize: [82, 92],
  iconAnchor: [41, 84],
  popupAnchor: [0, -78],
});

export default function TourDeGlaceFemmeMapEggs({ enabled, currentZoom, isLoggedIn, authToken, setShowLoginModal }) {
  const map = useMap();
  const [state, setState] = useState({ loading: false, error: '', egg: null });
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    if (!enabled) {
      setState({ loading: false, error: '', egg: null });
      return;
    }
    setState((previous) => ({ ...previous, loading: true, error: '' }));
    try {
      const data = await fetchTourDeGlaceFemmeProgress(authToken);
      setState({ loading: false, error: '', egg: data.easter_egg || null });
    } catch (error) {
      setState({ loading: false, error: error.message || 'Easter Egg konnte nicht geladen werden.', egg: null });
    }
  }, [authToken, enabled]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const refresh = () => load();
    window.addEventListener('seasonal:tour-de-glace-femme-progress-updated', refresh);
    return () => window.removeEventListener('seasonal:tour-de-glace-femme-progress-updated', refresh);
  }, [load]);

  const position = useMemo(() => {
    const lat = Number(state.egg?.latitude);
    const lng = Number(state.egg?.longitude);
    return enabled && Number(currentZoom) >= TOUR_EGG_MIN_ZOOM && state.egg && !Number.isNaN(lat) && !Number.isNaN(lng) ? [lat, lng] : null;
  }, [currentZoom, enabled, state.egg]);

  const findEgg = async () => {
    const egg = state.egg;
    if (egg?.found) return setMessage('Dieses Egg hast du bereits gefunden.');
    if (!isLoggedIn) return setShowLoginModal?.(true);
    if (!egg?.stage_number || !egg?.map_secret_code) return;
    setMessage('');
    try {
      await findTourDeGlaceFemmeEgg(authToken, egg.stage_number, egg.map_secret_code);
      setMessage('Egg gefunden. Dein Etappentipp erhaelt bei einem Top-10-Treffer den 1,25-fachen Bonus.');
      window.dispatchEvent(new CustomEvent('seasonal:tour-de-glace-femme-progress-updated'));
      await load();
    } catch (error) {
      setMessage(error.message || 'Egg konnte nicht gespeichert werden.');
    }
  };

  if (!enabled || !position) return null;

  return <Marker position={position} icon={eggIcon} eventHandlers={{ click: () => map.flyTo(position, Math.max(map.getZoom(), 12), { duration: 0.8 }) }}>
    <Popup>
      <div style={{ minWidth: '210px' }}>
        <strong>Tour de Glace Femmes Egg</strong>
        <p style={{ margin: '0.45rem 0' }}>Etappe {state.egg.stage_number}: {state.egg.start_location} &rarr; {state.egg.finish_location}</p>
        <p style={{ margin: '0 0 0.65rem', color: '#5b6270' }}>{state.egg.found ? 'Gefunden: Der Bonus ist fuer deinen heutigen Etappentipp aktiv.' : state.egg.hint_text}</p>
        {state.error && <p style={{ color: '#b42318' }}>{state.error}</p>}
        {message && <p style={{ color: '#14532d', fontWeight: 800 }}>{message}</p>}
        <button type="button" onClick={findEgg} disabled={state.loading} style={{ border: 0, borderRadius: '6px', padding: '0.5rem 0.7rem', background: '#5b2a86', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>
          {state.egg.found ? 'Bereits gefunden' : isLoggedIn ? 'Egg finden' : 'Einloggen zum Finden'}
        </button>
      </div>
    </Popup>
  </Marker>;
}
