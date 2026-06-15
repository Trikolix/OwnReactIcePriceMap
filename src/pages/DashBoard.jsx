import Header from '../Header';
import React, { useState, useEffect, useRef } from 'react';
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
import { useLocation } from 'react-router-dom';
import {
  getLatestActivityTimestamp,
  groupActivities,
  readActivityFeedCache,
  writeActivityFeedCache,
  writeActivityFeedSeenAt,
} from '../utils/activityFeed';

const getTodayKey = () => new Date().toISOString().slice(0, 10);
const getFeedActionDismissKey = () => `action-feed-nudge-dismissed:${getTodayKey()}`;

function DashBoard() {
  const { userId } = useUser();
  const location = useLocation();
  const [activities, setActivities] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
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

  const filterMenuRef = useRef(null);

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

  const markDashboardSeen = (activitiesToMark = []) => {
    const latestTimestamp = getLatestActivityTimestamp(activitiesToMark) || new Date().toISOString();
    writeActivityFeedSeenAt(userId, latestTimestamp);
    window.dispatchEvent(new CustomEvent('activity-feed-seen', { detail: { userId, seenAt: latestTimestamp } }));
  };

  const fetchActivities = async (append = false, customOffset = null) => {
    const hasCachedActivities = Boolean(readActivityFeedCache(userId)?.activities?.length);
    append ? setLoadingMore(true) : setLoadingInitial(!hasCachedActivities && activities.length === 0);
    setError(null);
    try {
      const usedOffset = customOffset !== null ? customOffset : offset;

      const res = await fetch(
        `${apiUrl}/activity_feed.php?days=${days}&minimum=${minimum}&offset=${usedOffset}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

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
        setOffset(0);
        setHasMore(false);
      } else {
        const nextOffset = meta.nextOffset ?? (usedOffset + newActivities.length);
        const nextHasMore = meta.hasMore ?? false;
        setActivities((prev) => {
          const nextActivities = append ? [...prev, ...newActivities] : newActivities;

          if (!append) {
            writeActivityFeedCache(userId, {
              activities: nextActivities,
              nextOffset,
              hasMore: nextHasMore,
              cachedAt: new Date().toISOString(),
            });
            markDashboardSeen(nextActivities);
          }

          return nextActivities;
        });
        setOffset(nextOffset);
        setHasMore(nextHasMore);
      }
    } catch (err) {
      console.error("Fehler beim Laden der Dashboard-Daten:", err);
      setError(err);
    } finally {
      append ? setLoadingMore(false) : setLoadingInitial(false);
    }
  };

  // Initial laden
  useEffect(() => {
    const cachedFeed = readActivityFeedCache(userId);
    if (cachedFeed?.activities?.length) {
      setActivities(cachedFeed.activities);
      setOffset(Number.isFinite(cachedFeed.nextOffset) ? cachedFeed.nextOffset : 0);
      setHasMore(Boolean(cachedFeed.hasMore));
      markDashboardSeen(cachedFeed.activities);
    }

    fetchActivities(false, 0);
  }, [userId]);


  const reload = () => {
    setOffset(0);
    setHasMore(true);
    fetchActivities(false, 0);
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
    <Page>
      <Header />
      <Container>
        <HeroCard>
          <SettingsContainer ref={filterMenuRef}>
            <SettingsButton onClick={() => setShowFilters(!showFilters)} aria-label="Aktivitätsfilter">
              <Settings size={20} color="rgba(47, 33, 0, 0.6)" />
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
        </HeroCard>

        {showActionNudge && (
          <ActionNudge>
            <div>
              <strong>Heute aktiv</strong>
              <span>Foto-Challenges, Sammelaktionen und Tagesaufgaben findest du im kompakten Aktions-Hub.</span>
            </div>
            <ActionNudgeButton type="button" onClick={openActionsHub}>Aktions-Hub öffnen</ActionNudgeButton>
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
          {groupActivities(activities).filter(activity => {
            const { typ } = activity;
            if (['checkin', 'group_checkin'].includes(typ)) return filters.checkin;
            if (typ === 'bewertung') return filters.bewertung;
            if (typ === 'eisdiele') return filters.eisdiele;
            if (['award', 'award_bundle', 'award_wave'].includes(typ)) return filters.award;
            if (typ === 'new_user') return filters.new_user;
            return true; // route defaults to true since it's not in the requirements to be toggleable
          }).map((activity) => {
            const { typ, id, data } = activity;
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
                return (
                  <AwardCard
                    key={`award-${id}`}
                    award={data}
                    showComments={String(data?.id) === String(focusAwardId)}
                    focusCommentId={String(data?.id) === String(focusAwardId) ? focusCommentId : null}
                  />
                );
              case 'award_wave':
                return (
                  <AwardWaveCard
                    key={`award-wave-${id}`}
                    wave={data}
                    focusAwardId={focusAwardId}
                    focusCommentId={focusCommentId}
                  />
                );
              case 'new_user':
                return (
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
                return (
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
  width: min(96%, 1040px);
  box-sizing: border-box;
  margin: 0 auto;
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

const Controls = styled.div`
  margin: 1rem 0 3rem;
  text-align: center;
`;

const Placeholder = styled.div`
  width: 100%;
  text-align: center;
  padding: 1.25rem 1rem;
  border-radius: 16px;
  border: 1px solid rgba(47, 33, 0, 0.08);
  background: rgba(255, 252, 243, 0.94);
  box-shadow: 0 10px 28px rgba(28, 20, 0, 0.05);
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

const HeroCard = styled.div`
  position: relative;
  background: rgba(255, 252, 243, 0.96);
  border: 1px solid rgba(47, 33, 0, 0.08);
  border-radius: 18px;
  box-shadow: 0 10px 28px rgba(28, 20, 0, 0.08);
  padding: 1rem 1rem 0.9rem;
  margin-top: 0.25rem;
`;

const SettingsContainer = styled.div`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  z-index: 10;
`;

const SettingsButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(47, 33, 0, 0.05);
  }
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
`;

const ActionNudge = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.75rem;
  align-items: center;
  border: 1px solid rgba(31, 111, 235, 0.18);
  border-left: 4px solid #1f6feb;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 8px 20px rgba(28, 20, 0, 0.06);
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
