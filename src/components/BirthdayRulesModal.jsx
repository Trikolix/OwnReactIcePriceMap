import styled from 'styled-components';
import { Link } from 'react-router-dom';

const POINT_LABELS = {
  checkin_with_photo: 'Check-in mit Bild',
  group_checkin_with_other: 'Check-in mit weiterer Person',
  price_reported: 'Preis gemeldet',
  invited_user_with_checkin: 'Nutzer eingeladen (mit Check-in)',
  login_days_7: 'An 7 Tagen eingeloggt',
  profile_image: 'Profilbild vorhanden',
  comment_written: 'Kommentar geschrieben',
  rad_event_page_visited: 'Eis-Tour-Seite besucht',
  easter_eggs_3: '3 Easter Eggs gefunden',
  photo_challenge_participated: 'An der Fotochallenge teilgenommen',
  checkins_base_ep: 'Check-ins (15 EP je Check-in)',
  checkins_photo_ep: 'Check-ins mit Bild (+5 EP je Check-in)',
  checkins_on_site_ep: 'Vor-Ort-Check-ins (+5 EP je Check-in)',
  price_reported_ep: 'Preis gemeldet (einmalig)',
  invite_registered_ep: 'Nutzer eingeladen (20 EP je Nutzer)',
  invite_checkin_ep: 'Eingeladener Nutzer mit Check-in (60 EP)',
  login_days_ep: 'Login-Tage (5 EP je Tag)',
  profile_image_ep: 'Profilbild vorhanden (einmalig)',
  comment_ep: 'Kommentare (max. 5 x 5 EP)',
  rad_event_page_ep: 'Eis-Tour-Seite besucht',
  easter_eggs_ep: 'Easter Eggs gefunden',
  new_shop_ep: 'Neue Eisdielen (max. 3 x 15 EP)',
  challenge_completed_ep: 'Challenges abgeschlossen (45 EP je Challenge)',
  ice_shop_reviewed_ep: 'Eisdielen bewertet (max. 3 x 10 EP)',
  route_submitted_ep: 'Routen eingetragen (max. 3 x 15 EP)',
  photo_challenge_submission_ep: 'Fotochallenge: Bild eingereicht (40 EP je Bild)',
  photo_challenge_vote_ep: 'Fotochallenge: Votes abgegeben',
};

const MANDATORY_KEYS = [
  'checkin_with_photo',
  'group_checkin_with_other',
  'price_reported',
  'invited_user_with_checkin',
  'login_days_7',
  'profile_image',
  'comment_written',
  'rad_event_page_visited',
  'easter_eggs_3',
  'photo_challenge_participated',
];

const PROGRESS_MARKERS = [
  { value: 25, label: '25%' },
  { value: 50, label: '50%' },
  { value: 75, label: '75%' },
  { value: 100, label: '100%' },
];

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
  mandatoryTotal = 10,
  rewardUnlocked = false,
  leaderboard = [],
  leaderboardFull = [],
  userRank = null,
  isLeaderboardLoading = false,
  isLeaderboardExpanded = false,
  isLeaderboardFullLoading = false,
  onToggleLeaderboard = () => {},
  currentUserId = null,
}) => {
  if (!open) {
    return null;
  }

  const safeCompleted = Math.max(0, Math.min(mandatoryCompleted, mandatoryTotal));
  const progressPercent = mandatoryTotal > 0 ? Math.round((safeCompleted / mandatoryTotal) * 100) : 0;
  const safePoints = Number.isFinite(points) ? points : 0;
  const hasPointCap = Number.isFinite(maxPoints) && maxPoints > 0;
  const activeLeaderboard = (isLeaderboardExpanded && leaderboardFull.length > 0)
    ? leaderboardFull
    : leaderboard;

  return (
    <OverlayBackground>
      <Overlay>
        <CloseButton onClick={onClose}>&times;</CloseButton>
        <h2>🎂🍦 Ice-App Geburtstagsaktion</h2>
        <p>
          Die Ice-App wird am <strong>14. März</strong> ein Jahr alt, deshalb gibt es eine Reihe toller Aktionen,
          um das zu feiern.
        </p>
        <p>
          Sammle EP, steige in der Rangliste auf und schließe alle 10 unten gelisteten Aktionen ab.
          Dann erhältst du ein Kugel Eis spendiert.*
        </p>
        <p>
          <small>* Teilnahmebedingungen werden noch ergänzt.</small>
        </p>

        <ProgressLabel>Pflichtaktionen: {safeCompleted}/{mandatoryTotal}</ProgressLabel>
        <ProgressBar>
          <ProgressFill style={{ width: `${progressPercent}%` }} />
          {PROGRESS_MARKERS.map((marker) => (
            <ProgressMarker key={marker.value} style={{ left: `${marker.value}%` }}>
              {marker.label}
            </ProgressMarker>
          ))}
        </ProgressBar>

        <StatusInfo>
          <strong>{progressPercent}%</strong> Fortschritt
          <br />
          Punkte: <strong>{safePoints} EP{hasPointCap ? ` / ${maxPoints} EP` : ''}</strong>
          <br />
          Login-Tage: <strong>{counts.login_days || 0}/7</strong>
          <br />
          Easter Eggs: <strong>{counts.easter_eggs_found || 0}/3</strong>
          <br />
          {rewardUnlocked ? (
            <RewardOk>Alle Pflichtaktionen geschafft. Eis freigeschaltet.</RewardOk>
          ) : (
            <RewardPending>Noch nicht alle Pflichtaktionen abgeschlossen.</RewardPending>
          )}
        </StatusInfo>

        <ActionSummary>
          <ActionSummaryTitle>Pflichtaktionen</ActionSummaryTitle>
          <ActionList>
            {MANDATORY_KEYS.map((key) => (
              <ActionItem key={key} $done={!!status[key]}>
                <span>{POINT_LABELS[key] || key}</span>
                <ActionState>{status[key] ? 'Erfüllt' : 'Offen'}</ActionState>
              </ActionItem>
            ))}
          </ActionList>
          <ActionSummaryTitle>EP-Aufschlüsselung</ActionSummaryTitle>
          <ActionList>
            {Object.keys(breakdown)
              .filter((key) => Number.isFinite(breakdown[key]) && breakdown[key] > 0)
              .map((key) => (
                <ActionItem key={key} $done>
                  <span>{POINT_LABELS[key] || key}</span>
                  <ActionState>+{breakdown[key] || 0} EP</ActionState>
                </ActionItem>
              ))}
          </ActionList>
        </ActionSummary>

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
  top: 16px;
  transform: translateX(-50%);
  font-size: 0.72rem;
  color: #666;
`;

const StatusInfo = styled.p`
  margin: 0.25rem 0 1rem;
  line-height: 1.5;
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
  text-align: left;
  margin-top: 0.75rem;
`;

const ActionSummaryTitle = styled.p`
  margin: 0.7rem 0 0.35rem;
  font-weight: 700;
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
