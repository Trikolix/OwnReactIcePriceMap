import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useUser } from './context/UserContext';
import LoginModal from './LoginModal';
import SubmitIceShopModal from './SubmitIceShopModal';
import { Link } from 'react-router-dom';
import NotificationBell from './components/NotificationBell';
import NewAwards from './components/NewAwards';


const Header = ({ refreshShops }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const { userId, username, isLoggedIn, userPosition, login, logout } = useUser();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSubmitNewIceShop, setShowSubmitNewIceShop] = useState(false);
  const [levelUpInfo, setLevelUpInfo] = useState(null);
  const [newAwards, setNewAwards] = useState([]);
  const [showOverlay, setShowOverlay] = useState(false);
  const apiUrl = process.env.REACT_APP_API_BASE_URL;

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

  return (
    <>
      <HeaderContainer>
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
                <MenuItem onClick={logout} className="logged-in">Ausloggen</MenuItem>
              </>
            ) : (
              <MenuItem onClick={() => setShowLoginModal(true)}>Einloggen</MenuItem>
            )}
            <MenuItemLink to="/impressum">Über diese Website</MenuItemLink>
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
        <Overlay>
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

          <NewAwards awards={newAwards} />
        </Overlay>
      )}
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

const Overlay = styled.div`
  position: fixed;
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  background: white;
  padding: 2rem 2.5rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
  text-align: center;
  animation: fadeIn 0.4s ease-out;
  max-width: 90%;
  width: 320px;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateX(-50%) scale(0.9); }
    to   { opacity: 1; transform: translateX(-50%) scale(1); }
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
