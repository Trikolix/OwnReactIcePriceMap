import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  Activity, Award, BarChart3, Bell, Bike, CalendarDays, Camera, ClipboardList,
  IceCreamCone, Info, Instagram, LogIn, LogOut, Map, Megaphone,
  Menu as MenuIcon, Route, Store, Sun, Target, Trophy, UserRound, Wrench, X,
} from 'lucide-react';
import styled, { css } from 'styled-components';
import NotificationBell from './NotificationBell';
import { AvatarBadgeFrame, LevelBadge, StreakFlames } from './ProfileProgress';

export default function HeaderNavigation({
  logo, promoIcon, userId, username, isLoggedIn, currentLevel, avatarSrc, progress,
  menuOpen, onMenuChange, notificationsOpen, onNotificationsChange,
  onCheckin, checkinOpen, onLogin, onAddShop, onLogout,
  actionCount, hasActivePhotoChallenge, dashboardNewCount, pendingShopChangeCount = 0,
}) {
  const headerRef = useRef(null);
  const menuButtonRef = useRef(null);
  const closeButtonRef = useRef(null);
  const [anchor, setAnchor] = useState({ top: 64, right: 12 });
  const [awardsOpen, setAwardsOpen] = useState(false);
  const location = useLocation();
  const awardsActive = ['/awards-admin', '/summer-campaign-admin', '/admin/summer-campaign', '/admin/tour-de-glace', '/admin/tour-de-glace-femme'].includes(location.pathname);
  const isAdmin = Number(userId) === 1;
  const canMaintain = isAdmin || Number(currentLevel || 0) >= 15;
  const mapActive = location.pathname === '/' || /^\/map(?:\/|$)/.test(location.pathname);
  const closeMenu = () => onMenuChange(false);
  const badgeCount = count => count > 99 ? '99+' : count;
  const avatar = <Avatar aria-hidden="true">{avatarSrc
    ? <img src={avatarSrc} alt="" /> : (username || '?').slice(0, 1).toUpperCase()}</Avatar>;

  useEffect(() => {
    const measure = () => {
      const header = headerRef.current?.getBoundingClientRect();
      const button = menuButtonRef.current?.getBoundingClientRect();
      if (!header || !button) return;
      const next = { top: Math.max(0, header.bottom), right: Math.max(12, innerWidth - button.right) };
      setAnchor(previous => previous.top === next.top && previous.right === next.right ? previous : next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(headerRef.current);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    // Headless UI focuses the dialog container on touch devices; keep the first action visible.
    const frame = requestAnimationFrame(() => closeButtonRef.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [menuOpen]);

  useEffect(() => {
    if (awardsActive) setAwardsOpen(true);
  }, [awardsActive]);

  const menuLink = (to, label, Icon, badge) => {
    const Item = to === '/' ? MenuMapLink : MenuLink;
    return <Item key={to} to={to} onClick={closeMenu}
      className={to === '/' && mapActive ? 'active' : undefined}
      aria-current={to === '/' && mapActive ? 'page' : undefined}>
      <Icon size={18} aria-hidden="true" /><span>{label}</span>
      {badge && <SmallBadge>{badge}</SmallBadge>}
    </Item>;
  };

  return <>
    <Header ref={headerRef} style={{ '--ice-header-bottom': `${anchor.top}px`, '--ice-header-end-gap': `${anchor.right}px` }}>
      <HeaderInner>
        <LogoLink to="/" aria-label="Ice-App Startseite"><Logo src={logo} alt="Ice-App" /></LogoLink>
        <DesktopNav aria-label="Hauptnavigation">
          <DesktopLink as={Link} to="/" className={mapActive ? 'active' : undefined} aria-current={mapActive ? 'page' : undefined}>Karte</DesktopLink>
          <DesktopLink to="/challenge">Challenges</DesktopLink>
          <DesktopLink to="/photo-challenge">Foto-Challenges</DesktopLink>
          <DesktopLink to="/dashboard">Aktivitäten{dashboardNewCount > 0 && <NavDot aria-label={`${dashboardNewCount} neue Aktivitäten`} />}</DesktopLink>
          <DesktopLink to="/aktionen">Aktionen</DesktopLink>
        </DesktopNav>
        <HeaderActions>
          <CheckinButton type="button" onClick={onCheckin} aria-label="Eis einchecken"
            title="Eis einchecken" aria-haspopup="dialog" aria-expanded={checkinOpen}>
            <IceCreamCone size={21} aria-hidden="true" /><span>Eis einchecken</span>
          </CheckinButton>
          {isLoggedIn ? <>
            <NotificationBell open={notificationsOpen} onOpenChange={onNotificationsChange} />
            <ProfileLink to={`/user/${userId}`} aria-label="Mein Profil" title={username || 'Mein Profil'}>{avatar}</ProfileLink>
          </> : <LoginButton type="button" aria-label="Einloggen" title="Einloggen" onClick={onLogin}>
            <LogIn size={21} aria-hidden="true" /><span>Einloggen</span>
          </LoginButton>}
          <IconButton ref={menuButtonRef} type="button" aria-label="Menü öffnen" title="Menü öffnen"
            aria-haspopup="dialog" aria-expanded={menuOpen} onClick={() => onMenuChange(!menuOpen)}>
            <MenuIcon size={24} aria-hidden="true" />
          </IconButton>
        </HeaderActions>
      </HeaderInner>
    </Header>
    <MenuDialog open={menuOpen} onClose={closeMenu} initialFocus={closeButtonRef}>
      <Backdrop />
      <Panel style={{ '--menu-top': `${anchor.top + 8}px`, '--menu-right': `${anchor.right}px` }} data-testid="header-menu">
        <MenuHeading>
          <Title>Menü</Title>
          <CloseButton ref={closeButtonRef} type="button" aria-label="Menü schließen" onClick={closeMenu}><X size={24} aria-hidden="true" /></CloseButton>
        </MenuHeading>
        <MenuBody>
          {isLoggedIn ? <ProfileCard>
            <ProfileSummary to={`/user/${userId}`} onClick={closeMenu}>
              <AvatarBadgeFrame>{avatar}<LevelBadge level={progress?.level_info?.level ?? currentLevel} /></AvatarBadgeFrame>
              <ProfileText><strong>{username || `Nutzer ${userId}`}</strong>
                <span>Level {progress?.level_info?.level ?? currentLevel ?? '–'}{isAdmin ? ' · Administrator' : ''}</span>
              </ProfileText>
            </ProfileSummary>
            <StreakFlames streaks={progress?.streaks} events={progress?.events} showLabels />
          </ProfileCard> : <GuestCard><strong>Willkommen in der Ice-App</strong><p>Deine Eis-Orte, Check-ins und Challenges.</p></GuestCard>}
          <FeaturedAction to="/aktionen" onClick={closeMenu}>
            <img src={promoIcon} alt="" /><span><strong>Aktionen</strong><small>Mitmachen &amp; Rückblicke entdecken</small></span>
            {actionCount > 0 && <SmallBadge>{badgeCount(actionCount)}</SmallBadge>}
          </FeaturedAction>
          <MenuNav aria-label="Alle Seiten">
            <Section aria-labelledby="menu-navigation"><SectionTitle id="menu-navigation">Navigation</SectionTitle>
              {menuLink('/', 'Karte', Map)}
              {isLoggedIn && menuLink('/challenge', 'Challenges', Target)}
              {menuLink('/photo-challenge', 'Foto-Challenges', Camera, hasActivePhotoChallenge ? 'AKTIV' : null)}
              {menuLink('/dashboard', 'Aktivitäten', Activity, dashboardNewCount > 0 ? `${badgeCount(dashboardNewCount)} neu` : null)}
            </Section>
            <Section aria-labelledby="menu-discover"><SectionTitle id="menu-discover">Entdecken</SectionTitle>
              {menuLink('/ranking', 'Top Eisdielen', Trophy)}
              {menuLink('/statistics', 'Statistiken', BarChart3)}
              {menuLink('/routes', 'Routen', Route)}
              {menuLink('/ice-tour', 'Ice-Tour 2026 Rückblick', Bike)}
            </Section>
            <Section aria-labelledby="menu-account"><SectionTitle id="menu-account">Konto</SectionTitle>
              <MenuButton type="button" onClick={onCheckin}><IceCreamCone size={18} aria-hidden="true" /><span>Eis einchecken</span></MenuButton>
              {isLoggedIn ? <>
                {menuLink(`/user/${userId}`, 'Profil', UserRound)}
                {isAdmin && menuLink('/kundenkarten', 'Meine Kundenkarten', ClipboardList)}
                {isAdmin && menuLink('/betreiber', 'Meine Eisdielen', Store)}
                {menuLink('/ice-date', 'Eis-Dates', CalendarDays)}
                {canMaintain && menuLink('/pflege', 'Pflegeboard', Wrench)}
                <MenuButton type="button" onClick={onAddShop}><Store size={18} aria-hidden="true" /><span>Eisdiele hinzufügen</span></MenuButton>
                <MenuButton type="button" onClick={onLogout} $danger><LogOut size={18} aria-hidden="true" /><span>Ausloggen</span></MenuButton>
              </> : <MenuButton type="button" onClick={onLogin}><LogIn size={18} aria-hidden="true" /><span>Einloggen</span></MenuButton>}
            </Section>
            {isLoggedIn && (isAdmin || Number(userId) === 2) && <Section aria-labelledby="menu-admin"><SectionTitle id="menu-admin">Administration</SectionTitle>
              {menuLink('/admin/weekly-stats', 'Wochenstatistik', BarChart3)}
              {menuLink('/admin/push-stats', 'Push-Statistik', Bell)}
              {isAdmin && <>
                {menuLink('/systemmeldungenform', 'Systemmeldung erstellen', Megaphone)}
                {menuLink('/admin/betreiber', 'Betreiberanträge', Store)}
                <MenuButton type="button" $active={awardsActive} aria-expanded={awardsOpen} aria-controls="menu-awards" onClick={() => setAwardsOpen(!awardsOpen)}>
                  <Award size={18} aria-hidden="true" /><span>Awards / Aktionen</span><span aria-hidden="true">{awardsOpen ? '−' : '+'}</span>
                </MenuButton>
                {awardsOpen && <Submenu id="menu-awards">
                  {menuLink('/awards-admin', 'Awards verwalten', Award)}
                  {menuLink('/summer-campaign-admin', 'Sommer-QR-Aktion verwalten', Sun)}
                  {menuLink('/admin/tour-de-glace', 'Tour de Glace verwalten', Bike)}
                  {menuLink('/admin/tour-de-glace-femme', 'Tour de Glace Femmes verwalten', Bike)}
                </Submenu>}
                {menuLink('/admin/instagram', 'Instagram-Fotoexport', Instagram)}
                {menuLink('/photo-challenge-admin', 'Fotochallenges verwalten', Camera)}
                {menuLink('/shop-change-requests', 'Änderungsvorschläge', ClipboardList, pendingShopChangeCount > 0
                  ? <span aria-label={`${pendingShopChangeCount} offene Änderungsvorschläge`}>{badgeCount(pendingShopChangeCount)} offen</span> : null)}
              </>}
            </Section>}
            <Section aria-labelledby="menu-info"><SectionTitle id="menu-info">Informationen</SectionTitle>
              {menuLink('/impressum', 'Über diese Website', Info)}
              <MenuAnchor href="https://www.instagram.com/ice_app.de?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                target="_blank" rel="noreferrer" onClick={closeMenu}><Instagram size={18} aria-hidden="true" /><span>Instagram</span></MenuAnchor>
            </Section>
          </MenuNav>
        </MenuBody>
      </Panel>
    </MenuDialog>
  </>;
}

const focusStyle = css`&:focus-visible { outline: 2px solid #633e14; outline-offset: 2px; }`;
const Header = styled.header`
  flex: 0 0 auto;
  width: 100%;
  min-width: 0;
  position: relative;
  z-index: 1200;
  background: #ffb522;
  color: #2f2100;
  border-bottom: 1px solid #2f210014;
  padding-top: env(safe-area-inset-top, 0px);
`;
const HeaderInner = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 1440px;
  height: 64px;
  margin: 0 auto;
  padding: 0 max(12px, env(safe-area-inset-right)) 0 max(12px, env(safe-area-inset-left));
  box-sizing: border-box;
  @media (max-width: 359px) { gap: 4px; padding: 0 max(8px, env(safe-area-inset-right)) 0 max(8px, env(safe-area-inset-left)); }
  @media (min-width: 768px) { height: 72px; gap: 12px; padding: 0 max(24px, env(safe-area-inset-right)) 0 max(24px, env(safe-area-inset-left)); }
  @media (min-width: 1200px) { height: 80px; gap: 20px; }
`;
const LogoLink = styled(Link)`
  display: flex;
  align-items: center;
  min-width: 44px;
  min-height: 44px;
  max-width: 144px;
  margin-right: auto;
  border-radius: 8px;
  ${focusStyle}
  @media (min-width: 768px) { max-width: 168px; }
  @media (min-width: 1200px) { width: 172px; max-width: 172px; margin-right: 0; flex-shrink: 0; }
`;
const Logo = styled.img`
  display: block;
  width: 100%;
  height: 40px;
  object-fit: contain;
  object-position: left center;
  @media (min-width: 768px) { height: 48px; }
  @media (min-width: 1200px) { height: 56px; }
`;
const DesktopNav = styled.nav`
  display: none;
  @media (min-width: 1200px) { display: flex; align-items: center; gap: 4px; flex: 1; min-width: 0; }
`;
const DesktopLink = styled(NavLink)`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 44px;
  padding: 0 8px;
  border-bottom: 3px solid transparent;
  box-sizing: border-box;
  color: inherit;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
  text-decoration: none;
  &:hover { border-bottom-color: #2f210050; }
  &.active { border-bottom-color: #2f2100; }
  ${focusStyle}
`;
const NavDot = styled.span`width: 7px; height: 7px; background: #9d3300; border-radius: 50%;`;
const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  @media (max-width: 359px) { gap: 2px; }
`;
const IconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  padding: 0;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  &:hover { background: #ffffff55; }
  ${focusStyle}
`;
const CheckinButton = styled(IconButton)`
  width: 84px;
  padding: 0 6px;
  border: 1px solid #633e1466;
  box-sizing: border-box;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.15;
  svg { display: none; }
  span { display: block; }
  @media (min-width: 768px) {
    width: auto;
    gap: 7px;
    padding: 0 12px;
    font-size: 14px;
    svg { display: block; }
    span { white-space: nowrap; }
  }
`;
const LoginButton = styled(IconButton)`
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  span { display: none; }
  @media (min-width: 768px) { width: auto; gap: 7px; padding: 0 12px; span { display: inline; } }
`;
const Avatar = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #fff0c6;
  color: #633e14;
  font-size: 20px;
  font-weight: 800;
  overflow: hidden;
  img { width: 100%; height: 100%; object-fit: cover; }
`;
const ProfileLink = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  color: inherit;
  border-radius: 50%;
  ${focusStyle}
`;
const MenuDialog = styled(Dialog)`position: relative; z-index: 3100;`;
const Backdrop = styled(DialogBackdrop)`
  position: fixed;
  inset: 0;
  background: #2f21004d;
  @media (min-width: 768px) { background: transparent; }
`;
const Panel = styled(DialogPanel)`
  position: fixed;
  top: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  width: min(360px, 100vw);
  height: 100vh;
  height: 100dvh;
  box-sizing: border-box;
  background: #fffaf0;
  color: #2f2100;
  box-shadow: -8px 0 32px #2f210026;
  overflow: hidden;
  @media (min-width: 768px) {
    top: var(--menu-top);
    right: var(--menu-right);
    height: auto;
    max-height: calc(100dvh - var(--menu-top) - 12px);
    border: 1px solid #e6ddc9;
    border-radius: 16px;
  }
`;
const MenuHeading = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  padding: max(10px, env(safe-area-inset-top)) 12px 10px 20px;
  border-bottom: 1px solid #e6ddc9;
`;
const Title = styled(DialogTitle)`margin: 0; font-size: 20px; font-weight: 800;`;
const CloseButton = styled(IconButton)``;
const MenuBody = styled.div`
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 12px 12px max(16px, env(safe-area-inset-bottom));
`;
const ProfileCard = styled.div`padding: 8px 8px 16px; & > span { margin-top: 12px; gap: 8px; }`;
const ProfileSummary = styled(Link)`
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 48px;
  border-radius: 8px;
  text-decoration: none;
  color: inherit;
  ${focusStyle}
`;
const ProfileText = styled.span`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  strong { overflow-wrap: anywhere; font-size: 16px; }
  span { color: #77664a; font-size: 13px; }
`;
const GuestCard = styled.div`padding: 8px; p { margin: 6px 0 12px; color: #77664a; font-size: 14px; }`;
const FeaturedAction = styled(Link)`
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 64px;
  margin-bottom: 12px;
  padding: 10px;
  box-sizing: border-box;
  border-radius: 12px;
  background: #ffe6a3;
  color: inherit;
  text-decoration: none;
  img { width: 44px; height: 44px; object-fit: contain; }
  & > span { min-width: 0; }
  strong, small { display: block; }
  strong { font-size: 16px; }
  small { margin-top: 3px; font-size: 12px; line-height: 1.4; }
  &:hover { background: #ffdc80; }
  ${focusStyle}
`;
const MenuNav = styled.nav`display: grid; gap: 12px;`;
const Section = styled.section`display: grid; gap: 2px; & + section { border-top: 1px solid #e6ddc9; padding-top: 10px; }`;
const SectionTitle = styled.h3`margin: 0; padding: 6px 10px; color: #77664a; font-size: 12px; letter-spacing: .05em; text-transform: uppercase;`;
const menuItem = css`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 44px;
  padding: 10px;
  box-sizing: border-box;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 15px;
  font-weight: 600;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
  svg { flex-shrink: 0; }
  & > span:first-of-type { flex: 1; min-width: 0; overflow-wrap: anywhere; }
  &:hover, &.active { background: #fff0c6; }
  ${focusStyle}
`;
const MenuLink = styled(NavLink)`${menuItem}`;
const MenuMapLink = styled(Link)`${menuItem}`;
const MenuAnchor = styled.a`${menuItem}`;
const MenuButton = styled.button`
  ${menuItem}
  ${p => p.$danger && css`color: #9f1f1f;`}
  ${p => p.$active && css`background: #fff0c6;`}
`;
const Submenu = styled.div`margin-left: 18px; border-left: 2px solid #ffdc80; padding-left: 6px;`;
const SmallBadge = styled.span`
  flex: 0 0 auto;
  padding: 3px 6px;
  border-radius: 999px;
  background: #9d3300;
  color: white;
  font-size: 10px;
  font-weight: 800;
  white-space: nowrap;
`;
