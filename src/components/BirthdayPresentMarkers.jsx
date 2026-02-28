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

const BirthdayPresentMarkers = ({ shops = [], isLoggedIn, userId, setShowLoginModal }) => {
  if (isSpecialTime() !== 'birthday') {
    return null;
  }

  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const stateStorageKey = `birthday-eggs-state:${userId || 'guest'}`;
  const [cooldownUntil, setCooldownUntil] = useState(null);
  const [foundCount, setFoundCount] = useState(0);
  const [nowTs, setNowTs] = useState(Date.now());

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
      console.warn('Konnte Easter-Egg-State nicht lesen:', error);
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
      console.warn('Konnte Easter-Egg-State nicht speichern:', error);
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
    } catch (error) {
      console.error('Fehler beim Speichern des Easter Eggs:', error);
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
              <h3 style={{ margin: '0 0 6px' }}>Easter Egg</h3>
              <p style={{ margin: 0 }}>
                {isLoggedIn
                  ? 'Geschenk gefunden. Wird für die Geburtstagsaktion gewertet.'
                  : 'Bitte einloggen, um das Geschenk zu sammeln.'}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
};

export default BirthdayPresentMarkers;
