import Header from './../Header';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';
import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useUser } from "../context/UserContext";
import CheckinCard from "../components/CheckinCard";
import ReviewCard from "../components/ReviewCard";
import GroupCheckinCard from '../components/GroupCheckinCard';
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import RouteCard from '../components/RouteCard';
import ShopCard from '../components/ShopCard';
import useStreakStatus from '../hooks/useStreakStatus';
import { AvatarBadgeFrame, LevelBadge } from '../components/ProfileProgress';
import StreakOverview from '../components/StreakOverview';
import { Button, ChallengeDialog } from '../components/ChallengeUI';
import UserSettings from './UserSettings';
import SystemModal from '../components/SystemModal';
import { notifyNotificationsChanged } from '../utils/systemMessages';
import MentionInviteModal from '../components/MentionInviteModal';
import { Sparkles, Calendar, MapPin, IceCream, Heart, SlidersHorizontal, Settings, UserPlus, Activity, Trophy, ChartNoAxesCombined, Instagram } from 'lucide-react';
import { getActiveAwardEffectTier } from '../shared/awardEffects';
import { getAwardIconSources, handleAwardIconFallback } from '../utils/awardIcons';
import { groupActivities } from '../utils/activityFeed';

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const ASSET_BASE = (import.meta.env.VITE_ASSET_BASE_URL || "https://ice-app.de/").replace(/\/+$/, "");
const TRAVEL_COLORS = ["#ffb522", "#ff8a00", "#ff595e", "#8ac926", "#33658a", "#6a4c93", "#1982c4", "#6f2dbd"];
const PROFILE_TABS = ['feed', 'awards', 'stats'];
const buildAssetUrl = (path) => (path ? `${ASSET_BASE}/${path.replace(/^\/+/, "")}` : null);
function UserSite() {
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const { userId: userIdFromUrl } = useParams();
  const { userId: userIdFromContext } = useUser();
  const viewerUserId = userIdFromContext || (typeof window !== 'undefined' ? localStorage.getItem('userId') : null);
  const [activeTab, setActiveTab] = useState('feed');
  const finalUserId = userIdFromUrl || userIdFromContext;
  const progress = useStreakStatus(finalUserId, viewerUserId);
  const isOwnProfile = Boolean(finalUserId && viewerUserId && String(progress?.user_id ?? finalUserId) === String(viewerUserId));
  const [showToast, setShowToast] = useState(false);
  const [copyError, setCopyError] = useState(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const [awardPage, setAwardPage] = useState(1);
  const [awardColumns, setAwardColumns] = useState(1);
  const [profileActivities, setProfileActivities] = useState([]);
  const [profileFeedLoading, setProfileFeedLoading] = useState(false);
  const [profileFeedLoadingMore, setProfileFeedLoadingMore] = useState(false);
  const [profileFeedError, setProfileFeedError] = useState(null);
  const [profileFeedNextOffset, setProfileFeedNextOffset] = useState(0);
  const [profileFeedHasMore, setProfileFeedHasMore] = useState(false);
  const [showFeedFilters, setShowFeedFilters] = useState(false);
  const [profileFeedFilters, setProfileFeedFilters] = useState({
    checkin: true,
    bewertung: true,
    route: true,
    eisdiele: true,
  });
  const [showSettings, setShowSettings] = useState(false);
  const [systemModal, setSystemModal] = useState({ isOpen: false, title: "", message: "" });
  const [systemReadError, setSystemReadError] = useState('');
  const [mentionModal, setMentionModal] = useState({ isOpen: false, data: null });
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
  const [awardsGridElement, setAwardsGridElement] = useState(null);
  const userDataRequestRef = useRef(0);
  const PROFILE_156_SCAN_CODE = '3cb55cb87747d1ed4069e612cef2e75d';
  const [selectedAward, setSelectedAward] = useState(null);

  useEffect(() => {
    setShowInviteDialog(false);
    setShowToast(false);
    setCopyError(null);
  }, [finalUserId]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('openSettings') === '1') {
      if (isOwnProfile) {
        setShowSettings(true);
      } else {
        setShowSettings(false);
        params.delete('openSettings');
        params.delete('openDelete');
        navigate(
          {
            pathname: location.pathname,
            search: params.toString() ? `?${params.toString()}` : '',
          },
          { replace: true }
        );
      }
    }
    const requestedTab = params.get('tab');
    setActiveTab(PROFILE_TABS.includes(requestedTab) ? requestedTab : 'feed');
  }, [isOwnProfile, location.pathname, location.search, navigate]);

  const selectProfileTab = index => {
    const tab = PROFILE_TABS[index];
    setActiveTab(tab);
    const params = new URLSearchParams(location.search);
    if (tab === 'feed') params.delete('tab'); else params.set('tab', tab);
    navigate({ pathname: location.pathname, search: params.toString() ? `?${params}` : '' });
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const systemmeldungId = params.get('systemmeldungId');
    const mentionNotificationId = params.get('mentionNotificationId');
    const notificationId = params.get('notificationId');

    let cancelled = false;
    if (systemmeldungId && viewerUserId) {
      fetch(`${API_BASE}/systemmeldung.php?action=get&id=${systemmeldungId}`)
        .then(async res => {
          const json = await res.json();
          if (!res.ok || json.status !== 'success') throw new Error(json.message || 'Systemmeldung nicht verfügbar.');
          return json;
        })
        .then((json) => {
          if (!cancelled && json.status === 'success') {
            setSystemModal({
              isOpen: true,
              title: json.systemmeldung.titel,
              message: json.systemmeldung.nachricht,
              linkUrl: json.systemmeldung.link_url,
              linkLabel: json.systemmeldung.link_label,
              notificationId: Number(json.systemmeldung.notification_id),
            });
          }
        })
        .catch((error) => {
          if (!cancelled) setSystemModal({ isOpen: true, title: 'Systemmeldung nicht verfügbar', message: error.message, notificationId: null });
        });
    }

    if (mentionNotificationId && viewerUserId) {
      fetch(`${API_BASE}/benachrichtigungen.php?action=get&id=${mentionNotificationId}&nutzer_id=${viewerUserId}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.status !== 'success' || !json.notification) return;
          const data = JSON.parse(json.notification.zusatzdaten || '{}');
          setMentionModal({
            isOpen: true,
            data: {
              checkinId: data.checkin_id,
              shopId: data.shop_id,
              inviterName: data.username || 'Unbekannt',
              shopName: data.shop_name || data.shop || 'Eisdiele',
              date: json.notification.erstellt_am,
              userId: viewerUserId,
            },
          });
          if (notificationId) {
            fetch(`${API_BASE}/benachrichtigungen.php?action=markAsRead`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: Number(notificationId), nutzer_id: Number(viewerUserId) }),
            }).catch(() => {});
          }
        })
        .catch((error) => {
          console.error('Mention-Benachrichtigung konnte nicht geladen werden', error);
        });
    }
    return () => { cancelled = true; };
  }, [location.search, viewerUserId]);

  useEffect(() => {
    if (!systemModal.isOpen || !systemModal.notificationId || !viewerUserId) return;
    setSystemReadError('');
    fetch(`${API_BASE}/benachrichtigungen.php?action=markAsRead`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: systemModal.notificationId }),
    }).then(async response => {
      const data = await response.json();
      if (!response.ok || data.status !== 'success') throw new Error('Lesestatus konnte nicht gespeichert werden.');
      notifyNotificationsChanged();
    }).catch(error => setSystemReadError(error.message));
  }, [systemModal.isOpen, systemModal.notificationId, viewerUserId]);

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

  const loadMoreAwards = () => setAwardPage((prev) => prev + 1);

  const fetchUserData = async (userIdToLoad, signal) => {
    const requestId = userDataRequestRef.current + 1;
    userDataRequestRef.current = requestId;

    try {
      setLoading(true);
      const response = await fetch(
        `${apiUrl}/get_user_stats.php?nutzer_id=${userIdToLoad}`,
        { signal }
      );
      if (!response.ok) throw new Error("Fehler beim Abruf der Daten");
      const json = await response.json();
      if (requestId !== userDataRequestRef.current) return;
      setData(json);
      setError(null);
      setLoading(false);
    } catch (err) {
      if (err.name === 'AbortError' || requestId !== userDataRequestRef.current) return;
      setError(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!finalUserId) return;
    const controller = new AbortController();
    fetchUserData(finalUserId, controller.signal);
    return () => controller.abort();
  }, [finalUserId, viewerUserId]);

  const fetchProfileActivities = async (append = false, signal) => {
    if (!finalUserId) return;
    const currentOffset = append ? profileFeedNextOffset : 0;
    append ? setProfileFeedLoadingMore(true) : setProfileFeedLoading(true);
    if (!append) setProfileFeedError(null);

    try {
      const params = new URLSearchParams({
        profile_user_id: String(finalUserId),
        limit: '20',
        offset: String(currentOffset),
      });
      const response = await fetch(`${apiUrl}/user_activity_feed.php?${params.toString()}`, { signal });
      if (!response.ok) throw new Error('Aktivitäten konnten nicht geladen werden.');
      const json = await response.json();
      const incoming = Array.isArray(json.activities) ? json.activities : [];
      setProfileActivities((previous) => append ? [...previous, ...incoming] : incoming);
      setProfileFeedNextOffset(Number(json.meta?.next_offset || currentOffset + incoming.length));
      setProfileFeedHasMore(Boolean(json.meta?.has_more));
      setProfileFeedError(null);
    } catch (err) {
      if (err.name !== 'AbortError') setProfileFeedError(err);
    } finally {
      if (!signal?.aborted) {
        append ? setProfileFeedLoadingMore(false) : setProfileFeedLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!finalUserId) return undefined;
    const controller = new AbortController();
    setProfileActivities([]);
    setProfileFeedNextOffset(0);
    setProfileFeedHasMore(false);
    fetchProfileActivities(false, controller.signal);
    return () => controller.abort();
  }, [finalUserId, viewerUserId]);

  useEffect(() => {
    const grid = awardsGridElement;
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
  }, [awardsGridElement]);

  const refreshUser = () => {
    fetchUserData(finalUserId);
    fetchProfileActivities();
  };
  const copyToClipboard = async (text) => {
    setCopyError(null);
    try {
      await navigator.clipboard.writeText(text);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
    } catch (err) {
      setShowToast(false);
      setCopyError('Der Link konnte nicht kopiert werden. Du kannst ihn im Feld auswählen und kopieren.');
    }
  };

  const awards = data?.user_awards || [];
  const awardsBatchSize = Math.max(awardColumns * 2, 1);
  const routeFocusParams = new URLSearchParams(location.search);
  const focusRouteId = routeFocusParams.get('focusRoute');
  const focusCommentId = routeFocusParams.get('focusComment');
  const displayedAwards = awards.slice(0, awardPage * awardsBatchSize);
  const groupedProfileActivities = useMemo(() => groupActivities(profileActivities), [profileActivities]);
  const visibleProfileActivities = useMemo(() => groupedProfileActivities.filter((activity) => {
    if (activity.typ === 'group_checkin') return profileFeedFilters.checkin;
    return profileFeedFilters[activity.typ] !== false;
  }), [groupedProfileActivities, profileFeedFilters]);
  const activeProfileFeedFilterCount = Object.values(profileFeedFilters).filter(Boolean).length;
  const toggleProfileFeedFilter = (type) => {
    setProfileFeedFilters((previous) => ({ ...previous, [type]: !previous[type] }));
  };
  const totalIcePortions = data ? (Number(data.eisarten?.Kugel || 0) + Number(data.eisarten?.Softeis || 0) + Number(data.eisarten?.Eisbecher || 0)) : 0;
  const visibleStreaks = progress?.streaks || data?.streaks;
  const levelInfo = progress?.level_info || data?.level_info;
  const isHighestLevel = levelInfo?.ep_to_next === null;
  const levelPercent = isHighestLevel ? 100 : Math.max(0, Math.min(100, Number(levelInfo?.percent_to_next) || 0));
  const portionBreakdown = [
    { key: 'Kugel', label: 'Kugeleis', value: Number(data?.eisarten?.Kugel || 0) },
    { key: 'Softeis', label: 'Softeis', value: Number(data?.eisarten?.Softeis || 0) },
    { key: 'Eisbecher', label: 'Eisbecher', value: Number(data?.eisarten?.Eisbecher || 0) }
  ];
  const maxPortionValue = Math.max(1, ...portionBreakdown.map((item) => item.value));
  const epBreakdown = data?.ep_breakdown || null;
  const epBreakdownTotal = Math.max(1, Number(epBreakdown?.ep_gesamt || 0));
  const epBreakdownRows = epBreakdown ? [
    { key: 'ep_checkins_ohne_bild', label: 'Check-ins ohne Bild' },
    { key: 'ep_checkins_mit_bild', label: 'Check-ins mit Bild' },
    { key: 'ep_bewertungen', label: 'Bewertungen' },
    { key: 'ep_preismeldungen', label: 'Preismeldungen' },
    { key: 'ep_routen', label: 'Routen' },
    { key: 'ep_awards', label: 'Awards' },
    { key: 'ep_eisdielen', label: 'Eisdielen' },
    { key: 'ep_geworbene_nutzer', label: 'Geworbene Nutzer' },
    { key: 'ep_pflege', label: 'Pflegeaufgaben' }
  ].map((item) => ({
    ...item,
    value: Number(epBreakdown[item.key] || 0)
  })) : [];
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

  const getActivityRegionLabel = (item) =>
    item.land || item.bundesland || item.landkreis || 'Unbekannt';

  const getActivityRegionPath = (item) => {
    if (item.landkreis_id) {
      return `/region/landkreis/${item.landkreis_id}`;
    }
    if (item.bundesland_id) {
      return `/region/bundesland/${item.bundesland_id}`;
    }
    return null;
  };

  const renderActivityRegionName = (item) => {
    const label = getActivityRegionLabel(item);
    const path = getActivityRegionPath(item);

    if (!path) {
      return label;
    }

    return <ActivityRegionLink to={path}>{label}</ActivityRegionLink>;
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
          <tr key={`${getActivityRegionLabel(item)}-${index}`}>
            <td>{renderActivityRegionName(item)}</td>
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
    const routeId = params.get('focusRoute');
    if (activeTab === 'feed' && routeId) {
      const isLoaded = profileActivities.some((activity) => activity.typ === 'route' && String(activity.id) === String(routeId));
      if (!isLoaded && profileFeedHasMore && !profileFeedLoadingMore) {
        fetchProfileActivities(true);
        return;
      }
      setTimeout(() => {
        if (routeRefs.current[routeId]) {
          routeRefs.current[routeId].scrollIntoView({ behavior: 'smooth', block: 'center' });
          const newParams = new URLSearchParams(location.search);
          newParams.delete('focusRoute');
          newParams.delete('focusComment');
          newParams.delete('tab');
          const newUrl = `${location.pathname}${newParams.toString() ? '?' + newParams.toString() : ''}`;
          window.history.replaceState({}, '', newUrl);
        }
      }, 300);
    }
  }, [activeTab, location.pathname, location.search, profileActivities, profileFeedHasMore, profileFeedLoadingMore]);

  const handleAvatarUpdated = (newPath) => {
    setData((prev) => (prev ? { ...prev, avatar_url: newPath } : prev));
  };
  const systemMessageOverlay = <SystemModal
    isOpen={systemModal.isOpen}
    onClose={() => setSystemModal(prev => ({ ...prev, isOpen: false }))}
    title={systemModal.title} message={systemModal.message}
    linkUrl={systemModal.linkUrl} linkLabel={systemModal.linkLabel}
    statusMessage={systemReadError}
  />;
  if (loading) {
    return (
      <FullPage>
        <Header />
        {systemMessageOverlay}
        <WhiteBackground>
          <DashboardWrapper>
            <LoadingCard>
              <h1>Nutzerseite</h1>
              <p>Profil wird geladen…</p>
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
        {systemMessageOverlay}
        <WhiteBackground>
          <DashboardWrapper>
            <LoadingCard>
              <h1>Nutzerseite</h1>
              <p>Das Profil konnte nicht geladen werden.</p><Button type="button" onClick={() => fetchUserData(finalUserId)}>Erneut versuchen</Button>
            </LoadingCard>
          </DashboardWrapper>
        </WhiteBackground>
      </FullPage>
    );
  }

  return (
    <FullPage>
      <Header />
      {systemMessageOverlay}
      <WhiteBackground>
        <DashboardWrapper>
            <ProfileHeader aria-label="Profilübersicht" $hasSeries={Boolean(visibleStreaks?.day && visibleStreaks?.week)}>
              <ProfileMainColumn>
                <ProfileIdentity>
                  <AvatarBadgeFrame>
                    <AvatarCircle type="button" disabled={!avatarUrl} aria-label={`Profilbild von ${data.nutzername} vergrößern`} onClick={() => setShowAvatarModal(true)}>
                      {avatarUrl ? <img src={avatarUrl} alt={`Avatar von ${data.nutzername}`} /> : <span>{userInitial}</span>}
                    </AvatarCircle>
                    <LevelBadge large level={levelInfo?.level} />
                  </AvatarBadgeFrame>
                  <ProfileInfo>
                    <ProfileEyebrow>{isOwnProfile ? 'Dein Eis-Profil' : 'Eis-Profil'}</ProfileEyebrow>
                    <h1>{data.nutzername}</h1>
                    <MetaRow>Mitglied seit <time dateTime={data.erstellungsdatum}>{new Date(data.erstellungsdatum).toLocaleDateString('de-DE', { month: 'short', year: 'numeric' })}</time></MetaRow>

                  </ProfileInfo>
                </ProfileIdentity>
                {levelInfo && <LevelInlineCard aria-label="Level und Fortschritt">
                  <LevelHeading><strong>Level {levelInfo.level} · {levelInfo.level_name}</strong><span>{Math.round(levelPercent)} %</span></LevelHeading>
                  <progress max="100" value={levelPercent} aria-label={isHighestLevel ? 'Höchstes Level erreicht' : 'Fortschritt zum nächsten Level'} />
                  <small>{levelInfo.ep_current} EP · {isHighestLevel ? 'Höchstes Level erreicht' : `Noch ${levelInfo.ep_to_next ?? 0} EP bis Level ${Number(levelInfo.level) + 1}`}</small>
                </LevelInlineCard>}
                {(isOwnProfile || data.instagram_account || data.strava_account) && <ProfileActions aria-label="Profilaktionen">
                  {isOwnProfile && <>
                    <SettingsButton type="button" aria-label="Profil bearbeiten" title="Profil bearbeiten" onClick={() => setShowSettings(true)}><Settings size={18} aria-hidden="true" /><span>Profil bearbeiten</span></SettingsButton>
                    <FavoriteSocialLink to="/favoriten" aria-label="Favoriten verwalten" title="Favoriten verwalten"><Heart size={18} aria-hidden="true" /><span>Favoriten</span></FavoriteSocialLink>
                    {data.invite_code && <InviteButton type="button" data-invite-trigger aria-haspopup="dialog" aria-expanded={showInviteDialog}
                      onClick={() => { setShowToast(false); setCopyError(null); setShowInviteDialog(true); }}>
                      <UserPlus size={18} aria-hidden="true" /><span>Freunde einladen</span>
                    </InviteButton>}
                  </>}
                    {(data.instagram_account || data.strava_account) && <React.Fragment>
                      {data.instagram_account && <SocialLink
                        href={/^https?:\/\//.test(data.instagram_account) ? data.instagram_account : `https://instagram.com/${data.instagram_account.replace('@', '')}`}
                        target="_blank" rel="noopener noreferrer" aria-label="Instagram Profil">
                        <Instagram size={20} aria-hidden="true" />
                      </SocialLink>}
                      {data.strava_account && <SocialLink
                        href={/^https?:\/\//.test(data.strava_account) ? data.strava_account : `https://www.strava.com/athletes/${data.strava_account}`}
                        target="_blank" rel="noopener noreferrer" aria-label="Strava Profil">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#df5b21" aria-hidden="true"><path d="m10 2 6 11H4Zm6 20 4-7h-8Z" /></svg>
                      </SocialLink>}
                    </React.Fragment>}
                </ProfileActions>}
              </ProfileMainColumn>
              {visibleStreaks?.day && visibleStreaks?.week && <ProfileSeries><StreakOverview streaks={visibleStreaks} own={isOwnProfile} embedded /></ProfileSeries>}
              <HighlightGrid aria-label="Profil auf einen Blick">
                <HighlightCard><StatIconWrap><Calendar size={16} aria-hidden="true" /></StatIconWrap><strong>{data.anzahl_checkins || 0}</strong><h3>Check-ins</h3></HighlightCard>
                <HighlightCard><StatIconWrap><MapPin size={16} aria-hidden="true" /></StatIconWrap><strong>{data.eisdielen_besucht || 0}</strong><h3>Eisdielen besucht</h3></HighlightCard>
                <HighlightCard><StatIconWrap><IceCream size={16} aria-hidden="true" /></StatIconWrap><strong>{totalIcePortions}</strong><h3>Portionen Eis</h3></HighlightCard>
              </HighlightGrid>
            </ProfileHeader>
            {showSettings && (
              <UserSettings
                onClose={() => setShowSettings(false)}
                currentAvatar={data.avatar_url}
                onAvatarUpdated={handleAvatarUpdated}
              />
            )}
            <MentionInviteModal
              open={mentionModal.isOpen}
              onClose={() => setMentionModal({ isOpen: false, data: null })}
              {...(mentionModal.data || {})}
            />
            <TabGroup selectedIndex={PROFILE_TABS.indexOf(activeTab)} onChange={selectProfileTab} manual>
              <UnifiedTabBar aria-label="Profilbereiche">
                <UnifiedTabButton><Activity size={18} aria-hidden="true" />Aktivitäten</UnifiedTabButton>
                <UnifiedTabButton><Trophy size={18} aria-hidden="true" />Erfolge<small>{awards.length}</small></UnifiedTabButton>
                <UnifiedTabButton><ChartNoAxesCombined size={18} aria-hidden="true" />Statistiken</UnifiedTabButton>
              </UnifiedTabBar>
              <TabPanels>
                <ProfileTabPanel>
              <FeedArea>
                <FeedHeading>
                  <h2>{isOwnProfile ? 'Deine Aktivitäten' : 'Aktivitäten'}</h2>
                  <FeedHeaderTools>
                    <FeedFilterToggle
                      type="button"
                      onClick={() => setShowFeedFilters((current) => !current)}
                      aria-expanded={showFeedFilters}
                      aria-controls="profile-feed-filters"
                    >
                      <SlidersHorizontal size={16} aria-hidden="true" />
                      Filter{activeProfileFeedFilterCount < 4 ? ` · ${activeProfileFeedFilterCount}/4` : ''}
                    </FeedFilterToggle>
                  </FeedHeaderTools>
                </FeedHeading>
                {showFeedFilters && (
                  <FeedFilterPanel id="profile-feed-filters" aria-label="Aktivitätstypen filtern">
                    <FeedFilterChip type="button" $active={profileFeedFilters.checkin} aria-pressed={profileFeedFilters.checkin} onClick={() => toggleProfileFeedFilter('checkin')}>Check-ins</FeedFilterChip>
                    <FeedFilterChip type="button" $active={profileFeedFilters.bewertung} aria-pressed={profileFeedFilters.bewertung} onClick={() => toggleProfileFeedFilter('bewertung')}>Bewertungen</FeedFilterChip>
                    <FeedFilterChip type="button" $active={profileFeedFilters.route} aria-pressed={profileFeedFilters.route} onClick={() => toggleProfileFeedFilter('route')}>Routen</FeedFilterChip>
                    <FeedFilterChip type="button" $active={profileFeedFilters.eisdiele} aria-pressed={profileFeedFilters.eisdiele} onClick={() => toggleProfileFeedFilter('eisdiele')}>Eisdielen</FeedFilterChip>
                  </FeedFilterPanel>
                )}
                {profileFeedLoading && visibleProfileActivities.length === 0 && (
                  <EmptyState>Aktivitäten werden geladen…</EmptyState>
                )}
                {profileFeedError && visibleProfileActivities.length === 0 && (
                  <EmptyState><strong>Die Aktivitäten konnten nicht geladen werden.</strong><p>Bitte versuche es noch einmal.</p><Button type="button" $secondary onClick={() => fetchProfileActivities(false)}>Erneut versuchen</Button></EmptyState>
                )}
                {!profileFeedLoading && !profileFeedError && visibleProfileActivities.length === 0 && (
                  <EmptyState><strong>{groupedProfileActivities.length ? 'Keine Aktivitäten für diese Auswahl.' : isOwnProfile ? 'Dein nächster Eis-Moment wartet.' : 'Hier gibt es noch keine Aktivitäten.'}</strong><p>{groupedProfileActivities.length ? 'Wähle andere Filter, um mehr zu entdecken.' : 'Check-ins, Bewertungen, Routen und neue Eis-Orte erscheinen hier.'}</p>{groupedProfileActivities.length > 0 && <Button type="button" $secondary onClick={() => setProfileFeedFilters({ checkin: true, bewertung: true, route: true, eisdiele: true })}>Filter zurücksetzen</Button>}</EmptyState>
                )}
                <FeedList>
                  {visibleProfileActivities.map((activity) => {
                    const { typ, id, data: activityData } = activity;
                    switch (typ) {
                      case 'checkin':
                        return <CheckinCard key={`checkin-${id}`} checkin={activityData} onSuccess={refreshUser} />;
                      case 'group_checkin':
                        return <GroupCheckinCard key={id} checkins={activityData} onSuccess={refreshUser} />;
                      case 'bewertung':
                        return <ReviewCard key={`bewertung-${id}`} review={activityData} onSuccess={refreshUser} />;
                      case 'eisdiele':
                        return <ShopCard key={`eisdiele-${id}`} iceShop={activityData} onSuccess={refreshUser} />;
                      case 'route':
                        return (
                          <FocusedFeedItem
                            key={`route-${id}`}
                            ref={(element) => { routeRefs.current[id] = element; }}
                            data-focused={String(id) === String(focusRouteId)}
                          >
                            <RouteCard
                              route={activityData}
                              shopId={activityData.eisdielen?.[0]?.id || activityData.eisdiele_id}
                              shopName={activityData.eisdielen?.[0]?.name || activityData.eisdiele_name}
                              onSuccess={refreshUser}
                              showComments={String(id) === String(focusRouteId)}
                              focusCommentId={String(id) === String(focusRouteId) ? focusCommentId : null}
                            />
                          </FocusedFeedItem>
                        );
                      default:
                        return null;
                    }
                  })}
                </FeedList>
                {profileFeedHasMore && !profileFeedLoadingMore && (
                  <LoadMoreButton type="button" onClick={() => fetchProfileActivities(true)}>
                    Mehr laden
                  </LoadMoreButton>
                )}
                {profileFeedLoadingMore && <FeedLoadingMore>Weitere Aktivitäten werden geladen…</FeedLoadingMore>}
                {profileFeedError && visibleProfileActivities.length > 0 && (
                  <FeedLoadingMore $error>Weitere Aktivitäten konnten nicht geladen werden. <Button type="button" $secondary onClick={() => fetchProfileActivities(true)}>Erneut versuchen</Button></FeedLoadingMore>
                )}
              </FeedArea>
                </ProfileTabPanel>
                <ProfileTabPanel>
            <AwardsCard>
              <SectionHeader>
                <h2>{isOwnProfile ? 'Deine Auszeichnungen' : 'Auszeichnungen'}</h2>
                <span>{awards.length}</span>
              </SectionHeader>
              {displayedAwards.length ? (
                <AwardsGrid ref={setAwardsGridElement} role="list">
                  {displayedAwards.map((award, index) => {
                    const iconSources = getAwardIconSources(award?.icon_path, 512);
                    const epicTier = getActiveAwardEffectTier(award?.ep);

                    return (
                      <AwardCard key={index} role="listitem">
                        <EPBadge>{award.ep} EP <Sparkles size={16} style={{ marginLeft: 2, verticalAlign: 'bottom' }} /></EPBadge>
                        <AwardImageButton
                          $epicTier={epicTier}
                          type="button"
                          onClick={() => setSelectedAward({
                            src: iconSources.src || '',
                            fallbackSrc: iconSources.fallbackSrc || '',
                            title: award.title_de || 'Auszeichnung',
                            description: award.description_de || '',
                            ep: award.ep ?? 0,
                            epicTier,
                            awardedAt: award.awarded_at || null,
                          })}
                          aria-label={`Auszeichnung ${award.title_de || ''} groß anzeigen`}
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
                <EmptyState>Noch keine Auszeichnungen gesammelt.</EmptyState>
              )}
              {(displayedAwards.length < awards.length || awardPage > 1) && (
                <AwardsFooterActions>
                  {displayedAwards.length < awards.length && (
                    <LoadMoreButton onClick={loadMoreAwards}>Weitere Auszeichnungen</LoadMoreButton>
                  )}
                  {awardPage > 1 && (
                    <LoadMoreButton type="button" onClick={() => setAwardPage(1)}>
                      Weniger anzeigen
                    </LoadMoreButton>
                  )}
                </AwardsFooterActions>
              )}
            </AwardsCard>
                </ProfileTabPanel>
                <ProfileTabPanel>
          <StatsArea>
            <SectionHeader>
              <h2>{isOwnProfile ? 'Deine Eis-Statistik' : 'Eis-Statistik'}</h2>
              <span>Ein Überblick über die Eis-Abenteuer</span>
            </SectionHeader>
            {Number(viewerUserId) === 1 && epBreakdown && (
              <ContentGrid>
                <ContentCard>
                  <CardTitle>EP-Analyse (Admin)</CardTitle>
                  <CardSubtitle>Gesamt-EP: {Number(epBreakdown.ep_gesamt || 0)}</CardSubtitle>
                  {epBreakdownRows.map((item) => (
                    <PortionRow key={item.key}>
                      <span>{item.label}</span>
                      <PortionBar>
                        <PortionFill style={{ width: `${(item.value / epBreakdownTotal) * 100}%` }} />
                      </PortionBar>
                      <span>{item.value}</span>
                    </PortionRow>
                  ))}
                </ContentCard>
              </ContentGrid>
            )}
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
                          innerRadius="45%"
                          outerRadius="75%"
                          paddingAngle={2}
                          label={false}
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
                    {renderActivityTable(activityPreview)}
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
                </ProfileTabPanel>
              </TabPanels>
            </TabGroup>
        </DashboardWrapper>
      </WhiteBackground>
      <ChallengeDialog compact open={Boolean(showInviteDialog && isOwnProfile && data.invite_code)} onClose={() => setShowInviteDialog(false)} title="Freunde einladen">
        <InviteContent>
          <p>Teile deinen Einladungslink und sammle zusätzliche EP, wenn deine Freunde mitmachen.</p>
          <label htmlFor="profile-invite-link">Dein Einladungslink</label>
          <LinkContainer>
            <Input id="profile-invite-link" value={`https://ice-app.de/register/${data.invite_code || ''}`} readOnly onFocus={event => event.target.select()} />
            <CopyButton type="button" onClick={() => copyToClipboard(`https://ice-app.de/register/${data.invite_code}`)}>Link kopieren</CopyButton>
          </LinkContainer>
          {showToast && <Toast role="status">Einladungslink kopiert.</Toast>}
          {copyError && <CopyError role="alert">{copyError}</CopyError>}
        </InviteContent>
      </ChallengeDialog>
      <ChallengeDialog open={Boolean(listModal)} onClose={closeModal} title={listModal?.title || 'Übersicht'}>
        {listModal && renderModalContent()}
      </ChallengeDialog>
      <ChallengeDialog open={Boolean(showAvatarModal && avatarUrl)} onClose={() => setShowAvatarModal(false)} title={`Profilbild von ${data.nutzername}`}>
        <LargeAvatarImg src={avatarUrl || undefined} alt={`Avatar von ${data.nutzername}`} />
      </ChallengeDialog>
      <ChallengeDialog open={Boolean(selectedAward)} onClose={() => setSelectedAward(null)} title={selectedAward?.title || 'Auszeichnung'}>
        {selectedAward && <>
          <AwardLightboxImage $epicTier={selectedAward.epicTier || getActiveAwardEffectTier(selectedAward.ep)} src={selectedAward.src}
            data-fallback-src={selectedAward.fallbackSrc || ''} onError={handleAwardIconFallback} alt={selectedAward.title} />
          <AwardLightboxMeta>
            <AwardLightboxDescription>{selectedAward.description || 'Keine Beschreibung vorhanden.'}</AwardLightboxDescription>
            <AwardLightboxFooter><strong>{selectedAward.ep} EP</strong>
              {selectedAward.awardedAt && <span>Vergeben am {new Date(selectedAward.awardedAt).toLocaleDateString('de-DE')}</span>}
            </AwardLightboxFooter>
          </AwardLightboxMeta>
        </>}
      </ChallengeDialog>
    </FullPage>
  );
}

export default UserSite;

const FullPage = styled.div`
  display: flex; flex-direction: column; min-height: 100dvh; background: #fff8ec;
`;

const WhiteBackground = styled.div`
  width: 100%;
  background: transparent;
  flex: 1;
`;

const DashboardWrapper = styled.main`
  width: 100%; max-width: 1200px; margin: 0 auto; padding: 24px; color: #2f2100; box-sizing: border-box;
  *, *::before, *::after { box-sizing: border-box; }
  h1, h2, h3 { text-align: left; text-shadow: none; overflow-wrap: anywhere; }
  button, summary { min-height: 44px; }
  button:focus-visible, a:focus-visible, summary:focus-visible { outline: 3px solid #835500; outline-offset: 3px; }
  input, select, textarea { font-size: 16px; }
  @media(prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }
  @media(max-width: 767px) { padding: 16px; }
  @media(max-width: 359px) { padding: 12px; }
`;

const LoadingCard = styled.div`
  background: rgba(255, 252, 243, 0.96);
  padding: 2rem;
  border-radius: 18px;
  border: 1px solid rgba(47, 33, 0, 0.08);
  box-shadow: 0 10px 28px rgba(28, 20, 0, 0.08);
  color: #2f2100;
`;

const ProfileHeader = styled.section`
  display: grid; grid-template-columns: ${p => p.$hasSeries ? 'minmax(0, 1fr) 300px' : 'minmax(0, 1fr)'};
  align-items: center; gap: 20px 32px; padding: 24px; background: #fffdf8;
  border: 1px solid #eadfc9; border-radius: 20px; box-shadow: 0 4px 24px #2f210008;
  @media(min-width: 768px) and (max-width: 1023px) { grid-template-columns: ${p => p.$hasSeries ? 'minmax(0, 1fr) 260px' : 'minmax(0, 1fr)'}; column-gap: 20px; }
  @media(max-width: 767px) { grid-template-columns: minmax(0, 1fr); gap: 12px; padding: 16px; }
`;

const ProfileIdentity = styled.div`
  display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: 16px; min-width: 0;
  @media(max-width: 359px) { gap: 12px; }
`;

const AvatarCircle = styled.button`
  width: 96px; height: 96px; flex-shrink: 0; padding: 0; border: 3px solid #fff;
  border-radius: 50%; background: #ffe4b7; box-shadow: 0 3px 12px #a0650018;
  display: grid; place-items: center; color: #8c5300; font: inherit; font-size: 32px; font-weight: 750;
  overflow: hidden; cursor: zoom-in;
  &:disabled { cursor: default; }
  img { width: 100%; height: 100%; object-fit: cover; }
  @media(max-width: 767px) { width: 80px; height: 80px; }
  @media(max-width: 359px) { width: 60px; height: 60px; }
`;

const SocialLink = styled.a`
  display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px;
  border-radius: 12px; background: #fff5df; border: 1px solid #eadfc9;
  &:hover { background: #ffecc4; } img { display: block; }
`;

const ProfileInfo = styled.div`
  min-width: 0;
  h1 { margin: 4px 0 6px; font-size: clamp(24px, 3vw, 36px); line-height: 1.15; color: #2f2100; overflow-wrap: anywhere; }
  @media(max-width: 359px) { h1 { font-size: 20px; } }
`;

const ProfileMainColumn = styled.div`min-width: 0; display: flex; flex-direction: column; gap: 16px; @media(max-width: 767px) { gap: 12px; }`;

const LevelInlineCard = styled.div`
  display: grid; gap: 6px; padding: 10px 12px; border-radius: 12px; background: #fff6e3;
  small { color: #756951; font-size: 13px; line-height: 1.4; }
  progress { appearance: none; width: 100%; height: 8px; border: 0; border-radius: 99px; overflow: hidden; background: #eadfc9; accent-color: #efaa18; }
  progress::-webkit-progress-bar { background: #eadfc9; border-radius: 99px; }
  progress::-webkit-progress-value { background: #efaa18; border-radius: 99px; }
  progress::-moz-progress-bar { background: #efaa18; border-radius: 99px; }
`;

const ProfileActions = styled.div`
  display: flex; align-items: center; flex-wrap: wrap; gap: 8px;
  @media(max-width: 1023px) {
    > button:not([data-invite-trigger]), > a { width: 44px; padding: 0; }
    > button:not([data-invite-trigger]) span, > a span { display: none; }
  }
`;

const FavoriteSocialLink = styled(Link)`
  display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px;
  padding: 10px 12px; border-radius: 12px; border: 1px solid #e4d6ba; background: #fffdf8;
  color: #5a421b; font-size: 14px; font-weight: 650; text-decoration: none;
  &:hover { background: #fff3d9; }
`;

const MetaRow = styled.p`margin: 0; color: #756951; font-size: 13px; line-height: 1.5;`;

const SettingsButton = styled.button`
  display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px;
  padding: 10px 12px; border-radius: 12px; border: 1px solid #e4d6ba; background: #fffdf8;
  color: #5a421b; font: inherit; font-size: 14px; font-weight: 650; cursor: pointer;
  &:hover { background: #fff3d9; } svg { flex-shrink: 0; }
`;

const InviteButton = styled(SettingsButton)`
  background: #fff3d9; border-color: #e7c985; white-space: nowrap;
  &:hover { background: #ffe9bb; }
  @media(max-width: 359px) { padding: 10px 8px; font-size: 13px; }
`;

const UnifiedTabBar = styled(TabList)`
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 4px;
  margin: 16px 0; padding: 4px; border-radius: 14px; border: 1px solid #eadfc9; background: #fffdf8;
`;

const UnifiedTabButton = styled(Tab)`
  display: flex; align-items: center; justify-content: center; gap: 8px; min-width: 0; min-height: 48px;
  padding: 10px 8px; border: 0; border-radius: 10px; background: transparent; color: #756951;
  font: inherit; font-size: 15px; font-weight: 700; cursor: pointer;
  &[data-selected] { background: #ffbe35; color: #2f2100; }
  &:hover:not([data-selected]) { background: #fff3d9; }
  small { display: grid; place-items: center; min-width: 22px; height: 22px; padding: 0 4px; border-radius: 99px; background: #2f210014; font-size: 11px; }
  @media(max-width: 639px) { font-size: 13px; gap: 4px; svg { display: none; } }
  @media(max-width: 359px) { small { display: none; } }
`;

const AwardsCard = styled.section`
  padding: clamp(16px, 2vw, 24px); background: #fffdf8; border: 1px solid #eadfc9; border-radius: 18px;
  h2 { font-size: 21px; }
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

  @media (max-width: 620px) {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.5rem;
  }
`;

const FeedHeaderTools = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.55rem;
  flex-wrap: wrap;

  @media (max-width: 620px) {
    width: 100%;
    justify-content: space-between;
  }
`;

const FeedFilterToggle = styled.button`
  display: inline-flex; align-items: center; gap: 8px; min-height: 44px; min-width: 44px; padding: 10px 12px;
  border: 1px solid #e4d6ba; border-radius: 12px; background: #fff5df; color: #5a421b;
  font: inherit; font-size: 14px; font-weight: 650; cursor: pointer;
  &:hover { background: #ffecc4; }
`;

const FeedFilterPanel = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin: -0.35rem 0 0.8rem;
  padding: 0.65rem;
  border: 1px solid rgba(47, 33, 0, 0.07);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.42);
`;

const FeedFilterChip = styled.button`
  min-height: 44px; padding: 10px 12px; border: 1px solid ${p => p.$active ? '#edb449' : '#e4d6ba'};
  border-radius: 10px; background: ${p => p.$active ? '#fff0c7' : '#fffdf8'}; color: #5a421b;
  font: inherit; font-size: 14px; font-weight: 650; cursor: pointer;
`;

const StatsArea = styled.section`
  min-width: 0; h2 { font-size: 21px; } > :last-child { margin-bottom: 0; }
`;

const HighlightGrid = styled.div`
  grid-column: 1 / -1; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px; border-top: 1px solid #eadfc9; padding-top: 16px;
`;

const HighlightCard = styled.div`
  display: grid; justify-items: center; align-content: start; gap: 4px; text-align: center; min-width: 0;
  + & { border-left: 1px solid #eadfc9; }
  strong { font-size: 26px; line-height: 1.15; color: #2f2100; overflow-wrap: anywhere; }
  h3 { margin: 0; font-size: 13px; font-weight: 500; color: #756951; text-align: center; }
  @media(max-width: 639px) { > div { display: none; } strong { font-size: 23px; } }
`;

const StatIconWrap = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: ${({ $tone }) =>
    $tone === 'frozen' ? '#dceeff' : $tone === 'active'
      ? 'rgba(34, 197, 94, 0.2)'
      : $tone === 'at_risk'
        ? 'rgba(248, 113, 113, 0.2)'
        : $tone === 'none'
          ? 'rgba(148, 163, 184, 0.25)'
          : 'rgba(255, 181, 34, 0.22)'};
  color: ${({ $tone }) =>
    $tone === 'frozen' ? '#176bba' : $tone === 'active'
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
  display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr)); gap: 16px; margin-bottom: 16px;
`;

const ContentCard = styled.div`
  min-width: 0; padding: clamp(16px, 2vw, 24px); background: #fffdf8; border: 1px solid #eadfc9; border-radius: 18px;
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
  min-height: 44px;
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
  min-height: 44px;
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

const EmptyState = styled.div`
  margin: 8px 0 0; padding: 20px; border: 1px dashed #e4d6ba; border-radius: 14px; background: #fffaf0;
  color: #756951; line-height: 1.5; strong { color: #5a421b; } p { margin: 8px 0 0; } button { margin-top: 12px; }
`;

const ChartWrapper = styled.div`
  width: 100%;
  height: 300px;
`;

const ActivityTabs = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const ActivityTabButton = styled.button`
  min-height: 44px;
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

const ActivityRegionLink = styled(Link)`
  display: inline-flex; align-items: center; min-height: 44px; min-width: 44px; color: #7a4a00;
  font-weight: 700; text-decoration: none; overflow-wrap: anywhere;
  &:hover { text-decoration: underline; }
`;

const FeedArea = styled.section`
  min-width: 0; padding: clamp(16px, 2vw, 24px); background: #fffdf8; border: 1px solid #eadfc9; border-radius: 18px;
`;

const FeedList = styled.div`
  display: grid;
  gap: 0.75rem;
  min-width: 0;
`;

const FeedLoadingMore = styled.p`
  margin: 1rem 0;
  color: ${({ $error }) => ($error ? '#b23a2d' : '#6b5327')};
  text-align: center;
  font-size: 0.9rem;
  font-weight: 700;
`;

const FocusedFeedItem = styled.div`
  border-radius: 22px;
  transition: box-shadow 0.25s ease, background 0.25s ease;

  &[data-focused="true"] {
    background: rgba(255, 181, 34, 0.12);
    box-shadow: 0 0 0 3px rgba(255, 181, 34, 0.34);
  }
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

const LinkContainer = styled.div`display: flex; align-items: stretch; flex-wrap: wrap; gap: 8px; margin-top: 8px;`;

const Input = styled.input`
  flex: 1; min-width: min(100%, 200px); width: 100%; min-height: 44px; padding: 10px 12px;
  border-radius: 10px; border: 1px solid #e4d6ba; background: #fff; font: inherit; font-size: 16px; color: #5a421b;
`;

const CopyButton = styled(Button)`flex-shrink: 0;`;

const Toast = styled.p`margin: 12px 0 0 !important; color: #526a36 !important; font-weight: 650;`;

const AwardsGrid = styled.div`
  display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 220px), 1fr)); gap: 16px;
  @media(max-width: 639px) { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
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
  box-shadow: 0 2px 10px #2f210005;
  padding: 16px;
  text-align: center;
  position: relative;
  overflow: hidden;
  @media(max-width: 639px) { padding: 10px; }
`;

const AwardImage = styled.img`
  width: 100%;
  max-width: 140px;
  height: auto;
  aspect-ratio: 1;
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
  @media(max-width: 639px) { max-width: 104px; }
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
  margin: 12px 0 6px;
  font-size: 16px;
  line-height: 1.35;
  min-height: 2.7em;
  font-weight: 600;
  color: #2f2100;
  display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden;
  @media(max-width: 639px) { font-size: 15px; }
`;

const AwardDescription = styled.p`
  font-size: 0.875rem;
  color: rgba(47, 33, 0, 0.62);
  margin: 0;
  line-height: 1.45;
  display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden;
`;

const AwardDate = styled.span`
  font-size: 0.75rem;
  color: rgba(47, 33, 0, 0.55);
  margin-top: 8px;
  display: block;
`;

const EPBadge = styled.div`
  display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 99px;
  background: #fff0c7; color: #704300; font-size: 12px; font-weight: 750; margin-bottom: 8px;
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

const AwardLightboxMeta = styled.div`
  margin-top: 0.85rem;
  color: #2f2100;
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

const LargeAvatarImg = styled.img`
  display: block;
  width: 100%;
  max-width: 340px;
  height: auto;
  max-height: 70vh;
  object-fit: contain;
  margin: 0 auto;
  border-radius: 50%;
  box-shadow: 0 2px 16px rgba(0,0,0,0.10);
`;


const ProfileEyebrow = styled.p`margin: 0; color: #806d4e; font-size: 12px; font-weight: 650;`;

const LevelHeading = styled.div`
  display: flex; justify-content: space-between; align-items: baseline; gap: 12px;
  strong { font-size: 15px; overflow-wrap: anywhere; } span { color: #756951; font-size: 12px; white-space: nowrap; }
`;

const ProfileSeries = styled.div`
  min-width: 0; border-left: 1px solid #eadfc9; padding-left: 24px;
  @media(min-width: 768px) and (max-width: 1023px) { padding-left: 16px; }
  @media(max-width: 767px) { border-left: 0; border-top: 1px solid #eadfc9; padding-left: 0; padding-top: 16px; }
`;

const InviteContent = styled.div`
  p { color: #756951; margin: 0 0 16px; line-height: 1.5; }
  label { font-size: 14px; font-weight: 650; }
  input:focus-visible { outline: 3px solid #835500; outline-offset: 2px; }
  @media(max-width: 639px) { ${CopyButton} { width: 100%; } }
`;

const ProfileTabPanel = styled(TabPanel)`min-width: 0; &:focus-visible { outline: 3px solid #835500; outline-offset: 3px; border-radius: 14px; }`;

const FeedHeading = styled(SectionHeader)`
  align-items: center; h2 { font-size: 21px; }
  > div { width: auto; flex-shrink: 0; }
  @media(max-width: 620px) { flex-direction: row; align-items: center; }
`;

const CopyError = styled.p`margin: 12px 0 0 !important; color: #8e3528 !important;`;
