import Header from './../Header';
import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useUser } from "../context/UserContext";
import CheckinCard from "../components/CheckinCard";
import ReviewCard from "../components/ReviewCard";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import RouteCard from '../components/RouteCard';
import LevelDisplay from '../components/LevelDisplay';
import UserSettings from './UserSettings';

const ASSET_BASE = (process.env.REACT_APP_ASSET_BASE_URL || "https://ice-app.de/").replace(/\/+$/, "");
const TRAVEL_COLORS = ["#ffb522", "#ff8a00", "#ff595e", "#8ac926", "#33658a", "#6a4c93", "#1982c4", "#6f2dbd"];
const buildAssetUrl = (path) => (path ? `${ASSET_BASE}/${path.replace(/^\/+/, "")}` : null);
const toNumberOrDefault = (value, defaultValue = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : defaultValue;
};

function UserSite() {
  const { userId: userIdFromUrl } = useParams();
  const { userId: userIdFromContext } = useUser();
  const [activeTab, setActiveTab] = useState('checkins');
  const isOwnProfile = userIdFromUrl === userIdFromContext;
  const [showToast, setShowToast] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const finalUserId = userIdFromUrl || userIdFromContext;
  const apiUrl = process.env.REACT_APP_API_BASE_URL;
  const [checkinPage, setCheckinPage] = useState(1);
  const [reviewPage, setReviewPage] = useState(1);
  const [awardPage, setAwardPage] = useState(1);
  const [routePage, setRoutePage] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [activityLevel, setActivityLevel] = useState('land');
  const PREVIEW_COUNT = 5;
  const location = useLocation();
  const navigate = useNavigate();
  const [listModal, setListModal] = useState(null); // { title, type, items, isBestRated }
  const [expandedFlavorKey, setExpandedFlavorKey] = useState(null);
  const [flavorDetails, setFlavorDetails] = useState({});
  const [flavorLoading, setFlavorLoading] = useState({});
  const [flavorErrors, setFlavorErrors] = useState({});

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('openSettings') === '1') {
      setShowSettings(true);
    }
    if (params.get('tab') === 'routes') {
      setActiveTab('routen');
    }
  }, [location.search]);

  const loadMoreCheckins = () => setCheckinPage((prev) => prev + 1);
  const loadMoreReviews = () => setReviewPage((prev) => prev + 1);
  const loadMoreAwards = () => setAwardPage((prev) => prev + 1);
  const loadMoreRoutes = () => setRoutePage((prev) => prev + 1);

  const fetchUserData = async (userIdToLoad) => {
    try {
      const response = await fetch(`${apiUrl}/get_user_stats.php?nutzer_id=${userIdToLoad}&cur_user_id=${userIdFromContext}`);
      if (!response.ok) throw new Error("Fehler beim Abruf der Daten");
      const json = await response.json();
      setData(json);
      setLoading(false);
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!finalUserId) return;
    fetchUserData(finalUserId);
  }, [finalUserId]);

  const refreshUser = () => fetchUserData(finalUserId);
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
    } catch (err) {
      alert('Kopieren fehlgeschlagen.');
    }
  };

  const checkins = data?.checkins || [];
  const reviews = data?.reviews || [];
  const awards = data?.user_awards || [];
  const routes = data?.routen || [];
  const displayedCheckins = checkins.slice(0, checkinPage * 5);
  const displayedReviews = reviews.slice(0, reviewPage * 5);
  const displayedAwards = awards.slice(0, awardPage * 6);
  const displayedRoutes = routes.slice(0, routePage * 5);
  const fallbackImageCount = React.useMemo(() => {
    const checkinImages = checkins.reduce((sum, checkin) => sum + (checkin?.bilder?.length || 0), 0);
    const reviewImages = reviews.reduce((sum, review) => sum + (review?.bilder?.length || 0), 0);
    return checkinImages + reviewImages;
  }, [checkins, reviews]);
  const fallbackCommentCount = React.useMemo(() => {
    const checkinComments = checkins.reduce((sum, checkin) => sum + (Number(checkin?.commentCount) || 0), 0);
    const reviewComments = reviews.reduce((sum, review) => sum + (Number(review?.commentCount) || 0), 0);
    return checkinComments + reviewComments;
  }, [checkins, reviews]);
  const reviewCount = data?.review_count != null ? toNumberOrDefault(data.review_count, 0) : reviews.length;
  const imageCount = data?.image_count != null ? toNumberOrDefault(data.image_count, 0) : fallbackImageCount;
  const routeCount = data?.route_count != null ? toNumberOrDefault(data.route_count, 0) : routes.length;
  const commentCount = data?.comment_count != null ? toNumberOrDefault(data.comment_count, 0) : fallbackCommentCount;
  const totalIcePortions = data ? (Number(data.eisarten?.Kugel || 0) + Number(data.eisarten?.Softeis || 0) + Number(data.eisarten?.Eisbecher || 0)) : 0;
  const portionBreakdown = [
    { key: 'Kugel', label: 'Kugeleis', value: Number(data?.eisarten?.Kugel || 0) },
    { key: 'Softeis', label: 'Softeis', value: Number(data?.eisarten?.Softeis || 0) },
    { key: 'Eisbecher', label: 'Eisbecher', value: Number(data?.eisarten?.Eisbecher || 0) }
  ];
  const maxPortionValue = Math.max(1, ...portionBreakdown.map((item) => item.value));
  const avatarUrl = buildAssetUrl(data?.avatar_url);
  const userInitial = data?.nutzername?.charAt(0)?.toUpperCase() || '?';
  const activityData = {
    land: { label: 'Land', data: data?.aktivitaet_land || [] },
    bundesland: { label: 'Bundesland', data: data?.aktivitaet_bundesland || [] },
    landkreis: { label: 'Landkreis', data: data?.aktivitaet_landkreis || [] }
  };
  const activeActivityData = activityData[activityLevel]?.data || [];
  const activityPreview = activeActivityData.slice(0, PREVIEW_COUNT);

  const sortedMostVisited = React.useMemo(() => {
    if (!data?.meistbesuchte_eisdielen) return [];
    return [...data.meistbesuchte_eisdielen].sort((a, b) => {
      if (b.besuche !== a.besuche) return b.besuche - a.besuche;
      return a.name.localeCompare(b.name);
    });
  }, [data?.meistbesuchte_eisdielen]);

  const sortedMostEaten = React.useMemo(() => {
    if (!data?.meistgegessene_eissorten) return [];
    return [...data.meistgegessene_eissorten].sort((a, b) => {
      if (b.anzahl !== a.anzahl) return b.anzahl - a.anzahl;
      const ratingA = Number(a.bewertung) || 0;
      const ratingB = Number(b.bewertung) || 0;
      if (ratingB !== ratingA) return ratingB - ratingA;
      return a.sortenname.localeCompare(b.sortenname);
    });
  }, [data?.meistgegessene_eissorten]);

  const sortedBestRated = React.useMemo(() => {
    if (!data?.best_bewertete_eissorten) return [];
    return [...data.best_bewertete_eissorten].sort((a, b) => {
      const avgA = Number(a.durchschnitt) || 0;
      const avgB = Number(b.durchschnitt) || 0;
      if (avgB !== avgA) return avgB - avgA;
      if ((b.anzahl || 0) !== (a.anzahl || 0)) return (b.anzahl || 0) - (a.anzahl || 0);
      return a.sortenname.localeCompare(b.sortenname);
    });
  }, [data?.best_bewertete_eissorten]);

  const previewList = (list) => list.slice(0, PREVIEW_COUNT);

  const formatRating = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num.toFixed(1) : '–';
  };

  const formatDate = (value) => {
    if (!value) return '–';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '–' : date.toLocaleDateString();
  };

  const travelDistribution = React.useMemo(() => {
    if (!data?.anreise_verteilung) return [];
    return data.anreise_verteilung.map((entry, index) => ({
      ...entry,
      fill: TRAVEL_COLORS[index % TRAVEL_COLORS.length],
    }));
  }, [data?.anreise_verteilung]);

  const openListModal = (config) => {
    setListModal(config);
  };

  const closeModal = () => setListModal(null);

  const getShopId = (shop) =>
    shop?.eisdiele_id ?? shop?.eisdieleId ?? shop?.id ?? shop?.shop_id ?? null;

  const handleShopNavigate = (shopId) => {
    if (!shopId) return;
    closeModal();
    navigate(`/map/activeShop/${shopId}`);
  };

  const handleRankingItemKeyDown = (event, shopId) => {
    if (!shopId) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleShopNavigate(shopId);
    }
  };

  const buildFlavorKey = (sortenname, category = 'flavor') =>
    `${category}__${sortenname}`;

  const toggleFlavorDetails = async (sortenname, category = 'flavor') => {
    if (!finalUserId || !sortenname) return;
    const key = buildFlavorKey(sortenname, category);

    if (expandedFlavorKey === key) {
      setExpandedFlavorKey(null);
      return;
    }

    if (flavorDetails[key]) {
      setExpandedFlavorKey(key);
      return;
    }

    try {
      setFlavorErrors((prev) => ({ ...prev, [key]: null }));
      setFlavorLoading((prev) => ({ ...prev, [key]: true }));
      setExpandedFlavorKey(key);
      const response = await fetch(
        `${apiUrl}/get_user_flavour_details.php?nutzer_id=${finalUserId}&sortenname=${encodeURIComponent(
          sortenname
        )}`
      );
      if (!response.ok) {
        throw new Error('Fehler beim Laden der Sorten-Details.');
      }
      const json = await response.json();
      if (json && !Array.isArray(json) && json.error) {
        throw new Error(json.error);
      }
      const payload = Array.isArray(json) ? json : [];
      setFlavorDetails((prev) => ({ ...prev, [key]: payload }));
    } catch (err) {
      setFlavorErrors((prev) => ({
        ...prev,
        [key]: err.message || 'Unbekannter Fehler.',
      }));
    } finally {
      setFlavorLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleFlavorKeyDown = (event, sortenname, category = 'flavor') => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleFlavorDetails(sortenname, category);
    }
  };

  const renderShopList = (list) => (
    <RankingList>
      {list.map((shop, index) => {
        const shopId = getShopId(shop);
        return (
          <RankingItem
            key={`${shop.name}-${index}`}
            $clickable={Boolean(shopId)}
            $hasDetail={false}
            role={shopId ? 'button' : undefined}
            tabIndex={shopId ? 0 : undefined}
            onClick={() => shopId && handleShopNavigate(shopId)}
            onKeyDown={(event) => shopId && handleRankingItemKeyDown(event, shopId)}
          >
            <RankingItemHeader>
              <span>{index + 1}. {shop.name}</span>
              <RankingMeta>{shop.besuche} Besuche</RankingMeta>
            </RankingItemHeader>
          </RankingItem>
        );
      })}
    </RankingList>
  );

  const renderFlavorList = (list, { isBestRated = false, category = 'flavor' } = {}) => (
    <RankingList>
      {list.map((sorte, index) => {
        const key = buildFlavorKey(sorte.sortenname, category);
        const isExpanded = expandedFlavorKey === key;
        const details = flavorDetails[key] || [];
        const isLoading = flavorLoading[key];
        const errorMessage = flavorErrors[key];

        return (
          <RankingItem
            key={`${sorte.sortenname}-${index}`}
            $clickable
            $hasDetail
            role="button"
            tabIndex={0}
            onClick={() => toggleFlavorDetails(sorte.sortenname, category)}
            onKeyDown={(event) => handleFlavorKeyDown(event, sorte.sortenname, category)}
          >
            <RankingItemHeader>
              <span>{index + 1}. {sorte.sortenname}</span>
              {isBestRated ? (
                <RankingMeta>{formatRating(sorte.durchschnitt)}★ · {sorte.anzahl} Bewertungen</RankingMeta>
              ) : (
                <RankingMeta>{sorte.anzahl}x · {formatRating(sorte.bewertung)}★</RankingMeta>
              )}
            </RankingItemHeader>
            {isExpanded && (
              <FlavorDetail>
                {isLoading && <FlavorDetailNote>Lade Details...</FlavorDetailNote>}
                {!isLoading && errorMessage && (
                  <FlavorDetailNote>{errorMessage}</FlavorDetailNote>
                )}
                {!isLoading && !errorMessage && (
                  <>
                    {details.length ? (
                      <FlavorDetailList>
                        {details.map((entry) => (
                          <FlavorDetailEntry
                            key={`${entry.eisdiele_id}-${entry.ice_type || 'unknown'}`}
                            role="button"
                            tabIndex={0}
                            onClick={() => handleShopNavigate(entry.eisdiele_id)}
                            onKeyDown={(event) => handleRankingItemKeyDown(event, entry.eisdiele_id)}
                          >
                            <FlavorDetailHeader>
                              <span>{entry.eisdiele_name}</span>
                              <FlavorDetailMeta>
                                {entry.anzahl_checkins}x · {formatRating(entry.durchschnittsbewertung)}★
                              </FlavorDetailMeta>
                            </FlavorDetailHeader>
                            <FlavorDetailSub>
                              Typ: {entry.ice_type || 'unbekannt'} · Letzter Besuch {formatDate(entry.letzter_besuch)}
                            </FlavorDetailSub>
                          </FlavorDetailEntry>
                        ))}
                      </FlavorDetailList>
                    ) : (
                      <FlavorDetailNote>Keine Details verfügbar.</FlavorDetailNote>
                    )}
                  </>
                )}
              </FlavorDetail>
            )}
          </RankingItem>
        );
      })}
    </RankingList>
  );

  const renderActivityTable = (items) => (
    <ActivityTable>
      <thead>
        <tr>
          <th>Region</th>
          <th>Check-ins</th>
          <th>Eisdielen</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, index) => (
          <tr key={`${item.land || item.bundesland || item.landkreis || 'region'}-${index}`}>
            <td>{item.land || item.bundesland || item.landkreis || 'Unbekannt'}</td>
            <td>{item.checkins}</td>
            <td>{item.eisdielen}</td>
          </tr>
        ))}
      </tbody>
    </ActivityTable>
  );

  const renderModalContent = () => {
    if (!listModal) return null;
    switch (listModal.type) {
      case 'shops':
        return renderShopList(listModal.items || []);
      case 'flavor':
        return renderFlavorList(listModal.items || [], {
          isBestRated: !!listModal.isBestRated,
          category: listModal.category || 'flavor',
        });
      case 'activity':
        return (
          <>
            <ActivityTabs>
              {Object.entries(activityData).map(([key, meta]) => (
                <ActivityTabButton
                  key={key}
                  type="button"
                  active={activityLevel === key}
                  onClick={() => setActivityLevel(key)}
                >
                  {meta.label}
                </ActivityTabButton>
              ))}
            </ActivityTabs>
            {renderActivityTable(activityData[activityLevel]?.data || [])}
          </>
        );
      default:
        return null;
    }
  };

  const routeRefs = React.useRef({});

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (activeTab === 'routen' && params.get('focusRoute')) {
      const routeId = params.get('focusRoute');
      setTimeout(() => {
        if (routeRefs.current[routeId]) {
          routeRefs.current[routeId].scrollIntoView({ behavior: 'smooth', block: 'center' });
          const newParams = new URLSearchParams(location.search);
          newParams.delete('focusRoute');
          newParams.delete('tab');
          const newUrl = `${location.pathname}${newParams.toString() ? '?' + newParams.toString() : ''}`;
          window.history.replaceState({}, '', newUrl);
        }
      }, 300);
    }
  }, [activeTab, displayedRoutes, location.search]);

  const handleAvatarUpdated = (newPath) => {
    setData((prev) => (prev ? { ...prev, avatar_url: newPath } : prev));
  };
  if (loading) {
    return (
      <FullPage>
        <Header />
        <WhiteBackground>
          <DashboardWrapper>
            <LoadingCard>
              <h1>Nutzerseite</h1>
              <p>Lade Nutzer Daten...</p>
            </LoadingCard>
          </DashboardWrapper>
        </WhiteBackground>
      </FullPage>
    );
  }

  if (error !== null) {
    return (
      <FullPage>
        <Header />
        <WhiteBackground>
          <DashboardWrapper>
            <LoadingCard>
              <h1>Nutzerseite</h1>
              <p>Fehler beim Abruf der Daten</p>
            </LoadingCard>
          </DashboardWrapper>
        </WhiteBackground>
      </FullPage>
    );
  }

  return (
    <FullPage>
      <Header />
      <WhiteBackground>
        <DashboardWrapper>
            <ProfileHeader>
              <AvatarCircle>
                {avatarUrl ? <img src={avatarUrl} alt={`Avatar von ${data.nutzername}`} /> : <span>{userInitial}</span>}
              </AvatarCircle>
              <ProfileInfo>
                <h1>{data.nutzername}</h1>
                <MetaRow>
                  <Chip>Mitglied seit {new Date(data.erstellungsdatum).toLocaleDateString()}</Chip>
                  <Chip>{data.eisdielen_besucht} verschiedene Eisdielen</Chip>
                  <Chip>{data.anzahl_checkins} Check-ins</Chip>
                  <Chip>{reviewCount} Reviews</Chip>
                  <Chip>{imageCount} hochgeladene Bilder</Chip>
                  <Chip>{routeCount} Routen</Chip>
                  <Chip>{commentCount} Kommentare</Chip>
                </MetaRow>
              </ProfileInfo>
              {isOwnProfile && (
                <SettingsButton onClick={() => setShowSettings(true)}>
                  ⚙️ Profil & Einstellungen
                </SettingsButton>
              )}
            </ProfileHeader>
            {isOwnProfile && (
              <InviteCard>
                <h3>Lade neue Nutzer ein und verdiene extra EP ✨</h3>
                <LinkContainer>
                  Dein Einladungslink:
                  <Input value={`https://ice-app.de/#/register/${data.invite_code}`} readOnly />
                  <CopyButton onClick={() => copyToClipboard(`https://ice-app.de/#/register/${data.invite_code}`)}>Kopieren</CopyButton>
                </LinkContainer>
                {showToast && <Toast>Link wurde kopiert ✔️</Toast>}
              </InviteCard>
            )}
            {showSettings && (
              <UserSettings
                onClose={() => setShowSettings(false)}
                currentAvatar={data.avatar_url}
                onAvatarUpdated={handleAvatarUpdated}
              />
            )}
            <LevelCardWrapper>
              <LevelDisplay levelInfo={data.level_info} />
            </LevelCardWrapper>
            <AwardsCard>
              <SectionHeader>
                <h3>Awards</h3>
                <span>{awards.length}</span>
              </SectionHeader>
              {displayedAwards.length ? (
                <AwardsGrid>
                  {displayedAwards.map((award, index) => (
                    <AwardCard key={index}>
                      <EPBadge>{award.ep} EP ✨</EPBadge>
                      <AwardImage src={`https://ice-app.de/${award.icon_path}`} alt={award.title_de} />
                      <AwardTitle>{award.title_de}</AwardTitle>
                      <AwardDescription>{award.description_de}</AwardDescription>
                      <AwardDate>Vergeben am {new Date(award.awarded_at).toLocaleDateString()}</AwardDate>
                    </AwardCard>
                  ))}
                </AwardsGrid>
              ) : (
                <EmptyState>Keine Awards vorhanden.</EmptyState>
              )}
              {displayedAwards.length < awards.length && (
                <LoadMoreButton onClick={loadMoreAwards}>Mehr Awards laden</LoadMoreButton>
              )}
            </AwardsCard>

          <StatsArea>
            <SectionHeader>
              <h2>Deine Statistiken</h2>
              <span>Ein Überblick über deine Eis-Abenteuer</span>
            </SectionHeader>
            <HighlightGrid>
              <HighlightCard>
                <h3>Check-ins gesamt</h3>
                <strong>{data.anzahl_checkins}</strong>
              </HighlightCard>
              <HighlightCard>
                <h3>Verschiedene Eisdielen</h3>
                <strong>{data.eisdielen_besucht}</strong>
              </HighlightCard>
              <HighlightCard>
                <h3>Portionen Eis</h3>
                <strong>{totalIcePortions}</strong>
                <small>Kugel · Softeis · Becher</small>
              </HighlightCard>
            </HighlightGrid>
            <ContentGrid>
              <ContentCard>
                <CardTitle>Portionen & Verteilung</CardTitle>
                <CardSubtitle>Gesamt: {totalIcePortions}</CardSubtitle>
                {portionBreakdown.map((item) => (
                  <PortionRow key={item.key}>
                    <span>{item.label}</span>
                    <PortionBar>
                      <PortionFill style={{ width: `${(item.value / maxPortionValue) * 100}%` }} />
                    </PortionBar>
                    <span>{item.value}</span>
                  </PortionRow>
                ))}
              </ContentCard>
              <ContentCard>
                <CardTitle>Meistbesuchte Eisdielen</CardTitle>
                {sortedMostVisited.length ? (
                  renderShopList(previewList(sortedMostVisited))
                ) : (
                  <EmptyState>Noch keine Besuche erfasst.</EmptyState>
                )}
                {sortedMostVisited.length > PREVIEW_COUNT && (
                  <ListToggle onClick={() => openListModal({ title: 'Meistbesuchte Eisdielen', type: 'shops', items: sortedMostVisited })}>
                    Alle anzeigen
                  </ListToggle>
                )}
              </ContentCard>
            </ContentGrid>
            <ContentGrid>
              <ContentCard>
                <CardTitle>Meistgegessene Eissorten</CardTitle>
                {sortedMostEaten.length ? (
                  renderFlavorList(previewList(sortedMostEaten), { category: 'mostEaten', isBestRated: false })
                ) : (
                  <EmptyState>Noch keine Sorten bewertet.</EmptyState>
                )}
                {sortedMostEaten.length > PREVIEW_COUNT && (
                  <ListToggle onClick={() => openListModal({ title: 'Meistgegessene Eissorten', type: 'flavor', items: sortedMostEaten, isBestRated: false, category: 'mostEaten' })}>
                    Alle anzeigen
                  </ListToggle>
                )}
              </ContentCard>
              <ContentCard>
                <CardTitle>Best bewertete Eissorten</CardTitle>
                {sortedBestRated.length ? (
                  renderFlavorList(previewList(sortedBestRated), { category: 'bestRated', isBestRated: true })
                ) : (
                  <EmptyState>Keine Bewertungen vorhanden.</EmptyState>
                )}
                {sortedBestRated.length > PREVIEW_COUNT && (
                  <ListToggle onClick={() => openListModal({ title: 'Best bewertete Eissorten', type: 'flavor', items: sortedBestRated, isBestRated: true, category: 'bestRated' })}>
                    Alle anzeigen
                  </ListToggle>
                )}
              </ContentCard>
            </ContentGrid>
            <ContentGrid>
              <ContentCard>
                <CardTitle>Verteilung der Anreise</CardTitle>
                {travelDistribution.length ? (
                  <ChartWrapper>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={travelDistribution}
                          dataKey="anzahl"
                          nameKey="anreise"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={110}
                          paddingAngle={2}
                          label={({ anreise, percent }) =>
                            `${anreise} ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {travelDistribution.map((entry, index) => (
                            <Cell key={`anreise-${entry.anreise}-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartWrapper>
                ) : (
                  <EmptyState>Keine Anreisen dokumentiert.</EmptyState>
                )}
              </ContentCard>
              <ContentCard>
                <CardTitle>Aktivität nach Region</CardTitle>
                <ActivityTabs>
                  {Object.entries(activityData).map(([key, meta]) => (
                    <ActivityTabButton
                      key={key}
                      type="button"
                      active={activityLevel === key}
                      onClick={() => setActivityLevel(key)}
                    >
                      {meta.label}
                    </ActivityTabButton>
                  ))}
                </ActivityTabs>
                {activeActivityData.length ? (
                  <>
                    <ActivityTable>
                      <thead>
                        <tr>
                          <th>Region</th>
                          <th>Check-ins</th>
                          <th>Eisdielen</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activityPreview.map((item, index) => (
                          <tr key={`${activityLevel}-${index}`}>
                            <td>{item.land || item.bundesland || item.landkreis || 'Unbekannt'}</td>
                            <td>{item.checkins}</td>
                            <td>{item.eisdielen}</td>
                          </tr>
                        ))}
                      </tbody>
                    </ActivityTable>
                    {activeActivityData.length > PREVIEW_COUNT && (
                      <ListToggle
                        onClick={() => openListModal({ title: 'Aktivität nach Region', type: 'activity' })}
                      >
                        Alle anzeigen
                      </ListToggle>
                    )}
                  </>
                ) : (
                  <EmptyState>Keine Aktivität für diese Region.</EmptyState>
                )}
              </ContentCard>
            </ContentGrid>
          </StatsArea>

            <SectionHeader>
              <h2>Aktivitätsfeed</h2>
              <span>Check-ins, Reviews & Routen</span>
            </SectionHeader>
            <FeedTabContainer>
              <FeedTabButton
                active={activeTab === 'checkins'}
                onClick={() => setActiveTab('checkins')}
              >
                Check-ins
              </FeedTabButton>
              <FeedTabButton
                active={activeTab === 'reviews'}
                onClick={() => setActiveTab('reviews')}
              >
                Reviews
              </FeedTabButton>
              {routes.length > 0 && (
                <FeedTabButton
                  active={activeTab === 'routen'}
                  onClick={() => setActiveTab('routen')}
                >
                  Routen
                </FeedTabButton>
              )}
            </FeedTabContainer>

            <TabContent>
              {activeTab === 'checkins' && (
                <div>
                  {displayedCheckins.map((checkin, index) => (
                    <CheckinCard key={index} checkin={checkin} onSuccess={refreshUser} />
                  ))}
                  {displayedCheckins.length < checkins.length && (
                    <LoadMoreButton onClick={loadMoreCheckins}>Mehr Checkins laden</LoadMoreButton>
                  )}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div>
                  {displayedReviews.map((review, index) => (
                    <ReviewCard key={index} review={review} />
                  ))}
                  {displayedReviews.length < reviews.length && (
                    <LoadMoreButton onClick={loadMoreReviews}>Mehr Reviews laden</LoadMoreButton>
                  )}
                </div>
              )}

              {activeTab === 'routen' && (
                <div>
                  {displayedRoutes.map((route, index) => (
                    <div
                      key={route.id || index}
                      ref={el => {
                        if (route.id) routeRefs.current[route.id] = el;
                      }}
                    >
                    <RouteCard
                      route={route}
                      shopId={route.eisdielen?.[0]?.id || route.eisdiele_id}
                      shopName={route.eisdielen?.[0]?.name || route.eisdiele_name}
                      onSuccess={refreshUser}
                    />
                    </div>
                  ))}
                  {displayedRoutes.length < routes.length && (
                    <LoadMoreButton onClick={loadMoreRoutes}>Mehr Routen laden</LoadMoreButton>
                  )}
                </div>
              )}
            </TabContent>
        </DashboardWrapper>
      </WhiteBackground>
      {listModal && (
        <ModalOverlay>
          <ModalCard>
            <ModalHeader>
              <h3>{listModal.title}</h3>
              <CloseModalButton onClick={closeModal}>×</CloseModalButton>
            </ModalHeader>
            <ModalBody>
              {renderModalContent()}
            </ModalBody>
          </ModalCard>
        </ModalOverlay>
      )}
    </FullPage>
  );
}

export default UserSite;

const FullPage = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #ffb522;
`;

const WhiteBackground = styled.div`
  width: 100vw;
  background-color: #fff;
  flex: 1;
`;

const DashboardWrapper = styled.div`
  width: 92%;
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem 1rem 3rem;
`;

const LoadingCard = styled.div`
  background: #fff;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.08);
`;

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
`;

const AvatarCircle = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: #ffe2b5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 700;
  color: #a05c00;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const ProfileInfo = styled.div`
  flex: 1;
  min-width: 240px;
  h1 {
    margin: 0;
    font-size: 2rem;
  }
`;

const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
`;

const Chip = styled.span`
  background: #f5f5f5;
  padding: 0.35rem 0.8rem;
  border-radius: 999px;
  font-size: 0.9rem;
  color: #555;
`;

const SettingsButton = styled.button`
  margin-left: auto;
  background: #ffb522;
  color: white;
  border: none;
  border-radius: 999px;
  padding: 0.65rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  font-weight: bold;
  box-shadow: 0 10px 20px rgba(255, 181, 34, 0.35);
  &:hover {
    background: #da9c20;
  }
`;

const InviteCard = styled.div`
  background: #fff7e6;
  padding: 1.5rem;
  border-radius: 16px;
  margin-top: 1.5rem;
`;

const LevelCardWrapper = styled.div`
  margin-top: 2rem;
`;

const AwardsCard = styled.div`
  margin-top: 2rem;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;

  h2, h3 {
    margin: 0;
  }

  span {
    color: #888;
    font-size: 0.9rem;
  }
`;

const StatsArea = styled.section`
  margin-bottom: 2.5rem;
`;

const HighlightGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const HighlightCard = styled.div`
  background: #f7fbff;
  border-radius: 16px;
  padding: 1.5rem;
  text-align: center;
  box-shadow: inset 0 0 0 1px #e5f0ff;

  h3 {
    margin: 0;
    color: #5f6c80;
    font-size: 0.95rem;
  }

  strong {
    display: block;
    font-size: 2rem;
    margin-top: 0.5rem;
    color: #0d3b66;
  }

  small {
    color: #9aa6c1;
  }
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
`;

const ContentCard = styled.div`
  background: #fff;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 8px 30px rgba(0,0,0,0.05);
`;

const CardTitle = styled.h3`
  margin: 0 0 0.25rem;
`;

const CardSubtitle = styled.p`
  margin: 0 0 1rem;
  color: #777;
`;

const PortionRow = styled.div`
  display: grid;
  grid-template-columns: 110px 1fr 50px;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

const PortionBar = styled.div`
  height: 8px;
  background: #f2f2f2;
  border-radius: 999px;
  overflow: hidden;
`;

const PortionFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #ffb522, #ff7b00);
`;

const RankingList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const RankingItem = styled.li`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: ${(props) => (props.$hasDetail ? 0.5 : 0)}rem;
  border-bottom: 1px solid #f0f0f0;
  padding: 0.65rem 0;
  font-weight: 500;
  cursor: ${(props) => (props.$clickable ? 'pointer' : 'default')};
  transition: background 0.2s ease, color 0.2s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${(props) => (props.$clickable ? 'rgba(255, 181, 34, 0.08)' : 'transparent')};
  }

  &:focus-visible {
    outline: ${(props) => (props.$clickable ? '2px solid #ffb522' : 'none')};
    outline-offset: 2px;
  }
`;

const RankingItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
`;

const FlavorDetail = styled.div`
  width: 100%;
  padding: 0.75rem;
  border-radius: 12px;
  background: #f9fafb;
  border: 1px solid #eee;
`;

const FlavorDetailList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const FlavorDetailEntry = styled.li`
  padding: 0.5rem 0.75rem;
  border-radius: 10px;
  background: #fff;
  border: 1px solid #f0f0f0;
  cursor: pointer;
  transition: box-shadow 0.2s ease;

  &:hover {
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }

  &:focus-visible {
    outline: 2px solid #ffb522;
    outline-offset: 2px;
  }
`;

const FlavorDetailHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
`;

const FlavorDetailMeta = styled.span`
  font-size: 0.85rem;
  color: #777;
`;

const FlavorDetailSub = styled.div`
  font-size: 0.8rem;
  color: #888;
  margin-top: 0.25rem;
`;

const FlavorDetailNote = styled.p`
  margin: 0;
  font-size: 0.85rem;
  color: #777;
`;

const RankingMeta = styled.span`
  font-size: 0.85rem;
  color: #777;
`;

const ListToggle = styled.button`
  margin-top: 0.75rem;
  background: none;
  border: none;
  color: #ff8a00;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  &:hover {
    text-decoration: underline;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalCard = styled.div`
  background: #fff;
  border-radius: 16px;
  max-width: 640px;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f0f0f0;

  h3 {
    margin: 0;
  }
`;

const CloseModalButton = styled.button`
  border: none;
  background: transparent;
  font-size: 1.5rem;
  cursor: pointer;
  line-height: 1;
`;

const ModalBody = styled.div`
  padding: 1rem 1.5rem 1.5rem;
  overflow-y: auto;
`;

const EmptyState = styled.p`
  margin: 0.5rem 0 0;
  color: #999;
`;

const ChartWrapper = styled.div`
  width: 100%;
  height: 260px;
`;

const ActivityTabs = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const ActivityTabButton = styled.button`
  border: none;
  border-radius: 999px;
  padding: 0.4rem 1rem;
  font-size: 0.9rem;
  cursor: pointer;
  background: ${(props) => (props.active ? '#ffb522' : '#f3f3f3')};
  color: ${(props) => (props.active ? '#fff' : '#555')};
`;

const ActivityTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;

  th, td {
    padding: 0.5rem;
    text-align: left;
  }

  th {
    color: #777;
    font-size: 0.85rem;
  }

  tbody tr:nth-child(even) {
    background: #fafafa;
  }
`;

const FeedTabContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
`;

const FeedTabButton = styled.button`
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  background-color: ${(props) => (props.active ? '#ffb522' : '#f0f0f0')};
  color: ${(props) => (props.active ? 'white' : '#333')};
  font-weight: 600;
`;

const TabContent = styled.div`
  margin-top: 1rem;
`;

const LoadMoreButton = styled.button`
  display: block;
  margin: 1rem auto;
  padding: 0.5rem 1rem;
  background-color: #ffb522;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #da9c20;
  }
`;

const LinkContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  flex-wrap: wrap;
`;

const Input = styled.input`
  flex: 1;
  min-width: 200px;
  padding: 0.5rem;
  border-radius: 8px;
  border: 1px solid #ccc;
  font-family: monospace;
`;

const CopyButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: #ffb522;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
`;

const Toast = styled.div`
  margin-top: 1rem;
  background-color: #4caf50;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 500;
  animation: fadeOut 2.5s ease forwards;

  @keyframes fadeOut {
    0%   { opacity: 1; }
    80%  { opacity: 1; }
    100% { opacity: 0; }
  }
`;

const AwardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  }

  @media (max-width: 520px) {
    grid-template-columns: repeat(2, minmax(140px, 1fr));
  }
`;

const AwardCard = styled.div`
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 16px;
  text-align: center;
  position: relative;
`;

const AwardImage = styled.img`
  height: 140px;
  object-fit: contain;
`;

const AwardTitle = styled.h3`
  font-weight: 600;
`;

const AwardDescription = styled.p`
  font-size: 0.875rem;
  color: #666;
  margin-top: 4px;
`;

const AwardDate = styled.span`
  font-size: 0.75rem;
  color: #999;
  margin-top: 8px;
  display: block;
`;

const EPBadge = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
  background: linear-gradient(135deg, #FFD700, #FFC107);
  color: #fff;
  font-size: 0.75rem;
  font-weight: bold;
  padding: 4px 8px;
  border-radius: 20px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
`;
