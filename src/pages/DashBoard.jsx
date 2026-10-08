import Header from '../Header';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import styled from "styled-components";
import { Settings } from "lucide-react";
import { SHOP_COLORS, ShopButton } from "../styles/ShopUi";
import ReviewCard from "../components/ReviewCard";
import CheckinCard from '../components/CheckinCard';
import GroupCheckinCard from '../components/GroupCheckinCard';
import RouteCard from '../components/RouteCard';
import ShopCard from '../components/ShopCard';
import AwardCard from '../components/AwardCard';
import AwardBundleCard from '../components/AwardBundleCard';
import AwardWaveCard from '../components/AwardWaveCard';
import NewUserCard from '../components/NewUserCard';
import OnboardingChecklist from '../components/OnboardingChecklist';
import { useUser } from '../context/UserContext';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  getLatestActivityTimestamp,
  groupActivities,
  getActivityKey,
  mergeActivities,
  readActivityFeedCache,
  writeActivityFeedCache,
  writeActivityFeedSeenAt,
} from '../utils/activityFeed';

const getTodayKey = () => new Date().toISOString().slice(0, 10);
const getFeedActionDismissKey = () => `action-feed-nudge-dismissed:${getTodayKey()}`;
const activityNeedsLikeState = (activity) => ['checkin', 'bewertung', 'route', 'award', 'new_user'].includes(activity?.typ);
const cachedActivitiesHaveLikeState = (activities = []) => activities.every((activity) => {
  if (!activityNeedsLikeState(activity)) return true;
  const data = activity?.data || {};
  return data.likes_count !== undefined && data.has_liked !== undefined;
});

const activityContainsAward = (activity, awardId) => {
  if (!awardId || !activity) return false;
  const targetId = String(awardId);

  if (activity.typ === 'award') {
    return String(activity.data?.id) === targetId;
  }

  if (activity.typ === 'award_bundle') {
    return Array.isArray(activity.data)
      && activity.data.some((award) => String(award?.id) === targetId);
  }

  if (activity.typ === 'award_wave') {
    return Array.isArray(activity.data?.recipients)
      && activity.data.recipients.some((award) => String(award?.id) === targetId);
  }

  return false;
};

const activityContainsNewUser = (activity, userId) => (
  Boolean(userId)
  && activity?.typ === 'new_user'
  && String(activity.data?.id) === String(userId)
);

const buildDashboardTargetUrl = (type, id, focusCommentId = null) => {
  const params = new URLSearchParams({ type, id: String(id) });
  if (focusCommentId) params.set('focusComment', String(focusCommentId));
  return `/dashboard/target?${params.toString()}`;
};

function DashBoard() {
  const { userId } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [focusTarget, setFocusTarget] = useState(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showActionNudge, setShowActionNudge] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(getFeedActionDismissKey()) !== '1';
  });

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(() => {
    const saved = localStorage.getItem('dashboardFilters');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Fehler beim Parsen der Dashboard-Filter", e);
      }
    }
    return {
      checkin: true,
      bewertung: true,
      eisdiele: true,
      award: true,
      new_user: true,
    };
  });
  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const hasHiddenActivityTypes = activeFilterCount < Object.keys(filters).length;

  const filterMenuRef = useRef(null);
  const focusedActivityRef = useRef(null);
  const feedAbortRef = useRef(null);
  const feedRequestIdRef = useRef(0);
  const feedTopRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('dashboardFilters', JSON.stringify(filters));
  }, [filters]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target)) {
        setShowFilters(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFilterChange = (key) => {
    setFilters((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const days = 7;
  const minimum = 20;
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const queryParams = new URLSearchParams(location.search);
  const focusAwardId = queryParams.get('focusAward');
  const focusNewUserId = queryParams.get('focusNewUser');
  const focusCommentId = queryParams.get('focusComment');
  const focusType = focusAwardId ? 'award' : focusNewUserId ? 'new_user' : null;
  const focusId = focusAwardId || focusNewUserId;
  const displayActivities = useMemo(() => {
    if (!focusTarget) return activities;
    const targetKey = getActivityKey(focusTarget);
    return activities.some((activity) => getActivityKey(activity) === targetKey)
      ? activities
      : mergeActivities(activities, [focusTarget]);
  }, [activities, focusTarget]);
  const groupedActivities = useMemo(() => groupActivities(displayActivities), [displayActivities]);
  const visibleActivities = useMemo(() => (
    groupedActivities.filter(activity => {
      const { typ } = activity;
      if (focusAwardId && ['award', 'award_bundle', 'award_wave'].includes(typ) && activityContainsAward(activity, focusAwardId)) {
        return true;
      }
      if (focusNewUserId && activityContainsNewUser(activity, focusNewUserId)) {
        return true;
      }
      if (['checkin', 'group_checkin'].includes(typ)) return filters.checkin;
      if (typ === 'bewertung') return filters.bewertung;
      if (typ === 'eisdiele') return filters.eisdiele;
      if (['award', 'award_bundle', 'award_wave'].includes(typ)) return filters.award;
      if (typ === 'new_user') return filters.new_user;
      return true;
    })
  ), [filters, focusAwardId, focusNewUserId, groupedActivities]);

  const markDashboardSeen = (activitiesToMark = []) => {
    const latestTimestamp = getLatestActivityTimestamp(activitiesToMark) || new Date().toISOString();
    writeActivityFeedSeenAt(userId, latestTimestamp);
    window.dispatchEvent(new CustomEvent('activity-feed-seen', { detail: { userId, seenAt: latestTimestamp } }));
  };

  const fetchActivities = async (append = false, customOffset = null) => {
    if (!append) {
      feedAbortRef.current?.abort();
    }

    const requestId = feedRequestIdRef.current + 1;
    feedRequestIdRef.current = requestId;
    const controller = new AbortController();
    feedAbortRef.current = controller;
    const hasCachedActivities = Boolean(readActivityFeedCache(userId)?.activities?.length);
    append ? setLoadingMore(true) : setLoadingInitial(Boolean(focusId) || (!hasCachedActivities && activities.length === 0));
    setError(null);
    try {
      const usedOffset = customOffset !== null ? customOffset : offset;

      const params = new URLSearchParams({
        days: String(days),
        minimum: String(minimum),
        offset: String(usedOffset),
      });
      const res = await fetch(`${apiUrl}/activity_feed.php?${params.toString()}`, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      if (requestId !== feedRequestIdRef.current) return;

      const newActivities = json.activities || [];
      const meta = json.meta || {};

      if (newActivities.length === 0) {
        if (!append) {
          writeActivityFeedCache(userId, {
            activities: [],
            nextOffset: 0,
            hasMore: false,
            cachedAt: new Date().toISOString(),
          });
          markDashboardSeen([]);
        }
        setActivities((prev) => (append ? prev : []));
        if (!append) setOffset(0);
        setHasMore(false);
      } else {
        const nextOffset = meta.nextOffset ?? meta.next_offset ?? (usedOffset + newActivities.length);
        const nextHasMore = meta.hasMore ?? meta.has_more ?? false;
        setActivities((prev) => {
          const nextActivities = append
            ? mergeActivities(prev, newActivities)
            : mergeActivities([], newActivities);

          writeActivityFeedCache(userId, {
            activities: nextActivities,
            nextOffset,
            hasMore: nextHasMore,
            cachedAt: new Date().toISOString(),
          });
          if (!append) {
            markDashboardSeen(nextActivities);
          }

          return nextActivities;
        });
        setOffset(nextOffset);
        setHasMore(nextHasMore);
      }
    } catch (err) {
      if (err.name === 'AbortError' || requestId !== feedRequestIdRef.current) return;
      console.error("Fehler beim Laden der Dashboard-Daten:", err);
      setError(err);
    } finally {
      if (requestId === feedRequestIdRef.current) {
        append ? setLoadingMore(false) : setLoadingInitial(false);
      }
    }
  };

  useEffect(() => {
    if (focusAwardId && !filters.award) {
      setFilters((prev) => ({ ...prev, award: true }));
    }
    if (focusNewUserId && !filters.new_user) {
      setFilters((prev) => ({ ...prev, new_user: true }));
    }
  }, [filters.award, filters.new_user, focusAwardId, focusNewUserId]);

  useEffect(() => {
    let targetController = null;
    let disposed = false;
    const cachedFeed = readActivityFeedCache(userId);
    setFocusTarget(null);
    if (cachedFeed?.activities?.length && cachedActivitiesHaveLikeState(cachedFeed.activities)) {
      setActivities(cachedFeed.activities);
      setOffset(Number.isFinite(cachedFeed.nextOffset) ? cachedFeed.nextOffset : 0);
      setHasMore(Boolean(cachedFeed.hasMore));
    }

    const initialise = async () => {
      if (focusType && focusId) {
        targetController = new AbortController();
        try {
          const response = await fetch(
            `${apiUrl}/activity_feed.php?mode=target&type=${encodeURIComponent(focusType)}&id=${encodeURIComponent(focusId)}`,
            { signal: targetController.signal },
          );
          const json = await response.json().catch(() => ({}));
          if (!response.ok || !json.target) throw new Error('Das Dashboard-Item konnte nicht geladen werden.');
          if (json.meta?.historical) {
            navigate(buildDashboardTargetUrl(focusType, focusId, focusCommentId), { replace: true });
            return;
          }
          if (!disposed) setFocusTarget(json.target);
        } catch (targetError) {
          if (targetError.name !== 'AbortError' && !disposed) setError(targetError);
        }
      }

      if (!disposed) fetchActivities(false, 0);
    };

    initialise();

    return () => {
      disposed = true;
      targetController?.abort();
      feedRequestIdRef.current += 1;
      feedAbortRef.current?.abort();
    };
  }, [apiUrl, userId, focusType, focusId, focusCommentId, navigate]);

  useEffect(() => {
    if (!focusId || !focusedActivityRef.current) return undefined;
    const animationFrame = window.requestAnimationFrame(() => {
      focusedActivityRef.current?.scrollIntoView({ behavior: 'auto', block: 'center' });
    });
    return () => window.cancelAnimationFrame(animationFrame);
  }, [focusId, visibleActivities]);

  useEffect(() => {
    let animationFrame = null;
    const updateVisibility = () => {
      if (animationFrame !== null) return;
      animationFrame = window.requestAnimationFrame(() => {
        setShowBackToTop(window.scrollY > window.innerHeight * 1.5);
        animationFrame = null;
      });
    };

    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });
    window.addEventListener('resize', updateVisibility, { passive: true });
    return () => {
      window.removeEventListener('scroll', updateVisibility);
      window.removeEventListener('resize', updateVisibility);
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
    };
  }, []);


  const reload = () => {
    setOffset(0);
    setHasMore(true);
    fetchActivities(false, 0);
  };

  const scrollToTop = () => {
    feedTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const dismissActionNudge = () => {
    setShowActionNudge(false);
    try {
      window.localStorage.setItem(getFeedActionDismissKey(), '1');
    } catch (error) {
      console.warn('Aktionshinweis konnte nicht gespeichert werden:', error);
    }
  };
  const openActionsHub = () => {
    window.dispatchEvent(new CustomEvent('actions-hub:open'));
  };

  return (
    <Page ref={feedTopRef}>
      <Header />
      <Container>
        <PageHeader>
          <SettingsContainer ref={filterMenuRef}>
            <SettingsButton
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              aria-label={hasHiddenActivityTypes ? `Aktivitätsfilter, ${activeFilterCount} von ${Object.keys(filters).length} Aktivitätstypen aktiv` : 'Aktivitätsfilter'}
              aria-expanded={showFilters}
            >
              <Settings size={20} color="rgba(47, 33, 0, 0.6)" />
              {hasHiddenActivityTypes && <FilterStatusDot aria-hidden="true" />}
            </SettingsButton>
            {showFilters && (
              <FilterMenu>
                <FilterLabel>
                  <FilterCheckbox
                    type="checkbox"
                    checked={filters.checkin}
                    onChange={() => handleFilterChange('checkin')}
                  />
                  Check-ins
                </FilterLabel>
                <FilterLabel>
                  <FilterCheckbox
                    type="checkbox"
                    checked={filters.bewertung}
                    onChange={() => handleFilterChange('bewertung')}
                  />
                  Bewertungen
                </FilterLabel>
                <FilterLabel>
                  <FilterCheckbox
                    type="checkbox"
                    checked={filters.eisdiele}
                    onChange={() => handleFilterChange('eisdiele')}
                  />
                  Neue Eisdielen
                </FilterLabel>
                <FilterLabel>
                  <FilterCheckbox
                    type="checkbox"
                    checked={filters.award}
                    onChange={() => handleFilterChange('award')}
                  />
                  Awards
                </FilterLabel>
                <FilterLabel>
                  <FilterCheckbox
                    type="checkbox"
                    checked={filters.new_user}
                    onChange={() => handleFilterChange('new_user')}
                  />
                  Neue Nutzer
                </FilterLabel>
              </FilterMenu>
            )}
          </SettingsContainer>

          <Title>Aktivitäten</Title>
          <Subtitle>
            Neue Check-ins, Bewertungen, Routen, Awards und jetzt auch frisch registrierte Nutzer in einem Feed.
          </Subtitle>
        </PageHeader>
        <OnboardingChecklist />

        {showActionNudge && (
          <ActionNudge>
            <div>
              <strong>Aktive Aktionen</strong>
              <span>Aktuell läuft eine Foto-Challenge und du kannst an Tagesaufgaben teilnehmen. Hier geht es zu den Aktionen.</span>
            </div>
            <ActionNudgeButton type="button" onClick={openActionsHub}>Zu den aktiven Aktionen</ActionNudgeButton>
            <ActionNudgeClose type="button" onClick={dismissActionNudge} aria-label="Aktionshinweis ausblenden">×</ActionNudgeClose>
          </ActionNudge>
        )}

        {/* Initial-Loader: nur Platzhalter innerhalb des Containers */}
        {loadingInitial && activities.length === 0 && (
          <Placeholder>Lade Dashboard Daten...</Placeholder>
        )}

        {/* Fehleranzeige (nicht die Seite ersetzen) */}
        {error && activities.length === 0 && (
          <Placeholder>Fehler beim Abruf der Daten</Placeholder>
        )}

        <Section>
          {visibleActivities.map((activity) => {
            const { typ, id, data } = activity;
            const isFocusedActivity = activityContainsAward(activity, focusAwardId)
              || activityContainsNewUser(activity, focusNewUserId);
            const wrapActivity = (node) => isFocusedActivity ? (
              <FocusedActivityAnchor ref={focusedActivityRef} key={`focus-${id}`}>
                {node}
              </FocusedActivityAnchor>
            ) : node;

            switch (typ) {
              case 'checkin':
                return <CheckinCard key={`checkin-${id}`} checkin={data} onSuccess={reload} />;
              case "group_checkin":
                return <GroupCheckinCard key={id} checkins={data} onSuccess={reload} />;
              case 'bewertung':
                return <ReviewCard key={`bewertung-${id}`} review={data} onSuccess={reload} />;
              case 'route':
                return <RouteCard key={`route-${id}`} route={data} onSuccess={reload} />;
              case 'eisdiele':
                return <ShopCard key={`eisdiele-${id}`} iceShop={data} onSuccess={reload} />;
              case 'award':
                return wrapActivity(
                  <AwardCard
                    key={`award-${id}`}
                    award={data}
                    showComments={String(data?.id) === String(focusAwardId)}
                    focusCommentId={String(data?.id) === String(focusAwardId) ? focusCommentId : null}
                  />
                );
              case 'award_wave':
                return wrapActivity(
                  <AwardWaveCard
                    key={`award-wave-${id}`}
                    wave={data}
                    focusAwardId={focusAwardId}
                    focusCommentId={focusCommentId}
                  />
                );
              case 'new_user':
                return wrapActivity(
                  <NewUserCard
                    key={`new-user-${id}`}
                    user={data}
                    showComments={String(data?.id) === String(focusNewUserId)}
                    focusCommentId={String(data?.id) === String(focusNewUserId) ? focusCommentId : null}
                  />
                );
              case 'award_bundle': {
                const firstAward = Array.isArray(data) ? data[0] : null;
                const latestAward = Array.isArray(data) ? data[data.length - 1] : null;
                return wrapActivity(
                  <AwardBundleCard
                    key={id}
                    awards={data}
                    userName={latestAward?.user_name || firstAward?.user_name}
                    date={latestAward?.datum || firstAward?.datum}
                    focusAwardId={focusAwardId}
                    focusCommentId={focusCommentId}
                  />
                );
              }
              default:
                return null;
            }
          })}

          {/* Controls & Loader am Listenende – DOM bleibt bestehen */}
          <Controls>
            {hasMore && !loadingMore && (
              <LoadButton
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  fetchActivities(true, offset);
                }}
              >
                Mehr laden
              </LoadButton>

            )}
            {loadingMore && <p>Lade weitere Aktivitäten…</p>}
            {error && activities.length > 0 && (
              <p style={{ color: "red" }}>Fehler: {error.message}</p>
            )}
          </Controls>
        </Section>
      </Container>
      {showBackToTop && (
        <BackToTopButton type="button" onClick={scrollToTop} aria-label="Nach oben">
          ↑ <span>Nach oben</span>
        </BackToTopButton>
      )}
    </Page>
  );
}

export default DashBoard;

/* ===== Styles ===== */
const Page = styled.div`
  display: flex; flex-direction: column; min-height: 100vh; background: #fffaf2; color: ${SHOP_COLORS.text};
`;
const Container = styled.main`
  width: min(calc(100% - 24px), 1040px); margin: 0 auto; padding-top: 20px;
  display: flex; flex-direction: column; gap: 12px; min-width: 0;
`;
const Title = styled.h2`margin: 0; text-align: center; font-size: 1.5rem;`;
const Section = styled.div`
  width: 100%; min-width: 0; display: grid; gap: 12px;
  > [data-activity-card], > div > [data-activity-card] { margin-bottom: 0; }
`;
const FocusedActivityAnchor = styled.div`scroll-margin-top: 96px; min-width: 0;`;
const BackToTopButton = styled(ShopButton)`
  position: fixed; right: 1rem; bottom: calc(1rem + env(safe-area-inset-bottom));
  z-index: 50; min-width: 44px; border-radius: 999px; background: ${SHOP_COLORS.accent};
  @media (max-width: 520px) { right: .75rem; span { display: none; } }
`;
const Controls = styled.div`margin: 1rem 0 3rem; text-align: center;`;
const Placeholder = styled.div`
  padding: 20px; border: 1px solid ${SHOP_COLORS.border}; border-radius: 18px;
  background: #fff; color: ${SHOP_COLORS.muted}; text-align: center;
`;
const LoadButton = styled(ShopButton).attrs({ $primary: true })``;
const PageHeader = styled.header`
  position: relative; padding: 8px 52px; margin-bottom: 4px; min-height: 44px;
`;
const SettingsContainer = styled.div`position: absolute; top: 4px; right: 0; z-index: 10;`;
const SettingsButton = styled(ShopButton)`position: relative; min-width: 44px; padding: 8px;`;
const FilterStatusDot = styled.span`
  position: absolute; top: 4px; right: 4px; width: 7px; height: 7px;
  border: 1px solid #fffaf2; border-radius: 50%; background: #d97706;
`;
const FilterMenu = styled.div`
  position: absolute; top: 100%; right: 0; margin-top: 8px; background: #fff;
  border: 1px solid ${SHOP_COLORS.border}; border-radius: 12px; padding: 8px;
  box-shadow: 0 4px 20px rgba(47, 33, 0, .1); display: grid; min-width: 170px;
`;
const FilterLabel = styled.label`
  display: flex; align-items: center; gap: 8px; min-height: 44px; font-size: .85rem; cursor: pointer;
`;
const FilterCheckbox = styled.input`
  cursor: pointer; accent-color: ${SHOP_COLORS.accent};
  &:focus-visible { outline: 3px solid #986b0e; outline-offset: 3px; }
`;
const Subtitle = styled.p`
  margin: 8px 0 0; text-align: center; color: ${SHOP_COLORS.muted}; font-size: .95rem;
  @media (max-width: 700px) { display: none; }
`;
const ActionNudge = styled.div`
  position: relative; display: grid; grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px; align-items: center; padding: 16px 60px 16px 20px;
  border: 1px solid ${SHOP_COLORS.border}; border-radius: 18px; background: #fff;
  div { display: grid; gap: 4px; min-width: 0; }
  span { color: ${SHOP_COLORS.muted}; font-size: .9rem; line-height: 1.5; }
  @media (max-width: 620px) { grid-template-columns: minmax(0, 1fr); }
`;
const ActionNudgeButton = styled(ShopButton).attrs({ $primary: true })`
  justify-self: end; @media (max-width: 620px) { justify-self: start; }
`;
const ActionNudgeClose = styled(ShopButton)`
  position: absolute; top: 4px; right: 4px; min-width: 44px; padding: 8px;
  border: 0; background: transparent; color: ${SHOP_COLORS.muted}; font-size: 1.25rem;
`;
