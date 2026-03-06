import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { buildAssetUrl } from '../utils/assets.jsx';

const POINT_LABELS = {
  checkin_with_photo: 'Check-in mit Bild',
  group_checkin_with_other: 'Check-in mit weiterer Person',
  price_reported: 'Preis gemeldet',
  favorite_shop_added: 'Eisdiele zu Favoriten hinzugefuegt',
  invited_user_with_checkin: 'Nutzer eingeladen (mit Check-in)',
  login_days_7: 'An 7 Tagen eingeloggt',
  profile_image: 'Profilbild vorhanden',
  comment_written: 'Kommentar geschrieben',
  rad_event_page_visited: 'Eis-Tour-Seite besucht',
  easter_eggs_3: '3 Geschenke auf der Karte entdeckt',
  photo_challenge_participated: 'An der Fotochallenge teilgenommen',
  checkins_base_ep: 'Check-ins (15 EP je Check-in)',
  checkins_photo_ep: 'Check-ins mit Bild (+5 EP je Check-in)',
  checkins_on_site_ep: 'Vor-Ort-Check-ins (+5 EP je Check-in)',
  price_reported_ep: 'Preis gemeldet (einmalig)',
  favorite_shop_added_ep: 'Eisdiele zu Favoriten hinzugefuegt (einmalig)',
  invite_registered_ep: 'Nutzer eingeladen (20 EP je Nutzer)',
  invite_checkin_ep: 'Eingeladener Nutzer mit Check-in (60 EP)',
  login_days_ep: 'Login-Tage (5 EP je Tag)',
  profile_image_ep: 'Profilbild vorhanden (einmalig)',
  comment_ep: 'Kommentare (max. 5 x 5 EP)',
  rad_event_page_ep: 'Eis-Tour-Seite besucht',
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
  eisTourRegistrationOpen = false,
  forceLocalUnlock = false,
  awardConfig = null,
}) => {
  if (!open) {
    return null;
  }

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
  const defaultUnlockDate = new Date('2026-03-14T12:00:00+01:00');
  const parsedUnlockDate = anniversaryUnlockedAt ? new Date(anniversaryUnlockedAt) : null;
  const unlockDate = parsedUnlockDate && !Number.isNaN(parsedUnlockDate.getTime())
    ? parsedUnlockDate
    : defaultUnlockDate;
  const eventUnlocked = forceLocalUnlock || now >= unlockDate;
  const tourRegistrationUnlocked = forceLocalUnlock || (eventUnlocked && Boolean(eisTourRegistrationOpen));
  const actionEntries = ACTION_DISPLAY_ORDER
    .filter((key) => key !== 'rad_event_page_ep' || eventUnlocked)
    .map((key) => {
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
    });
  const [showAllActions, setShowAllActions] = useState(false);
  const earnedActionEntries = useMemo(
    () => actionEntries.filter((entry) => entry.earned),
    [actionEntries]
  );
  const displayedActionEntries = showAllActions ? actionEntries : earnedActionEntries;
  const hasHiddenActions = actionEntries.length > earnedActionEntries.length;

  return (
    <OverlayBackground>
      <Overlay>
        <CloseButton onClick={onClose}>&times;</CloseButton>
        <h2>🎂🍦 Ice-App Geburtstagsaktion</h2>
        <p>
          Die Ice-App wird am <strong>14. März</strong> ein Jahr alt, deshalb gibt es im Aktionszeitraum vom <strong>6.–22. März</strong> eine Reihe toller Aktionen, um das zu feiern.
        </p>
        {!eventUnlocked && (
          <p style={{ color: '#8a5a00', fontWeight: 700 }}>
            Am 14. März wird es eine Zusatzüberraschung geben.
          </p>
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
                      $highlight={currentUserId && Number(entry.user_id) === Number(currentUserId)}
                    >
                      <span>#{entry.rank}</span>
                      <span><UserLink to={`/user/${entry.user_id}`}>{entry.username}</UserLink></span>
                      <strong>{entry.total_xp} XP</strong>
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
          <p style={{margin: '0 0 0.5rem', color: '#444', fontSize: '0.98rem'}}>Für diese Aktionen erhältst du EP. Fahre mit der Maus oder tippe auf eine Aktion für Details/Limits.</p>
          {hasHiddenActions && (
            <ActionToggleButton type="button" onClick={() => setShowAllActions((prev) => !prev)}>
              {showAllActions ? 'Nur bereits erhaltene EP-Aktionen' : 'Weitere mögliche EP-Aktionen anzeigen'}
            </ActionToggleButton>
          )}
          <ActionList>
            {displayedActionEntries.map((entry) => {
              return (
                <ActionItem
                  key={entry.key}
                  $done={entry.earned}
                  {...(entry.hover ? { title: entry.hover || 'Siehe Aktionsbeschreibung' } : {})}
                  style={!entry.earned ? { color: '#aaa', background: '#f5f5f5' } : {}}
                >
                  <span>{entry.label}</span>
                  <ActionState>+{entry.points} EP</ActionState>
                </ActionItem>
              );
            })}
            {!displayedActionEntries.length && (
              <LeaderboardHint>Noch keine EP-Aktionen erreicht.</LeaderboardHint>
            )}
          </ActionList>

        </ActionSummary>

        {eventUnlocked && (
          <div style={{ marginTop: '2rem', background: '#eeeeee', borderRadius: '12px', padding: '18px 12px' }}>
            <h3 style={{ margin: '0 0 0.5rem', color: '#2b1b00' }}>Sonderaktion: Eis-Tour</h3>
            <p>
              Es ist öffentlich: Es wird eine <a href="/eis-tour" style={{ color: '#ffb522', fontWeight: 700, textDecoration: 'none', cursor: 'pointer', display: 'inline-block' }}>Eis-Tour</a> geben! Alle, die bis zum Ende des Aktionszeitraum alle Pflichtaktionen erledigt haben, erhalten ein kostenloses Eis
              am Start / Ziel der Eis-Tour.
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
              {rewardUnlocked ? (
                <RewardOk>Alle Pflichtaktionen geschafft. Eis freigeschaltet.</RewardOk>
              ) : (
                <RewardPending>Noch nicht alle Pflichtaktionen abgeschlossen.</RewardPending>
              )}
              {extraIceReward && (
                <div style={{ marginTop: '10px', color: '#0f7c2f', fontWeight: 700 }}>
                  🎉 Zusatzaktion: Du hast alle Aktionen abgeschlossen und erhältst ein Eis!
                </div>
              )}
              <TourGateBox>
                {tourRegistrationUnlocked ? (
                  <>
                    <TourGateText>Jetzt anmelden.</TourGateText>
                    <TourCtaLink to="/event-registration">Zur Eis-Tour-Anmeldung</TourCtaLink>
                  </>
                ) : (
                  <TourGateText>Anmeldung folgt in Kürze.</TourGateText>
                )}
              </TourGateBox>
            </div>
          </div>
        )}

        {!isLoggedIn && (
          <div>
            <p>Bitte logge dich ein oder registriere dich, um teilzunehmen.</p>
            <LoginButton type="button" onClick={onLogin}>Login / Registrieren</LoginButton>
          </div>
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
  padding: 2rem 2.5rem;
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
  gap: 6px;
`;

const ActionItem = styled.li`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
  padding: 6px 10px;
  border-radius: 10px;
  background: ${(props) => (props.$done ? '#fff4db' : '#f5f5f5')};
  color: ${(props) => (props.$done ? '#3a2a00' : '#777')};
  font-size: 0.9rem;
`;

const ActionState = styled.strong`
  font-size: 0.82rem;
`;

const LeaderboardSection = styled.div`
  margin-top: 1rem;
  text-align: center;
  background: #f8f1e6;
  border-radius: 12px;
  padding: 12px;
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
  gap: 8px;
  padding: 6px 8px;
  border-radius: 8px;
  background: ${(props) => (props.$highlight ? '#ffd27a' : '#ffffff')};
  color: #3a2a00;
  font-size: 0.9rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
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
