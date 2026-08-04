import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { ArrowLeft, Info, MapPin, Users } from 'lucide-react';
import Header from '../Header';
import Seo from '../components/Seo';
import UserAvatar from '../components/UserAvatar';

const ICE_TYPES = ['Kugel', 'Softeis', 'Eisbecher'];
const API_BASE = import.meta.env.VITE_API_BASE_URL;

const emptyData = {
  flavour: null,
  shops: [],
  users: [],
  regions: { laender: [], bundeslaender: [], landkreise: [] },
  meta: { prior_users: 3 },
};

const formatRating = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(2) : '–';
};

const formatDate = (value) => {
  if (!value) return '–';
  const date = new Date(String(value).replace(' ', 'T'));
  return Number.isNaN(date.getTime()) ? '–' : date.toLocaleDateString('de-DE');
};

const statusLabel = (status) => {
  if (status === 'seasonal_closed') return 'Saisonal geschlossen';
  if (status === 'permanent_closed') return 'Dauerhaft geschlossen';
  return null;
};

function FlavourStatistics() {
  const { flavourName } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAllShops, setShowAllShops] = useState(false);

  const flavour = useMemo(() => {
    try {
      return decodeURIComponent(flavourName || '').trim();
    } catch {
      return (flavourName || '').trim();
    }
  }, [flavourName]);

  const typeParam = searchParams.get('type') || 'all';
  const selectedType = ICE_TYPES.includes(typeParam) ? typeParam : 'all';
  const regionLevelParam = searchParams.get('region_level') || '';
  const selectedRegionLevel = ['land', 'bundesland', 'landkreis'].includes(regionLevelParam) ? regionLevelParam : '';
  const selectedRegionId = searchParams.get('region_id') || '';
  const regionIdNumber = Number(selectedRegionId);
  const validRegion = ['land', 'bundesland', 'landkreis'].includes(selectedRegionLevel)
    && Number.isInteger(regionIdNumber)
    && regionIdNumber > 0;

  useEffect(() => {
    setShowAllShops(false);
  }, [flavour, selectedType, selectedRegionLevel, selectedRegionId]);

  useEffect(() => {
    if (!flavour) {
      setError('Die Sorte konnte nicht bestimmt werden.');
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    const params = new URLSearchParams({ sortenname: flavour });
    if (ICE_TYPES.includes(selectedType)) {
      params.set('iceType', selectedType);
    }
    if (validRegion) {
      params.set('region_level', selectedRegionLevel);
      params.set('region_id', String(regionIdNumber));
    }

    setLoading(true);
    setError(null);
    fetch(`${API_BASE}/get_flavour_statistics.php?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then((json) => {
        if (!controller.signal.aborted) {
          setData({ ...emptyData, ...json, regions: { ...emptyData.regions, ...(json.regions || {}) } });
        }
      })
      .catch((requestError) => {
        if (!controller.signal.aborted) {
          console.error('Fehler beim Laden der Sortenstatistik:', requestError);
          setError('Die Sortenstatistik konnte nicht geladen werden.');
          setData(emptyData);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [flavour, regionIdNumber, selectedRegionId, selectedRegionLevel, selectedType, validRegion]);

  const laender = data.regions.laender || [];
  const allBundeslaender = data.regions.bundeslaender || [];
  const allLandkreise = data.regions.landkreise || [];
  const selectedCountryId = selectedRegionLevel === 'land'
    ? selectedRegionId
    : selectedRegionLevel === 'bundesland'
      ? allBundeslaender.find((region) => String(region.id) === String(selectedRegionId))?.land_id
      : allLandkreise.find((region) => String(region.id) === String(selectedRegionId))?.land_id;
  const selectedStateId = selectedRegionLevel === 'bundesland'
    ? selectedRegionId
    : allLandkreise.find((region) => String(region.id) === String(selectedRegionId))?.bundesland_id;
  const bundeslaender = selectedCountryId
    ? allBundeslaender.filter((region) => String(region.land_id) === String(selectedCountryId))
    : [];
  const landkreise = selectedStateId
    ? allLandkreise.filter((region) => String(region.bundesland_id) === String(selectedStateId))
    : [];
  const visibleShops = showAllShops ? data.shops : data.shops.slice(0, 10);
  const additionalShopCount = Math.max(0, data.shops.length - 10);

  const updateFilters = (changes) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    setSearchParams(next, { replace: true });
  };

  const handleCountryChange = (event) => {
    const countryId = event.target.value;
    updateFilters({ region_level: countryId ? 'land' : '', region_id: countryId });
  };

  const handleStateChange = (event) => {
    const stateId = event.target.value;
    updateFilters({ region_level: stateId ? 'bundesland' : (selectedCountryId ? 'land' : ''), region_id: stateId || selectedCountryId || '' });
  };

  const handleCountyChange = (event) => {
    const countyId = event.target.value;
    updateFilters({ region_level: countyId ? 'landkreis' : (selectedStateId ? 'bundesland' : selectedCountryId ? 'land' : ''), region_id: countyId || selectedStateId || selectedCountryId || '' });
  };

  if (loading && !data.flavour) {
    return (
      <PageShell>
        <Header />
        <Main><StateMessage>Sortenstatistik wird geladen …</StateMessage></Main>
      </PageShell>
    );
  }

  if (error && !data.flavour) {
    return (
      <PageShell>
        <Header />
        <Main><StateMessage $error>{error}</StateMessage></Main>
      </PageShell>
    );
  }

  const currentFlavour = data.flavour || { name: flavour, type: selectedType === 'all' ? 'Alle' : selectedType };

  return (
    <PageShell>
      <Seo
        title={`${currentFlavour.name} Eis-Statistik | Ice-App`}
        description={`Finde die besten Eisdielen für ${currentFlavour.name}. Community-Bewertungen, Nutzerzahlen und regionale Sorten-Auswertung.`}
        keywords={[`${currentFlavour.name} Eis`, `bestes ${currentFlavour.name} Eis`, 'Eisdielen Bewertung']}
        canonical={`/statistics/flavours/${encodeURIComponent(currentFlavour.name)}`}
      />
      <Header />
      <Main>
        <BackLink to="/statistics?tab=mostPopularFlavours"><ArrowLeft size={16} aria-hidden="true" /> Alle Sorten</BackLink>
        <PageHeader>
          <Eyebrow>Sorten-Auswertung</Eyebrow>
          <Title>{currentFlavour.name}</Title>
          <Subtitle>{currentFlavour.type} · datenbasierte Empfehlungen der Community</Subtitle>
        </PageHeader>

        <FilterCard>
          <FilterGroup>
            <FilterLabel htmlFor="flavour-type">Eistyp</FilterLabel>
            <FilterSelect
              id="flavour-type"
              value={selectedType}
              onChange={(event) => updateFilters({ type: event.target.value })}
            >
              <option value="all">Alle Eistypen</option>
              {ICE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </FilterSelect>
          </FilterGroup>
          <FilterGroup>
            <FilterLabel htmlFor="flavour-country">Land</FilterLabel>
            <FilterSelect id="flavour-country" value={selectedCountryId || ''} onChange={handleCountryChange}>
              <option value="">Alle Länder</option>
              {laender.map((land) => <option key={land.id} value={land.id}>{land.name}</option>)}
            </FilterSelect>
          </FilterGroup>
          {selectedCountryId && (
            <FilterGroup>
              <FilterLabel htmlFor="flavour-state">Bundesland</FilterLabel>
              <FilterSelect id="flavour-state" value={selectedStateId || ''} onChange={handleStateChange}>
                <option value="">Alle Bundesländer</option>
                {bundeslaender.map((region) => (
                  <option key={region.id} value={region.id}>{region.name}</option>
                ))}
              </FilterSelect>
            </FilterGroup>
          )}
          {selectedStateId && (
            <FilterGroup>
              <FilterLabel htmlFor="flavour-county">Landkreis</FilterLabel>
              <FilterSelect id="flavour-county" value={selectedRegionLevel === 'landkreis' ? selectedRegionId : ''} onChange={handleCountyChange}>
                <option value="">Alle Landkreise</option>
                {landkreise.map((region) => (
                  <option key={region.id} value={region.id}>{region.name}</option>
                ))}
              </FilterSelect>
            </FilterGroup>
          )}
        </FilterCard>

        <SummaryGrid>
          <SummaryCard><SummaryValue>{currentFlavour.checkins ?? 0}</SummaryValue><SummaryLabel>Check-ins</SummaryLabel></SummaryCard>
          <SummaryCard><SummaryValue>{currentFlavour.unique_users ?? 0}</SummaryValue><SummaryLabel>verschiedene Nutzer</SummaryLabel></SummaryCard>
          <SummaryCard><SummaryValue>{formatRating(currentFlavour.average_rating)}</SummaryValue><SummaryLabel>Ø Bewertung</SummaryLabel></SummaryCard>
        </SummaryGrid>

        {loading && <LoadingHint>Auswertung wird aktualisiert …</LoadingHint>}

        <SectionCard>
          <SectionTitle>Beste Eisdielen für {currentFlavour.name}</SectionTitle>
          <SectionHint>
            Der Empfehlungswert berücksichtigt die Anzahl verschiedener Bewertender. Kleine Datenbasen werden vorsichtig gewichtet. Historische Treffer dauerhaft geschlossener Eisdielen sind entsprechend gekennzeichnet.
          </SectionHint>
          {visibleShops.length === 0 ? (
            <EmptyState>Für diese Auswahl gibt es noch keine passenden Eisdielen.</EmptyState>
          ) : (
            <ShopList>
              {visibleShops.map((shop, index) => (
                <ShopRow key={shop.eisdiele_id}>
                  <Rank>{index + 1}</Rank>
                  <ShopBody>
                    <ShopTitleRow>
                      <ShopLink to={`/map/activeShop/${shop.eisdiele_id}`}>{shop.eisdiele_name}</ShopLink>
                      {statusLabel(shop.status) && (
                        <StatusBadge $status={shop.status}>{statusLabel(shop.status)}</StatusBadge>
                      )}
                    </ShopTitleRow>
                    <ShopMeta><MapPin size={14} aria-hidden="true" />{shop.adresse || [shop.landkreis_name, shop.bundesland_name].filter(Boolean).join(', ') || 'Adresse nicht verfügbar'}</ShopMeta>
                    <Metrics>
                      <Metric><MetricValue>{formatRating(shop.weighted_rating)}</MetricValue><MetricLabel>Empfehlung</MetricLabel></Metric>
                      <Metric><MetricValue>{formatRating(shop.raw_average_rating)}</MetricValue><MetricLabel>Rohdurchschnitt</MetricLabel></Metric>
                      <Metric><MetricValue>{shop.rating_users}</MetricValue><MetricLabel>Bewertende</MetricLabel></Metric>
                      <Metric><MetricValue>{shop.checkins}</MetricValue><MetricLabel>Check-ins</MetricLabel></Metric>
                    </Metrics>
                    {shop.data_quality === 'low' && <DataHint><Info size={14} aria-hidden="true" /> Geringe Datenbasis: bisher weniger als drei verschiedene Bewertende.</DataHint>}
                  </ShopBody>
                </ShopRow>
              ))}
            </ShopList>
          )}
          {additionalShopCount > 0 && (
            <MoreButton type="button" onClick={() => setShowAllShops((current) => !current)}>
              {showAllShops ? 'Weniger Eisdielen anzeigen' : `${additionalShopCount} weitere Eisdielen anzeigen`}
            </MoreButton>
          )}
        </SectionCard>

        <SectionCard>
          <SectionTitle>Community-Favoriten</SectionTitle>
          <SectionHint>Diese Nutzer haben die Sorte am häufigsten in Check-ins eingetragen.</SectionHint>
          {data.users.length === 0 ? (
            <EmptyState>Noch keine Nutzerstatistik verfügbar.</EmptyState>
          ) : (
            <UserList>
              {data.users.map((user, index) => (
                <UserRow key={user.user_id}>
                  <Rank>{index + 1}</Rank>
                  <UserAvatar userId={user.user_id} name={user.username} avatarUrl={user.avatar_url} size={42} />
                  <UserBody>
                    <UserNameLink to={`/user/${user.user_id}`}>{user.username}</UserNameLink>
                    <UserMeta><Users size={14} aria-hidden="true" />{user.checkin_count} Check-ins · {user.shop_count} Eisdielen · zuletzt {formatDate(user.last_checkin)}</UserMeta>
                  </UserBody>
                </UserRow>
              ))}
            </UserList>
          )}
        </SectionCard>
      </Main>
    </PageShell>
  );
}

export default FlavourStatistics;

const PageShell = styled.div`
  min-height: 100vh;
  background: #fff8e8;
`;

const Main = styled.main`
  width: min(1120px, calc(100% - 1.5rem));
  margin: 0 auto;
  padding: 1.15rem 0 3rem;
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: #865400;
  font-size: 0.87rem;
  font-weight: 750;
  text-decoration: none;

  &:hover { text-decoration: underline; }
`;

const PageHeader = styled.header`
  padding: 1.2rem 0 1rem;
  text-align: center;
`;

const Eyebrow = styled.div`
  color: #9a6500;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const Title = styled.h1`
  margin: 0.25rem 0;
  color: #2f2100;
  font-size: clamp(1.8rem, 5vw, 2.8rem);
`;

const Subtitle = styled.p`
  margin: 0;
  color: rgba(47, 33, 0, 0.7);
`;

const FilterCard = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding: 0.85rem;
  border: 1px solid rgba(47, 33, 0, 0.1);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.7);
`;

const FilterGroup = styled.label`
  display: grid;
  gap: 0.28rem;
  min-width: 180px;
  flex: 1;
`;

const FilterLabel = styled.span`
  color: #704600;
  font-size: 0.76rem;
  font-weight: 800;
`;

const FilterSelect = styled.select`
  min-height: 40px;
  border: 1px solid rgba(47, 33, 0, 0.18);
  border-radius: 9px;
  background: #fff;
  padding: 0 0.6rem;
  color: #2f2100;
  font: inherit;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;

  @media (max-width: 520px) { grid-template-columns: 1fr; }
`;

const SummaryCard = styled.div`
  padding: 0.85rem;
  border: 1px solid rgba(47, 33, 0, 0.1);
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.78);
  text-align: center;
`;

const SummaryValue = styled.strong`
  display: block;
  color: #2f2100;
  font-size: 1.45rem;
`;

const SummaryLabel = styled.span`
  color: rgba(47, 33, 0, 0.67);
  font-size: 0.76rem;
`;

const LoadingHint = styled.div`
  margin: -0.35rem 0 0.75rem;
  color: #865400;
  font-size: 0.82rem;
  text-align: center;
`;

const SectionCard = styled.section`
  margin-top: 1rem;
  overflow: hidden;
  border: 1px solid rgba(47, 33, 0, 0.1);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.76);
`;

const SectionTitle = styled.h2`
  margin: 0;
  padding: 1rem 1rem 0.35rem;
  color: #2f2100;
  font-size: 1.15rem;
`;

const SectionHint = styled.p`
  margin: 0;
  padding: 0 1rem 0.8rem;
  color: rgba(47, 33, 0, 0.68);
  font-size: 0.82rem;
  line-height: 1.45;
`;

const ShopList = styled.div`
  display: grid;
`;

const ShopRow = styled.article`
  display: flex;
  gap: 0.8rem;
  padding: 0.9rem 1rem;
  border-top: 1px solid rgba(47, 33, 0, 0.09);
`;

const Rank = styled.div`
  width: 1.7rem;
  flex: 0 0 1.7rem;
  color: #a26a00;
  font-size: 1.05rem;
  font-weight: 850;
  text-align: center;
`;

const ShopBody = styled.div`
  min-width: 0;
  flex: 1;
`;

const ShopTitleRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
`;

const ShopLink = styled(Link)`
  color: #2f2100;
  font-weight: 850;
  text-decoration: none;
  &:hover { color: #8a5600; text-decoration: underline; }
`;

const StatusBadge = styled.span`
  padding: 0.16rem 0.4rem;
  border-radius: 999px;
  background: ${(props) => props.$status === 'seasonal_closed' ? '#fff0cf' : '#e8f7e8'};
  color: ${(props) => props.$status === 'seasonal_closed' ? '#875500' : '#27632d'};
  font-size: 0.68rem;
  font-weight: 750;
`;

const ShopMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin-top: 0.25rem;
  color: rgba(47, 33, 0, 0.62);
  font-size: 0.76rem;
`;

const Metrics = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  margin-top: 0.65rem;
`;

const Metric = styled.div`
  display: grid;
  gap: 0.05rem;
  min-width: 65px;
`;

const MetricValue = styled.strong`
  color: #704600;
  font-size: 0.94rem;
`;

const MetricLabel = styled.span`
  color: rgba(47, 33, 0, 0.58);
  font-size: 0.66rem;
`;

const DataHint = styled.div`
  display: flex;
  align-items: center;
  gap: 0.28rem;
  margin-top: 0.55rem;
  color: #8a5b00;
  font-size: 0.73rem;
`;

const MoreButton = styled.button`
  display: block;
  width: calc(100% - 2rem);
  margin: 0.85rem 1rem 1rem;
  min-height: 40px;
  border: 1px solid rgba(138, 86, 0, 0.28);
  border-radius: 9px;
  background: #fff8e8;
  color: #704600;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 800;
  cursor: pointer;
`;

const UserList = styled.div`
  display: grid;
`;

const UserRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.75rem 1rem;
  border-top: 1px solid rgba(47, 33, 0, 0.09);
`;

const UserBody = styled.div`
  min-width: 0;
`;

const UserNameLink = styled(Link)`
  color: #2f2100;
  font-weight: 800;
  text-decoration: none;
  &:hover { text-decoration: underline; }
`;

const UserMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.15rem;
  color: rgba(47, 33, 0, 0.62);
  font-size: 0.73rem;
`;

const EmptyState = styled.div`
  padding: 1rem;
  color: rgba(47, 33, 0, 0.65);
  font-size: 0.86rem;
`;

const StateMessage = styled.main`
  width: min(680px, calc(100% - 2rem));
  margin: 3rem auto;
  padding: 1rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.76);
  color: ${(props) => props.$error ? '#a52b22' : '#704600'};
  text-align: center;
`;
