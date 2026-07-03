import { useCallback, useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import { Marker, Popup, useMap } from 'react-leaflet';
import {
  fetchTourDeGlaceProgress,
  findTourDeGlaceEasterEgg,
  submitTourDeGlaceStageTip,
} from './tourDeGlaceApi';
import { getTourDeGlaceStarterSuggestions } from './tourDeGlaceStarters';

const TOUR_EGG_IMAGE = '/assets/tour-de-glace/tour_egg.png';
const TOUR_EGG_MIN_ZOOM = 8;

const eggIcon = L.divIcon({
  className: 'tour-de-glace-egg-marker',
  html: `
    <div style="position:relative; width:74px; height:86px;">
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
  const [stageTipValue, setStageTipValue] = useState('');
  const [savingStageTip, setSavingStageTip] = useState(false);
  const [stageTipFocused, setStageTipFocused] = useState(false);

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
      setState({ loading: false, error: error.message || 'Etappensichtung konnte nicht geladen werden.', data: null });
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
  const stageTip = useMemo(() => (
    (state.data?.stage_tips || []).find((tip) => Number(tip.stage_number) === Number(egg?.stage_number)) || null
  ), [egg?.stage_number, state.data?.stage_tips]);
  const stageTipSuggestions = useMemo(() => {
    return getTourDeGlaceStarterSuggestions(stageTipValue, 6);
  }, [stageTipValue]);
  const showStageTipSuggestions = stageTipFocused && stageTipSuggestions.length > 0 && !Boolean(stageTip?.closed) && !savingStageTip;

  useEffect(() => {
    setStageTipValue(stageTip?.tip_stage_winner || '');
  }, [stageTip?.stage_number, stageTip?.tip_stage_winner]);

  const position = useMemo(() => {
    const lat = Number(egg?.latitude);
    const lng = Number(egg?.longitude);
    if (!enabled || Number(currentZoom) < TOUR_EGG_MIN_ZOOM || !egg || Number.isNaN(lat) || Number.isNaN(lng)) {
      return null;
    }
    return [lat, lng];
  }, [currentZoom, egg, enabled]);

  const handleFind = async () => {
    const funText = egg?.fun_text || 'Das Peloton nickt anerkennend.';
    if (egg?.found) {
      setMessage('Du hast diese Etappe schon gesichtet.');
      return;
    }
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
      window.dispatchEvent(new CustomEvent('seasonal:tour-de-glace-progress-updated'));
      await loadProgress();
    } catch (error) {
      setMessage(error.message || 'Etappensichtung konnte nicht gespeichert werden.');
    }
  };

  const handleCenter = () => {
    if (position) {
      map.flyTo(position, Math.max(map.getZoom(), 12), { duration: 0.8 });
    }
  };

  const handleSaveStageTip = async () => {
    const value = stageTipValue.trim();
    if (!value || !egg?.stage_number) {
      setMessage('Bitte gib einen Etappensieger ein.');
      return;
    }
    setSavingStageTip(true);
    setMessage('');
    try {
      await submitTourDeGlaceStageTip(authToken, egg.stage_number, value);
      setMessage('Etappentipp gespeichert.');
      window.dispatchEvent(new CustomEvent('seasonal:tour-de-glace-progress-updated'));
      await loadProgress();
    } catch (error) {
      setMessage(error.message || 'Etappentipp konnte nicht gespeichert werden.');
    } finally {
      setSavingStageTip(false);
    }
  };

  if (!enabled || !position) {
    return null;
  }

  return (
    <Marker position={position} icon={eggIcon} eventHandlers={{ click: handleCenter }}>
      <Popup>
        <div style={{ minWidth: '210px' }}>
          <strong>Tour de Glace Etappensichtung</strong>
          <p style={{ margin: '0.45rem 0' }}>
            Etappe {egg.stage_number}: {egg.start_location} &rarr; {egg.finish_location}
          </p>
          <p style={{ margin: '0 0 0.65rem', color: '#5b6270' }}>
            {egg.found
              ? `Gesichert! ${egg.fun_text || 'Das Peloton nickt anerkennend.'}`
              : egg.hint_text}
          </p>
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
            {egg.found ? 'Schon gesichtet' : isLoggedIn ? 'Etappe sichten' : 'Einloggen zum Sichten'}
          </button>
          {egg.found && isLoggedIn && (
            <div style={{ marginTop: '0.75rem', display: 'grid', gap: '0.4rem' }}>
              <label style={{ position: 'relative', display: 'grid', gap: '0.25rem', color: '#303746', fontWeight: 800 }}>
                Etappensieger tippen
                <input
                  value={stageTipValue}
                  disabled={Boolean(stageTip?.closed) || savingStageTip}
                  onChange={(event) => setStageTipValue(event.target.value)}
                  onFocus={() => setStageTipFocused(true)}
                  onBlur={() => window.setTimeout(() => setStageTipFocused(false), 120)}
                  placeholder="Fahrername"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    border: '1px solid #cfd6df',
                    borderRadius: '8px',
                    padding: '0.5rem 0.6rem',
                    font: 'inherit',
                  }}
                />
                {showStageTipSuggestions && (
                  <div
                    style={{
                      position: 'absolute',
                      zIndex: 1000,
                      left: 0,
                      right: 0,
                      top: '100%',
                      display: 'grid',
                      gap: '0.2rem',
                      maxHeight: '180px',
                      overflowY: 'auto',
                      border: '1px solid #cfd6df',
                      borderRadius: '8px',
                      background: '#ffffff',
                      boxShadow: '0 10px 24px rgba(24, 39, 75, 0.14)',
                      padding: '0.3rem',
                    }}
                  >
                    {stageTipSuggestions.map((starter) => (
                      <button
                        key={`${starter.name}-${starter.team}`}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          setStageTipValue(starter.name);
                          setStageTipFocused(false);
                        }}
                        style={{
                          display: 'grid',
                          gap: '0.1rem',
                          width: '100%',
                          border: 0,
                          borderRadius: '6px',
                          background: 'transparent',
                          color: '#202124',
                          padding: '0.4rem 0.5rem',
                          textAlign: 'left',
                          cursor: 'pointer',
                        }}
                      >
                        <strong style={{ fontSize: '0.9rem' }}>{starter.name}</strong>
                        <span style={{ color: '#5b6270', fontSize: '0.78rem', fontWeight: 700 }}>{starter.team}</span>
                      </button>
                    ))}
                  </div>
                )}
              </label>
              <button
                type="button"
                onClick={handleSaveStageTip}
                disabled={Boolean(stageTip?.closed) || savingStageTip || !stageTipValue.trim()}
                style={{
                  border: 0,
                  borderRadius: '8px',
                  padding: '0.5rem 0.7rem',
                  background: '#202124',
                  color: '#ffffff',
                  fontWeight: 800,
                  cursor: 'pointer',
                  opacity: Boolean(stageTip?.closed) || savingStageTip || !stageTipValue.trim() ? 0.55 : 1,
                }}
              >
                {stageTip?.closed ? 'Tipp geschlossen' : savingStageTip ? 'Speichert...' : 'Tipp speichern'}
              </button>
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
};

export default TourDeGlaceMapEggs;
