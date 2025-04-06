import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import ToggleSwitch from "./ToggleSwitch";

const Header = ({ isLoggedIn, onLogout, setShowSubmitNewIceShop, setShowLoginModal, handleToggleChange, centerMapOnUser, clustering, setClustering, setZeigeFavoriten }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

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
    <HeaderContainer>
      <LogoContainer>
        <Logo src={require('./header.png')} alt="Website Logo" />
        <ToggleSwitch options={["Kugeleis", "Softeis", "Alle", "Rating", "Favoriten"]} onChange={handleToggleChange} />
        <button className="custom-button" onClick={centerMapOnUser}>Karte zentrieren</button>
        <button className="custom-button" onClick={() => setClustering(!clustering)}>
          {clustering ? 'Clustering deaktivieren' : 'Clustering aktivieren'}
        </button>
      </LogoContainer>
      
      <BurgerMenu onClick={toggleMenu}>
        <span />
        <span />
        <span />
      </BurgerMenu>
      {menuOpen && (
        <Menu ref={menuRef}>
          <MenuItem href="/ranking.php">Eisdielen Ranking</MenuItem>
          {isLoggedIn ? (
            <>
              <MenuItem onClick={() => setShowSubmitNewIceShop(true)}>Neue Eisdiele eintragen</MenuItem>
              <MenuItem onClick={() => setZeigeFavoriten(true)}>Favoriten anzeigen</MenuItem>
              <MenuItem onClick={onLogout}>Ausloggen</MenuItem>
            </>
          ) : (
            <MenuItem onClick={() => setShowLoginModal(true)}>Einloggen</MenuItem>
          )}
        </Menu>
      )}
    </HeaderContainer>
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
  height: 120px;
`;

const SiteName = styled.h1`
  font-size: 2.0em;
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
