import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useUser } from './context/UserContext';
import LoginModal from './LoginModal';
import SubmitIceShopModal from './SubmitIceShopModal';
import { Link } from 'react-router-dom';

const Header = ({ refreshShops }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const { userId, username, isLoggedIn, userPosition, login, logout } = useUser();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSubmitNewIceShop, setShowSubmitNewIceShop] = useState(false);

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

  return (
    <>
      <HeaderContainer>
        <LogoContainer>
          <a href="/"><Logo src={require('./header_wide.png')} alt="Website Logo" /></a>
        </LogoContainer>

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
            <MenuItemLink to="/impressum">Impressum</MenuItemLink>
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
  z-index: 1000;
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
