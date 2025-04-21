import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useUser } from './context/UserContext';
import LoginModal from './LoginModal';
import SubmitIceShopModal from './SubmitIceShopModal';
import { Link } from 'react-router-dom';

const Header = ({ refreshShops }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const { userId, isLoggedIn, userPosition, login, logout } = useUser();
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
            <MenuItemLink to="/">Eis-Karte</MenuItemLink>
            <MenuItemLink to="/ranking">Eisdielen Ranking</MenuItemLink>
            {isLoggedIn ? (
              <>
                <MenuItemLink to="/dashboard">Dashboard</MenuItemLink>
                <MenuItem onClick={() => setShowSubmitNewIceShop(true)}>Neue Eisdiele eintragen</MenuItem>
                <MenuItemLink to="/favoriten">Favoriten anzeigen</MenuItemLink>
                <MenuItem onClick={logout}>Ausloggen</MenuItem>
              </>
            ) : (
              <MenuItem onClick={() => setShowLoginModal(true)}>Einloggen</MenuItem>
            )}
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

  &:hover {
    background:rgb(206, 137, 0);
    color: white;
  }
`;

const MenuItemLink = styled(Link)`
  display: block;
  padding: 10px;
  color: white;
  font-weight: bold;
  text-decoration: none;

  &:hover {
    background:rgb(206, 137, 0);
    color: white;
  }
`;
