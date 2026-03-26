import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Link, useParams } from 'react-router-dom';
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import Header from '../Header';
import UserAvatar from '../components/UserAvatar';
import Seo from '../components/Seo';

const formatPrice = (value) => (value != null ? `${Number(value).toFixed(2)} €` : 'kein Preis');

const RegionOverview = () => {
  const { level, regionId } = useParams();
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shopScoreType, setShopScoreType] = useState('kugel');

  useEffect(() => {
    let isCancelled = false;

    const loadRegion = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${apiUrl}/api/region_overview.php?level=${encodeURIComponent(level)}&id=${encodeURIComponent(regionId)}`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const json = await response.json();
        if (!isCancelled) {
          setData(json);
        }
      } catch (fetchError) {
        if (!isCancelled) {
          console.error('Fehler beim Laden der Regionsseite:', fetchError);
          setError(fetchError);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadRegion();
    return () => {
      isCancelled = true;
    };
  }, [apiUrl, level, regionId]);

  const title = useMemo(() => {
    if (!data?.region_meta) {
      return 'Region';
    }
    return data.region_meta.name;
  }, [data]);

  const scoreConfig = useMemo(() => {
    if (shopScoreType === 'softeis') {
      return {
        key: 'softeis_score',
        label: 'Softeis',
        getPrice: (shop) => shop.softeis_preis,
        getCheckins: (shop) => shop.checkin_counts?.softeis ?? 0,
      };
    }
    if (shopScoreType === 'eisbecher') {
      return {
        key: 'eisbecher_score',
        label: 'Eisbecher',
        getPrice: () => null,
        getCheckins: (shop) => shop.checkin_counts?.eisbecher ?? 0,
      };
    }
    return {
      key: 'kugel_score',
      label: 'Kugeleis',
      getPrice: (shop) => shop.kugel_preis,
      getCheckins: (shop) => shop.checkin_counts?.kugel ?? 0,
    };
  }, [shopScoreType]);

  const priceSummary = data?.price_summary || {};
  const priceTrend = Array.isArray(data?.price_trend) ? data.price_trend : [];
  const activeUsers = Array.isArray(data?.active_users) ? data.active_users : [];
  const topShops = Array.isArray(data?.top_shops) ? data.top_shops : [];
  const displayedTopShops = useMemo(() => (
    [...topShops]
      .filter((shop) => shop[scoreConfig.key] != null)
      .sort((left, right) => {
        const scoreDiff = (right[scoreConfig.key] ?? -Infinity) - (left[scoreConfig.key] ?? -Infinity);
        if (scoreDiff !== 0) {
          return scoreDiff;
        }

        const checkinDiff = scoreConfig.getCheckins(right) - scoreConfig.getCheckins(left);
        if (checkinDiff !== 0) {
          return checkinDiff;
        }

        return left.name.localeCompare(right.name, 'de');
      })
      .slice(0, 10)
  ), [scoreConfig, topShops]);

  if (loading) {
    return (
      <Page>
        <Header />
        <Container>
          <HeroCard>Lade Regionsdaten…</HeroCard>
        </Container>
      </Page>
    );
  }

  if (error || !data?.region_meta) {
    return (
      <Page>
        <Header />
        <Container>
          <HeroCard>Region konnte nicht geladen werden.</HeroCard>
        </Container>
      </Page>
    );
  }

  return (
    <Page>
      <Seo
        title={`${title} | Regionale Eispreise und Eisdielen in der Ice-App`}
        description={`Regionenübersicht für ${title}: Eisdielen, Preise, Bewertungen und Entwicklungen in der Ice-App.`}
        keywords={[
          title,
          'Eispreise Region',
          'Eisdielen Region',
          'Ice-App Region',
          'Eispreise Deutschland Regionen',
        ]}
        canonical={`/region/${level}/${regionId}`}
      />
      <Header />
      <Container>
        <HeroCard>
          <Eyebrow>{data.region_meta.level === 'bundesland' ? 'Bundesland' : 'Landkreis'}</Eyebrow>
          <Title>{title}</Title>
          <HeroMeta>
            <MetaPill>{data.region_meta.shop_count || 0} Eisdielen</MetaPill>
            {data.region_meta.bundesland?.name && data.region_meta.bundesland?.id ? (
              <MetaPill as={Link} to={`/region/bundesland/${data.region_meta.bundesland.id}`}>
                {data.region_meta.bundesland.name}
              </MetaPill>
            ) : (
              data.region_meta.bundesland?.name && <MetaPill>{data.region_meta.bundesland.name}</MetaPill>
            )}
            {data.region_meta.land?.name && <MetaPill>{data.region_meta.land.name}</MetaPill>}
          </HeroMeta>
        </HeroCard>

        <Grid>
          <SectionCard>
            <SectionTitle>Preise aktuell</SectionTitle>
            <SummaryGrid>
              <SummaryBox>
                <span>Ø Kugelpreis</span>
                <strong>{priceSummary.average_kugel_price != null ? `${Number(priceSummary.average_kugel_price).toFixed(2)} €` : '-'}</strong>
              </SummaryBox>
              <SummaryBox>
                <span>Eisdielen mit Preis</span>
                <strong>{priceSummary.priced_shop_count || 0}</strong>
              </SummaryBox>
            </SummaryGrid>
            <MiniColumns>
              <MiniColumn>
                <h4>Günstigste</h4>
                <SimpleList>
                  {(priceSummary.cheapest_shops || []).map((shop) => (
                    <li key={`cheap-${shop.id}`}>
                      <Link to={`/map/activeShop/${shop.id}`}>{shop.name}</Link>
                      <strong>{Number(shop.preis).toFixed(2)} €</strong>
                    </li>
                  ))}
                </SimpleList>
              </MiniColumn>
              <MiniColumn>
                <h4>Populärste</h4>
                <SimpleList>
                  {(priceSummary.popular_shops || []).map((shop) => (
                    <li key={`popular-${shop.id}`}>
                      <Link to={`/map/activeShop/${shop.id}`}>{shop.name}</Link>
                      <strong>{shop.checkin_count} Check-ins</strong>
                    </li>
                  ))}
                </SimpleList>
              </MiniColumn>
            </MiniColumns>
          </SectionCard>

          <SectionCard>
            <SectionTitle>Preisentwicklung</SectionTitle>
            <ChartWrap>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={priceTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(47,33,0,0.08)" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => value == null ? '-' : `${Number(value).toFixed(2)} €`} />
                  <Line type="monotone" dataKey="average_price" stroke="#d97706" strokeWidth={3} dot={{ r: 3 }} connectNulls={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartWrap>
          </SectionCard>

          <SectionCard>
            <SectionTitle>Beliebteste Eisdielen</SectionTitle>
            <FilterRow>
              <FilterButton type="button" $active={shopScoreType === 'kugel'} onClick={() => setShopScoreType('kugel')}>
                Kugeleis
              </FilterButton>
              <FilterButton type="button" $active={shopScoreType === 'softeis'} onClick={() => setShopScoreType('softeis')}>
                Softeis
              </FilterButton>
              <FilterButton type="button" $active={shopScoreType === 'eisbecher'} onClick={() => setShopScoreType('eisbecher')}>
                Eisbecher
              </FilterButton>
            </FilterRow>
            <RankList>
              {displayedTopShops.map((shop, index) => (
                <RankItem key={shop.id}>
                  <RankNumber>#{index + 1}</RankNumber>
                  <RankContent>
                    <Link to={`/map/activeShop/${shop.id}`}>{shop.name}</Link>
                    <small>{shop.adresse}</small>
                  </RankContent>
                  <RankAside>
                    <strong>{shop[scoreConfig.key] != null ? Number(shop[scoreConfig.key]).toFixed(2) : '-'}</strong>
                    <small>{scoreConfig.label}</small>
                    <small>{formatPrice(scoreConfig.getPrice(shop))}</small>
                    <small>{scoreConfig.getCheckins(shop)} Check-ins</small>
                  </RankAside>
                </RankItem>
              ))}
              {displayedTopShops.length === 0 && (
                <RankItem>
                  <RankContent>
                    <small>Keine Eisdielen mit Score für diese Kategorie vorhanden.</small>
                  </RankContent>
                </RankItem>
              )}
            </RankList>
          </SectionCard>

          <SectionCard>
            <SectionTitle>Aktivste Nutzer im Gebiet</SectionTitle>
            <RankList>
              {activeUsers.map((entry) => (
                <RankItem key={entry.user_id}>
                  <RankNumber>#{entry.rank}</RankNumber>
                  <RankContent>
                    <UserRow>
                      <UserAvatar
                        size={34}
                        userId={entry.user_id}
                        name={entry.username}
                        avatarUrl={entry.avatar_url}
                      />
                      <Link to={`/user/${entry.user_id}`}>{entry.username}</Link>
                    </UserRow>
                    <small>
                      {entry.counts.checkins_with_photo + entry.counts.checkins_without_photo} Check-ins, {entry.counts.reviews} Bewertungen, {entry.counts.price_reports} Preise
                    </small>
                  </RankContent>
                  <RankAside>
                    <strong>{entry.total_ep} EP</strong>
                  </RankAside>
                </RankItem>
              ))}
            </RankList>
          </SectionCard>
        </Grid>
      </Container>
    </Page>
  );
};

export default RegionOverview;

const Page = styled.div`
  min-height: 100vh;
  background:
    radial-gradient(circle at top right, rgba(255, 218, 140, 0.28), transparent 45%),
    linear-gradient(180deg, #fffaf0 0%, #fff7e7 100%);
`;

const Container = styled.div`
  width: min(96%, 1320px);
  margin: 0 auto;
  padding: 0.75rem 0 2rem;
`;

const HeroCard = styled.div`
  background: rgba(255, 252, 243, 0.96);
  border: 1px solid rgba(47, 33, 0, 0.08);
  border-radius: 18px;
  box-shadow: 0 10px 28px rgba(28, 20, 0, 0.08);
  padding: 1rem;
`;

const Eyebrow = styled.div`
  color: #8a6a2e;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.72rem;
`;

const Title = styled.h1`
  margin: 0.2rem 0 0;
  color: #2f2100;
  font-size: clamp(1.6rem, 3vw, 2.4rem);
`;

const HeroMeta = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.75rem;
`;

const MetaPill = styled.span`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.35rem 0.75rem;
  background: rgba(255, 181, 34, 0.14);
  color: #5b420b;
  font-weight: 700;
  font-size: 0.86rem;
`;

const Grid = styled.div`
  display: grid;
  gap: 1rem;
  margin-top: 1rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));

  @media (max-width: 920px) {
    grid-template-columns: 1fr;
  }
`;

const SectionCard = styled.div`
  background: rgba(255, 252, 243, 0.94);
  border: 1px solid rgba(47, 33, 0, 0.08);
  border-radius: 18px;
  box-shadow: 0 10px 28px rgba(28, 20, 0, 0.08);
  padding: 1rem;
`;

const SectionTitle = styled.h3`
  margin: 0 0 0.9rem;
  color: #2f2100;
  font-size: 1.05rem;
  font-weight: 800;
`;

const FilterRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  margin-bottom: 1rem;
`;

const FilterButton = styled.button`
  border: 1px solid ${({ $active }) => ($active ? '#d97706' : 'rgba(47, 33, 0, 0.12)')};
  background: ${({ $active }) => ($active ? 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)' : 'rgba(255, 255, 255, 0.72)')};
  color: ${({ $active }) => ($active ? '#fff8ef' : '#5b430d')};
  border-radius: 999px;
  padding: 0.5rem 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 18px rgba(217, 119, 6, 0.15);
  }
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
`;

const SummaryBox = styled.div`
  display: grid;
  gap: 0.3rem;
  border-radius: 14px;
  background: #fff;
  border: 1px solid rgba(47, 33, 0, 0.08);
  padding: 0.85rem;

  span {
    color: rgba(47, 33, 0, 0.62);
    font-size: 0.82rem;
  }

  strong {
    font-size: 1.15rem;
    color: #2f2100;
  }
`;

const MiniColumns = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin-top: 0.9rem;

  @media (max-width: 680px) {
    grid-template-columns: 1fr;
  }
`;

const MiniColumn = styled.div`
  h4 {
    margin: 0 0 0.55rem;
    color: #5b420b;
  }
`;

const SimpleList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.55rem;

  li {
    display: flex;
    justify-content: space-between;
    gap: 0.8rem;
  }

  a {
    color: #2f2100;
    text-decoration: none;
  }
`;

const ChartWrap = styled.div`
  width: 100%;
  height: 260px;
`;

const RankList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.7rem;
`;

const RankItem = styled.li`
  display: grid;
  grid-template-columns: 40px 1fr auto;
  gap: 0.8rem;
  align-items: center;
  padding: 0.85rem;
  border-radius: 14px;
  background: #fff;
  border: 1px solid rgba(47, 33, 0, 0.08);
`;

const RankNumber = styled.div`
  font-weight: 800;
  color: #8a6a2e;
`;

const RankContent = styled.div`
  display: grid;
  gap: 0.25rem;

  a {
    color: #2f2100;
    text-decoration: none;
    font-weight: 700;
  }

  small {
    color: rgba(47, 33, 0, 0.64);
  }
`;

const RankAside = styled.div`
  display: grid;
  gap: 0.2rem;
  text-align: right;

  strong {
    color: #2f2100;
  }

  small {
    color: rgba(47, 33, 0, 0.64);
  }
`;

const UserRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.55rem;
`;
