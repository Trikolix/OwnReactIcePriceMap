import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';

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
};

const UPCOMING_ACTIONS = [
  {
    id: 'birthday',
    title: 'Ice-App Geburtstagsaktion',
    period: '07.03.2026 - 22.03.2026',
    status: 'aktiv im März',
    details: 'Pflichtaktionen erledigen, Fortschritt verfolgen und in der Bestenliste Punkte sammeln.',
  },
  {
    id: 'easter',
    title: 'Osteraktion',
    period: 'Zeitraum wird noch nicht verraten',
    status: 'geplant',
    details: 'Auch hier bleibt der Ablauf bewusst geheim. Weitere Infos kommen zur passenden Zeit.',
  },
];

const ActionsOverviewModal = ({ open, onClose }) => {
  const LEADERBOARD_COLLAPSED_COUNT = 10;
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const { userId } = useUser();
  const [currentUser, setCurrentUser] = useState(null);
  const [pastUsers, setPastUsers] = useState([]);
  const [isUserOfMonthLoading, setIsUserOfMonthLoading] = useState(false);
  const [olympicsLeaderboard, setOlympicsLeaderboard] = useState([]);
  const [olympicsUserRank, setOlympicsUserRank] = useState(null);
  const [isOlympicsLoading, setIsOlympicsLoading] = useState(false);
  const [isOlympicsExpanded, setIsOlympicsExpanded] = useState(false);
  const [breakdownByUser, setBreakdownByUser] = useState({});
  const [activeBreakdownUserId, setActiveBreakdownUserId] = useState(null);

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
      .finally(() => {
        setIsUserOfMonthLoading(false);
      });
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
        const leaderboard = Array.isArray(data?.leaderboard) ? data.leaderboard : [];
        setOlympicsLeaderboard(leaderboard);
        setOlympicsUserRank(data?.user_rank || null);
        setBreakdownByUser(data?.breakdowns || {});
      })
      .catch((error) => {
        console.error('Fehler beim Laden des Olympia-Leaderboards:', error);
        setOlympicsLeaderboard([]);
        setOlympicsUserRank(null);
        setBreakdownByUser({});
      })
      .finally(() => {
        setIsOlympicsLoading(false);
      });
  }, [apiUrl, open, userId]);

  if (!open) {
    return null;
  }

  const visibleOlympicsLeaderboard = isOlympicsExpanded
    ? olympicsLeaderboard
    : olympicsLeaderboard.slice(0, LEADERBOARD_COLLAPSED_COUNT);

  return (
    <OverlayBackground>
      <Overlay>
        <CloseButton onClick={onClose}>&times;</CloseButton>

        <SectionTitle>Nutzer/in des Monats</SectionTitle>
        {isUserOfMonthLoading ? (
          <Hint>Lade Nutzer/innen des Monats...</Hint>
        ) : !currentUser && pastUsers.length === 0 ? (
          <Hint>Keine Daten vorhanden.</Hint>
        ) : (
          <>
            {currentUser && (
              <CurrentUserWrapper>
                <UserLink to={`/user/${currentUser.id}`} onClick={onClose}>
                  <CurrentUserCard>
                    <Month>{currentUser.month}</Month>
                    <CurrentUserImage src={currentUser.image} alt={currentUser.name} />
                    <strong>{currentUser.name}</strong>
                  </CurrentUserCard>
                </UserLink>
              </CurrentUserWrapper>
            )}
            {pastUsers.length > 0 && (
              <>
                <SubTitle>Vorherige Nutzer/innen des Monats</SubTitle>
                <CardGrid>
                  {pastUsers.map((user) => (
                    <UserLink key={`${user.month}-${user.id}`} to={`/user/${user.id}`} onClick={onClose}>
                      <UserCard>
                        <Month>{user.month}</Month>
                        <UserImage src={user.image} alt={user.name} />
                        <strong>{user.name}</strong>
                      </UserCard>
                    </UserLink>
                  ))}
                </CardGrid>
              </>
            )}
          </>
        )}

        <MainHeading>Aktionen & Ergebnisse</MainHeading>
        <IntroText>
          Hier findest du aktuelle und vergangene Ergebnisse sowie erste Hinweise auf kommende Aktionen.
        </IntroText>

        <Section>
          <SectionTitle>Eis-Winterolympiade 2026 - Ergebnisse</SectionTitle>
          <Hint>
            Die Eis-Winterolympiade war eine zeitlich begrenzte Community-Aktion mit Punkten für Aktivitäten in der App.
            Sie fand vom <strong>6. Februar 2026</strong> bis zum <strong>22. Februar 2026</strong> statt.
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
            <LeaderboardToggleButton
              type="button"
              onClick={() => setIsOlympicsExpanded((prev) => !prev)}
            >
              {isOlympicsExpanded ? 'Ergebnisse einklappen' : 'Weitere Ergebnisse anzeigen'}
            </LeaderboardToggleButton>
          )}
          {olympicsUserRank && (
            <Hint>
              Dein Rang: <strong>#{olympicsUserRank.rank}</strong> mit <strong>{olympicsUserRank.total_xp} XP</strong>
            </Hint>
          )}
        </Section>

        <Section>
          <SectionTitle>Zukünftige Aktionen</SectionTitle>
          <CardGrid>
            {UPCOMING_ACTIONS.map((action) => (
              <UpcomingCard key={action.id}>
                <ActionTitle>{action.title}</ActionTitle>
                <ActionPeriod>{action.period}</ActionPeriod>
                <Status>{action.status}</Status>
                <p>{action.details}</p>
              </UpcomingCard>
            ))}
          </CardGrid>
        </Section>
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
  padding: 2rem 2.5rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  max-width: 90%;
  width: 760px;
  max-height: 84vh;
  overflow-y: auto;
  text-align: center;
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
  margin: 1.2rem 0 0.4rem;
  text-align: center;
`;

const IntroText = styled.p`
  margin: 0;
  text-align: center;
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

const UpcomingCard = styled.article`
  background: #fff8ea;
  border-radius: 12px;
  padding: 0.8rem;

  p {
    margin: 0.5rem 0 0;
  }
`;

const ActionTitle = styled.strong`
  display: block;
`;

const ActionPeriod = styled.small`
  display: block;
`;

const Status = styled.span`
  display: inline-block;
  margin-top: 0.4rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: #4b2b00;
`;

const Hint = styled.p`
  margin: 0.6rem 0;
`;
