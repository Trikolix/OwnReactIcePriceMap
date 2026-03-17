import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { buildAssetUrl } from '../utils/assets.jsx';

const POINT_LABELS = {
  checkin_with_photo: 'Check-in mit Bild',
  group_checkin_with_other: 'Check-in mit weiterer Person',
  price_reported: 'Preis gemeldet',
  favorite_shop_added: 'Eisdiele zu Favoriten hinzugefügt',
  invited_user_with_checkin: 'Nutzer eingeladen (mit Check-in)',
  login_days_7: 'An 7 Tagen eingeloggt',
  profile_image: 'Profilbild vorhanden',
  comment_written: 'Kommentar geschrieben',
  rad_event_page_visited: 'Ice-Tour-Seite besucht',
  easter_eggs_3: '3 Geschenke auf der Karte entdeckt',
  photo_challenge_participated: 'An der Fotochallenge teilgenommen',
  checkins_base_ep: 'Check-ins (15 EP je Check-in)',
  checkins_photo_ep: 'Check-ins mit Bild (+5 EP je Check-in)',
  checkins_on_site_ep: 'Vor-Ort-Check-ins (+5 EP je Check-in)',
  price_reported_ep: 'Preis gemeldet (einmalig)',
  favorite_shop_added_ep: 'Eisdiele zu Favoriten hinzugefügt (einmalig)',
  invite_registered_ep: 'Nutzer eingeladen (20 EP je Nutzer)',
  invite_checkin_ep: 'Eingeladener Nutzer mit Check-in (60 EP)',
  login_days_ep: 'Login-Tage (5 EP je Tag)',
  profile_image_ep: 'Profilbild vorhanden (einmalig)',
  comment_ep: 'Kommentare (max. 5 x 5 EP)',
  rad_event_page_ep: 'Ice-Tour-Seite besucht',
  easter_eggs_ep: 'Geschenke auf der Karte entdeckt',
  new_shop_ep: 'Neue Eisdielen eingetragen (max. 3 x 15 EP)',
  challenge_completed_ep: 'Challenges abgeschlossen (45 EP je Challenge)',
  ice_shop_reviewed_ep: 'Eisdielen bewertet (max. 3 x 10 EP)',
  route_submitted_ep: 'Routen eingetragen (max. 3 x 15 EP)',
  photo_challenge_submission_ep: 'Fotochallenge: Bild eingereicht (25 EP je Bild)',
  photo_challenge_vote_ep: 'Fotochallenge: Votes abgegeben',
};

const GROUPED_ACTIONS = {
  checkins_total_ep: {
    label: 'Check-ins (bis zu 25 EP je Check-in)',
    sourceKeys: ['checkins_base_ep', 'checkins_photo_ep', 'checkins_on_site_ep'],
    defaultEP: 25,
    hover: '15 EP für einfachen Check-in + 5 EP für Check-in mit Bild + 5 EP für Vor-Ort-Check-in',
  },
  invited_users_total_ep: {
    label: 'Eingeladene Nutzer (bis zu 80 EP je Nutzer)',
    sourceKeys: ['invite_registered_ep', 'invite_checkin_ep'],
    defaultEP: 80,
    hover: '20 EP für Einladung + 60 EP wenn eingeladener Nutzer einen Check-in macht',
  },
};

const ACTION_DISPLAY_ORDER = [
  'checkins_total_ep',
  'price_reported_ep',
  'favorite_shop_added_ep',
  'invited_users_total_ep',
  'login_days_ep',
  'profile_image_ep',
  'comment_ep',
  'rad_event_page_ep',
  'easter_eggs_ep',
  'new_shop_ep',
  'challenge_completed_ep',
  'ice_shop_reviewed_ep',
  'route_submitted_ep',
  'photo_challenge_submission_ep',
  'photo_challenge_vote_ep',
];

const apiUrl = import.meta.env.VITE_API_BASE_URL;

const MANDATORY_KEYS = [
  'checkin_with_photo',
  'group_checkin_with_other',
  'price_reported',
  'favorite_shop_added',
  'invited_user_with_checkin',
  'login_days_7',
  'profile_image',
  'comment_written',
  'rad_event_page_visited',
  'easter_eggs_3',
  'photo_challenge_participated',
];

// Hilfsfunktion für Default-EP
const getDefaultEP = (key) => {
  const defaults = {
    checkins_total_ep: 25,
    checkins_base_ep: 15,
    checkins_photo_ep: 5,
    checkins_on_site_ep: 5,
    price_reported_ep: 15,
    favorite_shop_added_ep: 5,
    invited_users_total_ep: 80,
    invite_registered_ep: 20,
    invite_checkin_ep: 60,
    login_days_ep: 5,
    profile_image_ep: 15,
    comment_ep: 5,
    rad_event_page_ep: 15,
    easter_eggs_ep: 12,
    new_shop_ep: 15,
    challenge_completed_ep: 45,
    ice_shop_reviewed_ep: 10,
    route_submitted_ep: 15,
    photo_challenge_submission_ep: 25,
    photo_challenge_vote_ep: 5,
  };
  return defaults[key] || 5;
};

const buildActionEntries = (breakdown = {}) => (
  ACTION_DISPLAY_ORDER.map((key) => {
    if (GROUPED_ACTIONS[key]) {
      const group = GROUPED_ACTIONS[key];
      const earnedPoints = group.sourceKeys.reduce((sum, sourceKey) => {
        const value = Number.isFinite(breakdown[sourceKey]) ? breakdown[sourceKey] : 0;
        return sum + value;
      }, 0);

      return {
        key,
        label: group.label,
        points: earnedPoints > 0 ? earnedPoints : group.defaultEP,
        earned: earnedPoints > 0,
        hover: group.hover,
      };
    }

    const earnedPoints = Number.isFinite(breakdown[key]) ? breakdown[key] : 0;
    return {
      key,
      label: POINT_LABELS[key] || key,
      points: earnedPoints > 0 ? earnedPoints : getDefaultEP(key),
      earned: earnedPoints > 0,
      hover: null,
    };
  })
);

const getDetailLabel = (entry, counts = {}) => {
  switch (entry.key) {
    case 'checkins_total_ep':
      return `${counts.checkins_total || 0} Check-ins, ${counts.checkins_with_photo || 0} mit Bild, ${counts.checkins_on_site || 0} vor Ort`;
    case 'price_reported_ep':
      return 'Preis im Aktionszeitraum gemeldet';
    case 'favorite_shop_added_ep':
      return counts.favorite_shops_added_count ? `${counts.favorite_shops_added_count} Favoriten vorhanden` : 'Einmalige Aktion';
    case 'invited_users_total_ep':
      return `${counts.invited_users_count || 0} Einladungen, ${counts.invited_users_with_checkin_count || 0} mit Check-in`;
    case 'login_days_ep':
      return `${counts.login_days || 0} Login-Tage gesammelt`;
    case 'profile_image_ep':
      return 'Profilbild im Zeitraum vorhanden';
    case 'comment_ep':
      return `${counts.comments_unique_targets || 0} kommentierte Einträge`;
    case 'rad_event_page_ep':
      return 'Ice-Tour-Seite besucht';
    case 'easter_eggs_ep':
      return `${counts.easter_eggs_found || 0} Geschenke entdeckt`;
    case 'new_shop_ep':
      return `${counts.new_shops_count || 0} neue Eisdielen eingetragen`;
    case 'challenge_completed_ep':
      return `${counts.challenges_completed || 0} Challenges abgeschlossen`;
    case 'ice_shop_reviewed_ep':
      return `${counts.reviews_count || 0} Eisdielen bewertet`;
    case 'route_submitted_ep':
      return `${counts.routes_count || 0} Routen eingetragen`;
    case 'photo_challenge_submission_ep':
      return `${counts.photo_challenge_submissions_count || 0} Bilder eingereicht`;
    case 'photo_challenge_vote_ep':
      return `${counts.photo_challenge_votes_count || 0} Votes abgegeben`;
    default:
      return null;
  }
};

const getTrendDisplay = (rankChange, rankDelta) => {
  if (rankChange === 'up') {
    return { symbol: '\u2191', label: `${rankDelta || 1}`, tone: 'up' };
  }
  if (rankChange === 'down') {
    return { symbol: '\u2193', label: `${rankDelta || 1}`, tone: 'down' };
  }
  if (rankChange === 'same') {
    return { symbol: '=', label: '', tone: 'same' };
  }
  if (rankChange === 'new') {
    return { symbol: 'Neu', label: '', tone: 'new' };
  }
  return null;
};

const formatCountdown = (targetDate) => {
  const diffMs = targetDate.getTime() - Date.now();
  if (diffMs <= 0) {
    return null;
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days: String(days),
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
  };
};

const BirthdayRulesModal = ({
  open,
  onClose,
  isLoggedIn,
  onLogin,
  points,
  maxPoints = null,
  breakdown = {},
  status = {},
  counts = {},
  mandatoryCompleted = 0,
  mandatoryTotal = 11,
  rewardUnlocked = false,
  leaderboard = [],
  leaderboardFull = [],
  userRank = null,
  isLeaderboardLoading = false,
  isLeaderboardExpanded = false,
  isLeaderboardFullLoading = false,
  onToggleLeaderboard = () => {},
  currentUserId = null,
  extraIceReward = false,
  campaignPhase = 'live',
  anniversaryUnlockedAt = null,
  iceTourRegistrationOpen = true,
  forceLocalUnlock = false,
  awardConfig = null,
}) => {
  const [showAllActions, setShowAllActions] = useState(false);
  const [activeLeaderboardEntry, setActiveLeaderboardEntry] = useState(null);
  const [leaderboardDetailState, setLeaderboardDetailState] = useState({
    loading: false,
    error: null,
    data: null,
  });

  const safeCompleted = Math.max(0, Math.min(mandatoryCompleted, mandatoryTotal));
  const progressPercent = mandatoryTotal > 0 ? Math.round((safeCompleted / mandatoryTotal) * 100) : 0;
  const safePoints = Number.isFinite(points) ? points : 0;
  const activeLeaderboard = (isLeaderboardExpanded && leaderboardFull.length > 0)
    ? leaderboardFull
    : leaderboard;

  const fallbackAwardLevels = [
    { threshold: 100, icon_path: '/assets/birthday_bronze.png' },
    { threshold: 200, icon_path: '/assets/birthday_silver.png' },
    { threshold: 500, icon_path: '/assets/birthday_gold.png' },
  ];
  const awardLevels = Array.isArray(awardConfig?.levels) && awardConfig.levels.length > 0
    ? awardConfig.levels
        .filter((level) => Number(level?.threshold) > 0 && level?.icon_path)
        .map((level) => ({
          threshold: Number(level.threshold),
          icon_path: String(level.icon_path),
          title: level?.title || null,
        }))
    : fallbackAwardLevels;
  const awardThresholds = awardLevels.map((level) => level.threshold);
  const now = new Date();
  const safeMaxPoints = Number.isFinite(maxPoints) && maxPoints > 0 ? maxPoints : 0;
  const progressMaxPoints = Math.max(1, safeMaxPoints, ...awardThresholds);
  const pointsProgressPercent = Math.min((safePoints / progressMaxPoints) * 100, 100);
  const getMarkerLeftPercent = (threshold) => {
    const rawPercent = (threshold / progressMaxPoints) * 100;
    return Math.min(92, Math.max(8, rawPercent));
  };
  const defaultUnlockDate = new Date('2026-03-15T18:00:00+01:00');
  const parsedUnlockDate = anniversaryUnlockedAt ? new Date(anniversaryUnlockedAt) : null;
  const unlockDate = parsedUnlockDate && !Number.isNaN(parsedUnlockDate.getTime())
    ? parsedUnlockDate
    : defaultUnlockDate;
  const eventUnlocked = forceLocalUnlock || now >= unlockDate;
  const isCountdownFinished = now >= unlockDate;
  const tourRegistrationUnlocked = forceLocalUnlock || (eventUnlocked && Boolean(iceTourRegistrationOpen));
  const [countdownValue, setCountdownValue] = useState(() => formatCountdown(unlockDate));
  const actionEntries = buildActionEntries(breakdown)
    .filter((key) => key.key !== 'rad_event_page_ep' || eventUnlocked);
  const earnedActionEntries = useMemo(
    () => actionEntries.filter((entry) => entry.earned),
    [actionEntries]
  );
  const displayedActionEntries = showAllActions ? actionEntries : earnedActionEntries;
  const hasHiddenActions = actionEntries.length > earnedActionEntries.length;
  const detailedActionEntries = useMemo(
    () => displayedActionEntries.map((entry) => ({
      ...entry,
      detailLabel: getDetailLabel(entry, counts) || entry.hover || (entry.earned ? 'EP im Aktionszeitraum gesammelt' : 'Noch nicht erreicht'),
    })),
    [counts, displayedActionEntries]
  );
  const leaderboardDetailEntries = useMemo(() => {
    const detailBreakdown = leaderboardDetailState.data?.points?.breakdown || {};
    const entries = buildActionEntries(detailBreakdown).filter((entry) => entry.earned);
    return entries.map((entry) => ({
      ...entry,
      detailLabel: getDetailLabel(entry, leaderboardDetailState.data?.counts || {}),
    }));
  }, [leaderboardDetailState.data]);

  useEffect(() => {
    if (isCountdownFinished) {
      setCountdownValue(null);
      return undefined;
    }

    const updateCountdown = () => {
      setCountdownValue(formatCountdown(unlockDate));
    };

    updateCountdown();
    const timerId = window.setInterval(updateCountdown, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [isCountdownFinished, unlockDate.getTime()]);

  const loadLeaderboardDetails = async (entry) => {
    setActiveLeaderboardEntry(entry);
    setLeaderboardDetailState({
      loading: true,
      error: null,
      data: null,
    });

    try {
      const response = await fetch(`${apiUrl}/api/birthday_progress.php?user_id=${entry.user_id}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setLeaderboardDetailState({
        loading: false,
        error: data?.error || null,
        data: data?.error ? null : data,
      });
    } catch (error) {
      console.error('Fehler beim Laden der Birthday-Details:', error);
      setLeaderboardDetailState({
        loading: false,
        error: 'Details konnten nicht geladen werden.',
        data: null,
      });
    }
  };

  const closeLeaderboardDetails = () => {
    setActiveLeaderboardEntry(null);
    setLeaderboardDetailState({
      loading: false,
      error: null,
      data: null,
    });
  };

  if (!open) {
    return null;
  }

  return (
    <OverlayBackground>
      <Overlay>
        <CloseButton onClick={onClose}>&times;</CloseButton>
        <h2>🎂🍦 Ice-App Geburtstagsaktion</h2>
        <p>
          Die Ice-App wird am <strong>14. März</strong> ein Jahr alt, deshalb gibt es im Aktionszeitraum vom <strong>6.–22. März</strong> eine Reihe toller Aktionen, um das zu feiern.
        </p>
        {!isCountdownFinished && (
          <CountdownBox>
            <p style={{ textAlign: 'center' }}>Am 15. März um 18 Uhr wird es eine große Veröffentlichung geben, seid gespannt!</p>
            {countdownValue ? (
              <CountdownGrid>
                <CountdownTile>
                  <strong>{countdownValue.days}</strong>
                  <span>Tage</span>
                </CountdownTile>
                <CountdownTile>
                  <strong>{countdownValue.hours}</strong>
                  <span>Stunden</span>
                </CountdownTile>
                <CountdownTile>
                  <strong>{countdownValue.minutes}</strong>
                  <span>Minuten</span>
                </CountdownTile>
                <CountdownTile>
                  <strong>{countdownValue.seconds}</strong>
                  <span>Sekunden</span>
                </CountdownTile>
              </CountdownGrid>
            ) : (
              <CountdownDone>Es ist so weit!</CountdownDone>
            )}
          </CountdownBox>
        )}
        {isCountdownFinished && (
          <CountdownBox>
            <h3>Ice-Tour</h3>
            <p style={{ textAlign: 'center' }}>
              Am 16. Mai findet die <a href="/#/ice-tour" style={{ color: '#ffb522', fontWeight: 900, textDecoration: 'none', cursor: 'pointer', display: 'inline-block' }}>Ice-Tour</a> statt: ein gemeinsames Rad-Event mit einer tollen Strecke
              und vielen großartigen Eisdielen entlang der Route.
            </p>
          </CountdownBox>
        )}
        <ProgressLabel>EP-Fortschritt</ProgressLabel>
        <ProgressBar style={{ marginBottom: '3rem', height: '18px', background: '#eaf2fa', marginTop: '2.5rem' }}>
          <ProgressFill style={{ width: `${pointsProgressPercent}%`, height: '100%', background: 'linear-gradient(90deg, #ffb522, #ff7a18)' }} />
          {awardLevels.map((level, idx) => (
            <ProgressMarker key={level.threshold} style={{ left: `${getMarkerLeftPercent(level.threshold)}%`, top: '-30px' }}>
              <img
                src={buildAssetUrl(level.icon_path)}
                alt={level.title || `Award ${idx + 1}`}
                style={{ height: '64px', opacity: safePoints >= level.threshold ? 1 : 0.35, filter: safePoints >= level.threshold ? 'none' : 'grayscale(1)' }}
              />
              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: safePoints >= level.threshold ? '#0f7c2f' : '#888' }}>
                {safePoints >= level.threshold ? 'Freigeschaltet' : `${level.threshold} EP`}
              </div>
            </ProgressMarker>
          ))}
        </ProgressBar>

        <LeaderboardSection>
          <LeaderboardTitle>🏆 Bestenliste</LeaderboardTitle>
          {isLeaderboardLoading ? (
            <LeaderboardHint>Lade Bestenliste…</LeaderboardHint>
          ) : (
            <>
              {userRank && (
                <LeaderboardOwn>
                  <span>Dein Rang</span>
                  <strong>#{userRank.rank}</strong>
                  <span>{userRank.total_xp} XP</span>
                </LeaderboardOwn>
              )}
              {activeLeaderboard.length > 0 ? (
                <LeaderboardList>
                  {activeLeaderboard.map((entry) => (
                    <LeaderboardRow
                      key={`${entry.user_id}-${entry.rank}`}
                      role="button"
                      tabIndex={0}
                      $highlight={currentUserId && Number(entry.user_id) === Number(currentUserId)}
                      onClick={() => loadLeaderboardDetails(entry)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          loadLeaderboardDetails(entry);
                        }
                      }}
                      aria-label={`Punkteaufschlüsselung von ${entry.username} anzeigen`}
                    >
                      <LeaderboardRank>#{entry.rank}</LeaderboardRank>
                      <LeaderboardUserCell>
                        <span>
                          <UserLink
                            to={`/user/${entry.user_id}`}
                            onClick={(event) => event.stopPropagation()}
                          >
                            {entry.username}
                          </UserLink>
                        </span>
                        <LeaderboardRowHint>Details anzeigen</LeaderboardRowHint>
                      </LeaderboardUserCell>
                      <LeaderboardRowMeta>
                        {getTrendDisplay(entry.rank_change, entry.rank_delta) && (
                          <RankTrendBadge $tone={getTrendDisplay(entry.rank_change, entry.rank_delta).tone}>
                            <span>{getTrendDisplay(entry.rank_change, entry.rank_delta).symbol}</span>
                            {getTrendDisplay(entry.rank_change, entry.rank_delta).label && (
                              <small>{getTrendDisplay(entry.rank_change, entry.rank_delta).label}</small>
                            )}
                          </RankTrendBadge>
                        )}
                        <strong>{entry.total_xp} XP</strong>
                      </LeaderboardRowMeta>
                    </LeaderboardRow>
                  ))}
                </LeaderboardList>
              ) : (
                <LeaderboardHint>Noch keine Einträge vorhanden.</LeaderboardHint>
              )}
              <LeaderboardToggle
                type="button"
                onClick={() => onToggleLeaderboard(!isLeaderboardExpanded)}
                disabled={isLeaderboardFullLoading}
              >
                {isLeaderboardExpanded ? 'Leaderboard einklappen' : 'Gesamtes Leaderboard anzeigen'}
              </LeaderboardToggle>
            </>
          )}
        </LeaderboardSection>

        {/* EP-Aktionen & Aufschlüsselung vereinigt */}
        <ActionSummary>
          <ActionSummaryTitle>EP-Aktionen</ActionSummaryTitle>
          <ActionSummaryIntro>
            Für diese Aktionen erhältst du EP. Jede Karte zeigt dir direkt, wofür du Punkte bekommst oder was noch offen ist.
          </ActionSummaryIntro>
          {hasHiddenActions && (
            <ActionToggleButton type="button" onClick={() => setShowAllActions((prev) => !prev)}>
              {showAllActions ? 'Nur bereits erhaltene EP-Aktionen' : 'Weitere mögliche EP-Aktionen anzeigen'}
            </ActionToggleButton>
          )}
          <ActionList>
            {detailedActionEntries.map((entry) => {
              return (
                <ActionItem
                  key={entry.key}
                  $done={entry.earned}
                >
                  <ActionTextBlock>
                    <strong>{entry.label}</strong>
                    {entry.detailLabel && <ActionMeta>{entry.detailLabel}</ActionMeta>}
                  </ActionTextBlock>
                  <ActionState $done={entry.earned}>+{entry.points} EP</ActionState>
                </ActionItem>
              );
            })}
            {!displayedActionEntries.length && (
              <LeaderboardHint>Noch keine EP-Aktionen erreicht.</LeaderboardHint>
            )}
          </ActionList>

        </ActionSummary>

        {eventUnlocked && (
          <CountdownBox style={{ marginTop: '1.5rem' }}>
            <h3 style={{ margin: '0 0 0.5rem', color: '#2b1b00' }}>Sonderaktion: Ice-Tour</h3>
            <p>
              Es ist öffentlich: Es wird eine <a href="/ice-tour" style={{ color: '#ffb522', fontWeight: 700, textDecoration: 'none', cursor: 'pointer', display: 'inline-block' }}>Ice-Tour</a> geben! Alle, die bis zum Ende des Aktionszeitraum alle Pflichtaktionen erledigt haben, erhalten ein kostenloses Eis
              am Start / Ziel der Ice-Tour.
            </p>
            <ProgressLabel>Pflichtaktionen-Fortschritt</ProgressLabel>
            <ProgressBar style={{ marginBottom: '0.5rem', height: '12px', background: '#eaf2fa' }}>
              <ProgressFill style={{ width: `${progressPercent}%` }} />
            </ProgressBar>
            <ActionList>
              {MANDATORY_KEYS.map((key) => (
                <ActionItem key={key} $done={!!status[key]}>
                  <span>{POINT_LABELS[key] || key}</span>
                  <ActionState>{status[key] ? 'Erfüllt' : 'Offen'}</ActionState>
                </ActionItem>
              ))}
            </ActionList>
            <div style={{ marginTop: '10px' }}>
              {extraIceReward && (
                <RewardOk>
                  Zusatzaktion: Du hast alle Aufgaben abgeschlossen und kannst dir am 16. Mai bei Karl mag's süß, dem Start / Ziel Ort der Ice-Tour, ein Eis abholen.
                </RewardOk>
              )}
              <TourGateBox>
                {tourRegistrationUnlocked ? (
                    <TourCtaLink to="/ice-tour">Zur Ice-Tour</TourCtaLink>
                ) : (
                  <TourGateText>Anmeldung folgt in Kürze.</TourGateText>
                )}
              </TourGateBox>
            </div>
          </CountdownBox>
        )}

        {!isLoggedIn && (
          <div>
            <p>Bitte logge dich ein oder registriere dich, um teilzunehmen.</p>
            <LoginButton type="button" onClick={onLogin}>Login / Registrieren</LoginButton>
          </div>
        )}

        {activeLeaderboardEntry && (
          <LeaderboardDetailBackdrop onClick={closeLeaderboardDetails}>
            <LeaderboardDetailCard onClick={(event) => event.stopPropagation()}>
              <LeaderboardDetailClose type="button" onClick={closeLeaderboardDetails} aria-label="Detailansicht schließen">
                &times;
              </LeaderboardDetailClose>
              <LeaderboardDetailEyebrow>Punkteaufschlüsselung</LeaderboardDetailEyebrow>
              <LeaderboardDetailTitle>
                {activeLeaderboardEntry.username}
              </LeaderboardDetailTitle>
              <LeaderboardDetailSummary>
                <span>Rang #{activeLeaderboardEntry.rank}</span>
                <strong>{activeLeaderboardEntry.total_xp} XP</strong>
              </LeaderboardDetailSummary>

              {leaderboardDetailState.loading && (
                <LeaderboardHint>Lade Detaildaten…</LeaderboardHint>
              )}

              {!leaderboardDetailState.loading && leaderboardDetailState.error && (
                <LeaderboardHint>{leaderboardDetailState.error}</LeaderboardHint>
              )}

              {!leaderboardDetailState.loading && !leaderboardDetailState.error && leaderboardDetailState.data && (
                <>
                  <LeaderboardDetailList>
                    {leaderboardDetailEntries.map((entry) => (
                      <LeaderboardDetailItem key={`${activeLeaderboardEntry.user_id}-${entry.key}`}>
                        <div>
                          <strong>{entry.label}</strong>
                          {entry.detailLabel && <LeaderboardDetailMeta>{entry.detailLabel}</LeaderboardDetailMeta>}
                        </div>
                        <LeaderboardDetailPoints>+{entry.points} EP</LeaderboardDetailPoints>
                      </LeaderboardDetailItem>
                    ))}
                  </LeaderboardDetailList>

                  {leaderboardDetailEntries.length === 0 && (
                    <LeaderboardHint>Noch keine verdienten EP-Aktionen.</LeaderboardHint>
                  )}
                </>
              )}
            </LeaderboardDetailCard>
          </LeaderboardDetailBackdrop>
        )}
      </Overlay>
    </OverlayBackground>
  );
};

export default BirthdayRulesModal;

const OverlayBackground = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Overlay = styled.div`
  position: relative;
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  text-align: center;
  max-width: 90%;
  width: 460px;
  max-height: 84vh;
  overflow-y: auto;
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
`;

const CountdownBox = styled.div`
  margin: 0.25rem 0 0.85rem;
  padding: 12px;
  border-radius: 16px;
  background: radial-gradient(circle at top, #fff7de 0%, #ffe6ad 100%);
  border: 1px solid #ffc86b;
  box-shadow: 0 10px 22px rgba(255, 170, 35, 0.22);
  color: #6b3f00;

  p {
    margin: 0 0 0.6rem;
    font-weight: 700;
    text-align: left;
  }
`;

const CountdownGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;

  @media (max-width: 520px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const CountdownTile = styled.div`
  display: grid;
  justify-items: center;
  align-items: center;
  gap: 2px;
  min-height: 64px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #ffd58f;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);

  strong {
    font-size: 1.25rem;
    line-height: 1;
    letter-spacing: 0.04em;
    color: #ab4f00;
  }

  span {
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #7f5a28;
  }
`;

const CountdownDone = styled.strong`
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 44px;
  border-radius: 10px;
  background: #fff;
  border: 1px solid #ffd58f;
  color: #ab4f00;
  font-size: 1rem;
`;

const AnnouncementBox = styled.div`
  margin: 0.25rem 0 0.85rem;
  padding: 12px 14px;
  border-radius: 12px;
  background: linear-gradient(135deg, #fff2c2, #ffd98f);
  border: 1px solid #ffb74d;
  color: #3a2200;
  text-align: left;

  h3 {
    margin: 0 0 0.35rem;
    font-size: 1rem;
    color: #7a4200;
  }

  p {
    margin: 0;
    font-weight: 700;
    line-height: 1.35;
  }
`;

const ProgressLabel = styled.p`
  margin: 0.75rem 0 0.8rem;
  font-weight: 700;
`;

const ProgressBar = styled.div`
  position: relative;
  height: 12px;
  border-radius: 999px;
  background: #f1f1f1;
  margin-bottom: 1.5rem;
`;

const ProgressFill = styled.div`
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #ffb522, #ff7a18);
  transition: width 0.25s ease;
`;

const ProgressMarker = styled.span`
  position: absolute;
  top: -8px;
  transform: translateX(-50%);
  font-size: 0.72rem;
  color: #666;
  display: flex;
  flex-direction: column;
  align-items: center;

  img {
    transition: transform 0.18s cubic-bezier(.4,1.4,.6,1.0);
    will-change: transform;
  }
  &:hover img, &:focus img {
    transform: scale(1.18);
    z-index: 2;
  }
`;

const RewardOk = styled.span`
  color: #0f7c2f;
  font-weight: 700;
`;

const RewardPending = styled.span`
  color: #8a5a00;
  font-weight: 700;
`;

const ActionSummary = styled.div`
  text-align: center;
  margin-top: 1.75rem;
`;

const ActionSummaryTitle = styled.p`
  margin: 0.7rem 0 0.35rem;
  font-weight: 700;
`;

const ActionSummaryIntro = styled.p`
  margin: 0 0 0.7rem;
  color: #5d4a24;
  font-size: 0.92rem;
  line-height: 1.4;
`;

const ActionToggleButton = styled.button`
  margin-bottom: 0.6rem;
  background: #ffffff;
  border: 1px solid #e0c48a;
  border-radius: 999px;
  padding: 6px 12px;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.85rem;
  color: #3a2a00;
`;

const ActionList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 8px;
`;

const ActionItem = styled.li`
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-start;
  padding: 11px 12px;
  border-radius: 14px;
  background: ${(props) => (props.$done ? '#fff8eb' : '#f6f6f6')};
  border: 1px solid ${(props) => (props.$done ? 'rgba(224, 196, 138, 0.75)' : 'rgba(0, 0, 0, 0.06)')};
  color: ${(props) => (props.$done ? '#3a2a00' : '#7a7a7a')};
  text-align: left;
`;

const ActionTextBlock = styled.div`
  display: grid;
  gap: 4px;

  strong {
    font-size: 0.92rem;
  }
`;

const ActionMeta = styled.div`
  color: #7a6336;
  font-size: 0.82rem;
  line-height: 1.35;
`;

const ActionState = styled.strong`
  white-space: nowrap;
  color: ${(props) => (props.$done ? '#a24f00' : '#8a8a8a')};
  font-size: 0.86rem;
  padding-top: 1px;
`;

const LeaderboardSection = styled.div`
  margin-top: 1rem;
  text-align: center;
  background: #f8f1e6;
  border-radius: 12px;
  padding: 12px 2px;
`;

const LeaderboardTitle = styled.p`
  margin: 0 0 0.5rem;
  font-weight: 700;
  color: #2b1b00;
`;

const LeaderboardList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 6px;
  text-align: left;
`;

const LeaderboardRow = styled.li`
  display: grid;
  grid-template-columns: 48px 1fr auto;
  align-items: center;
  gap: 4px;
  width: 94%;
  padding: 2px 12px;
  border-radius: 12px;
  background: ${(props) => (props.$highlight ? '#ffd27a' : '#ffffff')};
  color: #3a2a00;
  font-size: 0.9rem;
  border: 1px solid ${(props) => (props.$highlight ? 'rgba(255, 149, 0, 0.35)' : 'rgba(112, 72, 24, 0.10)')};
  box-shadow: 0 8px 18px rgba(88, 56, 16, 0.08);
  cursor: pointer;
  text-align: left;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, background 0.18s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 14px 28px rgba(88, 56, 16, 0.16);
    border-color: rgba(255, 149, 0, 0.42);
    background: ${(props) => (props.$highlight ? '#ffd27a' : '#fff8ed')};
  }

  &:focus-visible {
    outline: 3px solid rgba(255, 181, 34, 0.45);
    outline-offset: 2px;
  }
`;

const LeaderboardRank = styled.span`
  font-weight: 800;
`;

const LeaderboardUserCell = styled.span`
  display: grid;
  gap: 2px;
`;

const LeaderboardRowMeta = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
`;

const LeaderboardRowHint = styled.small`
  color: #8a6a2e;
  font-size: 0.72rem;
`;

const RankTrendBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 40px;
  justify-content: center;
  border-radius: 999px;
  padding: 3px 9px;
  font-size: 0.76rem;
  font-weight: 800;
  background: ${({ $tone }) => {
    if ($tone === 'up') return 'rgba(15, 124, 47, 0.12)';
    if ($tone === 'down') return 'rgba(191, 38, 0, 0.12)';
    if ($tone === 'new') return 'rgba(255, 181, 34, 0.18)';
    if ($tone === 'same') return 'rgba(30, 64, 175, 0.14)';
    return 'rgba(47, 33, 0, 0.08)';
  }};
  color: ${({ $tone }) => {
    if ($tone === 'up') return '#0f7c2f';
    if ($tone === 'down') return '#bf2600';
    if ($tone === 'new') return '#8a5a00';
    if ($tone === 'same') return '#1d4ed8';
    return '#6f5b3a';
  }};
  border: 1px solid ${({ $tone }) => ($tone === 'same' ? 'rgba(37, 99, 235, 0.32)' : 'transparent')};

  small {
    font-size: 0.7rem;
  }
`;

const LeaderboardOwn = styled.div`
  display: grid;
  text-align: left;
  grid-template-columns: 1fr auto auto;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
  padding: 8px 10px;
  border-radius: 10px;
  background: #ffb522;
  color: #2b1b00;
  font-weight: 700;
`;

const LeaderboardHint = styled.p`
  margin: 0.5rem 0 0;
  color: #6f5b3a;
  font-size: 0.85rem;
`;

const LeaderboardToggle = styled.button`
  margin-top: 0.6rem;
  background: #ffffff;
  border: 1px solid #e0c48a;
  border-radius: 999px;
  padding: 6px 12px;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.85rem;
  color: #3a2a00;
`;

const TourGateBox = styled.div`
  margin-top: 12px;
  display: grid;
  gap: 8px;
  justify-items: center;
`;

const TourGateText = styled.div`
  font-weight: 700;
  color: #2b1b00;
`;

const TourCtaLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  background: #ffb522;
  color: #2b1b00;
  border-radius: 999px;
  padding: 8px 14px;
  font-weight: 800;
`;

const LoginButton = styled.button`
  background: #ffb522;
  border: none;
  border-radius: 10px;
  padding: 8px 12px;
  cursor: pointer;
  font-weight: 700;
`;

const UserLink = styled(Link)`
  text-decoration: none;
  color: inherit;
`;

const LeaderboardDetailBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(21, 13, 3, 0.58);
  border: none;
  padding: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
`;

const LeaderboardDetailCard = styled.div`
  position: relative;
  width: min(560px, 100%);
  max-height: min(78vh, 720px);
  overflow-y: auto;
  border: none;
  border-radius: 20px;
  padding: 22px 18px 18px;
  text-align: left;
  background: linear-gradient(180deg, #fff9ef 0%, #ffffff 100%);
  box-shadow: 0 28px 60px rgba(0, 0, 0, 0.28);
  color: #2b1b00;
`;

const LeaderboardDetailClose = styled.button`
  position: absolute;
  top: 10px;
  right: 12px;
  border: none;
  background: transparent;
  color: #8a6a2e;
  font-size: 1.7rem;
  line-height: 1;
  cursor: pointer;
`;

const LeaderboardDetailEyebrow = styled.div`
  color: #8a6a2e;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.72rem;
`;

const LeaderboardDetailTitle = styled.h3`
  margin: 0.25rem 0 0;
  font-size: 1.45rem;
`;

const LeaderboardDetailSummary = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-top: 0.8rem;
  padding: 12px 14px;
  border-radius: 14px;
  background: #fff0cb;
  font-weight: 700;
`;

const LeaderboardDetailList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 1rem 0 0;
  display: grid;
  gap: 10px;
`;

const LeaderboardDetailItem = styled.li`
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-start;
  padding: 12px 14px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid rgba(112, 72, 24, 0.12);
`;

const LeaderboardDetailMeta = styled.div`
  margin-top: 4px;
  color: #7a6336;
  font-size: 0.82rem;
`;

const LeaderboardDetailPoints = styled.strong`
  white-space: nowrap;
  color: #a24f00;
  font-size: 0.95rem;
`;
