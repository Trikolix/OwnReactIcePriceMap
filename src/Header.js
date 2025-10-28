import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import {
  OverlayBackground as SharedOverlayBackground,
  Overlay as SharedOverlay,
  CloseButton as SharedCloseButton,
  SubmitButton as SharedSubmitButton,
  LevelInfo as SharedLevelInfo,
  Modal as SharedModal,
} from './styles/SharedStyles';
import { useUser } from './context/UserContext';
import LoginModal from './LoginModal';
import SubmitIceShopModal from './SubmitIceShopModal';
import { Link } from 'react-router-dom';
import NotificationBell from './components/NotificationBell';
import QrScanModal from "./components/QrScanModal";
import NewAwards from './components/NewAwards';
import { useLocation, useNavigate } from "react-router-dom";

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
  const apiUrl = process.env.REACT_APP_API_BASE_URL;
  const location = useLocation();
  const navigate = useNavigate();

  const canAccessChallenges = (userId) => {
    return [1, 2, 13, 118].includes(Number(userId));
  }

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

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
    if (!userId) return;
    const checkLevelInterval = setInterval(() => {
      checkForLevelUp();
    }, 5 * 60 * 1000); // alle 5 Minuten

    // sofort einmal ausführen (optional)
    checkForLevelUp();

    return () => clearInterval(checkLevelInterval);
  }, [userId]);

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

  const currentUser = { month: "September", id: 53, name: "IceGoe ", image: "https://ice-app.de/uploads/award_icons/68dd0401cf5ad_ChatGPT%20Image%201.%20Okt.%202025,%2012_32_52.png" };

  const pastUsers = [
    { month: "August", id: 53, name: "IceGoe ", image: "https://ice-app.de/uploads/award_icons/68bfc43ab0c79_1000101917.png" },
    { month: "Juli", id: 22, name: "Eispfote ", image: "https://ice-app.de/uploads/award_icons/68bfc41eb4748_1000101916.png" },
    { month: "Juni", id: 52, name: "alinaa.wrnr", image: "https://ice-app.de/uploads/award_icons/68bfc408d55d6_1000101915.png" },
    { month: "Mai", id: 2, name: "GourmetBiker", image: "https://ice-app.de/uploads/award_icons/68bfc3f576783_1000101914.png" },
    { month: "April", id: 3, name: "Leckermäulchen95", image: "https://ice-app.de/uploads/award_icons/68bfc3848cd3b_1000101913.png" },
  ];

  return (
    <>
      <HeaderContainer>
        <GewinnspielIcon onClick={() => setShowUserOfMonth(true)}>
          <img src={require('./user_of_the_month.png')} alt="Gewinnspiel" />
        </GewinnspielIcon>

        <LogoContainer>
          <a href="/"><Logo src={require('./header_wide.png')} alt="Website Logo" /></a>
        </LogoContainer>
        {isLoggedIn && <NotificationBell />}
        <BurgerMenu onClick={toggleMenu}>
          <span />
          <span />
          <span />
        </BurgerMenu>
        {menuOpen && (
          <Menu ref={menuRef}>
            <MenuItemLink to="/">Eisdielen-Karte</MenuItemLink>
            <MenuItemLink to="/ranking">Top Eisdielen</MenuItemLink>
            <MenuItemLink to="/dashboard">Aktivitäten</MenuItemLink>
            <MenuItemLink to="/statistics">Statistiken</MenuItemLink>
            {isLoggedIn ? (
              <>
                <MenuItemLink to={`/user/${userId}`} className="logged-in">Profil ({username})</MenuItemLink>
                <MenuItem onClick={() => setShowSubmitNewIceShop(true)} className="logged-in">Eisdiele hinzufügen</MenuItem>
                <MenuItemLink to="/favoriten" className="logged-in">Favoriten</MenuItemLink>
                {canAccessChallenges(userId) && (<MenuItemLink to="/challenge" className="logged-in">Challenges</MenuItemLink>)}

                {userId == 1 && (<MenuItemLink to="/systemmeldungenform" className="logged-in">Systemmeldung erstellen</MenuItemLink>)}
                <MenuItem onClick={logout} className="logged-in">Ausloggen</MenuItem>
              </>
            ) : (
              <MenuItem onClick={() => setShowLoginModal(true)}>Einloggen</MenuItem>
            )}
            <MenuItemLink to="/impressum">Über diese Website</MenuItemLink>
            <MenuItemLink to="https://www.instagram.com/ice_app.de?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank">Instagram</MenuItemLink>
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

      {showUserOfMonth && (
        <OverlayBackground>
          <Overlay>
            <CloseButton onClick={() => setShowUserOfMonth(false)}>&times;</CloseButton>
            <h2>🏅 Nutzer/in des Monats 🏅</h2>
            <CurrentUserWrapper>
              <UserLink to={`/user/${currentUser.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
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
                <UserLink to={`/user/${user.id}`} key={user.id} style={{ textDecoration: 'none', color: 'inherit' }}>
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
  padding: 0px 20px;
  background-color: #ffb522;
`;

const LogoContainer = styled.div`
  display: ruby;
  align-items: center;
  margin: 5px auto;
  color: black;
`;

const Logo = styled.img`
  height: 100px;
  @media (max-width: 768px) {
    height: 60px;
  }
`;

const BurgerMenu = styled.div`
  display: flex;
  flex-direction: column;
  cursor: pointer;
  color: white;

  span {
    height: 3px;
    background: #fff;
    margin: 4px 0;
    width: 25px;
  }
`;

const Menu = styled.nav`
  position: absolute;
  top: 60px;
  right: 20px;
  background: #ffb522;
  padding: 10px;
  border-radius: 5px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1002;
  cursor: pointer;
  color: white;
`;

const MenuItem = styled.a`
  display: block;
  padding: 10px;
  color: white;
  font-weight: bold;
  text-decoration: none;

  &.logged-in {
    margin-left: 15px;
    color:rgb(255, 255, 255);
  }

  &:hover {
    background: rgb(206, 137, 0);
  }
`;

const MenuItemLink = styled(Link)`
  display: block;
  padding: 10px;
  color: white;
  font-weight: bold;
  text-decoration: none;


  &.logged-in {
    margin-left: 15px;
  }
  &:hover {
    background: rgb(206, 137, 0);
    color: white;
  }
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
  margin-right: 10px;

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