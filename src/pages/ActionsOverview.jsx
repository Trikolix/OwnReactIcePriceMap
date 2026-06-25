import { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { ChevronDown, History, Trophy } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { buildPublicAssetUrl } from '../utils/assets.jsx';
import {
  CAMPAIGN_STATUS,
  getActionsOverviewCampaigns,
} from '../features/seasonal/campaigns';
import EasterCampaignPanel from '../features/seasonal/EasterCampaignPanel';
import SummerCampaignPanel from '../features/seasonal/SummerCampaignPanel';
import TourDeGlacePanel from '../features/seasonal/TourDeGlacePanel';

const ACTIVE_PHOTO_CHALLENGE_STATUSES = new Set([
  'active',
  'submission_open',
  'submission_closed',
  'group_running',
  'ko_running',
]);

const PHOTO_CHALLENGE_ACTION_LABELS = {
  active: 'Jetzt abstimmen',
  group_running: 'Jetzt voten',
  ko_running: 'Jetzt voten',
  submission_open: 'Bild einreichen',
  submission_closed: 'Voting startet bald',
};

const formatVoteCount = (count) => `${count} ${count === 1 ? 'Stimme' : 'Stimmen'}`;

const TASK_IMAGES = {
  photo_challenge: '/assets/photo_challenge_icon.png',
  tour_de_glace: '/assets/tour-de-glace/tour_egg.png',
  summer: '/assets/summer_action_logo2.png',
};

const POINT_LABELS = {
  login_active: 'App geöffnet & eingeloggt',
  login_days: 'Login-Tage',
  profile_image: 'Profilbild vorhanden',
  checkins: 'Check-ins',
  prices: 'Preis gemeldet',
  reviews: 'Bewertungen',
  comments: 'Kommentar geschrieben',
  new_shops: 'Neue Eisdiele eingetragen',
  routes: 'Neue Route eingetragen',
  secret_location: 'Olympische Spielstätte gefunden',
  challenges_completed: 'Challenges abgeschlossen',
  referred_users: 'Geworbene Nutzer',
  checkins_base_ep: 'Check-ins',
  checkins_photo_ep: 'Check-ins mit Bild',
  checkins_on_site_ep: 'Vor-Ort-Check-ins',
  price_reported_ep: 'Preis gemeldet',
  favorite_shop_added_ep: 'Favoriten hinzugefügt',
  invite_registered_ep: 'Nutzer eingeladen',
  invite_checkin_ep: 'Eingeladene Nutzer mit Check-in',
  login_days_ep: 'Login-Tage',
  profile_image_ep: 'Profilbild vorhanden',
  comment_ep: 'Kommentare',
  rad_event_page_ep: 'Ice-Tour-Seite besucht',
  easter_eggs_ep: 'Geschenke gefunden',
  new_shop_ep: 'Neue Eisdielen eingetragen',
  challenge_completed_ep: 'Challenges abgeschlossen',
  ice_shop_reviewed_ep: 'Eisdielen bewertet',
  route_submitted_ep: 'Routen eingetragen',
  photo_challenge_submission_ep: 'Fotochallenge: Einreichungen',
  photo_challenge_vote_ep: 'Fotochallenge: Votes',
};

const formatCampaignDate = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat('de-DE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

const getPhotoChallengeVoteSummary = (challenges = []) => challenges.reduce((summary, challenge) => {
  const progress = challenge?.vote_progress || {};
  const availableVotes = Number(progress.available_votes || 0);
  const castVotes = Number(progress.cast_votes || 0);
  const remainingVotes = Number(progress.remaining_votes || 0);
  return {
    activeChallenges: summary.activeChallenges + 1,
    votingChallenges: summary.votingChallenges + (availableVotes > 0 ? 1 : 0),
    availableVotes: summary.availableVotes + availableVotes,
    castVotes: summary.castVotes + castVotes,
    remainingVotes: summary.remainingVotes + remainingVotes,
  };
}, {
  activeChallenges: 0,
  votingChallenges: 0,
  availableVotes: 0,
  castVotes: 0,
  remainingVotes: 0,
});

const ActionsOverviewModal = ({ open, onClose, isLoggedIn, onLogin }) => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const { userId } = useUser();
  const isAdmin = Number(userId) === 1;
  const campaigns = useMemo(() => getActionsOverviewCampaigns(new Date(), { isAdmin }), [isAdmin]);
  const [currentUser, setCurrentUser] = useState(null);
  const [pastUsers, setPastUsers] = useState([]);
  const [isUserOfMonthLoading, setIsUserOfMonthLoading] = useState(false);
  const [olympicsLeaderboard, setOlympicsLeaderboard] = useState([]);
  const [olympicsUserRank, setOlympicsUserRank] = useState(null);
  const [isOlympicsLoading, setIsOlympicsLoading] = useState(false);
  const [isOlympicsExpanded, setIsOlympicsExpanded] = useState(false);
  const [birthdayLeaderboard, setBirthdayLeaderboard] = useState([]);
  const [birthdayUserRank, setBirthdayUserRank] = useState(null);
  const [isBirthdayLoading, setIsBirthdayLoading] = useState(false);
  const [isBirthdayExpanded, setIsBirthdayExpanded] = useState(false);
  const [birthdayBreakdownByUser, setBirthdayBreakdownByUser] = useState({});
  const [activeBirthdayBreakdownUserId, setActiveBirthdayBreakdownUserId] = useState(null);
  const [breakdownByUser, setBreakdownByUser] = useState({});
  const [activeBreakdownUserId, setActiveBreakdownUserId] = useState(null);
  const [photoChallenges, setPhotoChallenges] = useState([]);
  const [isPhotoChallengesLoading, setIsPhotoChallengesLoading] = useState(false);
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [showPastUsers, setShowPastUsers] = useState(false);
  const [activeDetailPanel, setActiveDetailPanel] = useState(null);
  const detailPanelRef = useRef(null);
  const shouldScrollToDetailRef = useRef(false);
  const LEADERBOARD_COLLAPSED_COUNT = 10;

  const openDetailPanel = (campaignId, { toggle = false } = {}) => {
    shouldScrollToDetailRef.current = true;
    setActiveDetailPanel((current) => {
      if (toggle && current === campaignId) {
        shouldScrollToDetailRef.current = false;
        return null;
      }
      return campaignId;
    });
  };

  useEffect(() => {
    if (!activeDetailPanel || !shouldScrollToDetailRef.current) {
      return;
    }

    const handle = window.requestAnimationFrame(() => {
      detailPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      shouldScrollToDetailRef.current = false;
    });

    return () => window.cancelAnimationFrame(handle);
  }, [activeDetailPanel]);

  useEffect(() => {
    if (!open || !apiUrl) {
      return;
    }

    setIsUserOfMonthLoading(true);
    fetch(`${apiUrl}/get_user_of_the_month.php`)
      .then((res) => res.json())
      .then((data) => {
        if (!data?.error) {
          setCurrentUser(data.currentUser || null);
          setPastUsers(Array.isArray(data.pastUsers) ? data.pastUsers : []);
        }
      })
      .catch((error) => {
        console.error('Failed to fetch user of the month:', error);
      })
      .finally(() => setIsUserOfMonthLoading(false));
  }, [apiUrl, open]);

  useEffect(() => {
    if (!open || !apiUrl) {
      return;
    }

    setIsOlympicsExpanded(false);
    setIsOlympicsLoading(true);
    const userParam = userId ? `?user_id=${userId}` : '';
    fetch(`${apiUrl}/api/olympics_leaderboard.php${userParam}`)
      .then((res) => res.json())
      .then((data) => {
        setOlympicsLeaderboard(Array.isArray(data?.leaderboard) ? data.leaderboard : []);
        setOlympicsUserRank(data?.user_rank || null);
        setBreakdownByUser(data?.breakdowns || {});
      })
      .catch((error) => {
        console.error('Fehler beim Laden des Olympia-Leaderboards:', error);
        setOlympicsLeaderboard([]);
        setOlympicsUserRank(null);
        setBreakdownByUser({});
      })
      .finally(() => setIsOlympicsLoading(false));
  }, [apiUrl, open, userId]);

  useEffect(() => {
    if (!open || !apiUrl) {
      return;
    }

    setIsBirthdayExpanded(false);
    setIsBirthdayLoading(true);
    setBirthdayBreakdownByUser({});
    setActiveBirthdayBreakdownUserId(null);
    const userParam = userId ? `?user_id=${userId}` : '';
    fetch(`${apiUrl}/api/birthday_leaderboard.php${userParam}`)
      .then((res) => res.json())
      .then((data) => {
        setBirthdayLeaderboard(Array.isArray(data?.leaderboard) ? data.leaderboard : []);
        setBirthdayUserRank(data?.user_rank || null);
        setBirthdayBreakdownByUser(data?.breakdowns || {});
      })
      .catch((error) => {
        console.error('Fehler beim Laden des Birthday-Leaderboards:', error);
        setBirthdayLeaderboard([]);
        setBirthdayUserRank(null);
        setBirthdayBreakdownByUser({});
      })
      .finally(() => setIsBirthdayLoading(false));
  }, [apiUrl, open, userId]);

  useEffect(() => {
    if (!open || !apiUrl) {
      return;
    }

    setIsPhotoChallengesLoading(true);
    const params = new URLSearchParams();
    if (userId) {
      params.set('nutzer_id', userId);
    }
    const query = params.toString();
    fetch(`${apiUrl}/photo_challenge/list_public_challenges.php${query ? `?${query}` : ''}`)
      .then((res) => res.json())
      .then((data) => {
        setPhotoChallenges(Array.isArray(data?.data) ? data.data : []);
      })
      .catch((error) => {
        console.error('Fehler beim Laden der Fotochallenges:', error);
        setPhotoChallenges([]);
      })
      .finally(() => setIsPhotoChallengesLoading(false));
  }, [apiUrl, open, userId]);

  if (!open) {
    return null;
  }

  const visibleOlympicsLeaderboard = isOlympicsExpanded
    ? olympicsLeaderboard
    : olympicsLeaderboard.slice(0, LEADERBOARD_COLLAPSED_COUNT);
  const visibleBirthdayLeaderboard = isBirthdayExpanded
    ? birthdayLeaderboard
    : birthdayLeaderboard.slice(0, LEADERBOARD_COLLAPSED_COUNT);
  const displayCampaigns = campaigns.map((campaign) => {
    if (campaign.id !== 'tour_de_glace_2026') {
      return campaign;
    }
    if (campaign.status === CAMPAIGN_STATUS.UPCOMING) {
      return null;
    }
    return campaign;
  }).filter(Boolean);
  const activeCampaigns = displayCampaigns.filter((campaign) => campaign.status === CAMPAIGN_STATUS.ACTIVE);
  const upcomingCampaigns = displayCampaigns.filter((campaign) => campaign.status === CAMPAIGN_STATUS.UPCOMING);
  const hasPastEvents = displayCampaigns.some((campaign) => campaign.status === CAMPAIGN_STATUS.RESULTS);
  const activePhotoChallenges = photoChallenges.filter((challenge) =>
    ACTIVE_PHOTO_CHALLENGE_STATUSES.has(challenge?.status)
  );
  const photoVoteSummary = getPhotoChallengeVoteSummary(activePhotoChallenges);
  const hasPhotoVotesAvailable = photoVoteSummary.availableVotes > 0;
  const hasOpenPhotoVotes = photoVoteSummary.remainingVotes > 0;
  const canTrackPhotoVotes = Boolean(userId);
  const singlePhotoChallengeTitle = activePhotoChallenges.length === 1
    ? activePhotoChallenges[0].title || 'Foto-Challenge'
    : null;
  const tourCampaign = displayCampaigns.find((campaign) => campaign.id === 'tour_de_glace_2026');
  const tourOfficialActive = tourCampaign
    ? new Date() >= tourCampaign.schedule.start
    : false;
  const summerCampaign = displayCampaigns.find((campaign) => campaign.id === 'summer_2026');
  const openCampaignDetail = (campaignId) => {
    setActiveDetailPanel((current) => (current === campaignId ? null : campaignId));
  };
  const openTourDeGlaceAction = () => {
    setActiveDetailPanel('tour_de_glace_2026');
    window.requestAnimationFrame(() => {
      detailPanelRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  };
  const taskItems = [
    activePhotoChallenges.length > 0 && {
      id: 'photo-challenges',
      type: 'photo_challenge',
      title: hasOpenPhotoVotes
        ? (singlePhotoChallengeTitle || `${activePhotoChallenges.length} Foto-Challenges warten`)
        : (singlePhotoChallengeTitle || `${activePhotoChallenges.length} Foto-Challenges aktiv`),
      description: hasPhotoVotesAvailable
        ? (!canTrackPhotoVotes
          ? `Aktuell sind ${formatVoteCount(photoVoteSummary.availableVotes)} verfügbar. Logge dich ein, um abzustimmen.`
          : hasOpenPhotoVotes
          ? `Du hast noch ${formatVoteCount(photoVoteSummary.remainingVotes)} offen. Bisher vergeben: ${photoVoteSummary.castVotes}/${photoVoteSummary.availableVotes}.`
          : `Alle aktuell verfügbaren Votes sind vergeben: ${photoVoteSummary.castVotes}/${photoVoteSummary.availableVotes}.`)
        : (activePhotoChallenges.length === 1
          ? 'Schau dir die aktuelle Challenge an.'
          : 'Mehrere Foto-Challenges sind gerade aktiv.'),
      statusLabel: hasPhotoVotesAvailable
        ? (!canTrackPhotoVotes
          ? `${photoVoteSummary.availableVotes} verfügbar`
          : hasOpenPhotoVotes
          ? `${photoVoteSummary.remainingVotes} offen`
          : `${photoVoteSummary.castVotes}/${photoVoteSummary.availableVotes} Votes`)
        : (activePhotoChallenges.length === 1
          ? (PHOTO_CHALLENGE_ACTION_LABELS[activePhotoChallenges[0].status] || 'Aktiv')
          : `${activePhotoChallenges.length} aktiv`),
      statusTone: hasPhotoVotesAvailable
        ? (!canTrackPhotoVotes ? 'available' : hasOpenPhotoVotes ? 'open' : 'done')
        : 'active',
      priority: 1,
      ctaLabel: hasOpenPhotoVotes
        ? 'Stimmen abgeben'
        : activePhotoChallenges.length === 1
        ? (PHOTO_CHALLENGE_ACTION_LABELS[activePhotoChallenges[0].status] || 'Öffnen')
        : 'Challenges ansehen',
      ctaTarget: activePhotoChallenges.length === 1
        ? `/photo-challenge/${activePhotoChallenges[0].id}`
        : '/photo-challenge',
    },
    tourCampaign?.status === CAMPAIGN_STATUS.ACTIVE && {
      id: 'tour-de-glace-daily',
      type: 'tour_de_glace',
      title: tourOfficialActive ? 'Tour de Glace Tagesetappe' : 'Tour de Glace Preview',
      description: tourOfficialActive
        ? 'Sammle Tagespunkte und suche die Etappensichtung auf der Karte.'
        : 'Das Tippspiel ist geoeffnet. Wertung und Etappensichtungen starten am 04.07.',
      statusLabel: tourOfficialActive ? 'Heute verfuegbar' : 'Tipps offen',
      statusTone: tourOfficialActive ? 'available' : 'active',
      priority: 2,
      ctaLabel: activeDetailPanel === 'tour_de_glace_2026' ? 'Einklappen' : 'Zur Aktion',
      onClick: () => openDetailPanel('tour_de_glace_2026', { toggle: true }),
    },
    summerCampaign?.status === CAMPAIGN_STATUS.ACTIVE && {
      id: 'summer-campaign',
      type: 'summer',
      title: 'Sommer-Sammelaktion',
      description: 'Behalte deinen Sammelfortschritt im Blick.',
      statusLabel: 'Läuft',
      statusTone: 'active',
      priority: 3,
      ctaLabel: 'Fortschritt ansehen',
      onClick: () => openDetailPanel('summer_2026'),
    },
  ].filter(Boolean).sort((left, right) => left.priority - right.priority);
  const visibleTasks = showAllTasks ? taskItems : taskItems.slice(0, 3);
  const runningCampaignCards = activeCampaigns.filter((campaign) => ['summer_2026', 'tour_de_glace_2026'].includes(campaign.id));
  const renderCampaignPanel = (campaign) => {
    if (campaign.id === 'summer_2026') {
      return (
        <SummerCampaignPanel
          key={campaign.id}
          campaign={campaign}
          isLoggedIn={isLoggedIn}
          onLogin={onLogin}
        />
      );
    }

    if (campaign.id === 'tour_de_glace_2026') {
      return (
        <TourDeGlacePanel
          key={campaign.id}
          campaign={campaign}
          isLoggedIn={isLoggedIn}
          onLogin={onLogin}
        />
      );
    }

    return (
      <EasterCampaignPanel
        key={campaign.id}
        campaign={campaign}
        isLoggedIn={isLoggedIn}
        onLogin={onLogin}
      />
    );
  };

  return (
    <OverlayBackground>
      <Overlay>
        <CloseButton onClick={onClose}>&times;</CloseButton>

        <MainHeading>Heute in der Ice-App</MainHeading>
        <IntroText>Alles Wichtige auf einen Blick. Karte, Check-ins und Feed bleiben im Fokus.</IntroText>

        <HubSection>
          <HubSectionHeader>
            <div>
              <HubKicker>Heute zu tun</HubKicker>
              <HubTitle>Offene Aktionen</HubTitle>
            </div>
            {taskItems.length > 0 && <TaskCount>{taskItems.length}</TaskCount>}
          </HubSectionHeader>
          {isPhotoChallengesLoading && taskItems.length === 0 ? (
            <EmptyHubState>Lade aktuelle Aufgaben...</EmptyHubState>
          ) : visibleTasks.length > 0 ? (
            <TaskList>
              {visibleTasks.map((task) => (
                <TaskCard key={task.id} $type={task.type}>
                  <TaskIcon $type={task.type}>
                    {TASK_IMAGES[task.type] ? (
                      <img src={buildPublicAssetUrl(TASK_IMAGES[task.type])} alt="" />
                    ) : (
                      <Trophy size={18} strokeWidth={2.2} />
                    )}
                  </TaskIcon>
                  <TaskContent>
                    <TaskTitleRow>
                      <strong>{task.title}</strong>
                      <TaskStatus $tone={task.statusTone}>{task.statusLabel}</TaskStatus>
                    </TaskTitleRow>
                    <p>{task.description}</p>
                  </TaskContent>
                  {task.ctaTarget ? (
                    <TaskLink to={task.ctaTarget} onClick={onClose}>{task.ctaLabel}</TaskLink>
                  ) : (
                    <TaskButton type="button" onClick={task.onClick}>{task.ctaLabel}</TaskButton>
                  )}
                </TaskCard>
              ))}
            </TaskList>
          ) : (
            <EmptyHubState>Heute ist nichts Dringendes offen. Schau später wieder rein.</EmptyHubState>
          )}
          {taskItems.length > 3 && (
            <InlineToggle type="button" onClick={() => setShowAllTasks((previous) => !previous)}>
              {showAllTasks ? 'Weniger anzeigen' : `${taskItems.length - 3} weitere anzeigen`}
            </InlineToggle>
          )}
        </HubSection>

        {runningCampaignCards.length > 0 && (
          <HubSection>
            <HubSectionHeader>
              <div>
                <HubKicker>Meine laufenden Aktionen</HubKicker>
                <HubTitle>Fortschritt ansehen</HubTitle>
              </div>
            </HubSectionHeader>
            <CampaignSummaryGrid>
              {runningCampaignCards.map((campaign) => (
                <CampaignSummaryCard key={campaign.id}>
                  <CampaignSummaryImage
                    src={buildPublicAssetUrl(campaign.id === 'tour_de_glace_2026'
                      ? TASK_IMAGES.tour_de_glace
                      : TASK_IMAGES.summer)}
                    alt=""
                  />
                  <CampaignSummaryBody>
                    <strong>{campaign.title}</strong>
                    <span>
                      {campaign.id === 'tour_de_glace_2026'
                        ? 'Trikots, Etappen und Tagespunkte'
                        : 'Sammelfortschritt und Aufgaben'}
                    </span>
                    <TaskButton type="button" onClick={() => openDetailPanel(campaign.id, { toggle: true })}>
                      {activeDetailPanel === campaign.id ? 'Einklappen' : 'Details'}
                    </TaskButton>
                  </CampaignSummaryBody>
                </CampaignSummaryCard>
              ))}
            </CampaignSummaryGrid>
            {activeDetailPanel && (
              <DetailPanelWrap ref={detailPanelRef}>
                {renderCampaignPanel(runningCampaignCards.find((campaign) => campaign.id === activeDetailPanel))}
              </DetailPanelWrap>
            )}
          </HubSection>
        )}

        {upcomingCampaigns.length > 0 && (
          <HubSection>
            <HubSectionHeader>
              <div>
                <HubKicker>Bald</HubKicker>
                <HubTitle>Anstehende Events</HubTitle>
              </div>
            </HubSectionHeader>
            <CompactList>
              {upcomingCampaigns.map((campaign) => (
                <CompactListItem key={campaign.id}>
                  <strong>{campaign.title}</strong>
                  <span>{campaign.schedule?.start ? `Start: ${formatCampaignDate(campaign.schedule.start)}` : 'Starttermin folgt'}</span>
                </CompactListItem>
              ))}
            </CompactList>
          </HubSection>
        )}

        <HubSection>
          <HubSectionHeader>
            <div>
              <HubKicker>Community</HubKicker>
              <HubTitle>Nutzer/in des Monats</HubTitle>
            </div>
          </HubSectionHeader>
          {isUserOfMonthLoading ? (
            <EmptyHubState>Lade Community-Highlight...</EmptyHubState>
          ) : currentUser ? (
            <CommunityBlock>
              <FeaturedCommunityCard to={`/user/${currentUser.id}`} onClick={onClose}>
                <FeaturedBadge>
                  <Trophy size={18} strokeWidth={2.3} />
                  <span>Aktuell</span>
                </FeaturedBadge>
                <FeaturedCommunityImage src={currentUser.image} alt={currentUser.name} />
                <FeaturedCommunityText>
                  <strong>{currentUser.name}</strong>
                  <span>{currentUser.month}</span>
                </FeaturedCommunityText>
              </FeaturedCommunityCard>

              {pastUsers.length > 0 && (
                <>
                  <CommunityHistoryToggle
                    type="button"
                    onClick={() => setShowPastUsers((previous) => !previous)}
                    $expanded={showPastUsers}
                  >
                    <History size={17} strokeWidth={2.2} />
                    <span>Vergangene Nutzer des Monats</span>
                    <ChevronDown size={17} strokeWidth={2.2} />
                  </CommunityHistoryToggle>

                  {showPastUsers && (
                    <CommunityHistoryList>
                      {pastUsers.map((user) => (
                        <CommunityHistoryItem key={`${user.id}-${user.month}`} to={`/user/${user.id}`} onClick={onClose}>
                          <CommunityHistoryImage src={user.image} alt={user.name} />
                          <div>
                            <strong>{user.name}</strong>
                            <span>{user.month}</span>
                          </div>
                        </CommunityHistoryItem>
                      ))}
                    </CommunityHistoryList>
                  )}
                </>
              )}
            </CommunityBlock>
          ) : (
            <EmptyHubState>Aktuell kein Community-Highlight verfügbar.</EmptyHubState>
          )}
        </HubSection>

        {hasPastEvents && (
          <ArchiveToggle type="button" onClick={() => setShowArchive((previous) => !previous)}>
            {showArchive ? 'Archiv ausblenden' : 'Archiv & Ergebnisse anzeigen'}
          </ArchiveToggle>
        )}

        {hasPastEvents && showArchive && (
          <>
            <Section>
              <SectionTitle>Ice-App Geburtstagschallenge 2026 - Ergebnisse</SectionTitle>
              <Hint>
                Die Geburtstagschallenge lief vom <strong>6. März 2026</strong> bis zum <strong>22. März 2026</strong>.
                Hier bleibt die Abschlussrangliste historisch sichtbar, die Live-Aktionslogik wurde aus dem regulären Produktfluss entfernt.
              </Hint>
              {isBirthdayLoading ? (
                <Hint>Lade Geburtstags-Rangliste...</Hint>
              ) : birthdayLeaderboard.length === 0 ? (
                <Hint>Keine Geburtstags-Ergebnisse vorhanden.</Hint>
              ) : (
                <LeaderboardList>
                  {visibleBirthdayLeaderboard.map((entry) => (
                    <LeaderboardItem
                      key={`birthday-${entry.user_id}-${entry.rank}`}
                      $highlight={Number(userId) === Number(entry.user_id)}
                      onMouseEnter={() => setActiveBirthdayBreakdownUserId(entry.user_id)}
                      onMouseLeave={() => setActiveBirthdayBreakdownUserId(null)}
                    >
                      <span>#{entry.rank}</span>
                      <UserLink to={`/user/${entry.user_id}`} onClick={onClose}>{entry.username}</UserLink>
                      <strong>{entry.total_xp} XP</strong>
                      {activeBirthdayBreakdownUserId === entry.user_id && (
                        <BreakdownPopover>
                          <PopoverTitle>Punkteaufschlüsselung</PopoverTitle>
                          <BreakdownList>
                            {Object.entries(birthdayBreakdownByUser[entry.user_id]?.breakdown || {})
                              .filter(([, value]) => Number.isFinite(value) && value > 0)
                              .map(([key, value]) => (
                                <BreakdownListItem key={`birthday-${entry.user_id}-${key}`}>
                                  <span>{POINT_LABELS[key] || key}</span>
                                  <strong>+{value} XP</strong>
                                </BreakdownListItem>
                              ))}
                          </BreakdownList>
                          {Object.entries(birthdayBreakdownByUser[entry.user_id]?.breakdown || {})
                            .filter(([, value]) => Number.isFinite(value) && value > 0).length === 0 && (
                              <small>Keine Punkte erfasst.</small>
                            )}
                        </BreakdownPopover>
                      )}
                    </LeaderboardItem>
                  ))}
                </LeaderboardList>
              )}
              {birthdayLeaderboard.length > LEADERBOARD_COLLAPSED_COUNT && (
                <LeaderboardToggleButton type="button" onClick={() => setIsBirthdayExpanded((prev) => !prev)}>
                  {isBirthdayExpanded ? 'Ergebnisse einklappen' : 'Weitere Ergebnisse anzeigen'}
                </LeaderboardToggleButton>
              )}
              {birthdayUserRank && (
                <Hint>
                  Dein Rang: <strong>#{birthdayUserRank.rank}</strong> mit <strong>{birthdayUserRank.total_xp} XP</strong>
                </Hint>
              )}
            </Section>

            <Section>
              <SectionTitle>Eis-Winterolympiade 2026 - Ergebnisse</SectionTitle>
              <Hint>
                Die Eis-Winterolympiade fand vom <strong>6. Februar 2026</strong> bis zum <strong>22. Februar 2026</strong> statt.
                Auch hier bleibt nur die historische Ergebnisansicht sichtbar.
              </Hint>
              {isOlympicsLoading ? (
                <Hint>Lade Olympia-Rangliste...</Hint>
              ) : olympicsLeaderboard.length === 0 ? (
                <Hint>Keine Olympia-Ergebnisse vorhanden.</Hint>
              ) : (
                <LeaderboardList>
                  {visibleOlympicsLeaderboard.map((entry) => (
                    <LeaderboardItem
                      key={`${entry.user_id}-${entry.rank}`}
                      $highlight={Number(userId) === Number(entry.user_id)}
                      onMouseEnter={() => setActiveBreakdownUserId(entry.user_id)}
                      onMouseLeave={() => setActiveBreakdownUserId(null)}
                    >
                      <span>#{entry.rank}</span>
                      <UserLink to={`/user/${entry.user_id}`} onClick={onClose}>{entry.username}</UserLink>
                      <strong>{entry.total_xp} XP</strong>
                      {activeBreakdownUserId === entry.user_id && (
                        <BreakdownPopover>
                          <PopoverTitle>Punkteaufschlüsselung</PopoverTitle>
                          <BreakdownList>
                            {Object.entries(breakdownByUser[entry.user_id]?.breakdown || {})
                              .filter(([, value]) => Number.isFinite(value) && value > 0)
                              .map(([key, value]) => (
                                <BreakdownListItem key={`${entry.user_id}-${key}`}>
                                  <span>{POINT_LABELS[key] || key}</span>
                                  <strong>+{value} XP</strong>
                                </BreakdownListItem>
                              ))}
                          </BreakdownList>
                          {Object.entries(breakdownByUser[entry.user_id]?.breakdown || {})
                            .filter(([, value]) => Number.isFinite(value) && value > 0).length === 0 && (
                              <small>Keine Punkte erfasst.</small>
                            )}
                        </BreakdownPopover>
                      )}
                    </LeaderboardItem>
                  ))}
                </LeaderboardList>
              )}
              {olympicsLeaderboard.length > LEADERBOARD_COLLAPSED_COUNT && (
                <LeaderboardToggleButton type="button" onClick={() => setIsOlympicsExpanded((prev) => !prev)}>
                  {isOlympicsExpanded ? 'Ergebnisse einklappen' : 'Weitere Ergebnisse anzeigen'}
                </LeaderboardToggleButton>
              )}
              {olympicsUserRank && (
                <Hint>
                  Dein Rang: <strong>#{olympicsUserRank.rank}</strong> mit <strong>{olympicsUserRank.total_xp} XP</strong>
                </Hint>
              )}
            </Section>
          </>
        )}
      </Overlay>
    </OverlayBackground>
  );
};

export default ActionsOverviewModal;

const OverlayBackground = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Overlay = styled.div`
  position: relative;
  background: white;
  padding: 1.4rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  width: min(640px, calc(100vw - 24px));
  max-height: min(84vh, calc(100dvh - 24px));
  overflow-y: auto;
  text-align: left;
  @media (max-width: 720px) {
    width: 100vw;
    max-height: 92dvh;
    align-self: flex-end;
    border-radius: 18px 18px 0 0;
    padding: 1rem;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 8px;
  right: 10px;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #888;

  &:hover {
    color: #000;
  }
`;

const Section = styled.section`
  background: #ffffff;
  border-radius: 14px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  padding: 1rem;
  margin-top: 1rem;
`;

const SectionTitle = styled.h3`
  margin: 0 0 0.75rem;
  text-align: center;
`;

const MainHeading = styled.h2`
  margin: 0.4rem 2rem 0.2rem 0;
  text-align: left;
  color: #202124;
`;

const IntroText = styled.p`
  margin: 0 0 1rem;
  color: #5b6270;
  line-height: 1.4;
`;

const HubSection = styled.section`
  border-top: 1px solid #edf0f5;
  padding-top: 0.9rem;
  margin-top: 0.9rem;
`;

const HubSectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  margin-bottom: 0.65rem;
`;

const HubKicker = styled.span`
  display: block;
  color: #6b7280;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const HubTitle = styled.h3`
  margin: 0.1rem 0 0;
  color: #202124;
  font-size: 1rem;
`;

const TaskCount = styled.span`
  display: inline-grid;
  place-items: center;
  min-width: 1.8rem;
  height: 1.8rem;
  border-radius: 999px;
  background: #ffb522;
  color: #2f2100;
  font-weight: 900;
`;

const TaskList = styled.div`
  display: grid;
  gap: 0.55rem;
`;

const TaskCard = styled.article`
  display: grid;
  grid-template-columns: 3.5rem minmax(0, 1fr) auto;
  gap: 0.75rem;
  align-items: center;
  border: 1px solid #e1e6ee;
  border-left: 4px solid ${({ $type }) => ($type === 'photo_challenge' ? '#7c3aed' : $type === 'tour_de_glace' ? '#1f9d55' : '#ffb522')};
  border-radius: 8px;
  background: #ffffff;
  padding: 0.65rem;

  @media (max-width: 560px) {
    grid-template-columns: 3.5rem minmax(0, 1fr);

    a,
    button {
      grid-column: 2;
      justify-self: start;
    }
  }
`;

const TaskIcon = styled.div`
  display: grid;
  place-items: center;
  width: 3.25rem;
  height: 3.25rem;
  border-radius: 8px;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`;

const TaskContent = styled.div`
  min-width: 0;

  p {
    margin: 0.2rem 0 0;
    color: #5b6270;
    font-size: 0.88rem;
    line-height: 1.35;
  }
`;

const TaskTitleRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;

  strong {
    overflow-wrap: anywhere;
  }
`;

const TaskStatus = styled.span`
  border-radius: 999px;
  background: ${({ $tone }) => {
    if ($tone === 'open') return '#ffe0b2';
    if ($tone === 'done') return '#dff4e6';
    if ($tone === 'available') return '#e8ddff';
    return '#eef5ff';
  }};
  color: ${({ $tone }) => {
    if ($tone === 'open') return '#8a4b00';
    if ($tone === 'done') return '#14532d';
    if ($tone === 'available') return '#4c1d95';
    return '#17436f';
  }};
  padding: 0.18rem 0.45rem;
  font-size: 0.72rem;
  font-weight: 800;
`;

const TaskLink = styled(Link)`
  justify-self: end;
  border-radius: 8px;
  background: #1f6feb;
  color: #ffffff;
  padding: 0.48rem 0.65rem;
  text-decoration: none;
  font-size: 0.82rem;
  font-weight: 800;
  white-space: nowrap;
`;

const TaskButton = styled.button`
  justify-self: end;
  border: none;
  border-radius: 8px;
  background: #1f6feb;
  color: #ffffff;
  padding: 0.48rem 0.65rem;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 800;
  cursor: pointer;
  white-space: nowrap;
`;

const InlineToggle = styled.button`
  margin-top: 0.55rem;
  border: none;
  background: transparent;
  color: #1f6feb;
  font-weight: 800;
  cursor: pointer;
  padding: 0.25rem 0;
`;

const EmptyHubState = styled.div`
  border-radius: 8px;
  background: #f5f7fb;
  color: #5b6270;
  padding: 0.75rem;
  line-height: 1.4;
`;

const CampaignSummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 0.6rem;
`;

const CampaignSummaryCard = styled.article`
  display: grid;
  grid-template-columns: 4.1rem minmax(0, 1fr);
  gap: 0.8rem;
  align-items: center;
  border: 1px solid #e1e6ee;
  border-radius: 8px;
  background: #fbfcff;
  padding: 0.7rem;
`;

const CampaignSummaryImage = styled.img`
  width: 4.1rem;
  height: 4.1rem;
  object-fit: contain;
`;

const CampaignSummaryBody = styled.div`
  display: grid;
  gap: 0.35rem;
  min-width: 0;

  strong {
    overflow-wrap: anywhere;
  }

  span {
    color: #5b6270;
    font-size: 0.86rem;
  }

  button {
    justify-self: start;
  }
`;

const DetailPanelWrap = styled.div`
  margin-top: 0.75rem;
`;

const CompactList = styled.div`
  display: grid;
  gap: 0.45rem;
`;

const CompactListItem = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  border-radius: 8px;
  background: #f5f7fb;
  padding: 0.55rem 0.65rem;

  span {
    color: #5b6270;
    font-size: 0.85rem;
  }

  @media (max-width: 520px) {
    display: grid;
  }
`;

const CommunityBlock = styled.div`
  display: grid;
  gap: 0.7rem;
  justify-items: center;
`;

const FeaturedCommunityCard = styled(Link)`
  position: relative;
  display: grid;
  justify-items: center;
  gap: 0.75rem;
  width: min(100%, 340px);
  border: 1px solid #e1e6ee;
  border-radius: 12px;
  background:
    linear-gradient(180deg, #ffffff 0%, #fbfcff 100%);
  box-shadow: 0 12px 28px rgba(24, 39, 75, 0.10);
  padding: 1rem;
  color: inherit;
  text-decoration: none;
  text-align: center;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;

  &:hover {
    border-color: #ffb522;
    box-shadow: 0 16px 34px rgba(24, 39, 75, 0.14);
    transform: translateY(-1px);
  }
`;

const FeaturedBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border-radius: 999px;
  background: #fff4d7;
  color: #7a4a00;
  padding: 0.28rem 0.6rem;
  font-size: 0.78rem;
  font-weight: 900;
`;

const FeaturedCommunityImage = styled.img`
  width: 104px;
  height: 104px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #ffffff;
  box-shadow: 0 8px 22px rgba(24, 39, 75, 0.18);
`;

const FeaturedCommunityText = styled.div`
  display: grid;
  gap: 0.2rem;

  strong {
    color: #202124;
    font-size: 1.18rem;
    line-height: 1.2;
    overflow-wrap: anywhere;
  }

  span {
    color: #5b6270;
    font-size: 0.92rem;
    font-weight: 700;
  }
`;

const CommunityHistoryToggle = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  border: 1px solid #d7dce4;
  border-radius: 999px;
  background: #ffffff;
  color: #303746;
  padding: 0.52rem 0.78rem;
  font: inherit;
  font-size: 0.86rem;
  font-weight: 800;
  cursor: pointer;

  svg:last-child {
    transition: transform 0.2s;
    transform: rotate(${({ $expanded }) => ($expanded ? '180deg' : '0deg')});
  }
`;

const CommunityHistoryList = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.5rem;
`;

const CommunityHistoryItem = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  border: 1px solid #e1e6ee;
  border-radius: 8px;
  background: #fbfcff;
  padding: 0.55rem;
  color: inherit;
  text-decoration: none;

  div {
    min-width: 0;
    display: grid;
  }

  strong {
    overflow-wrap: anywhere;
  }

  span {
    color: #5b6270;
    font-size: 0.84rem;
  }
`;

const CommunityHistoryImage = styled.img`
  width: 42px;
  height: 42px;
  flex: 0 0 auto;
  border-radius: 50%;
  object-fit: cover;
`;

const ArchiveToggle = styled.button`
  width: 100%;
  margin-top: 1rem;
  border: 1px solid #d7dce4;
  border-radius: 8px;
  background: #ffffff;
  color: #303746;
  padding: 0.65rem;
  font-weight: 800;
  cursor: pointer;
`;

const CategoryHeading = styled.h3`
  margin: 1.2rem 0 0.4rem;
  text-align: left;
`;

const CampaignsBlock = styled.div`
  margin-bottom: 2rem;
`;

const SubTitle = styled.h4`
  margin: 1rem 0 0.75rem;
  text-align: center;
`;

const CurrentUserWrapper = styled.div`
  display: flex;
  justify-content: center;
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 1rem;

  @media (max-width: 520px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.65rem;
  }
`;

const UserLink = styled(Link)`
  text-decoration: none;
  color: inherit;
`;

const UserCard = styled.article`
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.10);
  transition: box-shadow 0.2s, transform 0.2s;
  padding: 1rem 0.5rem;
  cursor: pointer;

  &:hover {
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.18);
    transform: translateY(-2px) scale(1.03);
  }
`;

const CurrentUserCard = styled(UserCard)`
  width: 240px;
  padding: 1.4rem 0.9rem;
`;

const UserImage = styled.img`
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 50%;
  display: block;
  margin: 0.4rem auto 0.5rem;
`;

const CurrentUserImage = styled(UserImage)`
  width: 130px;
  height: 130px;
`;

const Month = styled.div`
  font-weight: 700;
`;

const LeaderboardList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.5rem;
`;

const LeaderboardItem = styled.li`
  position: relative;
  display: grid;
  grid-template-columns: 60px 1fr auto;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 0.7rem;
  border-radius: 10px;
  background: ${(props) => (props.$highlight ? '#ffe2a3' : '#f6f6f6')};
  transition: box-shadow 0.2s, transform 0.2s;

  &:hover {
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.18);
    transform: translateY(-2px) scale(1.03);
  }
`;

const BreakdownPopover = styled.div`
  position: absolute;
  left: 50%;
  bottom: calc(100% + 8px);
  transform: translateX(-50%);
  width: min(380px, 90vw);
  background: #fffbe9;
  color: #3a2a00;
  border: 1px solid #ffe2a0;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
  padding: 10px 12px;
  z-index: 20;
  text-align: left;
`;

const PopoverTitle = styled.strong`
  display: block;
  margin-bottom: 0.4rem;
`;

const BreakdownList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.2rem;
`;

const BreakdownListItem = styled.li`
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
`;

const LeaderboardToggleButton = styled.button`
  margin-top: 0.75rem;
  border: none;
  border-radius: 999px;
  padding: 0.45rem 0.8rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: #412500;
  background: #ffd581;
  cursor: pointer;

  &:hover {
    background: #ffe4ad;
  }
`;

const Hint = styled.p`
  margin: 0.6rem 0;
`;
