import userOfTheMonthImg from './user_of_the_month.png';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import {
  SubmitButton as SharedSubmitButton,
  Modal as SharedModal,
} from './styles/SharedStyles';
import { useUser } from './context/UserContext';
import LoginModal from './LoginModal';
import SubmitIceShopModal from './SubmitIceShopModal';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import HeaderNavigation from './components/HeaderNavigation';
import QrScanModal from "./components/QrScanModal";
import NewAwards from './components/NewAwards';
import { getResolvedSeasonalCampaigns } from './features/seasonal/campaigns';
import { buildAssetUrl, buildPublicAssetUrl } from './utils/assets.jsx';
import {
  countActivitiesSince,
  readActivityFeedCache,
  readActivityFeedSeenAt,
  writeActivityFeedCache,
} from './utils/activityFeed';
import ActionsOverviewModal from './pages/ActionsOverview';
import GlobalCheckinModal from './components/GlobalCheckinModal';

import useStreakStatus from './hooks/useStreakStatus';

const ACTIVE_PHOTO_CHALLENGE_STATUSES = new Set([
  'active',
  'submission_open',
  'submission_closed',
  'group_running',
  'ko_running',
]);
const Header = ({ refreshShops }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { userId, username, currentLevel, isLoggedIn, userPosition, authToken, login, logout, setCurrentLevel } = useUser();
  const progress = useStreakStatus(isLoggedIn ? userId : null, userId, true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSubmitNewIceShop, setShowSubmitNewIceShop] = useState(false);
  const [levelUpInfo, setLevelUpInfo] = useState(null);
  const [newAwards, setNewAwards] = useState([]);
  const [modalData, setModalData] = useState(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [showActionsOverview, setShowActionsOverview] = useState(false);
  const [showGlobalCheckin, setShowGlobalCheckin] = useState(false);
  const [openCheckinAfterLogin, setOpenCheckinAfterLogin] = useState(false);
  const [dashboardNewCount, setDashboardNewCount] = useState(0);
  const [headerAvatarUrl, setHeaderAvatarUrl] = useState(null);
  const [hasActivePhotoChallenge, setHasActivePhotoChallenge] = useState(false);
  const [activePhotoChallengeCount, setActivePhotoChallengeCount] = useState(0);
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = Number(userId) === 1;
  const now = new Date();
  const seasonalState = getResolvedSeasonalCampaigns(now, { isAdmin });
  const seasonalActionCount = seasonalState.activeCampaigns.filter((campaign) => ['summer_2026', 'tour_de_glace_2026', 'tour_de_glace_femme_2026'].includes(campaign.id)).length;
  const actionHubCount = (activePhotoChallengeCount > 0 ? 1 : 0)
    + seasonalActionCount;
  const promoIconSrc = buildPublicAssetUrl('/assets/action_icon.png');
  const EVENT_PENDING_SCAN_KEY = 'event2026_pending_qr_scan_v1';
  const getAvatarCacheKey = (id) => (id ? `avatarUrl:${id}` : null);

  const closeMenu = () => {
    setMenuOpen(false);
    setNotificationsOpen(false);
  };
  const openLogin = () => {
    closeMenu();
    setShowLoginModal(true);
  };
  const openGlobalCheckin = () => {
    closeMenu();
    if (!isLoggedIn) {
      setOpenCheckinAfterLogin(true);
      setShowLoginModal(true);
      return;
    }
    setShowGlobalCheckin(true);
  };
  useEffect(() => {
    const handle = () => openGlobalCheckin();
    window.addEventListener('iceapp:open-checkin', handle);
    return () => window.removeEventListener('iceapp:open-checkin', handle);
  }, [isLoggedIn]);

  useEffect(() => {
    setMenuOpen(false);
    setNotificationsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (showLoginModal || showSubmitNewIceShop || showGlobalCheckin || showOverlay || showActionsOverview || modalData) {
      setMenuOpen(false);
      setNotificationsOpen(false);
    }
  }, [showLoginModal, showSubmitNewIceShop, showGlobalCheckin, showOverlay, showActionsOverview, modalData]);

  useEffect(() => {
    if (isLoggedIn && openCheckinAfterLogin) {
      setShowLoginModal(false);
      setOpenCheckinAfterLogin(false);
      setShowGlobalCheckin(true);
    }
  }, [isLoggedIn, openCheckinAfterLogin]);

  useEffect(() => {
    if (!apiUrl) {
      setHasActivePhotoChallenge(false);
      setActivePhotoChallengeCount(0);
      return;
    }

    let cancelled = false;

    const syncPhotoChallengeBadge = async () => {
      try {
        const response = await fetch(`${apiUrl}/photo_challenge/list_public_challenges.php`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const challenges = Array.isArray(data?.data) ? data.data : [];
        const activeChallengeCount = challenges.filter((challenge) =>
          ACTIVE_PHOTO_CHALLENGE_STATUSES.has(challenge?.status)
        ).length;

        if (!cancelled) {
          setHasActivePhotoChallenge(activeChallengeCount > 0);
          setActivePhotoChallengeCount(activeChallengeCount);
        }
      } catch (error) {
        console.error('Fotochallenge-Badge konnte nicht aktualisiert werden:', error);
        if (!cancelled) {
          setHasActivePhotoChallenge(false);
          setActivePhotoChallengeCount(0);
        }
      }
    };

    syncPhotoChallengeBadge();

    return () => {
      cancelled = true;
    };
  }, [apiUrl]);

  useEffect(() => {
    const handleOpenActionsHub = () => {
      setShowActionsOverview(true);
    };
    window.addEventListener('actions-hub:open', handleOpenActionsHub);
    return () => window.removeEventListener('actions-hub:open', handleOpenActionsHub);
  }, []);

  useEffect(() => {
    const handleOpenLogin = () => {
      setMenuOpen(false);
      setNotificationsOpen(false);
      setShowLoginModal(true);
    };
    window.addEventListener('auth:open-login', handleOpenLogin);
    return () => window.removeEventListener('auth:open-login', handleOpenLogin);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      setHeaderAvatarUrl(null);
      return;
    }
    const cacheKey = getAvatarCacheKey(userId);
    setHeaderAvatarUrl(cacheKey ? localStorage.getItem(cacheKey) : null);
  }, [isLoggedIn, userId, username]);

  useEffect(() => {
    if (location.pathname === '/dashboard') {
      setDashboardNewCount(0);
      return;
    }

    if (!userId) {
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
      if (event.key === getAvatarCacheKey(userId)) {
        setHeaderAvatarUrl(event.newValue);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [userId, authToken]);

  useEffect(() => {
    const handleAvatarUpdated = (event) => {
      if (String(event.detail?.userId ?? '') !== String(userId ?? '')) return;
      setHeaderAvatarUrl(event.detail?.avatarUrl || null);
    };

    window.addEventListener('avatar-updated', handleAvatarUpdated);
    return () => window.removeEventListener('avatar-updated', handleAvatarUpdated);
  }, [userId]);

  useEffect(() => {
    if (!isLoggedIn || !userId || !apiUrl) return;

    let isCancelled = false;
    fetch(`${apiUrl}/get_user_stats.php?nutzer_id=${userId}&cur_user_id=${userId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const nextAvatar = data?.avatar_url || null;
        if (isCancelled) return;
        const cacheKey = getAvatarCacheKey(userId);
        setHeaderAvatarUrl(nextAvatar);
        if (cacheKey) {
          if (nextAvatar) {
            localStorage.setItem(cacheKey, nextAvatar);
          } else {
            localStorage.removeItem(cacheKey);
          }
        }
      })
      .catch((error) => {
        console.warn('Header avatar could not be loaded:', error);
      });

    return () => {
      isCancelled = true;
    };
  }, [apiUrl, isLoggedIn, userId]);

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
              let lookup = null;
              try {
                const lookupResponse = await fetch(`${apiUrl}/event2026/qr_lookup.php?code=${encodeURIComponent(scanCode)}`);
                const lookupData = await lookupResponse.json();
                if (lookupResponse.ok && lookupData.status === "success") {
                  lookup = lookupData;
                }
              } catch (lookupError) {
                console.error("Ice-Tour QR-Code konnte nicht für die Shop-Weiterleitung ausgewertet werden:", lookupError);
              }

              persistEventPendingScan(scanCode);
              setModalData({
                icon: data.icon,
                name: lookup?.checkpoint?.shop_name || data.name || "Ice-Tour QR-Code",
                description: "Du hast einen QR-Code der Ice-Tour gescannt. Wenn du Teilnehmer bist, logge dich bitte ein, damit der Checkpoint automatisch übertragen wird. Wenn nicht, schau dir gern die Ice-App und das Spendenprojekt Ice-Tour an.",
                statusMessage: "Scan erkannt. Nach dem Login wird der Event-Scan automatisch weiterverarbeitet.",
                needsLogin: true,
              });
              if (lookup?.checkpoint?.shop_id) {
                redirectTarget = `/map/activeShop/${lookup.checkpoint.shop_id}`;
              }
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
            if (lookup.checkpoint?.shop_id) {
              redirectTarget = `/map/activeShop/${lookup.checkpoint.shop_id}`;
            }
            return;
          }

          if (data.already_scanned && !data.summer_campaign) {
            console.log("QR-Code wurde bereits gescannt. Kein Popup.");
            return;
          }

          if (!userId) {
            const stored = JSON.parse(localStorage.getItem("pendingQrScans") || "[]");
            if (stored.includes(scanCode) && !data.summer_campaign) {
              console.log("QR-Code ist bereits lokal vorgemerkt. Kein Popup.");
              return;
            }
            if (!stored.includes(scanCode)) {
              stored.push(scanCode);
              localStorage.setItem("pendingQrScans", JSON.stringify(stored));
            }
          }

          if (data.summer_campaign) {
            const summer = data.summer_campaign;
            const achievementCount = Array.isArray(summer.achievements) ? summer.achievements.length : 0;
            if (summer.shop_id) {
              redirectTarget = `/map/activeShop/${summer.shop_id}`;
            }
            setModalData({
              icon: summer.award?.icon || data.icon,
              name: summer.award?.title || summer.shop_name || data.name || "Sommer-Sammelkarte",
              description: data.saved
                ? `${summer.award?.message || `Sammelkarte freigeschaltet: ${summer.shop_name}.`} ${summer.checkin_confirmed ? "Dein Check-in Bonus ist bereits bestätigt." : "Checke jetzt dein Eis ein, um die Sammelkarte vollständig zu machen."}`
                : `Du hast bei ${summer.shop_name} eine Sommer-Sammelkarte entdeckt. Registriere dich kurz, dann wird der Scan automatisch gespeichert und du kannst dein Eis direkt einchecken.`,
              statusMessage: data.saved
                ? (data.already_scanned ? "Diese Sammelkarte war bereits in deinem Album." : `Gespeichert. ${achievementCount > 0 ? `${achievementCount} Bonus-Award(s) freigeschaltet.` : "Weiter sammeln für Bonus-Awards."}`)
                : "Der Scan ist vorgemerkt. Nach dem Login landet der Award in deinem Sammelalbum.",
              needsLogin: !data.saved,
              primaryAction: data.saved ? "checkin" : "login",
              primaryActionLabel: data.saved ? "Jetzt einchecken" : "Award sichern",
              secondaryActionLabel: data.saved ? "Erst zur Eisdiele" : "Erst Eisdiele ansehen",
              shopId: summer.shop_id,
            });
            window.dispatchEvent(new CustomEvent('seasonal:summer-progress-updated'));
          } else {
            setModalData({
              icon: data.icon,
              name: data.name,
              description: data.description,
              needsLogin: !data.saved,
            });
          }
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
        if (data.checkpoint?.shop_id) {
          navigate(`/map/activeShop/${data.checkpoint.shop_id}`, { replace: true });
        }
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
          } else if (data?.summer_campaign) {
            window.dispatchEvent(new CustomEvent('seasonal:summer-progress-updated'));
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
      const response = await fetch(`${apiUrl}/userManagement/update_activity_and_awards.php?nutzer_id=${userId}`, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      const data = await response.json();
      if (data.current_level != null) {
        setCurrentLevel(data.current_level);
      }

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

  const closeAwardOverlay = async () => {
    const userAwardIds = newAwards
      .map((award) => Number(award?.user_award_id || 0))
      .filter((id) => id > 0);
    if (userAwardIds.length > 0 && authToken) {
      try {
        await fetch(`${apiUrl}/awards/mark_awards_shown.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ user_award_ids: userAwardIds }),
        });
      } catch (error) {
        console.warn('Award-Anzeige konnte nicht bestätigt werden:', error);
      }
    }
    setShowOverlay(false);
    setLevelUpInfo(null);
    setNewAwards([]);
  };

  const headerAvatarSrc = buildAssetUrl(headerAvatarUrl);

  const handleQrPrimaryAction = () => {
    const action = modalData?.primaryAction;
    const shopId = modalData?.shopId;
    setModalData(null);

    if (action === "login") {
      setShowLoginModal(true);
      return;
    }

    if (action === "checkin" && shopId) {
      navigate(`/map/activeShop/${shopId}?tab=checkins&openCheckin=1`, { replace: false });
    }
  };

  return (
    <>
      <HeaderNavigation
        logo={seasonalState.headerLogo}
        promoIcon={promoIconSrc}
        userId={userId}
        username={username}
        currentLevel={currentLevel}
        isLoggedIn={isLoggedIn}
        avatarSrc={headerAvatarSrc}
        progress={progress}
        menuOpen={menuOpen}
        onMenuChange={open => {
          setNotificationsOpen(false);
          setMenuOpen(open);
        }}
        notificationsOpen={notificationsOpen}
        onNotificationsChange={open => {
          setMenuOpen(false);
          setNotificationsOpen(open);
        }}
        onCheckin={openGlobalCheckin}
        checkinOpen={showGlobalCheckin}
        onLogin={openLogin}
        onAddShop={() => { closeMenu(); setShowSubmitNewIceShop(true); }}
        onLogout={() => { closeMenu(); logout(); }}
        actionCount={actionHubCount}
        hasActivePhotoChallenge={hasActivePhotoChallenge}
        dashboardNewCount={dashboardNewCount}
      />
      {showLoginModal &&
        <LoginModal
          userId={userId}
          isLoggedIn={isLoggedIn}
          login={login}
          reloadAfterLogin={!openCheckinAfterLogin}
          setShowLoginModal={open => {
            setShowLoginModal(open);
            if (!open) setOpenCheckinAfterLogin(false);
          }}
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
      <GlobalCheckinModal
        open={showGlobalCheckin}
        onClose={() => setShowGlobalCheckin(false)}
        userId={userId}
        userPosition={userPosition}
        refreshShops={refreshShops}
      />
      {showOverlay && (
        <OverlayBackground>
          <SharedModal>
            <CloseButton onClick={closeAwardOverlay}>&times;</CloseButton>

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
              <SubmitButton onClick={closeAwardOverlay}>Alles Klar!</SubmitButton>
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
        onPrimaryAction={handleQrPrimaryAction}
        data={modalData}
        needsLogin={modalData?.needsLogin}
      />
    </>
  );
};

export default Header;

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
