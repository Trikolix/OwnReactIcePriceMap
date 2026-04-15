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
import { getResolvedSeasonalCampaigns } from './features/seasonal/campaigns';
import { buildAssetUrl } from './utils/assets.jsx';
import {
  countActivitiesSince,
  readActivityFeedCache,
  readActivityFeedSeenAt,
  writeActivityFeedCache,
} from './utils/activityFeed';
import ActionsOverviewModal from './pages/ActionsOverview';

const Header = ({ refreshShops }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const menuTriggerRef = useRef(null);
  const { userId, username, isLoggedIn, userPosition, authToken, login, logout } = useUser();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSubmitNewIceShop, setShowSubmitNewIceShop] = useState(false);
  const [levelUpInfo, setLevelUpInfo] = useState(null);
  const [newAwards, setNewAwards] = useState([]);
  const [modalData, setModalData] = useState(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [showActionsOverview, setShowActionsOverview] = useState(false);
  const [dashboardNewCount, setDashboardNewCount] = useState(0);
  const [headerAvatarUrl, setHeaderAvatarUrl] = useState(() => localStorage.getItem('avatarUrl'));
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const location = useLocation();
  const navigate = useNavigate();
  const seasonalState = getResolvedSeasonalCampaigns();
  const featuredCampaign = seasonalState.featuredCampaign;
  const promoIconSrc = featuredCampaign?.teaserIcon ? buildAssetUrl(featuredCampaign.teaserIcon) : userOfTheMonthImg;
  const promoIconAlt = featuredCampaign
    ? `${featuredCampaign.title} öffnen`
    : 'Aktionen & Ergebnisse öffnen';
  const EVENT_PENDING_SCAN_KEY = 'event2026_pending_qr_scan_v1';
  const now = new Date();
  const showPhotoChallengeNewBadge = now <= new Date(2026, 4, 31, 23, 59, 59);
  const showIceTourNewBadge = now <= new Date(2026, 5, 16, 23, 59, 59);

  const toggleMenu = () => {
    setMenuOpen((isOpen) => !isOpen);
  };
  const closeMenu = () => setMenuOpen(false);
  const isAdmin = Number(userId) === 1;

  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedInsideMenu = menuRef.current?.contains(event.target);
      const clickedMenuTrigger = menuTriggerRef.current?.contains(event.target);
      if (!clickedInsideMenu && !clickedMenuTrigger) {
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
    if (location.pathname === '/dashboard') {
      setDashboardNewCount(0);
      return;
    }

    const cachedFeed = readActivityFeedCache(userId);
    const seenAt = readActivityFeedSeenAt(userId);
    if (cachedFeed?.activities?.length && seenAt) {
      setDashboardNewCount(countActivitiesSince(cachedFeed.activities, seenAt));
    } else {
      setDashboardNewCount(0);
    }

    const syncDashboardBadge = async () => {
      try {
        const response = await fetch(`${apiUrl}/activity_feed.php?days=7&minimum=20&offset=0`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const activities = Array.isArray(data?.activities) ? data.activities : [];
        writeActivityFeedCache(userId, {
          activities,
          nextOffset: Number.isFinite(data?.meta?.nextOffset) ? data.meta.nextOffset : activities.length,
          hasMore: Boolean(data?.meta?.hasMore),
          cachedAt: new Date().toISOString(),
        });

        const latestSeenAt = readActivityFeedSeenAt(userId);
        setDashboardNewCount(latestSeenAt ? countActivitiesSince(activities, latestSeenAt) : 0);
      } catch (error) {
        console.error('Aktivitäts-Badge konnte nicht aktualisiert werden:', error);
      }
    };

    syncDashboardBadge();

    const handleFeedSeen = (event) => {
      const seenUserId = event.detail?.userId ?? null;
      if (Number(seenUserId || 0) === Number(userId || 0)) {
        setDashboardNewCount(0);
      }
    };

    window.addEventListener('activity-feed-seen', handleFeedSeen);
    return () => window.removeEventListener('activity-feed-seen', handleFeedSeen);
  }, [apiUrl, location.pathname, userId]);

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
    const rootParams = new URLSearchParams(window.location.search);
    let scanCode = params.get("scan");

    // Support both HashRouter query (/#/?scan=...) and root query (/?scan=...)
    if (!scanCode) {
      scanCode = rootParams.get("scan");
    }

    if (scanCode) {
      const persistEventPendingScan = (code) => {
        localStorage.setItem(EVENT_PENDING_SCAN_KEY, JSON.stringify({
          code,
          mode: 'live',
          checkpointId: null,
          savedAt: new Date().toISOString(),
        }));
      };

      const cleanupScanParams = () => {
        params.delete("scan");
        const newSearch = params.toString();
        navigate(
          {
            pathname: location.pathname,
            search: newSearch ? `?${newSearch}` : "",
          },
          { replace: true }
        );

        if (rootParams.has("scan")) {
          rootParams.delete("scan");
          const nextRootSearch = rootParams.toString();
          window.history.replaceState(
            {},
            "",
            `${window.location.pathname}${nextRootSearch ? `?${nextRootSearch}` : ""}${window.location.hash}`
          );
        }
      };

      const processScan = async () => {
        let redirectTarget = null;
        try {
          const payload = { code: scanCode };
          if (userId) payload["nutzer_id"] = userId;

          const scanResponse = await fetch(`${apiUrl}/api/qr_scan.php`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });
          const data = await scanResponse.json();
          if (data.status !== "success") {
            console.error("Scan fehlgeschlagen:", data.message);
            return;
          }

          if (data.award_type === "event_stamp_card") {
            if (!userId) {
              persistEventPendingScan(scanCode);
              setModalData({
                icon: data.icon,
                name: data.name || "Ice-Tour QR-Code",
                description: "Du hast einen QR-Code der Ice-Tour gescannt. Wenn du Teilnehmer bist, logge dich bitte ein, damit der Checkpoint automatisch übertragen wird. Wenn nicht, schau dir gern die Ice-App und das Spendenprojekt Ice-Tour an.",
                statusMessage: "Scan erkannt. Nach dem Login wird der Event-Scan automatisch weiterverarbeitet.",
                needsLogin: true,
              });
              return;
            }

            const lookupResponse = await fetch(`${apiUrl}/event2026/qr_lookup.php?code=${encodeURIComponent(scanCode)}`, {
              headers: {
                ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
              },
            });
            const lookup = await lookupResponse.json();
            if (!lookupResponse.ok || lookup.status !== "success") {
              throw new Error(lookup.message || "Ice-Tour QR-Code konnte nicht ausgewertet werden.");
            }

            if (lookup.user?.has_event_registration) {
              localStorage.removeItem(EVENT_PENDING_SCAN_KEY);
              redirectTarget = `/event-stamp-card?mode=${lookup.checkpoint.mode}&scan=${encodeURIComponent(lookup.checkpoint.qr_code)}&checkpoint=${lookup.checkpoint.id}`;
              return;
            }

            localStorage.removeItem(EVENT_PENDING_SCAN_KEY);
            setModalData({
              icon: data.icon,
              name: lookup.checkpoint?.shop_name || data.name || "Ice-Tour QR-Code",
              description: "Dieser QR-Code gehört zur Ice-Tour. Dein Account ist aktuell nicht als Teilnehmer registriert. Du kannst die Ice-App natürlich trotzdem weiter nutzen und ganz normal Eis einchecken.",
              statusMessage: "Kein Event-Stempel, da keine Ice-Tour Registrierung für diesen Account gefunden wurde.",
              needsLogin: false,
            });
            return;
          }

          if (data.already_scanned) {
            console.log("QR-Code wurde bereits gescannt. Kein Popup.");
            return;
          }

          if (!userId) {
            const stored = JSON.parse(localStorage.getItem("pendingQrScans") || "[]");
            if (stored.includes(scanCode)) {
              console.log("QR-Code ist bereits lokal vorgemerkt. Kein Popup.");
              return;
            }
            if (!stored.includes(scanCode)) {
              stored.push(scanCode);
              localStorage.setItem("pendingQrScans", JSON.stringify(stored));
            }
          }

          setModalData({
            icon: data.icon,
            name: data.name,
            description: data.description,
            needsLogin: !data.saved,
          });
        } catch (err) {
          console.error("Fehler beim Senden des QR-Codes:", err);
        } finally {
          if (redirectTarget) {
            navigate(redirectTarget, { replace: true });
          } else {
            cleanupScanParams();
          }
        }
      };

      processScan();
    }
  }, [location, userId, apiUrl, navigate, authToken]);

  useEffect(() => {
    if (!userId || !apiUrl || !authToken) return;

    let pendingEventScan = null;
    try {
      pendingEventScan = JSON.parse(localStorage.getItem(EVENT_PENDING_SCAN_KEY) || "null");
    } catch {
      pendingEventScan = null;
    }

    const pendingCode = typeof pendingEventScan?.code === 'string' ? pendingEventScan.code.trim() : '';
    if (!pendingCode) return;

    const resolvePendingEventScan = async () => {
      try {
        const response = await fetch(`${apiUrl}/event2026/qr_lookup.php?code=${encodeURIComponent(pendingCode)}`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        const data = await response.json();
        if (!response.ok || data.status !== 'success') {
          return;
        }

        localStorage.removeItem(EVENT_PENDING_SCAN_KEY);

        if (data.user?.has_event_registration) {
          navigate(`/event-stamp-card?mode=${data.checkpoint.mode}&scan=${encodeURIComponent(data.checkpoint.qr_code)}&checkpoint=${data.checkpoint.id}`, { replace: true });
          return;
        }

        setModalData({
          name: data.checkpoint?.shop_name || 'Ice-Tour QR-Code',
          description: 'Dieser QR-Code gehört zur Ice-Tour. Dein Account ist aktuell nicht als Teilnehmer registriert. Du kannst die Ice-App trotzdem ganz normal weiter nutzen und Eis einchecken.',
          statusMessage: 'Kein Event-Stempel, da keine Ice-Tour Registrierung für diesen Account gefunden wurde.',
          needsLogin: false,
        });
      } catch (error) {
        console.error('Fehler beim Verarbeiten des vorgemerkten Ice-Tour QR-Codes:', error);
      }
    };

    resolvePendingEventScan();
  }, [userId, apiUrl, authToken, navigate]);

  useEffect(() => {
    if (!userId || !apiUrl) return;

    let stored = [];
    try {
      stored = JSON.parse(localStorage.getItem("pendingQrScans") || "[]");
      if (!Array.isArray(stored)) stored = [];
    } catch {
      stored = [];
    }

    if (stored.length === 0) return;

    const syncPendingScans = async () => {
      const failedCodes = [];

      for (const code of stored) {
        try {
          const res = await fetch(`${apiUrl}/api/qr_scan.php`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, nutzer_id: userId }),
          });
          const data = await res.json();
          console.log("QR-Scan nach Login übertragen:", data);

          if (data?.status !== "success") {
            failedCodes.push(code);
          }
        } catch (err) {
          console.error("Fehler beim Nachsenden des QR-Codes:", err);
          failedCodes.push(code);
        }
      }

      if (failedCodes.length > 0) {
        localStorage.setItem("pendingQrScans", JSON.stringify([...new Set(failedCodes)]));
      } else {
        localStorage.removeItem("pendingQrScans");
      }
    };

    syncPendingScans();
  }, [userId, apiUrl]);

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

  const headerAvatarSrc = buildAssetUrl(headerAvatarUrl);

  return (
    <>
      <HeaderContainer $menuOpen={menuOpen}>
        <PromoIconsContainer>
          <GewinnspielIcon onClick={() => setShowActionsOverview(true)}>
            <img src={promoIconSrc} alt={promoIconAlt} />
          </GewinnspielIcon>
        </PromoIconsContainer>

        <LogoContainer>
          <a href="/"><Logo src={seasonalState.headerLogo} alt="Website Logo" /></a>
        </LogoContainer>
        <DesktopNav aria-label="Hauptnavigation">
          <DesktopNavLink to="/" end>Karte</DesktopNavLink>
          <DesktopNavLink to="/ice-tour" $compact>
            Ice-Tour
            {showIceTourNewBadge && (<DesktopNavBadge>NEU</DesktopNavBadge>)}
          </DesktopNavLink>
          <DesktopNavLink to="/photo-challenge" $compact>
            Foto-Challenge
            {showPhotoChallengeNewBadge && <DesktopNavBadge>NEU</DesktopNavBadge>}
          </DesktopNavLink>
          <DesktopNavLink to="/dashboard">
            Aktivitäten
            {dashboardNewCount > 0 && <ActivityBadge>{dashboardNewCount}</ActivityBadge>}
          </DesktopNavLink>
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
          <MenuTriggerWrap ref={menuTriggerRef}>
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
          </MenuTriggerWrap>
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
              <MenuItemLink to="/" end onClick={closeMenu}>Karte</MenuItemLink>
              <MenuItemLink to="/ice-tour" onClick={closeMenu}>
                Zur Ice-Tour
                {showIceTourNewBadge && <MenuItemBadge>NEU</MenuItemBadge>}
              </MenuItemLink>
              <MenuItemLink to="/photo-challenge" onClick={closeMenu}>
                Foto-Challenges
                {showPhotoChallengeNewBadge && <MenuItemBadge>NEU</MenuItemBadge>}
              </MenuItemLink>
              <MenuItemLink to="/dashboard" onClick={closeMenu}>
                Aktivitäten
                {dashboardNewCount > 0 && <MenuItemBadge>{dashboardNewCount} neu</MenuItemBadge>}
              </MenuItemLink>
              <MenuItemLink to="/ranking" onClick={closeMenu}>Top Eisdielen</MenuItemLink>
              <MenuItemLink to="/statistics" onClick={closeMenu}>Statistiken</MenuItemLink>
              <MenuItemLink to="/routes" onClick={closeMenu}>Routen</MenuItemLink>
            </MenuSection>

            <MenuDivider />
            {isLoggedIn ? (
              <>
                <MenuSection>
                  <MenuSectionTitle>Mein Konto</MenuSectionTitle>
                  <MenuItemLink to={`/user/${userId}`} onClick={closeMenu}>Profil</MenuItemLink>
                  <MenuItemLink to="/favoriten" onClick={closeMenu}>Favoriten</MenuItemLink>
                  <MenuItemLink to="/challenge" onClick={closeMenu}>Challenges</MenuItemLink>
                  {userId == 2 && (<MenuItemLink to="/admin/weekly-stats" onClick={closeMenu}>Wochenstatistik</MenuItemLink>)}
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
                      <MenuItemLink to="/admin/weekly-stats" onClick={closeMenu}>Wochenstatistik</MenuItemLink>
                      <MenuItemLink to="/systemmeldungenform" onClick={closeMenu}>Systemmeldung erstellen</MenuItemLink>
                      <MenuItemLink to="/awards-admin" onClick={closeMenu}>Awards verwalten</MenuItemLink>
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

      <ActionsOverviewModal
        open={showActionsOverview}
        onClose={() => setShowActionsOverview(false)}
        isLoggedIn={isLoggedIn}
        onLogin={() => {
          setShowActionsOverview(false);
          setShowLoginModal(true);
        }}
      />

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
  z-index: ${({ $menuOpen }) => ($menuOpen ? 1600 : 1200)};
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  box-sizing: border-box;
  width: 100%;

  > * {
    position: relative;
  }

  @media (max-width: 420px) {
    gap: 8px;
    padding: 8px;
  }
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  margin: 0 auto;
  color: black;

  @media (max-width: 768px) {
    flex: 1 1 auto;
    min-width: 0;
    justify-content: center;
  }

  @media (min-width: 769px) {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    margin: 0;
    z-index: 0;
  }

  @media (min-width: 1450px) and (max-width: 1625px) {
    left: calc(50% + 24px);
  }

  @media (min-width: 1300px) and (max-width: 1449px) {
    left: calc(50% + 44px);
  }

  @media (min-width: 1200px) and (max-width: 1299px) {
    left: calc(50% + 68px);
  }

  @media (min-width: 1100px) and (max-width: 1199px) {
    left: calc(50% + 92px);
  }
`;

const Logo = styled.img`
  height: 100px;
  @media (max-width: 768px) {
    height: 60px;
  }

  @media (max-width: 420px) {
    height: 48px;
    max-width: 100%;
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

  @media (min-width: 1100px) and (max-width: 1625px) {
    gap: 2px;
  }
`;

const DesktopNavLink = styled(NavLink)`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: #3d2c00;
  text-decoration: none;
  font-weight: 700;
  padding: 8px ${({ $compact }) => ($compact ? '0px' : '10px')} 8px 10px;
  margin-right: ${({ $compact }) => ($compact ? '-4px' : '0')};
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

  @media (min-width: 1100px) and (max-width: 1625px) {
    gap: 5px;
    font-size: 0.92rem;
    padding: 7px ${({ $compact }) => ($compact ? '0px' : '7px')} 7px 7px;
    margin-right: ${({ $compact }) => ($compact ? '-2px' : '0')};
  }
`;

const DesktopNavBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 1px 6px;
  border-radius: 999px;
  background: #ef4444;
  color: #fff;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  line-height: 1.1;
  transform: translate(-10px, -12px) rotate(12deg);
  transform-origin: center;
  box-shadow: 0 2px 6px rgba(120, 12, 12, 0.28);

  @media (min-width: 1100px) and (max-width: 1625px) {
    transform: translate(-8px, -10px) rotate(12deg);
  }
`;

const ActivityBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 7px;
  border-radius: 999px;
  background: #c2410c;
  color: #fff;
  font-size: 0.72rem;
  font-weight: 800;
  line-height: 1;
  box-shadow: 0 2px 6px rgba(124, 45, 18, 0.22);
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;

  @media (max-width: 768px) {
    flex: 0 1 auto;
    min-width: 0;
  }

  @media (max-width: 420px) {
    gap: 6px;
  }

  @media (min-width: 1100px) and (max-width: 1625px) {
    gap: 6px;
  }
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
    min-height: 42px;
    height: 42px;
    min-width: 0;
    max-width: none;
    flex: 0 1 auto;
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

  @media (max-width: 768px) {
    min-height: 42px;
    height: 42px;
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

  @media (max-width: 768px) {
    min-height: 42px;
    height: 42px;
    padding: 0 8px 0 6px;
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

const MenuTriggerWrap = styled.div`
  position: relative;
  z-index: 2;
`;

const Menu = styled.nav`
  position: absolute;
  top: calc(100% + 8px);
  right: 16px;
  width: min(360px, calc(100vw - 24px));
  max-height: min(78vh, calc(100dvh - 88px));
  box-sizing: border-box;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  background: rgba(255, 252, 243, 0.98);
  padding: 10px;
  border-radius: 16px;
  border: 1px solid rgba(47, 33, 0, 0.12);
  box-shadow: 0 16px 36px rgba(28, 20, 0, 0.2);
  z-index: 3;
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
  width: 95%;
  min-height: 25px;
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
  width: 100%;
  min-height: 40px;
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

const MenuItemBadge = styled.span`
  margin-left: 8px;
  padding: 2px 7px;
  border-radius: 999px;
  background: #ef4444;
  color: #fff;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  line-height: 1.1;
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

  @media (max-width: 420px) {
    margin-right: 0;

    img {
      width: 42px;
      height: 42px;
    }
  }
`;

const PromoIconsContainer = styled.div`
  display: flex;
  align-items: center;

  @media (max-width: 420px) {
    flex: 0 0 auto;
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
