import { useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import { Marker, Popup } from 'react-leaflet';
import { isSpecialTime } from '../utils/seasonal';

const presentIcon = L.divIcon({
  className: 'birthday-present-marker',
  html: '<div style="font-size:24px; line-height:24px;">🎁</div>',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24],
});

const COOLDOWN_HOURS = 3;
const BASE_GIFT_PROBABILITY = 0.025;
const MIN_GIFT_PROBABILITY = 0.007;
const PROBABILITY_DECAY_PER_FOUND = 0.0035;
const BASE_MAX_GIFTS = 10;
const MIN_MAX_GIFTS = 3;
const MAX_GIFTS_DECAY_PER_FOUND = 1;

const parseServerDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const normalized = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const formatDuration = (seconds) => {
  const safe = Math.max(0, Number(seconds) || 0);
  const roundedHours = Math.max(1, Math.round(safe / 3600));
  return `${roundedHours} ${roundedHours === 1 ? 'Stunde' : 'Stunden'}`;
};

const BirthdayPresentMarkers = ({ shops = [], isLoggedIn, userId, setShowLoginModal }) => {
  if (isSpecialTime() !== 'birthday') {
    return null;
  }

  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const stateStorageKey = `birthday-eggs-state:${userId || 'guest'}`;
  const [cooldownUntil, setCooldownUntil] = useState(null);
  const [foundCount, setFoundCount] = useState(0);
  const [nowTs, setNowTs] = useState(Date.now());
  const [feedbackModal, setFeedbackModal] = useState({ open: false, title: '', message: '' });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(stateStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.cooldownUntil) {
        setCooldownUntil(parsed.cooldownUntil);
      }
      if (Number.isFinite(parsed?.foundCount)) {
        setFoundCount(parsed.foundCount);
      }
    } catch (error) {
      console.warn('Konnte Geschenk-State nicht lesen:', error);
    }
  }, [stateStorageKey]);

  useEffect(() => {
    const intervalId = setInterval(() => setNowTs(Date.now()), 30000);
    return () => clearInterval(intervalId);
  }, []);

  const cooldownActive = Boolean(cooldownUntil) && nowTs < new Date(cooldownUntil).getTime();

  const dynamicProbability = Math.max(
    MIN_GIFT_PROBABILITY,
    BASE_GIFT_PROBABILITY - (foundCount * PROBABILITY_DECAY_PER_FOUND)
  );
  const dynamicMaxGifts = Math.max(
    MIN_MAX_GIFTS,
    BASE_MAX_GIFTS - (foundCount * MAX_GIFTS_DECAY_PER_FOUND)
  );

  const giftShops = useMemo(() => {
    if (cooldownActive) {
      return [];
    }

    const selected = [];
    for (const shop of shops) {
      if (!shop || !Number.isFinite(Number(shop.latitude)) || !Number.isFinite(Number(shop.longitude))) {
        continue;
      }
      if (Math.random() < dynamicProbability) {
        selected.push(shop);
      }
      if (selected.length >= dynamicMaxGifts) {
        break;
      }
    }
    return selected;
  }, [shops, cooldownActive, dynamicProbability, dynamicMaxGifts]);

  const persistState = (nextCooldownUntil, nextFoundCount) => {
    setCooldownUntil(nextCooldownUntil);
    setFoundCount(nextFoundCount);
    try {
      localStorage.setItem(stateStorageKey, JSON.stringify({
        cooldownUntil: nextCooldownUntil,
        foundCount: nextFoundCount,
      }));
    } catch (error) {
      console.warn('Konnte Geschenk-State nicht speichern:', error);
    }
  };

  const onGiftClick = async (shopId) => {
    if (!isLoggedIn || !userId) {
      setShowLoginModal(true);
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/birthday_easter_egg_click.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          shop_id: shopId,
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data?.next_available_at) {
        const nextCount = Number.isFinite(data?.easter_eggs_found) ? data.easter_eggs_found : foundCount;
        persistState(data.next_available_at, nextCount);
      } else if (data?.success) {
        const fallbackCooldown = new Date(Date.now() + (COOLDOWN_HOURS * 60 * 60 * 1000)).toISOString();
        const nextCount = Number.isFinite(data?.easter_eggs_found) ? data.easter_eggs_found : foundCount;
        persistState(fallbackCooldown, nextCount);
      }

      if (data?.success) {
        const nextDate = parseServerDate(data?.next_available_at);
        const remainingSeconds = Number.isFinite(data?.remaining_seconds)
          ? data.remaining_seconds
          : (nextDate ? Math.max(0, Math.floor((nextDate.getTime() - Date.now()) / 1000)) : null);

        if (data?.newly_discovered) {
          setFeedbackModal({
            open: true,
            title: 'Geburtstagsgeschenk gefunden',
            message: remainingSeconds !== null
              ? `Mega, Glückwunsch! Dein Geburtstagsgeschenk wurde erfolgreich für die Aktion gezählt. Vielleicht kannst du in etwa ${formatDuration(remainingSeconds)} schon das nächste entdecken.`
              : 'Mega, Glückwunsch! Dein Geburtstagsgeschenk wurde erfolgreich für die Aktion gezählt. Vielleicht findest du später noch weitere.',
          });
        } else {
          setFeedbackModal({
            open: true,
            title: 'Geburtstagsgeschenk entdeckt',
            message: remainingSeconds !== null
              ? `Stark! Dieses Geburtstagsgeschenk hattest du bereits gesammelt und es bleibt natürlich gewertet. Vielleicht wartet in etwa ${formatDuration(remainingSeconds)} das nächste auf dich.`
              : 'Stark! Dieses Geburtstagsgeschenk hattest du bereits gesammelt und es bleibt natürlich gewertet. Vielleicht findest du später noch weitere.',
          });
        }
      } else if (data?.cooldown_active) {
        const remainingSeconds = Number.isFinite(data?.remaining_seconds) ? data.remaining_seconds : 0;
        setFeedbackModal({
          open: true,
          title: 'Geschenk zählt schon',
          message: `Sehr schön, dein letztes Geburtstagsgeschenk ist bereits verbucht. Vielleicht kannst du in etwa ${formatDuration(remainingSeconds)} wieder ein neues entdecken.`,
        });
      }
    } catch (error) {
      console.error('Fehler beim Speichern des Geschenks:', error);
    }
  };

  return (
    <>
      {giftShops.map((shop) => (
        <Marker
          key={`birthday-gift-${shop.eisdielen_id}`}
          position={[Number(shop.latitude), Number(shop.longitude)]}
          icon={presentIcon}
          eventHandlers={{ click: () => onGiftClick(shop.eisdielen_id) }}
        >
          <Popup>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ margin: '0 0 6px' }}>Geschenk auf der Karte</h3>
              <p style={{ margin: 0 }}>
                {isLoggedIn
                  ? 'Geschenk gefunden. Wird für die Geburtstagsaktion gewertet.'
                  : 'Bitte einloggen, um das Geschenk zu sammeln.'}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
      {feedbackModal.open && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.45)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
        }}>
          <div style={{
            maxWidth: '420px',
            width: '100%',
            background: '#fff',
            borderRadius: '14px',
            padding: '18px 16px',
            boxShadow: '0 8px 28px rgba(0, 0, 0, 0.25)',
            textAlign: 'center',
          }}>
            <h3 style={{ margin: '0 0 10px' }}>{feedbackModal.title}</h3>
            <p style={{ margin: 0, lineHeight: 1.4 }}>{feedbackModal.message}</p>
            <button
              type="button"
              onClick={() => setFeedbackModal({ open: false, title: '', message: '' })}
              style={{
                marginTop: '14px',
                border: 'none',
                borderRadius: '10px',
                padding: '8px 14px',
                background: '#ff8a24',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Alles klar
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default BirthdayPresentMarkers;
