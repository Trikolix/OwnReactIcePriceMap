import { useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import { Marker, Popup } from 'react-leaflet';
import { advanceEasterBunnyHop, fetchEasterCampaignProgress } from './easterApi';

const bunnyIcon = new L.Icon({
  iconUrl: '/assets/easter-bunny.png',
  iconSize: [56, 56],
  iconAnchor: [28, 56],
  popupAnchor: [0, -48],
});

const dispatchProgressEvent = (detail) => {
  window.dispatchEvent(new CustomEvent('seasonal:easter-progress-updated', { detail }));
};

const EasterMapEncounter = ({ enabled, isLoggedIn, setShowLoginModal }) => {
  const [state, setState] = useState({
    loading: false,
    error: null,
    data: null,
  });

  useEffect(() => {
    if (!enabled || !isLoggedIn) {
      setState({ loading: false, error: null, data: null });
      return undefined;
    }

    let isCancelled = false;
    const load = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const data = await fetchEasterCampaignProgress();
        if (!isCancelled) {
          setState({ loading: false, error: null, data });
        }
      } catch (error) {
        if (!isCancelled) {
          setState({ loading: false, error: error.message, data: null });
        }
      }
    };

    load();

    const handleUpdate = (event) => {
      if (isCancelled) {
        return;
      }
      if (event.detail?.data) {
        setState({ loading: false, error: null, data: event.detail.data });
      } else {
        load();
      }
    };

    window.addEventListener('seasonal:easter-progress-updated', handleUpdate);
    return () => {
      isCancelled = true;
      window.removeEventListener('seasonal:easter-progress-updated', handleUpdate);
    };
  }, [enabled, isLoggedIn]);

  const progress = state.data?.progress || null;
  const currentTarget = progress?.current_target || null;
  const markerPosition = useMemo(() => {
    if (!currentTarget) {
      return null;
    }
    return [Number(currentTarget.lat), Number(currentTarget.lng)];
  }, [currentTarget]);

  const handleHop = async () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    try {
      const data = await advanceEasterBunnyHop();
      setState({ loading: false, error: null, data });
      dispatchProgressEvent({ data });

      if (Array.isArray(data?.achievements) && data.achievements.length > 0) {
        window.dispatchEvent(new CustomEvent('new-awards', { detail: data.achievements }));
      }
    } catch (error) {
      console.error('Die Hasenjagd konnte gerade nicht fortgesetzt werden.', error);
    }
  };

  if (!enabled) {
    return null;
  }

  if (!isLoggedIn) {
    return null;
  }

  if (state.loading && !progress) {
    return null;
  }

  if (!markerPosition || progress?.completed) {
    return null;
  }

  return (
    <>
      <Marker position={markerPosition} icon={bunnyIcon} eventHandlers={{ click: handleHop }}>
        <Popup>
          <div style={{ textAlign: 'center', minWidth: 180 }}>
            <h3 style={{ margin: '0 0 6px' }}>Osterhase gesichtet</h3>
            <p style={{ margin: 0 }}>
              Klick ihn an. Er hopst weiter und hinterlässt nach jedem Sprung eine neue Spur.
            </p>
          </div>
        </Popup>
      </Marker>
    </>
  );
};

export default EasterMapEncounter;
