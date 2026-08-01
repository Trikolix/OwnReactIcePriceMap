import Header from '../Header';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import styled from "styled-components";
import { Settings } from "lucide-react";
import ReviewCard from "../components/ReviewCard";
import CheckinCard from '../components/CheckinCard';
import GroupCheckinCard from '../components/GroupCheckinCard';
import RouteCard from '../components/RouteCard';
import ShopCard from '../components/ShopCard';
import AwardCard from '../components/AwardCard';
import AwardBundleCard from '../components/AwardBundleCard';
import AwardWaveCard from '../components/AwardWaveCard';
import NewUserCard from '../components/NewUserCard';
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

        {showActionNudge && (
          <ActionNudge>
            <div>
              <strong>Aktive Aktionen</strong>
              <span>Aktuell laufen Foto-Challenges, Sammelaktionen und Tagesaufgaben. Hier geht es zu den Aktionen.</span>
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
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background:
    radial-gradient(circle at top right, rgba(255, 218, 140, 0.35), transparent 40%),
    linear-gradient(180deg, #fff9ef 0%, #fff4da 100%);
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  justify-content: center;
  width: min(96%, 1200px);
  box-sizing: border-box;
  margin: 0 auto;
  padding-top: 0.5rem;
`;

const Title = styled.h2`
  font-size: clamp(1.35rem, 2vw, 1.9rem);
  font-weight: 800;
  margin: 0;
  text-align: center;
  color: #2f2100;
`;

const Section = styled.div`
  width: 100%;
`;

const FocusedActivityAnchor = styled.div`
  scroll-margin-top: 96px;
`;

const BackToTopButton = styled.button`
  position: fixed;
  right: 1rem;
  bottom: calc(1rem + env(safe-area-inset-bottom));
  z-index: 50;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-height: 42px;
  padding: 0.65rem 0.85rem;
  border: 1px solid rgba(108, 67, 0, 0.22);
  border-radius: 999px;
  background: rgba(255, 181, 34, 0.96);
  color: #2f2100;
  box-shadow: 0 8px 22px rgba(47, 33, 0, 0.2);
  cursor: pointer;
  font-weight: 800;

  &:hover {
    background: #ffc34a;
  }

  @media (max-width: 520px) {
    right: 0.75rem;
    padding: 0.7rem;

    span {
      display: none;
    }
  }
`;

const Controls = styled.div`
  margin: 1rem 0 3rem;
  text-align: center;
`;

const Placeholder = styled.div`
  width: 100%;
  text-align: center;
  padding: 1.25rem 1rem;
  border-radius: 12px;
  border: 1px solid rgba(47, 33, 0, 0.08);
  background: rgba(255, 255, 255, 0.55);
  box-shadow: none;
  color: #6b5327;
`;

const LoadButton = styled.button`
  align-self: flex-start;
  background-color: #ffb522;
  color: #2f2100;
  border: 1px solid rgba(255, 181, 34, 0.55);
  padding: 0.65rem 1rem;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 12px rgba(255, 181, 34, 0.22);

  &:hover {
    background-color: #ffc34a;
    box-shadow: 0 8px 18px rgba(255, 181, 34, 0.28);
  }
`;

const PageHeader = styled.header`
  position: relative;
  padding: 0.7rem 2.8rem 0.5rem 0.25rem;
  margin-bottom: 0.1rem;

  @media (max-width: 700px) {
    padding: 0.55rem 2.6rem 0.35rem 0.1rem;
    margin-bottom: 0.2rem;
  }
`;

const SettingsContainer = styled.div`
  position: absolute;
  top: 0.55rem;
  right: 0.2rem;
  z-index: 10;
`;

const SettingsButton = styled.button`
  position: relative;
  min-width: 38px;
  min-height: 38px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(47, 33, 0, 0.08);
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(47, 33, 0, 0.05);
  }
`;

const FilterStatusDot = styled.span`
  position: absolute;
  top: 4px;
  right: 4px;
  width: 7px;
  height: 7px;
  border: 1px solid #fffaf0;
  border-radius: 50%;
  background: #d97706;
`;

const FilterMenu = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.25rem;
  background: white;
  border: 1px solid rgba(47, 33, 0, 0.08);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 150px;
`;

const FilterLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #2f2100;
  cursor: pointer;
`;

const FilterCheckbox = styled.input`
  cursor: pointer;
  accent-color: #ffb522;
`;

const Subtitle = styled.p`
  margin: 0.4rem 0 0;
  text-align: center;
  color: rgba(47, 33, 0, 0.68);
  font-size: 0.95rem;

  @media (max-width: 700px) {
    display: none;
  }
`;

const ActionNudge = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.75rem;
  align-items: center;
  border: 1px solid rgba(31, 111, 235, 0.18);
  border-left: 4px solid #1f6feb;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.55);
  box-shadow: none;
  padding: 0.75rem 2.4rem 0.75rem 0.85rem;
  color: #2f2100;

  div {
    display: grid;
    gap: 0.15rem;
  }

  span {
    color: rgba(47, 33, 0, 0.68);
    font-size: 0.9rem;
    line-height: 1.35;
  }

  @media (max-width: 620px) {
    grid-template-columns: 1fr;
  }
`;

const ActionNudgeButton = styled.button`
  justify-self: end;
  border: none;
  border-radius: 8px;
  background: #1f6feb;
  color: #ffffff;
  padding: 0.5rem 0.7rem;
  font: inherit;
  font-size: 0.85rem;
  font-weight: 800;
  white-space: nowrap;
  cursor: pointer;

  @media (max-width: 620px) {
    justify-self: start;
  }
`;

const ActionNudgeClose = styled.button`
  position: absolute;
  top: 0.35rem;
  right: 0.45rem;
  border: none;
  background: transparent;
  color: rgba(47, 33, 0, 0.58);
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
`;
