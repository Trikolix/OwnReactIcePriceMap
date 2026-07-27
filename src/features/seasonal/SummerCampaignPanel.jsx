import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { MapPin, ScanLine, Sparkles, Trophy } from 'lucide-react';
import { CAMPAIGN_STATUS } from './campaigns';
import { fetchSummerCampaignProgress } from './summerApi';
import { useUser } from '../../context/UserContext';
import { getAwardIconSources, handleAwardIconFallback } from '../../utils/awardIcons';

const getDistanceKm = (from, shop) => {
  const lat = Number(shop?.lat);
  const lng = Number(shop?.lng);
  if (!from || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return Number.POSITIVE_INFINITY;
  }

  const toRad = (value) => (value * Math.PI) / 180;
  const radiusKm = 6371;
  const dLat = toRad(lat - from.lat);
  const dLng = toRad(lng - from.lng);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(from.lat)) * Math.cos(toRad(lat)) * Math.sin(dLng / 2) ** 2;

  return 2 * radiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatDistance = (distanceKm) => {
  if (!Number.isFinite(distanceKm)) {
    return null;
  }
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(distanceKm < 10 ? 1 : 0).replace('.', ',')} km`;
};

const SummerCampaignPanel = ({ campaign, isLoggedIn, onLogin }) => {
  const { authToken } = useUser();
  const [selectedShop, setSelectedShop] = useState(null);
  const [sortState, setSortState] = useState({ key: 'found', direction: 'desc' });
  const [userLocation, setUserLocation] = useState(null);
  const [locationMessage, setLocationMessage] = useState('');
  const [state, setState] = useState({
    loading: false,
    error: '',
    data: null,
  });

  useEffect(() => {
    if (!campaign || campaign.status !== CAMPAIGN_STATUS.ACTIVE) {
      setState({ loading: false, error: '', data: null });
      return undefined;
    }

    let cancelled = false;
    const load = async () => {
      setState((previous) => ({ ...previous, loading: true, error: '' }));
      try {
        const data = await fetchSummerCampaignProgress(authToken);
        if (!cancelled) {
          setState({ loading: false, error: '', data });
        }
      } catch (error) {
        if (!cancelled) {
          setState({ loading: false, error: error.message || 'Sommeraktion konnte nicht geladen werden.', data: null });
        }
      }
    };

    load();
    const handleUpdate = () => load();
    window.addEventListener('seasonal:summer-progress-updated', handleUpdate);
    return () => {
      cancelled = true;
      window.removeEventListener('seasonal:summer-progress-updated', handleUpdate);
    };
  }, [campaign, authToken]);

  const shops = state.data?.shops || [];
  const adminInsights = state.data?.admin_insights || null;
  const summary = state.data?.summary || { total: 0, collected: 0, missing: 0, checkins: 0 };
  const completion = summary.total > 0 ? Math.round((summary.collected / summary.total) * 100) : 0;
  const sortedShops = useMemo(() => (
    shops
      .map((shop, index) => ({ shop, index, distanceKm: getDistanceKm(userLocation, shop) }))
      .sort((left, right) => {
        if (sortState.key === 'found') {
          const directionFactor = sortState.direction === 'asc' ? 1 : -1;
          return (Number(left.shop.collected) - Number(right.shop.collected)) * directionFactor
            || Number(right.shop.checkin_confirmed) - Number(left.shop.checkin_confirmed)
            || left.index - right.index;
        }
        if (sortState.key === 'distance') {
          const directionFactor = sortState.direction === 'asc' ? 1 : -1;
          return (left.distanceKm - right.distanceKm) * directionFactor
            || Number(left.shop.collected) - Number(right.shop.collected)
            || left.index - right.index;
        }
        const nameCompare = String(left.shop.shop_name || '').localeCompare(String(right.shop.shop_name || ''), 'de-DE', { sensitivity: 'base' });
        return (sortState.direction === 'asc' ? nameCompare : -nameCompare)
          || left.index - right.index;
      })
  ), [shops, sortState, userLocation]);
  const handleSortChange = (nextKey) => {
    const nextState = sortState.key === nextKey
      ? { key: nextKey, direction: sortState.direction === 'asc' ? 'desc' : 'asc' }
      : { key: nextKey, direction: 'asc' };
    setSortState(nextState);
    if (nextKey !== 'distance' || userLocation) {
      return;
    }
    if (!navigator.geolocation) {
      setLocationMessage('Entfernungssortierung ist auf diesem Gerät nicht verfügbar.');
      return;
    }
    setLocationMessage('Standort wird angefragt...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationMessage('');
      },
      () => {
        setLocationMessage('Standort konnte nicht ermittelt werden. Die Sortierung bleibt ohne Entfernungsvorteil.');
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  };
  const getSortArrow = (key) => (sortState.key === key ? (sortState.direction === 'asc' ? '↑' : '↓') : '');
  const foundSortLabel = sortState.key === 'found' && sortState.direction === 'asc' ? 'Nicht gefunden' : 'Gefunden';
  const getShopCategories = (shop) => {
    if (Array.isArray(shop?.categories) && shop.categories.length > 0) {
      return shop.categories.map((category) => String(category).trim()).filter(Boolean);
    }
    return String(shop?.category || '')
      .split(/[,;\n]+/)
      .map((category) => category.trim())
      .filter(Boolean);
  };

  return (
    <PanelSection>
      <HeaderRow>
        <div>
          <SectionTitle>{campaign?.title || 'Sommer-Sammelaktion 2026'}</SectionTitle>
          <Lead>
            Scanne die Flyer-Codes in teilnehmenden Eisdielen und fülle dein Sammelalbum. Ein Check-in vor Ort macht die Karte vollständig.
          </Lead>
        </div>
        <Badge><Sparkles size={16} /> {completion}%</Badge>
      </HeaderRow>

      {!isLoggedIn && (
        <GuestBox>
          <strong>Scans werden nach dem Login gespeichert.</strong>
          <p>Du kannst einen Flyer-Code scannen und dich danach anmelden. Die App merkt sich den Scan lokal und trägt ihn nach.</p>
          <ActionButton type="button" onClick={onLogin}>Login / Registrieren</ActionButton>
        </GuestBox>
      )}

      {state.loading && <Hint>Lade Sammelalbum...</Hint>}
      {state.error && <Hint>{state.error}</Hint>}

      {!state.loading && !state.error && shops.length === 0 && (
        <Hint>Noch keine teilnehmenden Eisdielen konfiguriert.</Hint>
      )}

      {shops.length > 0 && (
        <>
          <ProgressBar aria-label={`Fortschritt ${completion} Prozent`}>
            <ProgressFill style={{ width: `${completion}%` }} />
          </ProgressBar>
          <StatsRow>
            <Stat><ScanLine size={16} /> {summary.collected}/{summary.total} gesammelt</Stat>
            <Stat><MapPin size={16} /> {summary.checkins} mit Check-in bestätigt</Stat>
            <Stat><Trophy size={16} /> {summary.missing} offen</Stat>
          </StatsRow>
          <SortBar aria-label="Sammelkarten sortieren">
            <SortLabel>Sortierung:</SortLabel>
            <SortButton type="button" $active={sortState.key === 'found'} onClick={() => handleSortChange('found')}>
              {foundSortLabel} {getSortArrow('found')}
            </SortButton>
            <SortButton type="button" $active={sortState.key === 'distance'} onClick={() => handleSortChange('distance')}>
              Entfernung {getSortArrow('distance')}
            </SortButton>
            <SortButton type="button" $active={sortState.key === 'name'} onClick={() => handleSortChange('name')}>
              Name {getSortArrow('name')}
            </SortButton>
          </SortBar>
          {locationMessage && <SortHint>{locationMessage}</SortHint>}

          <AlbumGrid>
            {sortedShops.map(({ shop, distanceKm }) => {
              const awardIconSources = shop.award_icon ? getAwardIconSources(shop.award_icon, 512) : null;
              const imageAlt = shop.award_title || `Sammelkarte ${shop.shop_name}`;
              const distanceLabel = sortState.key === 'distance' ? formatDistance(distanceKm) : null;

              return (
                <AlbumCard key={shop.id} $collected={shop.collected} $checkinConfirmed={shop.checkin_confirmed}>
                  <AwardImageButton
                    type="button"
                    $collected={shop.collected}
                    $checkinConfirmed={shop.checkin_confirmed}
                    onClick={() => setSelectedShop(shop)}
                    aria-label={`Details zu ${shop.shop_name} anzeigen`}
                  >
                    {awardIconSources?.src ? (
                      <AwardThumb
                        src={awardIconSources.src}
                        data-fallback-src={awardIconSources.fallbackSrc || ''}
                        onError={handleAwardIconFallback}
                        alt={imageAlt}
                        $collected={shop.collected}
                      />
                    ) : (
                      <AwardFallback $collected={shop.collected}>
                        <Sparkles size={42} />
                      </AwardFallback>
                    )}
                  </AwardImageButton>
                  <ShopLink to={`/map/activeShop/${shop.shop_id}`}>{shop.shop_name}</ShopLink>
                  {distanceLabel && <DistanceText>{distanceLabel}</DistanceText>}
                </AlbumCard>
              );
            })}
          </AlbumGrid>

          {adminInsights && (
            <AdminInsights>
              <AdminHeader>
                <div>
                  <AdminKicker>Nur für Admin</AdminKicker>
                  <AdminTitle>Sommer-Insights</AdminTitle>
                </div>
                <AdminBadge>{adminInsights.ranking?.length || 0} Sammler</AdminBadge>
              </AdminHeader>

              <AdminColumns>
                <AdminPanel>
                  <AdminSubTitle>Sammelkarten</AdminSubTitle>
                  <AdminList>
                    {(adminInsights.awards || []).map((entry) => (
                      <AdminListItem key={entry.summer_shop_id}>
                        <span>{entry.shop_name}</span>
                        <strong>{entry.scan_count} Scans</strong>
                        <em>{entry.checkin_count} Check-ins</em>
                      </AdminListItem>
                    ))}
                  </AdminList>
                </AdminPanel>

                <AdminPanel>
                  <AdminSubTitle>Ranking</AdminSubTitle>
                  <AdminList>
                    {(adminInsights.ranking || []).map((entry) => (
                      <AdminListItem key={entry.user_id}>
                        <span>#{entry.rank} {entry.username}</span>
                        <strong>{entry.scan_count} Scans</strong>
                        <em>{entry.checkin_count} Check-ins</em>
                      </AdminListItem>
                    ))}
                  </AdminList>
                  {(!adminInsights.ranking || adminInsights.ranking.length === 0) && (
                    <AdminEmpty>Noch keine Scans vorhanden.</AdminEmpty>
                  )}
                </AdminPanel>
              </AdminColumns>
            </AdminInsights>
          )}
        </>
      )}

      {selectedShop && (
        <DetailOverlay onClick={() => setSelectedShop(null)}>
          <DetailDialog onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="summer-award-detail-title">
            <DetailClose type="button" onClick={() => setSelectedShop(null)} aria-label="Details schließen">x</DetailClose>
            <DetailImageWrap>
              {selectedShop.award_icon ? (
                <AwardThumb
                  src={getAwardIconSources(selectedShop.award_icon, 512).src || ''}
                  data-fallback-src={getAwardIconSources(selectedShop.award_icon, 512).fallbackSrc || ''}
                  onError={handleAwardIconFallback}
                  alt={selectedShop.award_title || `Sammelkarte ${selectedShop.shop_name}`}
                  $collected={selectedShop.collected}
                />
              ) : (
                <AwardFallback $collected={selectedShop.collected}>
                  <Sparkles size={48} />
                </AwardFallback>
              )}
            </DetailImageWrap>
            <DetailTitle id="summer-award-detail-title">{selectedShop.shop_name}</DetailTitle>
            {selectedShop.award_title && <DetailMeta>{selectedShop.award_title}</DetailMeta>}
            <DetailStatus $collected={selectedShop.collected} $checkinConfirmed={selectedShop.checkin_confirmed}>
              {selectedShop.checkin_confirmed
                ? 'Mit Check-in bestätigt'
                : selectedShop.collected
                ? 'Freigeschaltet'
                : 'Noch nicht freigeschaltet'}
            </DetailStatus>
            <DetailSection>
              <DetailLabel>Kategorien</DetailLabel>
              {getShopCategories(selectedShop).length > 0 ? (
                <DetailPills>
                  {getShopCategories(selectedShop).map((category) => <DetailPill key={category}>{category}</DetailPill>)}
                </DetailPills>
              ) : (
                <DetailMeta>Keine Kategorien zugeordnet.</DetailMeta>
              )}
            </DetailSection>
            <DetailSection>
              <DetailLabel>Adresse</DetailLabel>
              <DetailMeta>{selectedShop.shop_address || 'Keine Adresse hinterlegt.'}</DetailMeta>
            </DetailSection>
            <DetailActions>
              <DetailLink to={`/map/activeShop/${selectedShop.shop_id}`}>Zur Eisdiele</DetailLink>
            </DetailActions>
          </DetailDialog>
        </DetailOverlay>
      )}
    </PanelSection>
  );
};

export default SummerCampaignPanel;

const PanelSection = styled.section`
  background: #ffffff;
  border-radius: 14px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  padding: 1rem;
  margin-top: 1rem;
  text-align: left;
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
`;

const SectionTitle = styled.h3`
  margin: 0 0 0.35rem;
  color: #2f2100;
`;

const Lead = styled.p`
  margin: 0;
  color: #5b4520;
  line-height: 1.45;
`;

const Badge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border-radius: 999px;
  background: #e9f7ef;
  color: #14532d;
  padding: 0.4rem 0.7rem;
  font-weight: 800;
  white-space: nowrap;
`;

const GuestBox = styled.div`
  margin-top: 0.85rem;
  padding: 0.85rem;
  border-radius: 12px;
  background: #fff8ea;
  color: #4d3500;

  p {
    margin: 0.35rem 0 0;
    line-height: 1.4;
  }
`;

const ActionButton = styled.button`
  margin-top: 0.7rem;
  border: none;
  border-radius: 10px;
  padding: 0.65rem 0.9rem;
  background: #ffb522;
  color: #2b1d00;
  font-weight: 800;
  cursor: pointer;
`;

const Hint = styled.p`
  margin: 0.8rem 0 0;
  color: #6f5b3a;
`;

const ProgressBar = styled.div`
  margin-top: 0.9rem;
  height: 10px;
  border-radius: 999px;
  background: #f0eadb;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #23a55a, #ffb522);
`;

const StatsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 0.8rem;
`;

const Stat = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border-radius: 999px;
  background: rgba(47, 33, 0, 0.05);
  padding: 0.35rem 0.65rem;
  color: #5b4520;
  font-weight: 700;
  font-size: 0.85rem;
`;

const SortBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  align-items: center;
  margin-top: 0.85rem;
`;

const SortLabel = styled.span`
  color: #5b4520;
  font-size: 0.84rem;
  font-weight: 900;
`;

const SortButton = styled.button`
  border: 1px solid ${({ $active }) => ($active ? '#23a55a' : '#d7d0c4')};
  border-radius: 999px;
  background: ${({ $active }) => ($active ? '#e3f7ea' : '#ffffff')};
  color: ${({ $active }) => ($active ? '#14532d' : '#5b4520')};
  padding: 0.38rem 0.65rem;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 800;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    border-color: #23a55a;
    outline: none;
  }
`;

const SortHint = styled.p`
  margin: 0.45rem 0 0;
  color: #6f5b3a;
  font-size: 0.82rem;
`;

const AlbumGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(132px, 1fr));
  gap: 1rem 0.85rem;
  margin-top: 1rem;
`;

const AlbumCard = styled.article`
  display: grid;
  justify-items: center;
  gap: 0.55rem;
  min-width: 0;
  border: 1px solid ${({ $collected, $checkinConfirmed }) => (
    $checkinConfirmed ? '#e9bd4f' : $collected ? '#9bd8ad' : 'transparent'
  )};
  border-radius: 14px;
  background: ${({ $collected, $checkinConfirmed }) => (
    $checkinConfirmed ? '#fff4ce' : $collected ? '#eefaf1' : 'transparent'
  )};
  padding: 0.45rem;
`;

const AwardImageButton = styled.button`
  width: 100%;
  max-width: 168px;
  aspect-ratio: 1 / 1;
  border: none;
  border-radius: 12px;
  padding: 0;
  overflow: hidden;
  display: grid;
  place-items: center;
  background: ${({ $collected, $checkinConfirmed }) => (
    $checkinConfirmed ? '#ffe8a3' : $collected ? '#dff4e6' : '#f1eee6'
  )};
  box-shadow: 0 6px 18px ${({ $checkinConfirmed }) => ($checkinConfirmed ? 'rgba(122, 74, 0, 0.13)' : 'rgba(47, 33, 0, 0.08)')};
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 24px rgba(47, 33, 0, 0.13);
  }
`;

const AwardThumb = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  filter: ${({ $collected }) => ($collected ? 'none' : 'grayscale(1) saturate(0)')};
  opacity: ${({ $collected }) => ($collected ? 1 : 0.35)};
`;

const AwardFallback = styled.div`
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: ${({ $collected }) => ($collected ? '#7a4a00' : '#8a857a')};
  background: ${({ $collected }) => ($collected ? '#fff1ca' : '#e7e4dc')};
  filter: ${({ $collected }) => ($collected ? 'none' : 'grayscale(1) saturate(0)')};
  opacity: ${({ $collected }) => ($collected ? 1 : 0.6)};
`;

const ShopLink = styled(Link)`
  color: #2f2100;
  font-weight: 800;
  font-size: 0.9rem;
  line-height: 1.2;
  text-align: center;
  text-decoration: none;
  overflow-wrap: anywhere;

  &:hover {
    color: #7a4a00;
    text-decoration: underline;
  }
`;

const DistanceText = styled.span`
  margin-top: -0.3rem;
  border-radius: 999px;
  background: #f5f7fb;
  color: #5b6270;
  padding: 0.16rem 0.45rem;
  font-size: 0.76rem;
  font-weight: 800;
`;

const AdminInsights = styled.section`
  margin-top: 1rem;
  border: 1px solid #d7e8dd;
  border-radius: 14px;
  background: #f6fbf8;
  padding: 0.9rem;
`;

const AdminHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  margin-bottom: 0.75rem;
`;

const AdminKicker = styled.span`
  display: block;
  color: #4f6f5a;
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
`;

const AdminTitle = styled.h4`
  margin: 0.1rem 0 0;
  color: #173b22;
  font-size: 1rem;
`;

const AdminBadge = styled.span`
  border-radius: 999px;
  background: #dff4e6;
  color: #14532d;
  padding: 0.28rem 0.6rem;
  font-size: 0.78rem;
  font-weight: 900;
  white-space: nowrap;
`;

const AdminColumns = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;

  @media (max-width: 620px) {
    grid-template-columns: 1fr;
  }
`;

const AdminPanel = styled.div`
  min-width: 0;
  border-radius: 10px;
  background: #ffffff;
  padding: 0.7rem;
`;

const AdminSubTitle = styled.h5`
  margin: 0 0 0.55rem;
  color: #2f2100;
  font-size: 0.9rem;
`;

const AdminList = styled.div`
  display: grid;
  gap: 0.4rem;
  max-height: 280px;
  overflow-y: auto;
`;

const AdminListItem = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 0.45rem;
  align-items: center;
  border-radius: 8px;
  background: #f5f7fb;
  padding: 0.45rem 0.5rem;
  font-size: 0.82rem;

  span {
    min-width: 0;
    color: #303746;
    font-weight: 800;
    overflow-wrap: anywhere;
  }

  strong,
  em {
    white-space: nowrap;
    font-style: normal;
    font-size: 0.76rem;
  }

  strong {
    color: #14532d;
  }

  em {
    color: #7a4a00;
  }

  @media (max-width: 460px) {
    grid-template-columns: 1fr;
    align-items: start;
  }
`;

const AdminEmpty = styled.p`
  margin: 0;
  color: #6f5b3a;
  font-size: 0.85rem;
`;

const DetailOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 3600;
  box-sizing: border-box;
  display: grid;
  place-items: center;
  width: 100vw;
  min-height: 100dvh;
  padding: 1rem;
  background: rgba(20, 14, 4, 0.54);

  @media (max-width: 460px) {
    padding: 0.75rem;
  }
`;

const DetailDialog = styled.div`
  position: relative;
  box-sizing: border-box;
  width: min(420px, calc(100vw - 2rem));
  max-width: 100%;
  max-height: min(760px, 92vh);
  overflow-y: auto;
  border-radius: 14px;
  background: #ffffff;
  padding: 1rem;
  box-shadow: 0 22px 60px rgba(0, 0, 0, 0.24);

  @media (max-width: 460px) {
    width: calc(100vw - 1.5rem);
  }
`;

const DetailClose = styled.button`
  position: absolute;
  top: 0.65rem;
  right: 0.65rem;
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 999px;
  background: rgba(47, 33, 0, 0.08);
  color: #2f2100;
  font-size: 1.15rem;
  font-weight: 800;
  cursor: pointer;
`;

const DetailImageWrap = styled.div`
  width: min(220px, 70vw);
  aspect-ratio: 1 / 1;
  margin: 0 auto 0.85rem;
  border-radius: 14px;
  overflow: hidden;
  background: #f1eee6;
`;

const DetailTitle = styled.h4`
  margin: 0;
  color: #2f2100;
  font-size: 1.15rem;
  text-align: center;
`;

const DetailMeta = styled.div`
  margin-top: 0.35rem;
  color: rgba(47, 33, 0, 0.68);
  font-size: 0.9rem;
  line-height: 1.4;
  text-align: center;
`;

const DetailStatus = styled.div`
  width: fit-content;
  margin: 0.75rem auto 0;
  border-radius: 999px;
  padding: 0.3rem 0.65rem;
  background: ${({ $collected, $checkinConfirmed }) => (
    $checkinConfirmed ? '#fff1ca' : $collected ? '#dff4e6' : '#e7e4dc'
  )};
  color: ${({ $collected, $checkinConfirmed }) => (
    $checkinConfirmed ? '#7a4a00' : $collected ? '#14532d' : '#5f5a50'
  )};
  font-size: 0.78rem;
  font-weight: 800;
`;

const DetailSection = styled.div`
  margin-top: 1rem;
`;

const DetailLabel = styled.div`
  margin-bottom: 0.4rem;
  color: #5b4520;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
`;

const DetailPills = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
`;

const DetailPill = styled.span`
  border-radius: 999px;
  padding: 0.28rem 0.58rem;
  background: #fff4dd;
  color: #7a4a00;
  font-size: 0.8rem;
  font-weight: 800;
`;

const DetailActions = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 1.1rem;
`;

const DetailLink = styled(Link)`
  border-radius: 10px;
  background: #ffb522;
  color: #2b1d00;
  padding: 0.65rem 0.95rem;
  font-weight: 800;
  text-decoration: none;
`;
