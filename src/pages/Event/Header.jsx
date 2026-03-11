import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { Link, NavLink } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import LoginModal from "../../LoginModal";
import iceTourLogo from "./eis_tour_logo.png";
import { buildAssetUrl } from "../../utils/assets.jsx";
import { getApiBaseUrl } from "../../shared/api/client";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [headerAvatarUrl, setHeaderAvatarUrl] = useState(() => localStorage.getItem("avatarUrl"));
  const [hasEventRegistration, setHasEventRegistration] = useState(() => localStorage.getItem("event2026_has_registration") === "1");
  const menuRef = useRef(null);
  const { userId, username, isLoggedIn, login, logout } = useUser();
  const isAdmin = Number(userId) === 1;
  const apiUrl = getApiBaseUrl();
  const headerAvatarSrc = buildAssetUrl(headerAvatarUrl);
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";
  const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  const now = new Date();
  const liveStartDate = new Date(now.getFullYear(), 4, 15, 0, 0, 0, 0);
  const shouldShowLiveMap = isLocalHost || now >= liveStartDate;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!isLoggedIn) {
      setHeaderAvatarUrl(null);
      return;
    }
    setHeaderAvatarUrl(localStorage.getItem("avatarUrl"));
  }, [isLoggedIn, userId, username]);

  useEffect(() => {
    if (!isLoggedIn) {
      setHasEventRegistration(false);
      return;
    }

    const syncRegistrationState = () => {
      setHasEventRegistration(localStorage.getItem("event2026_has_registration") === "1");
    };

    syncRegistrationState();
    window.addEventListener("storage", syncRegistrationState);

    return () => {
      window.removeEventListener("storage", syncRegistrationState);
    };
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn || !userId || !apiUrl || headerAvatarUrl) return;

    let isCancelled = false;
    fetch(`${apiUrl}/get_user_stats.php?nutzer_id=${userId}&cur_user_id=${userId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const nextAvatar = data?.avatar_url || null;
        if (isCancelled || !nextAvatar) return;
        setHeaderAvatarUrl(nextAvatar);
        localStorage.setItem("avatarUrl", nextAvatar);
      })
      .catch((error) => {
        console.warn("Event header avatar could not be loaded:", error);
      });

    return () => {
      isCancelled = true;
    };
  }, [apiUrl, isLoggedIn, userId, headerAvatarUrl]);

  return (
    <>
      <HeaderContainer>
        <BrandCenter to="/ice-tour" onClick={() => setMenuOpen(false)}>
          <Logo src={iceTourLogo} alt="Ice-Tour" />
        </BrandCenter>

        <HeaderRight>
          {isLoggedIn ? (
            <AccountCluster>
              <UserStatusLink to={hasEventRegistration ? "/event-me" : "/event-registration"} onClick={() => setMenuOpen(false)}>
                <UserStatusAvatar aria-hidden="true">
                  {headerAvatarSrc ? <img src={headerAvatarSrc} alt="" /> : (username || "?").slice(0, 1).toUpperCase()}
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
            aria-label={menuOpen ? "Menü schließen" : "Menü öffnen"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <span />
            <span />
            <span />
          </BurgerMenu>
        </HeaderRight>

        {menuOpen && (
          <Menu ref={menuRef}>
            <MenuSection>
              <MenuSectionTitle>Ice-Tour</MenuSectionTitle>
              <MenuItemLink to="/ice-tour" onClick={() => setMenuOpen(false)}>Ausschreibung</MenuItemLink>
              <MenuItemLink to="/event-gifts" onClick={() => setMenuOpen(false)}>Gutscheine schenken</MenuItemLink>
              {!hasEventRegistration && (
                <MenuItemLink to="/event-registration" onClick={() => setMenuOpen(false)}>Registrierung</MenuItemLink>
              )}
              {shouldShowLiveMap && (
                <MenuItemLink to="/event-live" onClick={() => setMenuOpen(false)}>Live</MenuItemLink>
              )}
              {isAdmin && (
                <MenuItemLink to="/event-admin" onClick={() => setMenuOpen(false)}>Admin</MenuItemLink>
              )}
              {isLoggedIn && hasEventRegistration && (
                <>
                  <MenuItemLink to="/event-me" onClick={() => setMenuOpen(false)}>Meine Anmeldung</MenuItemLink>
                  <MenuItemLink to="/event-stamp-card" onClick={() => setMenuOpen(false)}>Stempelkarte</MenuItemLink>
                </>
              )}
            </MenuSection>

            <MenuDivider />
            <MenuSection>
              <MenuSectionTitle>Navigation</MenuSectionTitle>
              <MenuItemLink to="/" onClick={() => setMenuOpen(false)}>Zur Ice-App</MenuItemLink>
            </MenuSection>

            <MenuDivider />
            <MenuSection>
              <MenuSectionTitle>Konto</MenuSectionTitle>
              {isLoggedIn ? (
                <>
                  {hasEventRegistration && (
                    <>
                      <MenuItemLink to="/event-me" onClick={() => setMenuOpen(false)}>Meine Anmeldung</MenuItemLink>
                      <MenuItemLink to="/event-stamp-card" onClick={() => setMenuOpen(false)}>Stempelkarte</MenuItemLink>
                    </>
                  )}
                  {isAdmin && (
                    <MenuItemLink to="/event-admin" onClick={() => setMenuOpen(false)}>Admin-Übersicht</MenuItemLink>
                  )}
                  <MenuActionButton
                    type="button"
                    $danger
                    onClick={() => {
                      logout();
                      setMenuOpen(false);
                    }}
                  >
                    Ausloggen
                  </MenuActionButton>
                </>
              ) : (
                <MenuActionButton
                  type="button"
                  onClick={() => {
                    setShowLoginModal(true);
                    setMenuOpen(false);
                  }}
                >
                  Einloggen
                </MenuActionButton>
              )}
            </MenuSection>
          </Menu>
        )}
      </HeaderContainer>

      {showLoginModal && (
        <LoginModal
          userId={userId}
          isLoggedIn={isLoggedIn}
          login={login}
          setShowLoginModal={setShowLoginModal}
        />
      )}
    </>
  );
}

const HeaderContainer = styled.header`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding: 0px 16px;
  min-height: 150px;
  background-color: #ffb522;
  position: sticky;
  top: 0;
  z-index: 1000;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);

  @media (max-width: 768px) {
    min-height: 100px;
    padding: 2px 8px;
  }
`;

const BrandCenter = styled(Link)`
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: #2f2100;
`;

const Logo = styled.img`
  height: 130px;
  display: block;
  object-fit: contain;

  @media (max-width: 768px) {
    height: 100px;
    margin-right: 40px;
  }
`;

const BrandTitle = styled.span`
  font-size: 1.6rem;
  font-weight: 900;
  letter-spacing: 0.02em;
  white-space: nowrap;
  text-transform: uppercase;

  @media (max-width: 768px) {
    font-size: 1.2rem;
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
    max-width: calc(100vw - 160px);
  }
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
  box-sizing: border-box;
  max-height: min(78vh, calc(100dvh - 88px));
  overflow-y: auto;
  overflow-x: hidden;
  background: rgba(255, 252, 243, 0.98);
  padding: 10px;
  border-radius: 16px;
  border: 1px solid rgba(47, 33, 0, 0.12);
  box-shadow: 0 16px 36px rgba(28, 20, 0, 0.2);
  z-index: 1002;
  color: #2f2100;
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
      : ""}
`;

const Button = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #ffb522;
  color: #2f2100;
  border-radius: 10px;
  border: 1px solid rgba(255, 181, 34, 0.65);
  font-size: 1rem;
  font-weight: 800;
  text-decoration: none;
  transition: background 0.2s ease;

  &:hover {
    background: #ffd36f;
  }
`;

export { Button };
