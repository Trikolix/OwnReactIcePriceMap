import Header from './../Header';
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useUser } from "../context/UserContext";
import CheckinCard from "../components/CheckinCard";
import ReviewCard from "../components/ReviewCard";
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import RouteCard from '../components/RouteCard';
import LevelDisplay from '../components/LevelDisplay';
import UserSettings from './UserSettings';
import { Sparkles, Calendar, MapPin, IceCream, Flame, CheckCircle2, CircleOff } from 'lucide-react';
import { getActiveAwardEffectTier } from '../shared/awardEffects';
import { getAwardIconSources, handleAwardIconFallback } from '../utils/awardIcons';

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const ASSET_BASE = (import.meta.env.VITE_ASSET_BASE_URL || "https://ice-app.de/").replace(/\/+$/, "");
const TRAVEL_COLORS = ["#ffb522", "#ff8a00", "#ff595e", "#8ac926", "#33658a", "#6a4c93", "#1982c4", "#6f2dbd"];
const buildAssetUrl = (path) => (path ? `${ASSET_BASE}/${path.replace(/^\/+/, "")}` : null);
const formatTimeLeft = (secondsInput) => {
  const seconds = Math.max(0, Number(secondsInput) || 0);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}T ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}min`;
  return `${minutes}min`;
};

function UserSite() {
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const { userId: userIdFromUrl } = useParams();
  const { userId: userIdFromContext } = useUser();
  const [activeTab, setActiveTab] = useState('checkins');
  const isOwnProfile = userIdFromUrl === userIdFromContext;
  const [showToast, setShowToast] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const finalUserId = userIdFromUrl || userIdFromContext;
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const [checkinPage, setCheckinPage] = useState(1);
  const [reviewPage, setReviewPage] = useState(1);
  const [awardPage, setAwardPage] = useState(1);
  const [awardColumns, setAwardColumns] = useState(1);
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
  const profile156AutoScanTriggeredRef = useRef(false);
  const awardsGridRef = useRef(null);
  const PROFILE_156_SCAN_CODE = '3cb55cb87747d1ed4069e612cef2e75d';
  const [selectedAward, setSelectedAward] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('openSettings') === '1') {
      setShowSettings(true);
    }
    if (params.get('tab') === 'routes') {
      setActiveTab('routen');
    }
    if (params.get('tab') === 'stats') {
      setActiveTab('stats');
    }
  }, [location.search]);

  useEffect(() => {
    if (Number(finalUserId) !== 156) return;
    if (profile156AutoScanTriggeredRef.current) return;

    const params = new URLSearchParams(location.search);
    if (params.get('scan') === PROFILE_156_SCAN_CODE) {
      profile156AutoScanTriggeredRef.current = true;
      return;
    }

    params.set('scan', PROFILE_156_SCAN_CODE);
    profile156AutoScanTriggeredRef.current = true;
    navigate(
      {
        pathname: location.pathname,
        search: `?${params.toString()}`,
      },
      { replace: true }
    );
  }, [finalUserId, location.pathname, location.search, navigate]);

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

  useEffect(() => {
    if (!selectedAward) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setSelectedAward(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedAward]);

  useEffect(() => {
    const grid = awardsGridRef.current;
    if (!grid) return undefined;

    const updateAwardColumns = () => {
      const style = window.getComputedStyle(grid);
      const columnCount = style.gridTemplateColumns
        .split(' ')
        .filter(Boolean)
        .length;
      setAwardColumns(Math.max(1, columnCount));
    };

    updateAwardColumns();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateAwardColumns);
      return () => {
        window.removeEventListener('resize', updateAwardColumns);
      };
    }
    const observer = new ResizeObserver(updateAwardColumns);
    observer.observe(grid);
    window.addEventListener('resize', updateAwardColumns);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateAwardColumns);
    };
  }, [data?.user_awards?.length]);

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
  const awardsBatchSize = Math.max(awardColumns * 2, 1);
  const routes = data?.routen || [];
  const displayedCheckins = checkins.slice(0, checkinPage * 5);
  const displayedReviews = reviews.slice(0, reviewPage * 5);
  const displayedAwards = awards.slice(0, awardPage * awardsBatchSize);
  const displayedRoutes = routes.slice(0, routePage * 5);
  const totalIcePortions = data ? (Number(data.eisarten?.Kugel || 0) + Number(data.eisarten?.Softeis || 0) + Number(data.eisarten?.Eisbecher || 0)) : 0;
  const dayStreak = data?.streaks?.day || {};
  const weekStreak = data?.streaks?.week || {};
  const dayStreakState = dayStreak.state || 'none';
  const weekStreakState = weekStreak.state || 'none';
  const dayStreakValue = Number(dayStreak.value || 0);
  const weekStreakValue = Number(weekStreak.value || 0);
  const dayStreakHint = dayStreakState === 'at_risk'
    ? `Heute noch kein Check-in. Noch ${formatTimeLeft(dayStreak.seconds_left)} bis der Streak verfällt.`
    : dayStreakState === 'active'
      ? 'Heute bereits eingecheckt. Streak gesichert.'
      : 'Kein aktiver Tages-Streak. Check heute ein, um zu starten.';
  const weekStreakHint = weekStreakState === 'at_risk'
    ? `Diese Woche noch kein Check-in. Noch ${formatTimeLeft(weekStreak.seconds_left)} bis der Wochen-Streak verfällt.`
    : weekStreakState === 'active'
      ? 'Diese Woche bereits eingecheckt. Wochen-Streak gesichert.'
      : 'Kein aktiver Wochen-Streak. Ein Check-in pro Woche startet die Serie.';

  const renderStreakIcon = (state) => {
    if (state === 'active') return <CheckCircle2 size={18} />;
    if (state === 'at_risk') return <Flame size={18} />;
    return <CircleOff size={18} />;
  };
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
              <ProfileMainColumn>
                <ProfileIdentity>
                  <AvatarCircle onClick={avatarUrl ? () => setShowAvatarModal(true) : undefined} style={avatarUrl ? { cursor: 'pointer' } : {}}>
                    {avatarUrl ? <img src={avatarUrl} alt={`Avatar von ${data.nutzername}`} /> : <span>{userInitial}</span>}
                  </AvatarCircle>
                  <ProfileInfo>
                    <h1>{data.nutzername}</h1>
                  </ProfileInfo>
                  <MetaRow>
                    <Chip>Mitglied seit {new Date(data.erstellungsdatum).toLocaleDateString()}</Chip>
                    {isOwnProfile && <Chip>Dein Profil</Chip>}
                  </MetaRow>
                </ProfileIdentity>
                <LevelInlineCard>
                  <LevelDisplay levelInfo={data.level_info} />
                </LevelInlineCard>
              </ProfileMainColumn>
              <ProfileActions>
                {isOwnProfile && (
                  <SettingsButton onClick={() => setShowSettings(true)}>
                    ⚙️ Profil & Einstellungen
                  </SettingsButton>
                )}
              </ProfileActions>
            </ProfileHeader>
            {isOwnProfile && (
              <InviteCard>
                <h3>Lade neue Nutzer ein und verdiene extra EP <Sparkles size={21} style={{ verticalAlign: 'sub' }} /></h3>
                <LinkContainer>
                  Dein Einladungslink:
                  <Input value={`https://ice-app.de/register/${data.invite_code}`} readOnly />
                  <CopyButton onClick={() => copyToClipboard(`https://ice-app.de/register/${data.invite_code}`)}>Kopieren</CopyButton>
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
            <HighlightGrid>
              <HighlightCard>
                <StatIconWrap><Calendar size={18} /></StatIconWrap>
                <h3>Check-ins gesamt</h3>
                <strong>{data.anzahl_checkins}</strong>
              </HighlightCard>
              <HighlightCard>
                <StatIconWrap><MapPin size={18} /></StatIconWrap>
                <h3>Verschiedene&nbsp;Eisdielen</h3>
                <strong>{data.eisdielen_besucht}</strong>
              </HighlightCard>
              <HighlightCard>
                <StatIconWrap><IceCream size={18} /></StatIconWrap>
                <h3>Portionen Eis</h3>
                <strong>{totalIcePortions}</strong>
                <small>Kugel · Softeis · Becher</small>
              </HighlightCard>
              <HighlightCard>
                <StatIconWrap $tone={dayStreakState}>
                  {renderStreakIcon(dayStreakState)}
                </StatIconWrap>
                <h3>Tages-Streak</h3>
                <strong>{dayStreakValue} Tage</strong>
                <small>Rekord: {data?.streaks?.day_record ?? 0} Tage</small>
                <small>{dayStreakHint}</small>
              </HighlightCard>
              <HighlightCard>
                <StatIconWrap $tone={weekStreakState}>
                  {renderStreakIcon(weekStreakState)}
                </StatIconWrap>
                <h3>Wochen-Streak</h3>
                <strong>{weekStreakValue} Wochen</strong>
                <small>Rekord: {data?.streaks?.week_record ?? 0} Wochen</small>
                <small>{weekStreakHint}</small>
              </HighlightCard>
            </HighlightGrid>
            <AwardsCard>
              <SectionHeader>
                <h3>Awards</h3>
                <span>{awards.length}</span>
              </SectionHeader>
              {displayedAwards.length ? (
                <AwardsGrid ref={awardsGridRef}>
                  {displayedAwards.map((award, index) => {
                    const iconSources = getAwardIconSources(award?.icon_path, 512);
                    const epicTier = getActiveAwardEffectTier(award?.ep);

                    return (
                      <AwardCard key={index}>
                        <EPBadge>{award.ep} EP <Sparkles size={16} style={{ marginLeft: 2, verticalAlign: 'bottom' }} /></EPBadge>
                        <AwardImageButton
                          $epicTier={epicTier}
                          type="button"
                          onClick={() => setSelectedAward({
                            src: iconSources.src || '',
                            fallbackSrc: iconSources.fallbackSrc || '',
                            title: award.title_de || 'Award',
                            description: award.description_de || '',
                            ep: award.ep ?? 0,
                            epicTier,
                            awardedAt: award.awarded_at || null,
                          })}
                          aria-label={`Award ${award.title_de || ''} groß anzeigen`}
                        >
                          <AwardImage
                            $epicTier={epicTier}
                            src={iconSources.src || ''}
                            data-fallback-src={iconSources.fallbackSrc || ''}
                            onError={handleAwardIconFallback}
                            loading="lazy"
                            decoding="async"
                            alt={award.title_de}
                          />
                        </AwardImageButton>
                        <AwardTitle>{award.title_de}</AwardTitle>
                        <AwardDescription>{award.description_de}</AwardDescription>
                        <AwardDate>Vergeben am {new Date(award.awarded_at).toLocaleDateString()}</AwardDate>
                      </AwardCard>
                    );
                  })}
                </AwardsGrid>
              ) : (
                <EmptyState>Keine Awards vorhanden.</EmptyState>
              )}
              {(displayedAwards.length < awards.length || awardPage > 1) && (
                <AwardsFooterActions>
                  {displayedAwards.length < awards.length && (
                    <LoadMoreButton onClick={loadMoreAwards}>Mehr Awards laden</LoadMoreButton>
                  )}
                  {awardPage > 1 && (
                    <LoadMoreButton type="button" onClick={() => setAwardPage(1)}>
                      Awards einklappen
                    </LoadMoreButton>
                  )}
                </AwardsFooterActions>
              )}
            </AwardsCard>
            <UnifiedTabBar>
              <UnifiedTabButton
                active={activeTab === 'checkins'}
                onClick={() => setActiveTab('checkins')}
              >
                Check-ins
              </UnifiedTabButton>
              <UnifiedTabButton
                active={activeTab === 'reviews'}
                onClick={() => setActiveTab('reviews')}
              >
                Reviews
              </UnifiedTabButton>
              <UnifiedTabButton
                active={activeTab === 'routen'}
                onClick={() => setActiveTab('routen')}
              >
                Routen
              </UnifiedTabButton>
              <UnifiedTabButton
                active={activeTab === 'stats'}
                onClick={() => setActiveTab('stats')}
              >
                Statistiken
              </UnifiedTabButton>
            </UnifiedTabBar>
            {selectedAward && typeof document !== 'undefined' && createPortal(
              <AwardLightboxOverlay onClick={() => setSelectedAward(null)}>
                <AwardLightboxCard onClick={(event) => event.stopPropagation()}>
                  <AwardLightboxClose type="button" onClick={() => setSelectedAward(null)}>
                    Schließen
                  </AwardLightboxClose>
                  <AwardLightboxImage
                    $epicTier={selectedAward.epicTier || getActiveAwardEffectTier(selectedAward.ep)}
                    src={selectedAward.src}
                    data-fallback-src={selectedAward.fallbackSrc || ''}
                    onError={handleAwardIconFallback}
                    alt={selectedAward.title}
                  />
                  <AwardLightboxMeta>
                    <AwardLightboxTitle>{selectedAward.title}</AwardLightboxTitle>
                    <AwardLightboxDescription>
                      {selectedAward.description || 'Keine Beschreibung vorhanden.'}
                    </AwardLightboxDescription>
                    <AwardLightboxFooter>
                      <strong>{selectedAward.ep} EP</strong>
                      {selectedAward.awardedAt ? (
                        <span>Vergeben am {new Date(selectedAward.awardedAt).toLocaleDateString()}</span>
                      ) : null}
                    </AwardLightboxFooter>
                  </AwardLightboxMeta>
                </AwardLightboxCard>
              </AwardLightboxOverlay>,
              document.body
            )}

          {activeTab === 'stats' && (
          <StatsArea>
            <SectionHeader>
              <h2>Deine Statistiken</h2>
              <span>Ein Überblick über deine Eis-Abenteuer</span>
            </SectionHeader>
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
          )}

            {activeTab !== 'stats' && (
            <>
            <SectionHeader>
              <h2>Aktivitätsfeed</h2>
              <span>Check-ins, Reviews & Routen</span>
            </SectionHeader>
            <TabContent>
              {activeTab === 'checkins' && (
                <div>
                  {checkins.length === 0 && (
                    <EmptyState>Noch keine Check-ins vorhanden.</EmptyState>
                  )}
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
                  {reviews.length === 0 && (
                    <EmptyState>Noch keine Reviews vorhanden.</EmptyState>
                  )}
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
                  {routes.length === 0 && (
                    <EmptyState>Noch keine Routen vorhanden.</EmptyState>
                  )}
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
            </>
            )}
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
      {showAvatarModal && avatarUrl && (
        <ModalOverlay onClick={() => setShowAvatarModal(false)}>
          <AvatarModalContent onClick={e => e.stopPropagation()}>
            <CloseAvatarModalButton onClick={() => setShowAvatarModal(false)}>×</CloseAvatarModalButton>
            <LargeAvatarImg src={avatarUrl} alt={`Avatar von ${data.nutzername}`} />
          </AvatarModalContent>
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
  background:
    radial-gradient(circle at top right, rgba(255, 218, 140, 0.34), transparent 42%),
    linear-gradient(180deg, #fff9ef 0%, #fff4da 100%);
`;

const WhiteBackground = styled.div`
  width: 100%;
  background: transparent;
  flex: 1;
`;

const DashboardWrapper = styled.div`
  width: min(96%, 1120px);
  margin: 0 auto;
  padding: 0.5rem 0rem 0.5rem;
  box-sizing: border-box;
`;

const LoadingCard = styled.div`
  background: rgba(255, 252, 243, 0.96);
  padding: 2rem;
  border-radius: 18px;
  border: 1px solid rgba(47, 33, 0, 0.08);
  box-shadow: 0 10px 28px rgba(28, 20, 0, 0.08);
  color: #2f2100;
`;

const ProfileHeader = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 1rem 1.2rem;
  background: rgba(255, 252, 243, 0.96);
  border: 1px solid rgba(47, 33, 0, 0.08);
  border-radius: 18px;
  box-shadow: 0 10px 28px rgba(28, 20, 0, 0.08);
  padding: 1rem;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
    justify-items: stretch;
  }
`;

const ProfileIdentity = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 0.8rem 1rem;

  @media (max-width: 640px) {
    align-items: flex-start;
  }
`;

const AvatarCircle = styled.div`
  width: 128px;
  height: 128px;
  min-width: 128px;
  aspect-ratio: 1 / 1;
  flex-shrink: 0;
  border-radius: 50%;
  background: linear-gradient(180deg, #ffe2b5, #ffd08a);
  border: 3px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 8px 20px rgba(255, 181, 34, 0.2);
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

  @media (max-width: 640px) {
    width: 104px;
    height: 104px;
    min-width: 104px;
    font-size: 1.7rem;
  }
`;

const ProfileInfo = styled.div`
  flex: 1;
  min-width: 0;

  h1 {
    margin: 0;
    font-size: clamp(2rem, 4vw, 3rem);
    line-height: 1.02;
    color: #2f2100;
  }
`;

const ProfileMainColumn = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
`;

const LevelInlineCard = styled.div`
  position: relative;
  border: 1px solid rgba(47, 33, 0, 0.1);
  border-radius: 14px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(255, 248, 229, 0.84)),
    radial-gradient(circle at 90% 15%, rgba(255, 203, 91, 0.24), transparent 48%);
  padding: 0.5rem 0.65rem 0.55rem;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    left: 0.4rem;
    top: 0.45rem;
    bottom: 0.45rem;
    width: 4px;
    border-radius: 999px;
    background: linear-gradient(180deg, #ffb522, #ffd978);
    opacity: 0.8;
  }

  > div {
    margin: 0;
    max-width: none;
    background: transparent;
    box-shadow: none;
    padding: 0.15rem 0.15rem 0.15rem 0.65rem;
  }

  > div h2 {
    margin: 0;
    font-size: 1rem;
    text-align: left;
    color: #2f2100;
    letter-spacing: 0.01em;
  }

  > div p {
    margin: 0.2rem 0 0;
    text-align: left;
    color: #5b4520;
    font-size: 0.92rem;
    line-height: 1.35;
  }

  > div p:last-child {
    font-size: 0.85rem;
    color: #6b5121;
  }

  > div > div {
    margin-top: 0.5rem;
    height: 12px;
    border-radius: 999px;
    background: rgba(47, 33, 0, 0.12);
  }

  > div > div > div {
    border-radius: 999px;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.25);
  }
`;

const ProfileActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;

  @media (max-width: 980px) {
    justify-content: stretch;
  }
`;

const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  grid-column: 1 / -1;
`;

const Chip = styled.span`
  background: rgba(47, 33, 0, 0.04);
  border: 1px solid rgba(47, 33, 0, 0.08);
  padding: 0.35rem 0.8rem;
  border-radius: 999px;
  font-size: 0.9rem;
  color: #5b4520;
`;

const SettingsButton = styled.button`
  background: #ffb522;
  color: #2f2100;
  border: 1px solid rgba(255, 181, 34, 0.5);
  border-radius: 999px;
  padding: 0.65rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(255, 181, 34, 0.22);
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
  &:hover {
    background: #ffc34a;
    box-shadow: 0 8px 18px rgba(255, 181, 34, 0.28);
  }

  @media (max-width: 900px) {
    width: 100%;
  }
`;

const InviteCard = styled.div`
  background: rgba(255, 247, 230, 0.94);
  border: 1px solid rgba(255, 181, 34, 0.2);
  box-shadow: 0 10px 24px rgba(28, 20, 0, 0.05);
  padding: 1.5rem;
  border-radius: 18px;
  margin-top: 1.5rem;
  color: #2f2100;

  h3 {
    margin: 0 0 0.75rem;
    color: #2f2100;
  }
`;

const UnifiedTabBar = styled.div`
  display: flex;
  gap: 0.65rem;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 1.6rem;
  margin-bottom: 0.3rem;
`;

const UnifiedTabButton = styled.button`
  border: 1px solid ${({ active }) => (active ? 'rgba(255, 181, 34, 0.65)' : 'rgba(47, 33, 0, 0.12)')};
  background: ${({ active }) => (active ? 'rgba(255, 181, 34, 0.2)' : 'rgba(255,255,255,0.92)')};
  color: #2f2100;
  border-radius: 999px;
  font-size: 0.9rem;
  font-weight: 700;
  padding: 0.45rem 0.95rem;
  min-width: 120px;
  cursor: pointer;
  text-align: center;
`;

const AwardsCard = styled.div`
  margin-top: 2rem;
  background: rgba(255, 252, 243, 0.94);
  border: 1px solid rgba(47, 33, 0, 0.08);
  border-radius: 18px;
  box-shadow: 0 10px 28px rgba(28, 20, 0, 0.08);
  padding: 1rem;
`;

const AwardsFooterActions = styled.div`
  margin-top: 0.85rem;
  display: flex;
  justify-content: center;
  gap: 0.6rem;
  flex-wrap: wrap;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;

  h2, h3 {
    margin: 0;
    color: #2f2100;
  }

  span {
    color: rgba(47, 33, 0, 0.62);
    font-size: 0.9rem;
  }
`;

const StatsArea = styled.section`
  margin-bottom: 2.5rem;
  margin-top: 2rem;
`;

const HighlightGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
  margin-bottom: 2rem;
`;

const HighlightCard = styled.div`
  background: rgba(255, 252, 243, 0.94);
  border-radius: 16px;
  padding: 1.2rem 1rem 1.1rem;
  text-align: center;
  border: 1px solid rgba(47, 33, 0, 0.08);
  box-shadow: 0 8px 22px rgba(28, 20, 0, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;

  h3 {
    margin: 0.35rem 0 0;
    color: #6b5327;
    font-size: 0.95rem;
    min-height: 1.35rem;
    white-space: nowrap;
  }

  strong {
    display: block;
    font-size: 2rem;
    margin-top: 0.5rem;
    color: #2f2100;
  }

  small {
    color: rgba(47, 33, 0, 0.55);
  }

  @media (max-width: 520px) {
    h3 {
      white-space: normal;
      min-height: auto;
    }
  }
`;

const StatIconWrap = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: ${({ $tone }) =>
    $tone === 'active'
      ? 'rgba(34, 197, 94, 0.2)'
      : $tone === 'at_risk'
        ? 'rgba(248, 113, 113, 0.2)'
        : $tone === 'none'
          ? 'rgba(148, 163, 184, 0.25)'
          : 'rgba(255, 181, 34, 0.22)'};
  color: ${({ $tone }) =>
    $tone === 'active'
      ? '#15803d'
      : $tone === 'at_risk'
        ? '#b91c1c'
        : $tone === 'none'
          ? '#64748b'
          : '#7d4b00'};
  border: 1px solid ${({ $tone }) =>
    $tone === 'active'
      ? 'rgba(21, 128, 61, 0.35)'
      : $tone === 'at_risk'
        ? 'rgba(185, 28, 28, 0.35)'
        : $tone === 'none'
          ? 'rgba(100, 116, 139, 0.35)'
          : 'rgba(255, 181, 34, 0.35)'};
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
`;

const ContentCard = styled.div`
  background: rgba(255, 252, 243, 0.94);
  border-radius: 18px;
  padding: 1.5rem;
  border: 1px solid rgba(47, 33, 0, 0.08);
  box-shadow: 0 10px 28px rgba(28, 20, 0, 0.08);
`;

const CardTitle = styled.h3`
  margin: 0 0 0.25rem;
  color: #2f2100;
`;

const CardSubtitle = styled.p`
  margin: 0 0 1rem;
  color: rgba(47, 33, 0, 0.65);
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
  background: rgba(47, 33, 0, 0.06);
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
  border-bottom: 1px solid rgba(47, 33, 0, 0.08);
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
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid rgba(47, 33, 0, 0.08);
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
  background: rgba(255, 252, 243, 0.95);
  border: 1px solid rgba(47, 33, 0, 0.08);
  cursor: pointer;
  transition: box-shadow 0.2s ease;

  &:hover {
    box-shadow: 0 6px 14px rgba(28, 20, 0, 0.08);
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
  color: rgba(47, 33, 0, 0.62);
`;

const FlavorDetailSub = styled.div`
  font-size: 0.8rem;
  color: rgba(47, 33, 0, 0.58);
  margin-top: 0.25rem;
`;

const FlavorDetailNote = styled.p`
  margin: 0;
  font-size: 0.85rem;
  color: rgba(47, 33, 0, 0.62);
`;

const RankingMeta = styled.span`
  font-size: 0.85rem;
  color: rgba(47, 33, 0, 0.62);
`;

const ListToggle = styled.button`
  margin-top: 0.75rem;
  background: none;
  border: none;
  color: #8a5700;
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
  background: rgba(24, 17, 0, 0.38);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalCard = styled.div`
  background: rgba(255, 252, 243, 0.98);
  border-radius: 18px;
  max-width: 640px;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(47, 33, 0, 0.08);
  box-shadow: 0 20px 60px rgba(28, 20, 0, 0.2);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(47, 33, 0, 0.08);

  h3 {
    margin: 0;
    color: #2f2100;
  }
`;

const CloseModalButton = styled.button`
  border: 1px solid rgba(47, 33, 0, 0.08);
  background: rgba(255, 255, 255, 0.6);
  font-size: 1.5rem;
  cursor: pointer;
  line-height: 1;
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  color: #5b4520;
`;

const ModalBody = styled.div`
  padding: 1rem 1.5rem 1.5rem;
  overflow-y: auto;
`;

const EmptyState = styled.p`
  margin: 0.5rem 0 0;
  color: rgba(47, 33, 0, 0.55);
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
  border: 1px solid ${(props) => (props.active ? 'rgba(255,181,34,0.45)' : 'rgba(47,33,0,0.08)')};
  border-radius: 999px;
  padding: 0.4rem 1rem;
  font-size: 0.9rem;
  cursor: pointer;
  background: ${(props) => (props.active ? 'rgba(255, 181, 34, 0.18)' : 'rgba(255,255,255,0.75)')};
  color: ${(props) => (props.active ? '#7a4a00' : '#5b4520')};
  font-weight: 700;
`;

const ActivityTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-top: 1rem;
  border: 1px solid rgba(47, 33, 0, 0.08);
  border-radius: 14px;
  overflow: hidden;

  th, td {
    padding: 0.6rem 0.7rem;
    text-align: left;
  }

  th {
    color: #5f3f00;
    font-size: 0.85rem;
    background: rgba(255, 252, 243, 0.98);
    border-bottom: 1px solid rgba(47, 33, 0, 0.08);
  }

  tbody tr:nth-child(even) {
    background: rgba(255, 255, 255, 0.55);
  }

  tbody tr:nth-child(odd) {
    background: rgba(255, 252, 243, 0.45);
  }

  td {
    border-bottom: 1px solid rgba(47, 33, 0, 0.06);
    color: #2f2100;
  }

  tbody tr:last-child td {
    border-bottom: none;
  }
`;

const TabContent = styled.div`
  margin-top: 1rem;
  background: rgba(255, 252, 243, 0.94);
  border: 1px solid rgba(47, 33, 0, 0.08);
  border-radius: 18px;
  box-shadow: 0 10px 28px rgba(28, 20, 0, 0.08);
  padding: 1rem;
`;

const LoadMoreButton = styled.button`
  display: block;
  margin: 1rem auto;
  padding: 0.5rem 1rem;
  background-color: #ffb522;
  color: #2f2100;
  border: 1px solid rgba(255, 181, 34, 0.5);
  border-radius: 10px;
  font-size: 0.95rem;
  cursor: pointer;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(255, 181, 34, 0.22);
  transition: background-color 0.2s, box-shadow 0.2s;

  &:hover {
    background-color: #ffc34a;
    box-shadow: 0 8px 18px rgba(255, 181, 34, 0.28);
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
  min-width: min(100%, 200px);
  padding: 0.5rem;
  border-radius: 10px;
  border: 1px solid rgba(47, 33, 0, 0.14);
  background: rgba(255,255,255,0.95);
  font-family: monospace;
`;

const CopyButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: #ffb522;
  color: #2f2100;
  border: 1px solid rgba(255, 181, 34, 0.45);
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
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
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  }

  @media (max-width: 520px) {
    grid-template-columns: repeat(2, minmax(140px, 1fr));
  }
`;

const AWARD_SHIMMER_KEYFRAMES = `
  @keyframes awardShimmerSweep {
    0% { transform: translateX(-140%) skewX(-18deg); opacity: 0; }
    18% { opacity: 0.22; }
    45% { opacity: 0.52; }
    100% { transform: translateX(220%) skewX(-18deg); opacity: 0; }
  }

  @keyframes awardShimmerSweepSecondary {
    0% { transform: translateX(-180%) skewX(16deg); opacity: 0; }
    28% { opacity: 0.12; }
    52% { opacity: 0.3; }
    100% { transform: translateX(240%) skewX(16deg); opacity: 0; }
  }
`;

const AwardCard = styled.div`
  background-color: rgba(255, 252, 243, 0.95);
  border-radius: 14px;
  border: 1px solid rgba(47, 33, 0, 0.08);
  box-shadow: 0 8px 20px rgba(28, 20, 0, 0.06);
  padding: 16px;
  text-align: center;
  position: relative;
  overflow: hidden;
`;

const AwardImage = styled.img`
  width: 100%;
  max-width: 140px;
  height: 140px;
  object-fit: contain;
  position: relative;
  z-index: 1;
  transition: filter 220ms ease;
  ${({ $epicTier }) => $epicTier !== 'base' && `
    filter: drop-shadow(0 0 12px rgba(255, 214, 122, 0.34)) saturate(1.06) contrast(1.03);
  `}
  ${({ $epicTier }) => $epicTier === 'legendary' && `
    filter: drop-shadow(0 0 18px rgba(255, 197, 86, 0.44)) drop-shadow(0 0 28px rgba(255, 176, 58, 0.18)) saturate(1.12) contrast(1.05);
  `}
  ${({ $epicTier }) => $epicTier === 'mythic' && `
    filter: drop-shadow(0 0 24px rgba(255, 196, 92, 0.52)) drop-shadow(0 0 44px rgba(255, 166, 48, 0.28)) brightness(1.08) saturate(1.18) contrast(1.08);
  `}

  ${AWARD_SHIMMER_KEYFRAMES}
`;

const AwardImageButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  border: none;
  background: transparent;
  padding: 0;
  cursor: zoom-in;
  border-radius: 8px;
  position: relative;
  overflow: hidden;

  &::after {
    content: "";
    position: absolute;
    inset: -18%;
    pointer-events: none;
    opacity: ${({ $epicTier }) => ($epicTier === 'base' ? 0 : 1)};
    background: linear-gradient(
      105deg,
      transparent 0%,
      transparent 30%,
      rgba(255, 255, 255, ${({ $epicTier }) => ($epicTier === 'mythic' ? 0.22 : $epicTier === 'legendary' ? 0.14 : 0.1)}) 42%,
      rgba(255, 246, 205, ${({ $epicTier }) => ($epicTier === 'mythic' ? 0.96 : $epicTier === 'legendary' ? 0.8 : 0.58)}) 50%,
      rgba(255, 255, 255, ${({ $epicTier }) => ($epicTier === 'mythic' ? 0.3 : $epicTier === 'legendary' ? 0.18 : 0.12)}) 58%,
      transparent 66%,
      transparent 100%
    );
    animation: ${({ $epicTier }) =>
      $epicTier === 'base'
        ? 'none'
        : $epicTier === 'mythic'
          ? 'awardShimmerSweep 2.7s linear infinite'
          : $epicTier === 'legendary'
            ? 'awardShimmerSweep 3.2s linear infinite'
            : 'awardShimmerSweep 4.2s linear infinite'};
  }

  &::before {
    content: "";
    position: absolute;
    inset: -22%;
    pointer-events: none;
    opacity: ${({ $epicTier }) => ($epicTier === 'mythic' ? 1 : 0)};
    background:
      linear-gradient(
        72deg,
        transparent 0%,
        transparent 40%,
        rgba(255, 255, 255, 0.14) 47%,
        rgba(255, 230, 160, 0.44) 52%,
        rgba(255, 255, 255, 0.08) 58%,
        transparent 68%,
        transparent 100%
      );
    animation: ${({ $epicTier }) => ($epicTier === 'mythic' ? 'awardShimmerSweepSecondary 1.9s linear infinite' : 'none')};
  }
`;

const AwardTitle = styled.h3`
  font-weight: 600;
  color: #2f2100;
`;

const AwardDescription = styled.p`
  font-size: 0.875rem;
  color: rgba(47, 33, 0, 0.62);
  margin-top: 4px;
`;

const AwardDate = styled.span`
  font-size: 0.75rem;
  color: rgba(47, 33, 0, 0.55);
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
  z-index: 4;
`;

const AwardLightboxOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 5000;
  background: rgba(0, 0, 0, 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
`;

const AwardLightboxCard = styled.div`
  position: relative;
  background: #ffffff;
  border-radius: 12px;
  padding: 0.9rem;
  max-width: min(92vw, 760px);
  max-height: 92vh;
  overflow: auto;
`;

const AwardLightboxImage = styled.img`
  display: block;
  max-width: 100%;
  max-height: min(62vh, 620px);
  width: 100%;
  height: auto;
  border-radius: 8px;
  object-fit: contain;
  position: relative;
  z-index: 1;
  transition: filter 220ms ease;
  ${({ $epicTier }) => $epicTier !== 'base' && `
    filter: drop-shadow(0 0 18px rgba(255, 214, 122, 0.36)) saturate(1.06) contrast(1.03);
  `}
  ${({ $epicTier }) => $epicTier === 'legendary' && `
    filter: drop-shadow(0 0 24px rgba(255, 197, 86, 0.46)) drop-shadow(0 0 34px rgba(255, 176, 58, 0.2)) saturate(1.12) contrast(1.05);
  `}
  ${({ $epicTier }) => $epicTier === 'mythic' && `
    filter: drop-shadow(0 0 30px rgba(255, 196, 92, 0.56)) drop-shadow(0 0 56px rgba(255, 166, 48, 0.3)) brightness(1.1) saturate(1.2) contrast(1.08);
  `}

  ${AWARD_SHIMMER_KEYFRAMES}
`;

const AwardLightboxClose = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 3;
  border: none;
  border-radius: 8px;
  background: #111827;
  color: #fff;
  padding: 0.35rem 0.6rem;
  cursor: pointer;
`;

const AwardLightboxMeta = styled.div`
  margin-top: 0.85rem;
  color: #2f2100;
`;

const AwardLightboxTitle = styled.h3`
  margin: 0;
  padding-right: 4.8rem;
`;

const AwardLightboxDescription = styled.p`
  margin: 0.4rem 0 0;
  color: rgba(47, 33, 0, 0.72);
`;

const AwardLightboxFooter = styled.div`
  margin-top: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  color: rgba(47, 33, 0, 0.78);
  font-size: 0.9rem;
`;

const AvatarModalContent = styled.div`
  position: relative;
  background: rgba(255, 252, 243, 0.98);
  border-radius: 18px;
  border: 1px solid rgba(47, 33, 0, 0.08);
  padding: 2rem;
  max-width: 420px;
  width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
`;

const LargeAvatarImg = styled.img`
  max-width: 340px;
  max-height: 70vh;
  border-radius: 50%;
  box-shadow: 0 2px 16px rgba(0,0,0,0.10);
`;

const CloseAvatarModalButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255,255,255,0.8);
  color: #5b4520;
  border: 1px solid rgba(47, 33, 0, 0.08);
  border-radius: 50%;
  width: 2.2rem;
  height: 2.2rem;
  font-size: 1.5rem;
  font-weight: bold;
  cursor: pointer;
  z-index: 2;
  &:hover {
    background: rgba(255, 181, 34, 0.12);
  }
`;
