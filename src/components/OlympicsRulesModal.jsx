import { useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

const PROGRESS_MAX = 100;

const TIERS = [
  { min: 100, label: '🥇 Olympiasieger/in des Eises' },
  { min: 40, label: '🥈 Olympia-Finalist/in' },
  { min: 10, label: '🥉 Olympia-Starter/in' },
];

const PROGRESS_MARKERS = [
  {
    value: 10,
    title: 'Olympia-Starter/in',
    src: 'https://ice-app.de/uploads/award_icons/6984974901ee9_Olympic_bronze.png',
    alt: 'Bronze-Award',
  },
  {
    value: 40,
    title: 'Olympia-Finalist/in',
    src: 'https://ice-app.de/uploads/award_icons/698497bc6d8f6_Olympic_silber.png',
    alt: 'Silber-Award',
  },
  {
    value: 100,
    title: 'Olympiasieger/in des Eises',
    src: 'https://ice-app.de/uploads/award_icons/698498895fad6_Olympic_gold.png',
    alt: 'Gold-Award',
  },
];

const POINT_LABELS = {
  login_active: 'App geöffnet & eingeloggt',
  login_days: '2 XP Pro Login-Tag im Aktionszeitraum',
  profile_image: 'Profilbild vorhanden',
  checkins: 'Check-ins',
  prices: 'Preis gemeldet',
  reviews: 'Bewertungen',
  comments: 'Kommentar geschrieben',
  new_shops: 'Neue Eisdiele eintragen',
  routes: 'Neue Routen eintragen',
  secret_location: 'Olympische Spielstätte gefunden',
  challenges_completed: 'Challenges abschließen',
};

const POINT_REWARDS = {
  login_active: '5 XP',
  login_days: '2 XP',
  profile_image: '5 XP',
  checkins: '10 XP',
  prices: '5 XP',
  reviews: '10 XP',
  comments: '5 XP',
  new_shops: '15 XP',
  routes: '20 XP',
  secret_location: '10 XP',
  challenges_completed: '50 XP',
};

const getNextTier = (points) => {
  if (!Number.isFinite(points)) {
    return null;
  }
  const sorted = [...TIERS].sort((a, b) => a.min - b.min);
  return sorted.find((entry) => points < entry.min) || null;
};

const OlympicsRulesModal = ({
  open,
  onClose,
  points,
  isLoggedIn,
  onLogin,
  breakdown = {},
  leaderboard = [],
  leaderboardFull = [],
  userRank = null,
  isLeaderboardLoading = false,
  isLeaderboardFullLoading = false,
  isLeaderboardExpanded = false,
  onToggleLeaderboard = () => {},
  currentUserId = null,
}) => {
  const safePoints = Number.isFinite(points)
    ? Math.max(0, Math.min(points, PROGRESS_MAX))
    : 0;
  const nextTier = getNextTier(points);
  const pointsToNextTier = nextTier ? Math.max(0, nextTier.min - safePoints) : 0;
  const earnedEntries = Object.entries(breakdown)
    .filter(([, value]) => Number.isFinite(value) && value > 0)
    .map(([key, value]) => ({ key, value }));
  const earnedKeys = new Set(earnedEntries.map((entry) => entry.key));
  const remainingEntries = Object.keys(POINT_LABELS)
    .filter((key) => !earnedKeys.has(key))
    .map((key) => ({
      key,
      label: POINT_LABELS[key] || key,
      reward: POINT_REWARDS[key] || 'XP',
    }));
  const activeLeaderboard = (isLeaderboardExpanded && leaderboardFull.length > 0)
    ? leaderboardFull
    : leaderboard;

  if (!open) {
    return null;
  }

  return (
    <OverlayBackground>
      <Overlay>
        <CloseButton onClick={onClose}>&times;</CloseButton>
        <h2>❄️🍦 Eis-Winterolympiade 2026</h2>
        <ProgressSection>
          <p>Vom <strong>6.–22. Februar</strong> wird die Ice-App olympisch!</p>
            <p>Sammle Punkte durch einfache Aktionen und sichere dir exklusive Winter-Olympia-Awards.</p>
          <ProgressLabel>Fortschritt</ProgressLabel>
          <ProgressBar>
            <ProgressFill style={{ width: `${safePoints}%` }} />
            {PROGRESS_MARKERS.map((marker) => (
              <ProgressMarker
                key={marker.value}
                $active={safePoints >= marker.value}
                style={{
                  left: `${marker.value}%`,
                  '--marker-transform': marker.value === PROGRESS_MAX ? 'translateX(-100%)' : 'translateX(-50%)',
                }}
                title={marker.title}
              >
                <ProgressMarkerIcon
                  src={marker.src}
                  alt={marker.alt}
                  $active={safePoints >= marker.value}
                />
              </ProgressMarker>
            ))}
          </ProgressBar>
          <ProgressScale>
            {PROGRESS_MARKERS.map((marker) => (
              <ProgressScaleItem
                key={marker.value}
                $active={safePoints >= marker.value}
                style={{
                  left: `${marker.value}%`,
                  transform: marker.value === PROGRESS_MAX ? 'translateX(-100%)' : 'translateX(-50%)',
                }}
              >
                {marker.value}
              </ProgressScaleItem>
            ))}
          </ProgressScale>
          {Number.isFinite(points) && (
            <div>
              <p>Deine erreichten Punkte: <ActionPoints $state="earned">{safePoints} XP</ActionPoints><br/>
              {nextTier ? (
                <>Noch {pointsToNextTier} Punkte bis zur nächsten Stufe.</>
              ) : (
                <>Maximale Stufe erreicht</>
              )}
              </p>
            </div>
          )}
          <LeaderboardSection>
            <LeaderboardTitle>🏆 Rangliste 🏆</LeaderboardTitle>
            {isLeaderboardLoading ? (
              <LeaderboardHint>Lade Rangliste…</LeaderboardHint>
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
                        $highlight={currentUserId && entry.user_id === Number(currentUserId)}
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
                {isLeaderboardFullLoading && (
                  <LeaderboardHint>Volles Leaderboard wird geladen…</LeaderboardHint>
                )}
              </>
            )}
          </LeaderboardSection>
          <ActionSummary>
            {earnedEntries.length > 0 && (
              <>
                <ActionSummaryTitle>Erhaltene Punkte</ActionSummaryTitle>
                <ActionList>
                  {earnedEntries.map((entry) => (
                    <ActionItem key={entry.key} $state="earned">
                      <span>{POINT_LABELS[entry.key] || entry.key}</span>
                      <ActionPoints $state="earned">+{entry.value} XP</ActionPoints>
                    </ActionItem>
                  ))}
                </ActionList>
              </>
            )}
            {remainingEntries.length > 0 && (
              <>
                <ActionSummaryTitle>Noch möglich</ActionSummaryTitle>
                <ActionList>
                  {remainingEntries.map((entry) => (
                    <ActionItem key={entry.key} $state="pending">
                      <span>{entry.label}</span>
                      <ActionPoints $state="pending">{entry.reward}</ActionPoints>
                    </ActionItem>
                  ))}
                </ActionList>
              </>
            )}
          </ActionSummary>
        </ProgressSection>
        {!isLoggedIn && (
          <div>
            <p>Bitte logge dich ein oder registriere dich, um an der Challenge teilzunehmen.</p>
            <LoginButton type="button" onClick={onLogin}>
              Login / Registrieren
            </LoginButton>
          </div>
        )}
        
      </Overlay>
    </OverlayBackground>
  );
};

export default OlympicsRulesModal;

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
  padding: 2rem 2.5rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  text-align: center;
  animation: fadeIn 0.4s ease-out;
  max-width: 90%;
  width: 420px;
  max-height: 80vh;
  overflow-y: auto;

  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.9); }
    to   { opacity: 1; transform: scale(1); }
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

const ProgressSection = styled.div`
  margin: 1rem 0 0.75rem;
`;

const ProgressLabel = styled.p`
  margin: 0 0 3rem;
  font-weight: 700;
`;

const ProgressBar = styled.div`
  position: relative;
  height: 10px;
  background: #f1f1f1;
  border-radius: 999px;
  overflow: visible;
  margin-top: 12px;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #ffb522, #ff7a18);
  border-radius: 999px;
  transition: width 0.3s ease;
`;

const ProgressMarker = styled.div`
  position: absolute;
  top: -40px;
  font-size: 16px;
  transform: var(--marker-transform, translateX(-50%));
  transition: transform 0.2s ease;

  &:hover {
    transform: var(--marker-transform, translateX(-50%)) translateY(-6px) scale(1.25);
    z-index: 1;
  }
`;

const ProgressMarkerIcon = styled.img`
  width: 48px;
  height: 48px;
  opacity: ${(props) => (props.$active ? 1 : 0.35)};
  filter: ${(props) => (props.$active ? 'none' : 'grayscale(1)')};
  transition: transform 0.2s ease;
`;

const ProgressScale = styled.div`
  position: relative;
  height: 18px;
  margin-top: 6px;
  font-size: 0.75rem;
  color: #666;
`;

const ProgressScaleItem = styled.div`
  position: absolute;
  top: 0;
  font-weight: ${(props) => (props.$active ? 700 : 400)};
  color: ${(props) => (props.$active ? '#000' : '#777')};
`;

const LoginButton = styled.button`
  background: #ffb522;
  border: none;
  border-radius: 10px;
  padding: 8px 12px;
  cursor: pointer;
  font-weight: 700;
`;

const ActionSummary = styled.div`
  margin-top: 12px;
  text-align: left;
`;

const ActionSummaryTitle = styled.p`
  margin: 0.6rem 0 0.35rem;
  font-weight: 700;
  color: #222;
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
  align-items: center;
  gap: 0.75rem;
  padding: 6px 10px;
  border-radius: 10px;
  font-size: 0.9rem;
  background: ${(props) => (props.$state === 'earned' ? '#fff4db' : '#f5f5f5')};
  color: ${(props) => (props.$state === 'earned' ? '#3a2a00' : '#7a7a7a')};
`;

const ActionPoints = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 64px;
  padding: 4px 10px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.8rem;
  background: ${(props) => (props.$state === 'earned' ? '#ffb522' : '#e2e2e2')};
  color: ${(props) => (props.$state === 'earned' ? '#2b1b00' : '#7a7a7a')};
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

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const UserLink = styled(Link)`
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  &:hover {
    font-weight: 600;
  }
`;
