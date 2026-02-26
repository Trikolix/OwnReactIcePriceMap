import userOfTheMonthImg from './user_of_the_month.png';
import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import {
  SubmitButton as SharedSubmitButton,
  Modal as SharedModal,
} from './styles/SharedStyles';
import { useUser } from './context/UserContext';
import LoginModal from './LoginModal';
import SubmitIceShopModal from './SubmitIceShopModal';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import NotificationBell from './components/NotificationBell';
import QrScanModal from "./components/QrScanModal";
import NewAwards from './components/NewAwards';
import { isSpecialTime } from './utils/seasonal';
import { buildAssetUrl } from './utils/assets.jsx';
import OlympicsRulesModal from './components/OlympicsRulesModal';
import ActionsOverviewModal from './pages/ActionsOverview';
import headerWideChristmas from './header_wide_christmas.png';
import headerWideEaster from './header_wide_easter.png';
import headerWide from './header_wide.png';

const Header = ({ refreshShops }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const { userId, username, isLoggedIn, userPosition, login, logout } = useUser();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSubmitNewIceShop, setShowSubmitNewIceShop] = useState(false);
  const [levelUpInfo, setLevelUpInfo] = useState(null);
  const [newAwards, setNewAwards] = useState([]);
  const [modalData, setModalData] = useState(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [showUserOfMonth, setShowUserOfMonth] = useState(false);
  const [showActionsOverview, setShowActionsOverview] = useState(false);
  const [showOlympicsRules, setShowOlympicsRules] = useState(false);
  const [olympicsPoints, setOlympicsPoints] = useState(null);
  const [olympicsBreakdown, setOlympicsBreakdown] = useState({});
  const [isOlympicsPointsLoading, setIsOlympicsPointsLoading] = useState(false);
  const [olympicsLeaderboard, setOlympicsLeaderboard] = useState([]);
  const [olympicsLeaderboardFull, setOlympicsLeaderboardFull] = useState([]);
  const [olympicsUserRank, setOlympicsUserRank] = useState(null);
  const [isOlympicsLeaderboardLoading, setIsOlympicsLeaderboardLoading] = useState(false);
  const [isOlympicsLeaderboardExpanded, setIsOlympicsLeaderboardExpanded] = useState(false);
  const [headerAvatarUrl, setHeaderAvatarUrl] = useState(() => localStorage.getItem('avatarUrl'));
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const location = useLocation();
  const navigate = useNavigate();
  const LEADERBOARD_COLLAPSED_COUNT = 3;

  const allowedPhotoChallenges = (userId) => {
    const allowedUsers = [1, 2, 13, 23]; // Liste der erlaubten Nutzer-IDs
    return allowedUsers.includes(Number(userId));
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };
  const closeMenu = () => setMenuOpen(false);
  const isAdmin = Number(userId) === 1;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!isLoggedIn) {
      setHeaderAvatarUrl(null);
      return;
    }
    setHeaderAvatarUrl(localStorage.getItem('avatarUrl'));
  }, [isLoggedIn, userId, username, menuOpen]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === 'avatarUrl') {
        setHeaderAvatarUrl(event.newValue);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !userId || !apiUrl) return;
    if (headerAvatarUrl) return;

    let isCancelled = false;
    fetch(`${apiUrl}/get_user_stats.php?nutzer_id=${userId}&cur_user_id=${userId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const nextAvatar = data?.avatar_url || null;
        if (isCancelled || !nextAvatar) return;
        setHeaderAvatarUrl(nextAvatar);
        localStorage.setItem('avatarUrl', nextAvatar);
      })
      .catch((error) => {
        console.warn('Header avatar could not be loaded:', error);
      });

    return () => {
      isCancelled = true;
    };
  }, [apiUrl, isLoggedIn, userId, headerAvatarUrl]);

  useEffect(() => {
    if (!userId) return;
    const checkLevelInterval = setInterval(() => {
      checkForLevelUp();
    }, 5 * 60 * 1000); // alle 5 Minuten

    // sofort einmal ausführen (optional)
    checkForLevelUp();

    return () => clearInterval(checkLevelInterval);
  }, [userId]);

  useEffect(() => {
    const handleNewAwards = (event) => {
      const awards = event.detail;
      if (awards && awards.length > 0) {
        setNewAwards(awards);
        setShowOverlay(true);
      }
    };

    window.addEventListener('new-awards', handleNewAwards);

    return () => {
      window.removeEventListener('new-awards', handleNewAwards);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const scanCode = params.get("scan");

    if (scanCode) {
      // ✅ QR-Code erkannt – weiterverarbeiten
      console.log("Scan-Code erkannt:", scanCode);

      // Asuwertung: Falls User eingeloggt ist: direkt in Datenbank speichern, falls nicht in LocalStorage speichern
      // Anfrage vorbereiten
      const payload = { code: scanCode };
      if (userId) { payload["nutzer_id"] = userId; }

      fetch(`${apiUrl}/api/qr_scan.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("Antwort von API:", data);
          if (data.status === "success") {
            // 🧠 Wenn nicht eingeloggt → lokal speichern
            if (!userId) {
              const stored = JSON.parse(localStorage.getItem("pendingQrScans") || "[]");
              if (!stored.includes(scanCode)) {
                stored.push(scanCode);
                localStorage.setItem("pendingQrScans", JSON.stringify(stored));
              }
            }

            // ✅ Modal anzeigen
            console.log("setModalData", {
              icon: data.icon,
              name: data.name,
              description: data.description,
              needsLogin: !data.saved,
              userId: userId,
            });
            setModalData({
              icon: data.icon,
              name: data.name,
              description: data.description,
              needsLogin: !data.saved,
            });
          } else {
            console.error("Scan fehlgeschlagen:", data.message);
          }
        })
        .catch((err) => {
          console.error("Fehler beim Senden des QR-Codes:", err);
        })
        .finally(() => {
          // ✅ Parameter aus URL entfernen, ohne Reload
          params.delete("scan");
          const newSearch = params.toString();
          navigate(
            {
              pathname: location.pathname,
              search: newSearch ? `?${newSearch}` : "",
            },
            { replace: true }
          );
        });
    }
  }, [location, userId, apiUrl, navigate]);

  useEffect(() => {
    if (!userId) return;

    const stored = JSON.parse(localStorage.getItem("pendingQrScans") || "[]");
    if (stored.length > 0) {
      stored.forEach((code) => {
        fetch(`${apiUrl}/api/qr_scan.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, nutzer_id: userId }),
        })
          .then((res) => res.json())
          .then((data) => {
            console.log("QR-Scan nach Login übertragen:", data);
          })
          .catch((err) => {
            console.error("Fehler beim Nachsenden des QR-Codes:", err);
          });
      });

      localStorage.removeItem("pendingQrScans");
    }
  }, [userId]);

  const checkForLevelUp = async () => {
    try {
      const response = await fetch(`${apiUrl}/userManagement/update_activity_and_awards.php?nutzer_id=${userId}`);
      const data = await response.json();

      if (data.level_up || (data.new_awards && data.new_awards.length > 0)) {
        if (data.level_up) {
          setLevelUpInfo({
            level: data.new_level,
            level_name: data.level_name,
          });
        }

        if (data.new_awards?.length > 0) {
          setNewAwards(data.new_awards);
        }

        setShowOverlay(true);
      }
    } catch (error) {
      console.error('Level-Check fehlgeschlagen:', error);
    }
  };

  const [currentUser, setCurrentUser] = useState(null);
  const [pastUsers, setPastUsers] = useState([]);

  useEffect(() => {
    const fetchUserOfMonth = async () => {
      try {
        const response = await fetch(`${apiUrl}/get_user_of_the_month.php`);
        const data = await response.json();
        if (data.error) {
          console.error("Error fetching user of the month:", data.error);
        } else {
          setCurrentUser(data.currentUser);
          setPastUsers(data.pastUsers || []);
        }
      } catch (error) {
        console.error('Failed to fetch user of the month:', error);
      }
    };

    fetchUserOfMonth();
  }, [apiUrl]);


  const getLogoSrc = () => {
    const specialTime = isSpecialTime();
    if (specialTime === 'christmas') {
      return headerWideChristmas;
    }
    if (specialTime === 'easter') {
        return headerWideEaster;
    }
    return headerWide;
  };

  const specialTime = isSpecialTime();
  const isOlympicsResultsOnly =
    specialTime === 'olympics' && new Date() >= new Date(2026, 1, 23);
  const headerAvatarSrc = buildAssetUrl(headerAvatarUrl);

  useEffect(() => {
    if (specialTime !== 'olympics' || !userId) {
      setOlympicsPoints(null);
      setOlympicsBreakdown({});
      return;
    }

    setIsOlympicsPointsLoading(true);
    fetch(`${apiUrl}/api/olympics_progress.php?user_id=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        const total = Number.isFinite(data?.total_xp) ? data.total_xp : 0;
        setOlympicsPoints(total);
        setOlympicsBreakdown(data?.breakdown || {});
        if (data?.new_awards && data.new_awards.length > 0) {
          setNewAwards(data.new_awards);
          setShowOverlay(true);
        }
      })
      .catch((err) => {
        console.error('Fehler beim Laden der Olympia-Punkte:', err);
        setOlympicsPoints(null);
        setOlympicsBreakdown({});
      })
      .finally(() => {
        setIsOlympicsPointsLoading(false);
      });
  }, [apiUrl, specialTime, userId]);

  useEffect(() => {
    if (specialTime !== 'olympics' || !showOlympicsRules) {
      setOlympicsLeaderboard([]);
      setOlympicsLeaderboardFull([]);
      setOlympicsUserRank(null);
      setIsOlympicsLeaderboardExpanded(false);
      return;
    }

    setIsOlympicsLeaderboardLoading(true);
    const userParam = userId ? `?user_id=${userId}` : '';
    fetch(`${apiUrl}/api/olympics_leaderboard.php${userParam}`)
      .then((res) => res.json())
      .then((data) => {
        const fullLeaderboard = Array.isArray(data?.leaderboard) ? data.leaderboard : [];
        setOlympicsLeaderboardFull(fullLeaderboard);
        setOlympicsLeaderboard(fullLeaderboard.slice(0, LEADERBOARD_COLLAPSED_COUNT));
        setOlympicsUserRank(data?.user_rank || null);
      })
      .catch((err) => {
        console.error('Fehler beim Laden des Olympia-Leaderboards:', err);
        setOlympicsLeaderboard([]);
        setOlympicsLeaderboardFull([]);
        setOlympicsUserRank(null);
      })
      .finally(() => {
        setIsOlympicsLeaderboardLoading(false);
      });
  }, [apiUrl, specialTime, showOlympicsRules, userId]);

  return (
    <>
      <HeaderContainer>
        <PromoIconsContainer>
          <GewinnspielIcon onClick={() => setShowActionsOverview(true)}>
            <img src={userOfTheMonthImg} alt="Aktionen & Ergebnisse" />
          </GewinnspielIcon>
        </PromoIconsContainer>

        <LogoContainer>
          <a href="/"><Logo src={getLogoSrc()} alt="Website Logo" /></a>
        </LogoContainer>
        <DesktopNav aria-label="Hauptnavigation">
          <DesktopNavLink to="/" end>Karte</DesktopNavLink>
          <DesktopNavLink to="/dashboard">Aktivitäten</DesktopNavLink>
          <DesktopNavLink to="/ranking">Top Eisdielen</DesktopNavLink>
          <DesktopNavLink to="/statistics">Statistiken</DesktopNavLink>
          <DesktopNavLink to="/routes">Routen</DesktopNavLink>
        </DesktopNav>
        <HeaderRight>
          {isLoggedIn ? (
            <AccountCluster>
              <NotificationBellWrap aria-label="Benachrichtigungen">
                <NotificationBell />
              </NotificationBellWrap>
              <AccountClusterDivider aria-hidden="true" />
              <UserStatusLink to={`/user/${userId}`} onClick={() => setMenuOpen(false)}>
                <UserStatusAvatar aria-hidden="true">
                  {headerAvatarSrc ? (
                    <img src={headerAvatarSrc} alt="" />
                  ) : (
                    (username || '?').slice(0, 1).toUpperCase()
                  )}
                </UserStatusAvatar>
                <UserStatusText>
                  <UserStatusLabel>Eingeloggt</UserStatusLabel>
                  <UserStatusName>{username || `Nutzer ${userId}`}</UserStatusName>
                </UserStatusText>
              </UserStatusLink>
            </AccountCluster>
          ) : (
            <LoginHeaderButton
              type="button"
              onClick={() => {
                setShowLoginModal(true);
                setMenuOpen(false);
              }}
            >
              Einloggen
            </LoginHeaderButton>
          )}
          <BurgerMenu
            type="button"
            aria-label={menuOpen ? 'Menü schließen' : 'Menü öffnen'}
            aria-expanded={menuOpen}
            onClick={toggleMenu}
          >
            <span />
            <span />
            <span />
          </BurgerMenu>
        </HeaderRight>
        {menuOpen && (
          <Menu ref={menuRef}>
            <MenuHeader>
              {isLoggedIn ? (
                <>
                  <MenuHeaderTitle>{username || `Nutzer ${userId}`}</MenuHeaderTitle>
                  <MenuHeaderSubtitle>{isAdmin ? 'Eingeloggt · Admin' : 'Eingeloggt'}</MenuHeaderSubtitle>
                </>
              ) : (
                <>
                  <MenuHeaderTitle>Gastmodus</MenuHeaderTitle>
                  <MenuHeaderSubtitle>Einloggen für Favoriten, Challenges und Profil</MenuHeaderSubtitle>
                </>
              )}
            </MenuHeader>

            <MenuSection>
              <MenuSectionTitle>Entdecken</MenuSectionTitle>
              <MenuItemLink to="/" end onClick={closeMenu}>Eisdielen-Karte</MenuItemLink>
              <MenuItemLink to="/dashboard" onClick={closeMenu}>Aktivitäten</MenuItemLink>
              <MenuItemLink to="/ranking" onClick={closeMenu}>Top Eisdielen</MenuItemLink>
              <MenuItemLink to="/statistics" onClick={closeMenu}>Statistiken</MenuItemLink>
              <MenuItemLink to="/routes" onClick={closeMenu}>Routen</MenuItemLink>
              {allowedPhotoChallenges(userId) && (
                <MenuItemLink to="/photo-challenge" onClick={closeMenu}>Foto-Challenges</MenuItemLink>
              )}
            </MenuSection>

            <MenuDivider />
            {isLoggedIn ? (
              <>
                <MenuSection>
                  <MenuSectionTitle>Mein Konto</MenuSectionTitle>
                  <MenuItemLink to={`/user/${userId}`} onClick={closeMenu}>Profil</MenuItemLink>
                  <MenuItemLink to="/favoriten" onClick={closeMenu}>Favoriten</MenuItemLink>
                  <MenuItemLink to="/challenge" onClick={closeMenu}>Challenges</MenuItemLink>
                  <MenuActionButton
                    type="button"
                    onClick={() => {
                      setShowSubmitNewIceShop(true);
                      closeMenu();
                    }}
                  >
                    Eisdiele hinzufügen
                  </MenuActionButton>
                </MenuSection>
                {isAdmin && (
                  <>
                    <MenuDivider />
                    <MenuSection>
                      <MenuSectionTitle>Admin</MenuSectionTitle>
                      <MenuItemLink to="/systemmeldungenform" onClick={closeMenu}>Systemmeldung erstellen</MenuItemLink>
                      <MenuItemLink to="/photo-challenge-admin" onClick={closeMenu}>Fotochallenges verwalten</MenuItemLink>
                      <MenuItemLink to="/shop-change-requests" onClick={closeMenu}>Änderungsvorschläge</MenuItemLink>
                    </MenuSection>
                  </>
                )}
                <MenuDivider />
                <MenuSection>
                  <MenuActionButton onClick={() => { logout(); closeMenu(); }} type="button" $danger>
                    Ausloggen
                  </MenuActionButton>
                </MenuSection>
              </>
            ) : (
              <MenuSection>
                <MenuSectionTitle>Konto</MenuSectionTitle>
                <MenuActionButton onClick={() => { setShowLoginModal(true); closeMenu(); }} type="button">
                  Einloggen
                </MenuActionButton>
              </MenuSection>
            )}

            <MenuDivider />
            <MenuSection>
              <MenuSectionTitle>Info</MenuSectionTitle>
              <MenuItemLink to="/impressum" onClick={closeMenu}>Über diese Website</MenuItemLink>
              <MenuItemAnchor
                href="https://www.instagram.com/ice_app.de?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                target="_blank"
                rel="noreferrer"
                onClick={closeMenu}
              >
                Instagram
              </MenuItemAnchor>
            </MenuSection>
          </Menu>
        )}
      </HeaderContainer>
      {showLoginModal &&
        <LoginModal
          userId={userId}
          isLoggedIn={isLoggedIn}
          login={login}
          setShowLoginModal={setShowLoginModal}
        />
      }
      {showSubmitNewIceShop && (
        <SubmitIceShopModal
          showForm={showSubmitNewIceShop}
          setShowForm={setShowSubmitNewIceShop}
          userId={userId}
          refreshShops={refreshShops}
          userLatitude={userPosition ? userPosition[0] : 50.83}
          userLongitude={userPosition ? userPosition[1] : 12.92}
        />
      )}
      {showOverlay && (
        <OverlayBackground>
          <SharedModal>
            <CloseButton onClick={() => {
              setShowOverlay(false);
              setLevelUpInfo(null);
              setNewAwards([]);
            }}>&times;</CloseButton>

            {levelUpInfo && (
              <>
                <h2>🎉 Level-Up!</h2>
                <p>Du hast <strong>Level {levelUpInfo.level}</strong> erreicht!</p>
                <p><em>{levelUpInfo.level_name}</em></p>
              </>
            )}
            {levelUpInfo && newAwards.length > 0 && (<hr></hr>)}
            <NewAwards awards={newAwards} />
            <ButtonWrapper>
              <SubmitButton onClick={() => {
                setShowOverlay(false);
                setLevelUpInfo(null);
                setNewAwards([]);
              }}>Alles Klar!</SubmitButton>
            </ButtonWrapper>
          </SharedModal>
        </OverlayBackground>
      )}

      <OlympicsRulesModal
        open={showOlympicsRules}
        onClose={() => setShowOlympicsRules(false)}
        isResultsOnly={isOlympicsResultsOnly}
        points={olympicsPoints}
        isLoggedIn={isLoggedIn}
        breakdown={olympicsBreakdown}
        leaderboard={olympicsLeaderboard}
        leaderboardFull={olympicsLeaderboardFull}
        userRank={olympicsUserRank}
        isLeaderboardLoading={isOlympicsLeaderboardLoading}
        isLeaderboardFullLoading={isOlympicsLeaderboardLoading}
        isLeaderboardExpanded={isOlympicsLeaderboardExpanded}
        onToggleLeaderboard={(expanded) => setIsOlympicsLeaderboardExpanded(expanded)}
        currentUserId={userId}
        onLogin={() => {
          setShowOlympicsRules(false);
          setShowLoginModal(true);
        }}
      />
      <ActionsOverviewModal
        open={showActionsOverview}
        onClose={() => setShowActionsOverview(false)}
      />

      {showUserOfMonth && currentUser && (
        <OverlayBackground>
          <Overlay>
            <CloseButton onClick={() => setShowUserOfMonth(false)}>&times;</CloseButton>
            <h2>🏅 Nutzer/in des Monats 🏅</h2>
            <CurrentUserWrapper>
              <UserLink to={`/user/${currentUser.id}`} style={{ textDecoration: 'none', color: 'inherit' }} onClick={() => setShowUserOfMonth(false)}>
                <UserCard>
                  <MonthHeader><u>{currentUser.month}</u></MonthHeader>
                  <CurrentUserImage
                    src={currentUser.image}
                    alt={currentUser.name}
                  />
                  <strong>
                    {currentUser.name}
                  </strong>
                </UserCard>
              </UserLink>
            </CurrentUserWrapper>
            <hr></hr>
            <h3>🏅 Vorherige Nutzer/innen des Monats 🏅</h3>
            <PastUsersGrid>
              {pastUsers.map((user) => (
                <UserLink to={`/user/${user.id}`} key={`${user.month}-${user.id}`} style={{ textDecoration: 'none', color: 'inherit' }} onClick={() => setShowUserOfMonth(false)}>
                  <UserCard>
                    <MonthHeader><u>{user.month}</u></MonthHeader>
                    <UserImage src={user.image} alt={user.name} />
                    <strong>
                      {user.name}
                    </strong>
                  </UserCard>
                </UserLink>
              ))}
            </PastUsersGrid>

            <SubmitButton style={{ marginTop: '1rem' }} onClick={() => setShowUserOfMonth(false)}>Alles Klar!</SubmitButton>
          </Overlay>
        </OverlayBackground>
      )}

      <QrScanModal
        open={modalData !== null}
        onClose={() => setModalData(null)}
        data={modalData}
        needsLogin={modalData?.needsLogin}
      />
    </>
  );
};

export default Header;

const HeaderContainer = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background-color: #ffb522;
  position: relative;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);

  > * {
    position: relative;
    z-index: 1;
  }
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  margin: 0 auto;
  color: black;

  @media (min-width: 769px) {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    margin: 0;
    z-index: 0;
  }
`;

const Logo = styled.img`
  height: 100px;
  @media (max-width: 768px) {
    height: 60px;
  }
`;

const DesktopNav = styled.nav`
  display: none;
  align-items: center;
  gap: 6px;
  margin-left: 4px;

  @media (min-width: 1100px) {
    display: flex;
  }
`;

const DesktopNavLink = styled(NavLink)`
  color: #3d2c00;
  text-decoration: none;
  font-weight: 700;
  padding: 8px 10px;
  border-radius: 10px;
  transition: background-color 0.15s ease, color 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.4);
    color: #251900;
  }

  &.active {
    background: rgba(255, 255, 255, 0.9);
    color: #2b1d00;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  }
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
`;

const AccountCluster = styled.div`
  display: flex;
  align-items: center;
  min-height: 40px;
  background: rgba(255, 255, 255, 0.65);
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

  @media (max-width: 768px) {
    max-width: calc(100vw - 150px);
  }
`;

const AccountClusterDivider = styled.div`
  width: 1px;
  align-self: stretch;
  background: rgba(47, 33, 0, 0.12);
`;

const NotificationBellWrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 42px;
  min-height: 40px;
  color: #2f2100;
  padding: 0 2px 0 4px;
`;

const UserStatusLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: #2f2100;
  background: transparent;
  border-radius: 14px;
  padding: 5px 10px 5px 6px;
  border: 1px solid transparent;
  min-height: 40px;

  &:hover {
    background: rgba(255, 255, 255, 0.35);
  }

  @media (max-width: 768px) {
    padding-right: 8px;
  }
`;

const UserStatusAvatar = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #2f2100;
  color: #fff;
  display: grid;
  place-items: center;
  font-weight: 800;
  font-size: 0.85rem;
  flex-shrink: 0;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const UserStatusText = styled.div`
  display: flex;
  flex-direction: column;
  line-height: 1.05;

  @media (max-width: 768px) {
    display: none;
  }
`;

const UserStatusLabel = styled.span`
  font-size: 0.65rem;
  opacity: 0.85;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const UserStatusName = styled.span`
  font-size: 0.82rem;
  font-weight: 800;
`;

const LoginHeaderButton = styled.button`
  border: none;
  background: #fff;
  color: #2f2100;
  border-radius: 14px;
  padding: 0 12px;
  min-height: 40px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

  &:hover {
    background: #fff8e6;
  }

  @media (max-width: 420px) {
    display: none;
  }
`;

const BurgerMenu = styled.button`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  color: #2f2100;
  background: rgba(255, 255, 255, 0.52);
  border: 1px solid rgba(255, 255, 255, 0.65);
  border-radius: 12px;
  width: 42px;
  height: 42px;
  padding: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

  span {
    height: 3px;
    background: currentColor;
    width: 20px;
    border-radius: 999px;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.78);
  }
`;

const Menu = styled.nav`
  position: absolute;
  top: calc(100% + 8px);
  right: 16px;
  width: min(360px, calc(100vw - 24px));
  max-height: min(78vh, calc(100dvh - 88px));
  overflow-y: auto;
  overscroll-behavior: contain;
  background: rgba(255, 252, 243, 0.98);
  padding: 10px;
  border-radius: 16px;
  border: 1px solid rgba(47, 33, 0, 0.12);
  box-shadow: 0 16px 36px rgba(28, 20, 0, 0.2);
  z-index: 1002;
  color: #2f2100;

  @media (max-width: 480px) {
    left: 0;
    right: 0;
    width: auto;
    max-width: none;
    border-radius: 0 0 16px 16px;
  }
`;

const MenuHeader = styled.div`
  padding: 8px 10px 10px;
`;

const MenuHeaderTitle = styled.div`
  font-size: 0.98rem;
  font-weight: 800;
  color: #231900;
`;

const MenuHeaderSubtitle = styled.div`
  margin-top: 2px;
  font-size: 0.78rem;
  color: rgba(47, 33, 0, 0.7);
  line-height: 1.25;
`;

const MenuSection = styled.div`
  display: grid;
  gap: 2px;
`;

const MenuSectionTitle = styled.div`
  padding: 6px 10px 4px;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(47, 33, 0, 0.62);
`;

const MenuDivider = styled.hr`
  margin: 8px 0;
  border: none;
  border-top: 1px solid rgba(47, 33, 0, 0.1);
`;

const menuItemBase = `
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 40px;
  padding: 9px 10px;
  border-radius: 10px;
  color: #2f2100;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.2;
  text-decoration: none;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.15s ease, color 0.15s ease;

  &:hover {
    background: rgba(255, 181, 34, 0.18);
    color: #231900;
  }
`;

const MenuItemLink = styled(NavLink)`
  ${menuItemBase}

  &.active {
    background: rgba(255, 181, 34, 0.24);
    box-shadow: inset 0 0 0 1px rgba(255, 181, 34, 0.35);
  }
`;

const MenuItemAnchor = styled.a`
  ${menuItemBase}
`;

const MenuActionButton = styled.button`
  ${menuItemBase}
  ${({ $danger }) =>
    $danger
      ? `
    color: #9f1f1f;
    &:hover {
      background: rgba(220, 38, 38, 0.10);
      color: #861313;
    }
  `
      : ''}
`;

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
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
  text-align: center;
  animation: fadeIn 0.4s ease-out;
  max-width: 90%;
  width: 400px;
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

const ButtonWrapper = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
`;

const GewinnspielIcon = styled.div`
  cursor: pointer;
  margin-right: 8px;

  img {
    width: 80px;
    height: 80px;
    transition: transform 0.2s;
  }

  &:hover img {
    transform: scale(1.1);
  }

  @media (max-width: 768px) {
    img {
      width: 50px;
      height: 50px;
    }
  }
`;

const PromoIconsContainer = styled.div`
  display: flex;
  align-items: center;
`;

const UserLink = styled(Link)`
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  font-size: 1.2rem;
`;

const CurrentUserWrapper = styled.div`
  margin-bottom: 2rem;
`;

const CurrentUserImage = styled.img`
  width: 160px;
  height: 160px;
  border-radius: 50%;
  margin-bottom: 1rem;
  object-fit: cover;
`;

const PastUsersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1.5rem;
`;

const UserCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.10);
  transition: box-shadow 0.2s, transform 0.2s;
  padding: 1rem 0.5rem;
  cursor: pointer;

  &:hover {
    box-shadow: 0 6px 24px rgba(0,0,0,0.18);
    transform: translateY(-2px) scale(1.03);
  }
`;

const UserImage = styled.img`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  margin-bottom: 0.5rem;
  object-fit: cover;
`;

const SubmitButton = SharedSubmitButton;

const MonthHeader = styled.h3`
  margin-top: 0rem;
  margin-bottom: 0rem;
  `;
