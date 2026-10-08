import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { ChevronRight, Clock3, IceCreamBowl, MapPin, Search, Store, UtensilsCrossed } from 'lucide-react';
import CheckinForm from '../CheckinForm';
import SubmitIceShopModal from '../SubmitIceShopModal';
import {
  Overlay,
  Modal,
  CloseButton,
  Heading,
  Input,
  Message,
} from '../styles/SharedStyles';

const TYPE_LABELS = {
  ice_shop: 'Eisdiele',
  restaurant: 'Restaurant/Café',
  temporary_stand: 'Temporärer Stand',
};

const distanceKm = (origin, place) => {
  if (!origin || !Number.isFinite(Number(place.latitude)) || !Number.isFinite(Number(place.longitude))) return null;
  const [lat1, lon1] = origin.map(Number);
  const lat2 = Number(place.latitude);
  const lon2 = Number(place.longitude);
  const rad = (value) => value * Math.PI / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const getPlaceIcon = (type) => {
  if (type === 'restaurant') return UtensilsCrossed;
  if (type === 'temporary_stand') return Clock3;
  return Store;
};

export default function GlobalCheckinModal({ open, onClose, userId, userPosition, refreshShops }) {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const [stage, setStage] = useState('choose');
  const [places, setPlaces] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [newPlaceType, setNewPlaceType] = useState(null);

  useEffect(() => {
    if (!open) return undefined;
    setStage('choose');
    setSelectedPlace(null);
    setNewPlaceType(null);
    setQuery('');
    setError('');
    const controller = new AbortController();
    setLoading(true);
    fetch(`${apiUrl}/get_eisdielen_list.php?include_secondary=1`, {
      signal: controller.signal,
      cache: 'no-store',
    })
      .then(async (response) => {
        const data = await response.json().catch(() => []);
        if (!response.ok || !Array.isArray(data)) throw new Error('Eis-Orte konnten nicht geladen werden.');
        return data;
      })
      .then(setPlaces)
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') setError(requestError.message || 'Eis-Orte konnten nicht geladen werden.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [apiUrl, open]);

  const visiblePlaces = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return places
      .map((place) => ({ ...place, distance: distanceKm(userPosition, place) }))
      .filter((place) => !normalized || `${place.name} ${place.adresse || ''}`.toLowerCase().includes(normalized))
      .sort((left, right) => {
        if (left.distance !== null && right.distance !== null) return left.distance - right.distance;
        if (left.distance !== null) return -1;
        if (right.distance !== null) return 1;
        return String(left.name).localeCompare(String(right.name), 'de');
      })
      .slice(0, query.trim() ? 20 : 8);
  }, [places, query, userPosition]);

  if (!open) return null;

  if (stage === 'checkin') {
    const contextType = selectedPlace?.place_type || 'no_public_place';
    return (
      <CheckinForm
        shopId={selectedPlace?.id || null}
        shopName={selectedPlace?.name || ''}
        contextType={contextType}
        userId={userId}
        showCheckinForm
        setShowCheckinForm={(visible) => { if (!visible) onClose(); }}
        onBack={() => {
          setSelectedPlace(null);
          setStage('choose');
        }}
        onSuccess={() => window.dispatchEvent(new CustomEvent('iceapp:checkin-created'))}
      />
    );
  }

  if (stage === 'create' && newPlaceType) {
    return (
      <SubmitIceShopModal
        showForm
        setShowForm={(visible) => { if (!visible) setStage('choose'); }}
        userId={userId}
        refreshShops={refreshShops}
        userLatitude={userPosition?.[0] ?? 50.83}
        userLongitude={userPosition?.[1] ?? 12.92}
        initialPlaceType={newPlaceType}
        autoCloseAfterSuccess={false}
        onSubmitSuccess={(payload, response) => {
          const created = response?.place || {
            id: response?.place_id,
            name: payload.name,
            adresse: payload.adresse,
            latitude: payload.latitude,
            longitude: payload.longitude,
            place_type: payload.place_type,
            active_until: payload.active_until,
          };
          if (created.id) {
            setPlaces((previous) => [
              created,
              ...previous.filter((place) => Number(place.id) !== Number(created.id)),
            ]);
            setSelectedPlace(created);
            setStage('checkin');
          }
        }}
      />
    );
  }

  return (
    <Overlay>
      <ChooserModal>
        <CloseButton type="button" onClick={onClose}>×</CloseButton>
        <Heading>Wo hast du dein Eis gegessen?</Heading>
        <Intro>Suche zuerst nach der Eisdiele oder dem Eis-Ort, an dem du dein Eis gegessen hast.</Intro>

        <SearchWrap>
          <Search size={18} aria-hidden="true" />
          <SearchInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Eisdiele, Restaurant oder Stand suchen"
            aria-label="Eis-Ort suchen"
          />
        </SearchWrap>

        <SectionTitle>{query.trim() ? 'Suchergebnisse' : userPosition ? 'Orte in deiner Nähe' : 'Öffentliche Eis-Orte'}</SectionTitle>
        {loading && <StatusText>Orte werden geladen …</StatusText>}
        {error && <Message>{error}</Message>}
        {!loading && !error && visiblePlaces.length === 0 && (
          <EmptyState>
            Kein passender Ort gefunden. Du kannst unten eine neue Eisdiele oder einen anderen Eis-Ort eintragen.
          </EmptyState>
        )}
        <PlaceList>
          {visiblePlaces.map((place) => {
            const Icon = getPlaceIcon(place.place_type);
            return (
              <PlaceButton key={place.id} type="button" onClick={() => { setSelectedPlace(place); setStage('checkin'); }}>
                <PlaceIcon $type={place.place_type}><Icon size={18} aria-hidden="true" /></PlaceIcon>
                <PlaceCopy>
                  <strong>{place.name}</strong>
                  <span>{TYPE_LABELS[place.place_type] || 'Eisdiele'}{place.adresse ? ` · ${place.adresse}` : ''}</span>
                </PlaceCopy>
                {place.distance !== null && <Distance>{place.distance < 1 ? `${Math.round(place.distance * 1000)} m` : `${place.distance.toFixed(1)} km`}</Distance>}
              </PlaceButton>
            );
          })}
        </PlaceList>

        <Divider><span>Ort nicht dabei?</span></Divider>

        <PrimaryCreateButton type="button" onClick={() => { setNewPlaceType('ice_shop'); setStage('create'); }}>
          <PrimaryActionIcon><Store size={21} aria-hidden="true" /></PrimaryActionIcon>
          <ActionCopy>
            <strong>Neue Eisdiele eintragen</strong>
            <small>Für Orte, an denen man Kugel- oder Softeis direkt kaufen kann</small>
          </ActionCopy>
          <ChevronRight size={20} aria-hidden="true" />
        </PrimaryCreateButton>

        <AdditionalTitle>Weitere Möglichkeiten</AdditionalTitle>
        <AdditionalActions>
          <AdditionalActionButton type="button" onClick={() => { setNewPlaceType('restaurant'); setStage('create'); }}>
            <AdditionalActionIcon $type="restaurant"><UtensilsCrossed size={18} aria-hidden="true" /></AdditionalActionIcon>
            <ActionCopy>
              <strong>Restaurant/Café mit Eisangebot</strong>
              <small>Kein direkter Eisverkauf – Eis gibt es nur als Dessert oder Eisspeise</small>
            </ActionCopy>
            <ChevronRight size={18} aria-hidden="true" />
          </AdditionalActionButton>
          <AdditionalActionButton type="button" onClick={() => { setNewPlaceType('temporary_stand'); setStage('create'); }}>
            <AdditionalActionIcon $type="temporary_stand"><Clock3 size={18} aria-hidden="true" /></AdditionalActionIcon>
            <ActionCopy>
              <strong>Temporären Eisstand eintragen</strong>
              <small>Mobiler Stand, der etwa während eines Festes nur zeitweise vor Ort ist</small>
            </ActionCopy>
            <ChevronRight size={18} aria-hidden="true" />
          </AdditionalActionButton>
          <AdditionalActionButton type="button" onClick={() => { setSelectedPlace(null); setStage('checkin'); }}>
            <AdditionalActionIcon $type="no_public_place"><IceCreamBowl size={18} aria-hidden="true" /></AdditionalActionIcon>
            <ActionCopy>
              <strong>Ohne öffentlichen Ort einchecken</strong>
              <small>Keine Ortsangabe, kein Marker und keine Standortdaten</small>
            </ActionCopy>
            <ChevronRight size={18} aria-hidden="true" />
          </AdditionalActionButton>
        </AdditionalActions>
        <PrivacyHint><MapPin size={15} /> Standortdaten werden erst für einen gewählten öffentlichen Ort verwendet.</PrivacyHint>
      </ChooserModal>
    </Overlay>
  );
}

const ChooserModal = styled(Modal)`
  width: min(94vw, 680px);
  max-height: min(94dvh, 880px);
  background: linear-gradient(180deg, #fffdf8 0%, #fff6e6 100%);
`;
const Intro = styled.p`margin: -0.25rem 0 1rem; color: rgba(47,33,0,.7); line-height: 1.45;`;
const SearchWrap = styled.div`
  display: flex; align-items: center; gap: .55rem; padding: 0 .75rem;
  border: 1px solid rgba(47,33,0,.18); border-radius: 12px; background: #fff;
  &:focus-within { border-color: #e09a00; box-shadow: 0 0 0 3px rgba(224, 154, 0, .14); }
`;
const SearchInput = styled(Input)`border: 0; box-shadow: none; padding-left: 0; &:focus { outline: none; }`;
const SectionTitle = styled.h3`margin: 1rem 0 .5rem; color: #4f3800; font-size: .95rem;`;
const StatusText = styled.p`color: rgba(47,33,0,.62); font-size: .9rem;`;
const EmptyState = styled(StatusText)`
  margin: 0 0 .5rem;
  padding: .7rem .8rem;
  border-radius: 10px;
  background: rgba(255, 255, 255, .65);
  line-height: 1.4;
`;
const PlaceList = styled.div`
  display: grid;
  gap: .45rem;
  max-height: clamp(128px, 22dvh, 220px);
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-right: .15rem;
`;
const PlaceButton = styled.button`
  display: flex; align-items: center; gap: .7rem; width: 100%; min-height: 54px; padding: .65rem .7rem;
  border: 1px solid rgba(47,33,0,.1); border-radius: 12px; background: rgba(255,255,255,.86);
  color: #2f2100; font: inherit; text-align: left; cursor: pointer;
  &:hover { border-color: #e09a00; background: #fff; }
  &:focus-visible { outline: 3px solid rgba(224, 154, 0, .35); outline-offset: 2px; }
`;
const PlaceIcon = styled.span`
  display: grid; place-items: center; flex: 0 0 auto; width: 36px; height: 36px; border-radius: 50%;
  background: ${({ $type }) => $type === 'restaurant' ? '#e0e7ff' : $type === 'temporary_stand' ? '#dcfce7' : '#ffedb8'};
  color: ${({ $type }) => $type === 'restaurant' ? '#4338ca' : $type === 'temporary_stand' ? '#166534' : '#8a5700'};
`;
const PlaceCopy = styled.span`display: grid; gap: .15rem; min-width: 0; flex: 1; span { color: rgba(47,33,0,.62); font-size: .8rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }`;
const Distance = styled.span`flex: 0 0 auto; color: #6b5327; font-size: .78rem; font-weight: 700;`;
const Divider = styled.div`display: flex; align-items: center; gap: .7rem; margin: 1rem 0 .75rem; color: rgba(47,33,0,.5); font-size: .8rem; &::before, &::after { content: ''; height: 1px; background: rgba(47,33,0,.12); flex: 1; }`;
const ActionCopy = styled.span`
  display: grid;
  flex: 1;
  min-width: 0;
  gap: .12rem;
  text-align: left;

  strong { font-size: .9rem; line-height: 1.25; }
  small { color: rgba(47, 33, 0, .65); font-size: .76rem; font-weight: 500; line-height: 1.3; }
`;
const PrimaryCreateButton = styled.button`
  display: flex;
  align-items: center;
  gap: .7rem;
  width: 100%;
  min-height: 60px;
  padding: .7rem .8rem;
  border: 1px solid #e8a312;
  border-radius: 12px;
  background: linear-gradient(180deg, #ffc74d 0%, #ffb522 100%);
  color: #3c2900;
  font: inherit;
  box-shadow: 0 5px 14px rgba(208, 135, 0, .18);
  cursor: pointer;

  strong { font-size: 1rem; }
  &:hover { background: linear-gradient(180deg, #ffd064 0%, #ffbd35 100%); }
  &:focus-visible { outline: 3px solid rgba(224, 154, 0, .38); outline-offset: 2px; }
`;
const PrimaryActionIcon = styled.span`
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: rgba(255, 255, 255, .68);
  color: #805000;
`;
const AdditionalTitle = styled.h3`
  margin: .9rem 0 .45rem;
  color: #5a4824;
  font-size: .84rem;
  font-weight: 800;
`;
const AdditionalActions = styled.div`
  display: grid;
  gap: .4rem;
`;
const AdditionalActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: .65rem;
  width: 100%;
  min-height: 48px;
  padding: .5rem .65rem;
  border: 1px solid rgba(47, 33, 0, .12);
  border-radius: 10px;
  background: rgba(255, 255, 255, .68);
  color: #382a0c;
  font: inherit;
  cursor: pointer;

  &:hover { border-color: rgba(176, 116, 0, .42); background: rgba(255, 255, 255, .94); }
  &:focus-visible { outline: 3px solid rgba(224, 154, 0, .3); outline-offset: 2px; }

  > svg { flex: 0 0 auto; color: rgba(47, 33, 0, .5); }
`;
const AdditionalActionIcon = styled.span`
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: ${({ $type }) => $type === 'restaurant'
    ? '#eef0ff'
    : $type === 'temporary_stand'
      ? '#e8f8ec'
      : '#edf3fb'};
  color: ${({ $type }) => $type === 'restaurant'
    ? '#4f46a5'
    : $type === 'temporary_stand'
      ? '#24703a'
      : '#34577d'};
`;
const PrivacyHint = styled.p`display: flex; align-items: center; gap: .35rem; margin: .8rem 0 0; color: rgba(47,33,0,.58); font-size: .78rem;`;
