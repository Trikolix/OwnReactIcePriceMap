import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import styled from 'styled-components';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Camera,
  Smartphone,
  Bell,
  IceCream,
  Users,
  Instagram,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  ArrowRight,
  Loader2,
  Store,
  MessageSquarePlus,
  Target,
  Route,
  Heart,
  Trophy,
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { usePwaInstall } from '../hooks/usePwaInstall';
import {
  getBrowserPushStatus,
  enableBrowserPush,
  initializeNativePush,
} from '../services/pushNotifications';
import { Capacitor } from '@capacitor/core';
import InviteFriendsModal from './InviteFriendsModal';
import PwaInstallModal from './PwaInstallModal';
import SubmitIceShopModal from '../SubmitIceShopModal';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

/* ==========================================================================
   STYLED COMPONENTS
   ========================================================================== */
const CardContainer = styled.div`
  background: #ffffff;
  border-radius: 18px;
  border: 1px solid rgba(47, 33, 0, 0.09);
  box-shadow: 0 4px 20px rgba(47, 33, 0, 0.06);
  padding: 18px 20px;
  margin-bottom: 24px;
  box-sizing: border-box;
  width: 100%;
  transition: all 0.2s ease;

  @media (max-width: 640px) {
    padding: 14px 14px;
    border-radius: 16px;
    margin-bottom: 18px;
  }
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const HeaderIconBadge = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: ${(props) =>
    props.$expert
      ? 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)'
      : 'linear-gradient(135deg, #ffb522 0%, #ff8a00 100%)'};
  color: #231900;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(255, 181, 34, 0.35);
  flex-shrink: 0;
`;

const TitleWrap = styled.div`
  display: flex;
  flex-direction: column;
`;

const MainTitle = styled.h2`
  font-size: 1.05rem;
  font-weight: 800;
  color: #231900;
  margin: 0;
  line-height: 1.25;
`;

const Subtitle = styled.span`
  font-size: 0.78rem;
  color: rgba(47, 33, 0, 0.65);
  margin-top: 2px;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const IconButton = styled.button`
  background: #fdfaf3;
  border: 1px solid rgba(47, 33, 0, 0.08);
  border-radius: 10px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #5c450e;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: #f7eed8;
    color: #231900;
  }
`;

const StageTabs = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 14px;
  margin-bottom: 12px;
`;

const StageTab = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1.5px solid ${(props) => (props.$active ? '#ffb522' : '#e5e7eb')};
  background: ${(props) => (props.$active ? '#fffbeb' : '#ffffff')};
  color: ${(props) => (props.$active ? '#92400e' : '#6b7280')};
  box-shadow: ${(props) => (props.$active ? '0 2px 8px rgba(255, 181, 34, 0.22)' : 'none')};

  &:hover {
    background: ${(props) => (props.$active ? '#fffbeb' : '#f9fafb')};
    border-color: ${(props) => (props.$active ? '#ffb522' : '#d1d5db')};
  }
`;

const StageCounter = styled.span`
  font-size: 0.72rem;
  font-weight: 800;
  background: rgba(0, 0, 0, 0.06);
  padding: 2px 6px;
  border-radius: 8px;
`;

const ProgressSection = styled.div`
  margin-top: 4px;
  margin-bottom: 16px;
`;

const ProgressLabels = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  font-weight: 700;
  color: #6b4d1b;
  margin-bottom: 6px;
`;

const ProgressBarTrack = styled.div`
  width: 100%;
  height: 8px;
  background: #f1ebd9;
  border-radius: 999px;
  overflow: hidden;
`;

const ProgressBarFill = styled.div`
  height: 100%;
  width: ${(props) => Math.min(100, Math.max(0, props.$percent))}%;
  background: ${(props) =>
    props.$expert
      ? 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)'
      : 'linear-gradient(90deg, #ffb522 0%, #ff8a00 100%)'};
  border-radius: 999px;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
`;

const StepsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const StepCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 12px;
  background: ${(props) => (props.$done ? '#f0fdf4' : '#fafafa')};
  border: 1px solid ${(props) => (props.$done ? '#bbf7d0' : '#e5e7eb')};
  transition: all 0.2s ease;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
    padding: 10px 12px;
    gap: 8px;
  }
`;

const StepLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
`;

const StepIconWrap = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: ${(props) => (props.$done ? '#dcfce7' : '#f3f4f6')};
  color: ${(props) => (props.$done ? '#16a34a' : '#6b7280')};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const StepTextWrap = styled.div`
  display: flex;
  flex-direction: column;
`;

const StepTitle = styled.span`
  font-size: 0.88rem;
  font-weight: 700;
  color: ${(props) => (props.$done ? '#15803d' : '#1f2937')};
  line-height: 1.25;
`;

const StepDescription = styled.span`
  font-size: 0.74rem;
  color: ${(props) => (props.$done ? '#166534' : '#6b7280')};
  margin-top: 2px;
  line-height: 1.25;
`;

const StepActionWrap = styled.div`
  flex-shrink: 0;
  @media (max-width: 640px) {
    width: 100%;
    display: flex;
    justify-content: flex-end;
  }
`;

const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: ${(props) => (props.$primary ? '#ffb522' : '#ffffff')};
  color: ${(props) => (props.$primary ? '#231900' : '#374151')};
  border: 1px solid ${(props) => (props.$primary ? '#e59d16' : '#d1d5db')};
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${(props) => (props.$primary ? '#f5a711' : '#f9fafb')};
    border-color: ${(props) => (props.$primary ? '#c98305' : '#9ca3af')};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const DoneBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #16a34a;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 6px;
  background: #dcfce7;
`;

const SuccessBanner = styled.div`
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border: 1px solid #a7f3d0;
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const SuccessTextWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const AwardIconBadge = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(255, 181, 34, 0.4);
  flex-shrink: 0;
  border: 2px solid #ffb522;
  background: #ffb522;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const SuccessTitle = styled.div`
  font-size: 0.92rem;
  font-weight: 800;
  color: #065f46;
`;

const SuccessSubtitle = styled.div`
  font-size: 0.76rem;
  color: #047857;
  margin-top: 2px;
`;

/* ==========================================================================
   COMPONENT
   ========================================================================== */
export default function OnboardingChecklist({ initialStats, onOpenAvatarSettings }) {
  const { userId, isLoggedIn, userPosition } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  const [stats, setStats] = useState(initialStats || null);
  const [loadingStats, setLoadingStats] = useState(!initialStats);
  const [pushGranted, setPushGranted] = useState(false);
  const [pushActivating, setPushActivating] = useState(false);
  const [inviteShared, setInviteShared] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('onboarding_invite_done') === '1';
  });
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAddShopModal, setShowAddShopModal] = useState(false);

  const effectiveUserId = useMemo(() => {
    return userId || (typeof window !== 'undefined' ? localStorage.getItem('userId') : null);
  }, [userId]);

  const dismissKey = useMemo(
    () => (effectiveUserId ? `iceapp_onboarding_dismissed:${effectiveUserId}` : 'iceapp_onboarding_dismissed'),
    [effectiveUserId]
  );
  const collapseKey = useMemo(
    () => (effectiveUserId ? `iceapp_onboarding_collapsed:${effectiveUserId}` : 'iceapp_onboarding_collapsed'),
    [effectiveUserId]
  );

  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    const uid = localStorage.getItem('userId');
    if (!uid) return false;
    return localStorage.getItem(`iceapp_onboarding_dismissed:${uid}`) === 'true';
  });

  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    const uid = localStorage.getItem('userId');
    if (!uid) return false;
    return localStorage.getItem(`iceapp_onboarding_collapsed:${uid}`) === 'true';
  });

  // Re-Sync mit localStorage, sobald effectiveUserId zur Verfügung steht
  useEffect(() => {
    if (typeof window === 'undefined' || !effectiveUserId) return;
    const storedDismissed = localStorage.getItem(`iceapp_onboarding_dismissed:${effectiveUserId}`);
    if (storedDismissed !== null) {
      setIsDismissed(storedDismissed === 'true');
    }
    const storedCollapsed = localStorage.getItem(`iceapp_onboarding_collapsed:${effectiveUserId}`);
    if (storedCollapsed !== null) {
      setIsCollapsed(storedCollapsed === 'true');
    }
  }, [effectiveUserId]);

  // Synchronisation mit Backend-Einstellungen
  useEffect(() => {
    if (!effectiveUserId || !API_BASE) return;
    const checkNotificationSettings = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/get_user_notification_settings.php?user_id=${effectiveUserId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const json = await res.json();
          if (json?.show_onboarding_checklist === 0) {
            setIsDismissed(true);
            if (typeof window !== 'undefined') {
              localStorage.setItem(`iceapp_onboarding_dismissed:${effectiveUserId}`, 'true');
            }
          }
        }
      } catch (e) {}
    };
    checkNotificationSettings();
  }, [effectiveUserId]);

  // URL-Parameter (?onboarding=1 oder ?showOnboarding=1) auswerten
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(location.search);
    if (params.get('onboarding') === '1' || params.get('showOnboarding') === '1') {
      setIsDismissed(false);
      setIsCollapsed(false);
      if (dismissKey) localStorage.removeItem(dismissKey);
      if (collapseKey) localStorage.removeItem(collapseKey);
    }
  }, [location.search, dismissKey, collapseKey]);

  // Globales Event 'onboarding:show' und 'onboarding:hide' abfangen
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleShowOnboarding = () => {
      setIsDismissed(false);
      setIsCollapsed(false);
      if (dismissKey) localStorage.removeItem(dismissKey);
      if (collapseKey) localStorage.removeItem(collapseKey);
    };
    const handleHideOnboarding = () => {
      setIsDismissed(true);
      if (dismissKey) localStorage.setItem(dismissKey, 'true');
    };
    window.addEventListener('onboarding:show', handleShowOnboarding);
    window.addEventListener('onboarding:hide', handleHideOnboarding);
    return () => {
      window.removeEventListener('onboarding:show', handleShowOnboarding);
      window.removeEventListener('onboarding:hide', handleHideOnboarding);
    };
  }, [dismissKey, collapseKey]);

  const { canInstall, isStandalone, installApp, showIosModal, setShowIosModal } = usePwaInstall();

  // 1. Stats laden falls noch nicht übergeben
  const loadUserStats = useCallback(async () => {
    if (!effectiveUserId || !API_BASE) return;
    try {
      setLoadingStats(true);
      const res = await fetch(`${API_BASE}/get_user_stats.php?nutzer_id=${effectiveUserId}&cur_user_id=${effectiveUserId}`);
      if (res.ok) {
        const json = await res.json();
        setStats(json);
      }
    } catch (e) {
      console.warn('Onboarding: Konnte Nutzerdaten nicht laden', e);
    } finally {
      setLoadingStats(false);
    }
  }, [effectiveUserId]);

  useEffect(() => {
    if (!initialStats && effectiveUserId) {
      loadUserStats();
    } else if (initialStats) {
      setStats(initialStats);
    }
  }, [initialStats, effectiveUserId, loadUserStats]);

  // 2. Push-Status prüfen
  const checkPushStatus = useCallback(async () => {
    if (typeof window === 'undefined') return;
    if (Capacitor.isNativePlatform()) {
      setPushGranted(true);
      return;
    }
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      setPushGranted(true);
      return;
    }
    try {
      const status = await getBrowserPushStatus();
      setPushGranted(status.permission === 'granted');
    } catch {
      setPushGranted(false);
    }
  }, []);

  useEffect(() => {
    checkPushStatus();
  }, [checkPushStatus]);

  /* --------------------------------------------------------------------------
     STUFE 1 KRITERIEN (Dein Ice-App Start)
     -------------------------------------------------------------------------- */
  const step1AvatarDone = Boolean(stats?.avatar_url || stats?.avatar_path);
  const step2AppDone = Boolean(
    isStandalone ||
    !canInstall ||
    (typeof window !== 'undefined' && localStorage.getItem('onboarding_app_installed') === '1')
  );
  const step3PushDone = Boolean(pushGranted);
  const step4CheckinDone = Boolean((Number(stats?.anzahl_checkins) || 0) > 0);
  const step5InviteDone = Boolean(
    (Number(stats?.invited_count) || 0) > 0 || inviteShared
  );
  const step6SocialDone = Boolean(
    (stats?.instagram_account && stats.instagram_account.trim()) ||
    (stats?.strava_account && stats.strava_account.trim())
  );

  const completedStage1Steps = [
    step1AvatarDone,
    step2AppDone,
    step3PushDone,
    step4CheckinDone,
    step5InviteDone,
    step6SocialDone,
  ].filter(Boolean).length;
  const allStage1Completed = completedStage1Steps === 6;

  /* --------------------------------------------------------------------------
     STUFE 2 KRITERIEN (Ice-App Experte)
     -------------------------------------------------------------------------- */
  const expertStep1ShopDone = Boolean((Number(stats?.expert_created_shops_with_checkin) || 0) > 0);
  const expertStep2ReviewDone = Boolean((Number(stats?.review_count) || 0) > 0);
  const expertStep3CheckinsDone = Boolean((Number(stats?.anzahl_checkins) || 0) >= 5);
  const expertStep4ChallengeDone = Boolean((Number(stats?.completed_challenges_count) || 0) > 0);
  const expertStep5RouteDone = Boolean((Number(stats?.submitted_routes_count) || 0) > 0);
  const expertStep6LikesDone = Boolean((Number(stats?.foreign_likes_given_count) || 0) >= 10);

  const completedStage2Steps = [
    expertStep1ShopDone,
    expertStep2ReviewDone,
    expertStep3CheckinsDone,
    expertStep4ChallengeDone,
    expertStep5RouteDone,
    expertStep6LikesDone,
  ].filter(Boolean).length;
  const allStage2Completed = completedStage2Steps === 6;

  /* --------------------------------------------------------------------------
     STUFEN-WECHSEL & STATUS
     -------------------------------------------------------------------------- */
  const [activeStage, setActiveStage] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('iceapp_onboarding_stage');
      if (saved === '1' || saved === '2') return Number(saved);
    }
    return 1;
  });

  // Sobald Stufe 1 fertig ist und der Nutzer nicht manuell Stufe 1 gewählt hat:
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('iceapp_onboarding_stage');
    if (allStage1Completed && !saved) {
      setActiveStage(2);
    }
  }, [allStage1Completed]);

  const handleSelectStage = (stageNum) => {
    setActiveStage(stageNum);
    if (typeof window !== 'undefined') {
      localStorage.setItem('iceapp_onboarding_stage', String(stageNum));
    }
  };

  const currentTotalSteps = 6;
  const currentCompletedSteps = activeStage === 1 ? completedStage1Steps : completedStage2Steps;
  const currentProgressPercent = Math.round((currentCompletedSteps / currentTotalSteps) * 100);

  /* --------------------------------------------------------------------------
     AWARD 77 VERGABE (Level 1 für Stufe 1, Level 2 für Stufe 2)
     -------------------------------------------------------------------------- */
  const hasStage1Award = useMemo(() => {
    return Boolean(
      stats?.user_awards?.some(
        (a) => Number(a.award_id) === 77 && Number(a.level) >= 1
      )
    );
  }, [stats?.user_awards]);

  const hasStage2Award = useMemo(() => {
    return Boolean(
      stats?.user_awards?.some(
        (a) => Number(a.award_id) === 77 && Number(a.level) >= 2
      )
    );
  }, [stats?.user_awards]);

  const stage1ClaimedRef = useRef(false);
  const stage2ClaimedRef = useRef(false);

  useEffect(() => {
    if (!allStage1Completed || !effectiveUserId || !API_BASE || stage1ClaimedRef.current || hasStage1Award) return;
    stage1ClaimedRef.current = true;

    const claimStage1 = async () => {
      try {
        const storedToken = localStorage.getItem('authToken');
        const headers = { 'Content-Type': 'application/json' };
        if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;

        const res = await fetch(`${API_BASE}/api/claim_onboarding_award.php`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ user_id: Number(effectiveUserId), level: 1 }),
        });

        if (res.ok) {
          const json = await res.json();
          if (json?.new_awards && json.new_awards.length > 0) {
            window.dispatchEvent(new CustomEvent('new-awards', { detail: json.new_awards }));
          }
        }
      } catch (err) {
        console.warn('Could not claim Stage 1 award:', err);
      }
    };
    claimStage1();
  }, [allStage1Completed, effectiveUserId, hasStage1Award]);

  useEffect(() => {
    if (!allStage2Completed || !effectiveUserId || !API_BASE || stage2ClaimedRef.current || hasStage2Award) return;
    stage2ClaimedRef.current = true;

    const claimStage2 = async () => {
      try {
        const storedToken = localStorage.getItem('authToken');
        const headers = { 'Content-Type': 'application/json' };
        if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;

        const res = await fetch(`${API_BASE}/api/claim_onboarding_award.php`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ user_id: Number(effectiveUserId), level: 2 }),
        });

        if (res.ok) {
          const json = await res.json();
          if (json?.new_awards && json.new_awards.length > 0) {
            window.dispatchEvent(new CustomEvent('new-awards', { detail: json.new_awards }));
          }
        }
      } catch (err) {
        console.warn('Could not claim Stage 2 award:', err);
      }
    };
    claimStage2();
  }, [allStage2Completed, effectiveUserId, hasStage2Award]);

  /* --------------------------------------------------------------------------
     HANDLER
     -------------------------------------------------------------------------- */
  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      if (collapseKey && typeof window !== 'undefined') {
        localStorage.setItem(collapseKey, String(next));
      }
      return next;
    });
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    if (dismissKey && typeof window !== 'undefined') {
      localStorage.setItem(dismissKey, 'true');
    }
    window.dispatchEvent(new CustomEvent('onboarding:hide'));

    if (effectiveUserId && API_BASE) {
      const token = localStorage.getItem('authToken');
      fetch(`${API_BASE}/api/update_user_notification_settings.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          user_id: Number(effectiveUserId),
          show_onboarding_checklist: 0,
        }),
      }).catch(() => {});
    }
  };

  // Stufe 1 Actions
  const handleStep1Avatar = () => {
    if (onOpenAvatarSettings) {
      onOpenAvatarSettings();
    } else {
      navigate(`/user/${effectiveUserId}?openSettings=1`);
    }
  };

  const handleStep2App = async () => {
    const res = await installApp();
    if (res?.outcome === 'accepted') {
      if (typeof window !== 'undefined') {
        localStorage.setItem('onboarding_app_installed', '1');
      }
    }
  };

  const handleStep3Push = async () => {
    if (!effectiveUserId) return;
    try {
      setPushActivating(true);
      if (Capacitor.isNativePlatform()) {
        await initializeNativePush(effectiveUserId);
      } else {
        await enableBrowserPush(effectiveUserId);
      }
      setPushGranted(true);
    } catch (err) {
      console.warn('Push activation error in onboarding:', err);
      navigate(`/user/${effectiveUserId}?openSettings=1`);
    } finally {
      setPushActivating(false);
      checkPushStatus();
    }
  };

  const handleStep4Checkin = () => {
    navigate('/');
  };

  const handleStep5Invite = () => {
    setShowInviteModal(true);
  };

  const handleInviteShared = () => {
    setInviteShared(true);
  };

  const handleStep6Social = () => {
    if (onOpenAvatarSettings) {
      onOpenAvatarSettings();
    } else {
      navigate(`/user/${effectiveUserId}?openSettings=1`);
    }
  };

  // Stufe 2 Actions
  const handleStepExpertShop = () => {
    setShowAddShopModal(true);
  };

  const handleStepExpertReview = () => {
    navigate('/');
  };

  const handleStepExpertChallenge = () => {
    navigate('/challenge');
  };

  const handleStepExpertRoute = () => {
    navigate('/routes');
  };

  const handleStepExpertLikes = () => {
    navigate('/dashboard');
  };

  /* --------------------------------------------------------------------------
     RENDER GUARDS (Verhindert Aufblitzen und unerwünschtes Laden)
     -------------------------------------------------------------------------- */
  if (isDismissed) {
    return null;
  }

  const hasUser = isLoggedIn || Boolean(effectiveUserId) || Boolean(initialStats);
  if (!hasUser) {
    return null;
  }

  if (!stats && loadingStats) {
    return null;
  }

  return (
    <>
      <CardContainer>
        <HeaderRow>
          <HeaderLeft>
            <HeaderIconBadge $expert={activeStage === 2}>
              {activeStage === 2 ? <Trophy size={20} /> : <IceCream size={20} />}
            </HeaderIconBadge>
            <TitleWrap>
              <MainTitle>
                {activeStage === 2 ? 'Ice-App Experte 🌟' : 'Dein Ice-App Start 🍦'}
              </MainTitle>
              <Subtitle>
                {activeStage === 2
                  ? '6 Community-Missionen für echte Eis-Kenner'
                  : '6 Schritte für dein perfektes Eis-Erlebnis'}
              </Subtitle>
            </TitleWrap>
          </HeaderLeft>

          <HeaderActions>
            <IconButton
              type="button"
              onClick={handleToggleCollapse}
              aria-label={isCollapsed ? 'Aufklappen' : 'Zuklappen'}
              title={isCollapsed ? 'Aufklappen' : 'Zuklappen'}
            >
              {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </IconButton>
            <IconButton
              type="button"
              onClick={handleDismiss}
              aria-label="Checkliste ausblenden"
              title="Ausblenden"
            >
              <X size={18} />
            </IconButton>
          </HeaderActions>
        </HeaderRow>

        {/* Stufen-Tabs */}
        <StageTabs>
          <StageTab
            type="button"
            $active={activeStage === 1}
            onClick={() => handleSelectStage(1)}
          >
            <span>🍦 Stufe 1: Start</span>
            {allStage1Completed ? (
              <CheckCircle2 size={15} color="#16a34a" />
            ) : (
              <StageCounter>{completedStage1Steps}/6</StageCounter>
            )}
          </StageTab>
          <StageTab
            type="button"
            $active={activeStage === 2}
            onClick={() => handleSelectStage(2)}
          >
            <span>🌟 Stufe 2: Experte</span>
            {allStage2Completed ? (
              <CheckCircle2 size={15} color="#16a34a" />
            ) : (
              <StageCounter>{completedStage2Steps}/6</StageCounter>
            )}
          </StageTab>
        </StageTabs>

        {/* Fortschrittsbalken */}
        <ProgressSection>
          <ProgressLabels>
            <span>
              {currentCompletedSteps} von {currentTotalSteps}{' '}
              {activeStage === 2 ? 'Missionen' : 'Schritten'} abgeschlossen
            </span>
            <span>{currentProgressPercent}%</span>
          </ProgressLabels>
          <ProgressBarTrack>
            <ProgressBarFill $percent={currentProgressPercent} $expert={activeStage === 2} />
          </ProgressBarTrack>
        </ProgressSection>

        {/* Erfolgs-Banner Stufe 1 */}
        {activeStage === 1 && allStage1Completed && (
          <SuccessBanner>
            <SuccessTextWrap>
              <AwardIconBadge>
                <img
                  src="/award_startklar.jpg"
                  alt="Startklar Award"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </AwardIconBadge>
              <div>
                <SuccessTitle>Großartig! Du bist startklar! 🎉</SuccessTitle>
                <SuccessSubtitle>
                  Stufe 1 vollendet & Award Level 1 freigeschaltet! Bereit für Stufe 2?
                </SuccessSubtitle>
              </div>
            </SuccessTextWrap>
            <ActionButton
              type="button"
              $primary
              onClick={() => handleSelectStage(2)}
            >
              Weiter zu Stufe 2 <ArrowRight size={14} />
            </ActionButton>
          </SuccessBanner>
        )}

        {/* Erfolgs-Banner Stufe 2 */}
        {activeStage === 2 && allStage2Completed && (
          <SuccessBanner>
            <SuccessTextWrap>
              <AwardIconBadge>
                <img
                  src="/award_startklar.jpg"
                  alt="Experten Award"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </AwardIconBadge>
              <div>
                <SuccessTitle>Phänomenal! Du bist Ice-App Experte! 🌟</SuccessTitle>
                <SuccessSubtitle>
                  Alle 6 Experten-Missionen gemeistert & Award Level 2 erhalten!
                </SuccessSubtitle>
              </div>
            </SuccessTextWrap>
            <ActionButton type="button" onClick={handleDismiss}>
              Fertig
            </ActionButton>
          </SuccessBanner>
        )}

        {/* SCHRITTE LISTE STUFE 1 */}
        {!isCollapsed && activeStage === 1 && (
          <StepsList>
            {/* Schritt 1: Profilbild */}
            <StepCard $done={step1AvatarDone}>
              <StepLeft>
                <StepIconWrap $done={step1AvatarDone}>
                  <Camera size={18} />
                </StepIconWrap>
                <StepTextWrap>
                  <StepTitle $done={step1AvatarDone}>Profilbild einstellen</StepTitle>
                  <StepDescription $done={step1AvatarDone}>
                    Zeige deinen Avatar in Rankings, Kommentaren und Benachrichtigungen
                  </StepDescription>
                </StepTextWrap>
              </StepLeft>
              <StepActionWrap>
                {step1AvatarDone ? (
                  <DoneBadge>
                    <CheckCircle2 size={14} /> Erledigt
                  </DoneBadge>
                ) : (
                  <ActionButton type="button" onClick={handleStep1Avatar}>
                    Foto wählen <ArrowRight size={14} />
                  </ActionButton>
                )}
              </StepActionWrap>
            </StepCard>

            {/* Schritt 2: App installieren */}
            <StepCard $done={step2AppDone}>
              <StepLeft>
                <StepIconWrap $done={step2AppDone}>
                  <Smartphone size={18} />
                </StepIconWrap>
                <StepTextWrap>
                  <StepTitle $done={step2AppDone}>Ice App installieren</StepTitle>
                  <StepDescription $done={step2AppDone}>
                    Direkt über den Homescreen öffnen für schnellen Zugriff vor der Eisdiele
                  </StepDescription>
                </StepTextWrap>
              </StepLeft>
              <StepActionWrap>
                {step2AppDone ? (
                  <DoneBadge>
                    <CheckCircle2 size={14} /> Installiert
                  </DoneBadge>
                ) : (
                  <ActionButton type="button" onClick={handleStep2App}>
                    Installieren <ArrowRight size={14} />
                  </ActionButton>
                )}
              </StepActionWrap>
            </StepCard>

            {/* Schritt 3: Benachrichtigungen */}
            <StepCard $done={step3PushDone}>
              <StepLeft>
                <StepIconWrap $done={step3PushDone}>
                  <Bell size={18} />
                </StepIconWrap>
                <StepTextWrap>
                  <StepTitle $done={step3PushDone}>Benachrichtigungen aktivieren</StepTitle>
                  <StepDescription $done={step3PushDone}>
                    Verpasse keine Likes, Erwähnungen, Eis-Dates oder neue Foto-Challenges
                  </StepDescription>
                </StepTextWrap>
              </StepLeft>
              <StepActionWrap>
                {step3PushDone ? (
                  <DoneBadge>
                    <CheckCircle2 size={14} /> Aktiv
                  </DoneBadge>
                ) : (
                  <ActionButton type="button" onClick={handleStep3Push} disabled={pushActivating}>
                    {pushActivating ? <Loader2 size={14} className="animate-spin" /> : 'Aktivieren'}
                    {!pushActivating && <ArrowRight size={14} />}
                  </ActionButton>
                )}
              </StepActionWrap>
            </StepCard>

            {/* Schritt 4: Erster Eis-Check-in */}
            <StepCard $done={step4CheckinDone}>
              <StepLeft>
                <StepIconWrap $done={step4CheckinDone}>
                  <IceCream size={18} />
                </StepIconWrap>
                <StepTextWrap>
                  <StepTitle $done={step4CheckinDone}>Ersten Eis-Check-in machen</StepTitle>
                  <StepDescription $done={step4CheckinDone}>
                    Checke dein Eis an einer Eisdiele ein und starte deine Eiskugel-Historie
                  </StepDescription>
                </StepTextWrap>
              </StepLeft>
              <StepActionWrap>
                {step4CheckinDone ? (
                  <DoneBadge>
                    <CheckCircle2 size={14} /> Eingecheckt
                  </DoneBadge>
                ) : (
                  <ActionButton type="button" onClick={handleStep4Checkin}>
                    Zur Karte <ArrowRight size={14} />
                  </ActionButton>
                )}
              </StepActionWrap>
            </StepCard>

            {/* Schritt 5: Freunde einladen */}
            <StepCard $done={step5InviteDone}>
              <StepLeft>
                <StepIconWrap $done={step5InviteDone}>
                  <Users size={18} />
                </StepIconWrap>
                <StepTextWrap>
                  <StepTitle $done={step5InviteDone}>Freunde einladen</StepTitle>
                  <StepDescription $done={step5InviteDone}>
                    {(Number(stats?.invited_count) || 0) > 0
                      ? `${stats.invited_count} ${stats.invited_count === 1 ? 'Freund' : 'Freunde'} erfolgreich geworben`
                      : 'Teile deinen Einladungslink und vergleiche eure Eis-Rankings'}
                  </StepDescription>
                </StepTextWrap>
              </StepLeft>
              <StepActionWrap>
                {step5InviteDone ? (
                  <DoneBadge>
                    <CheckCircle2 size={14} /> Erledigt
                  </DoneBadge>
                ) : (
                  <ActionButton type="button" onClick={handleStep5Invite}>
                    Freunde werben <ArrowRight size={14} />
                  </ActionButton>
                )}
              </StepActionWrap>
            </StepCard>

            {/* Schritt 6: Social Media verlinken */}
            <StepCard $done={step6SocialDone}>
              <StepLeft>
                <StepIconWrap $done={step6SocialDone}>
                  <Instagram size={18} />
                </StepIconWrap>
                <StepTextWrap>
                  <StepTitle $done={step6SocialDone}>Instagram oder Strava verlinken</StepTitle>
                  <StepDescription $done={step6SocialDone}>
                    Zeige deine Social-Accounts in deinem Profil und vernetze dich mit anderen
                  </StepDescription>
                </StepTextWrap>
              </StepLeft>
              <StepActionWrap>
                {step6SocialDone ? (
                  <DoneBadge>
                    <CheckCircle2 size={14} /> Verlinkt
                  </DoneBadge>
                ) : (
                  <ActionButton type="button" onClick={handleStep6Social}>
                    Verlinken <ArrowRight size={14} />
                  </ActionButton>
                )}
              </StepActionWrap>
            </StepCard>
          </StepsList>
        )}

        {/* SCHRITTE LISTE STUFE 2 (Ice-App Experte) */}
        {!isCollapsed && activeStage === 2 && (
          <StepsList>
            {/* Experte 1: Neue Eisdiele eingetragen mit mind. 1 Check-in */}
            <StepCard $done={expertStep1ShopDone}>
              <StepLeft>
                <StepIconWrap $done={expertStep1ShopDone}>
                  <Store size={18} />
                </StepIconWrap>
                <StepTextWrap>
                  <StepTitle $done={expertStep1ShopDone}>Neue Eisdiele eintragen</StepTitle>
                  <StepDescription $done={expertStep1ShopDone}>
                    {expertStep1ShopDone
                      ? 'Eisdiele erfolgreich eingetragen und mit Check-in bestätigt'
                      : 'Trage eine neue Eisdiele ein, an der mindestens 1 Check-in registriert wurde'}
                  </StepDescription>
                </StepTextWrap>
              </StepLeft>
              <StepActionWrap>
                {expertStep1ShopDone ? (
                  <DoneBadge>
                    <CheckCircle2 size={14} /> Bestätigt
                  </DoneBadge>
                ) : (
                  <ActionButton type="button" onClick={handleStepExpertShop}>
                    Eisdiele eintragen <ArrowRight size={14} />
                  </ActionButton>
                )}
              </StepActionWrap>
            </StepCard>

            {/* Experte 2: Mindestens eine Bewertung geschrieben */}
            <StepCard $done={expertStep2ReviewDone}>
              <StepLeft>
                <StepIconWrap $done={expertStep2ReviewDone}>
                  <MessageSquarePlus size={18} />
                </StepIconWrap>
                <StepTextWrap>
                  <StepTitle $done={expertStep2ReviewDone}>Bewertung schreiben</StepTitle>
                  <StepDescription $done={expertStep2ReviewDone}>
                    {expertStep2ReviewDone
                      ? `${stats?.review_count || 1} ${(stats?.review_count || 1) === 1 ? 'Bewertung' : 'Bewertungen'} verfasst`
                      : 'Verfasse mindestens eine Bewertung zu einer besuchten Eisdiele'}
                  </StepDescription>
                </StepTextWrap>
              </StepLeft>
              <StepActionWrap>
                {expertStep2ReviewDone ? (
                  <DoneBadge>
                    <CheckCircle2 size={14} /> Erledigt
                  </DoneBadge>
                ) : (
                  <ActionButton type="button" onClick={handleStepExpertReview}>
                    Zur Karte <ArrowRight size={14} />
                  </ActionButton>
                )}
              </StepActionWrap>
            </StepCard>

            {/* Experte 3: Mindestens 5 Check-ins */}
            <StepCard $done={expertStep3CheckinsDone}>
              <StepLeft>
                <StepIconWrap $done={expertStep3CheckinsDone}>
                  <IceCream size={18} />
                </StepIconWrap>
                <StepTextWrap>
                  <StepTitle $done={expertStep3CheckinsDone}>Mindestens 5 Check-ins</StepTitle>
                  <StepDescription $done={expertStep3CheckinsDone}>
                    {expertStep3CheckinsDone
                      ? `${stats?.anzahl_checkins || 5} Check-ins gesammelt`
                      : `${Math.min(stats?.anzahl_checkins || 0, 5)} von 5 Check-ins gesammelt`}
                  </StepDescription>
                </StepTextWrap>
              </StepLeft>
              <StepActionWrap>
                {expertStep3CheckinsDone ? (
                  <DoneBadge>
                    <CheckCircle2 size={14} /> 5+ Check-ins
                  </DoneBadge>
                ) : (
                  <ActionButton type="button" onClick={() => navigate('/')}>
                    Eis einchecken <ArrowRight size={14} />
                  </ActionButton>
                )}
              </StepActionWrap>
            </StepCard>

            {/* Experte 4: Mindestens eine Challenge abgeschlossen */}
            <StepCard $done={expertStep4ChallengeDone}>
              <StepLeft>
                <StepIconWrap $done={expertStep4ChallengeDone}>
                  <Target size={18} />
                </StepIconWrap>
                <StepTextWrap>
                  <StepTitle $done={expertStep4ChallengeDone}>Challenge abschließen</StepTitle>
                  <StepDescription $done={expertStep4ChallengeDone}>
                    {expertStep4ChallengeDone
                      ? `${stats?.completed_challenges_count || 1} ${(stats?.completed_challenges_count || 1) === 1 ? 'Challenge' : 'Challenges'} gemeistert`
                      : 'Schließe mindestens eine tägliche oder wöchentliche Challenge ab'}
                  </StepDescription>
                </StepTextWrap>
              </StepLeft>
              <StepActionWrap>
                {expertStep4ChallengeDone ? (
                  <DoneBadge>
                    <CheckCircle2 size={14} /> Gemeistert
                  </DoneBadge>
                ) : (
                  <ActionButton type="button" onClick={handleStepExpertChallenge}>
                    Zu den Challenges <ArrowRight size={14} />
                  </ActionButton>
                )}
              </StepActionWrap>
            </StepCard>

            {/* Experte 5: Eine Route eingereicht */}
            <StepCard $done={expertStep5RouteDone}>
              <StepLeft>
                <StepIconWrap $done={expertStep5RouteDone}>
                  <Route size={18} />
                </StepIconWrap>
                <StepTextWrap>
                  <StepTitle $done={expertStep5RouteDone}>Eis-Route einreichen</StepTitle>
                  <StepDescription $done={expertStep5RouteDone}>
                    {expertStep5RouteDone
                      ? `${stats?.submitted_routes_count || 1} ${(stats?.submitted_routes_count || 1) === 1 ? 'Route' : 'Routen'} eingereicht`
                      : 'Teile eine Rad- oder Wanderroute mit einem Stopp bei einer Eisdiele'}
                  </StepDescription>
                </StepTextWrap>
              </StepLeft>
              <StepActionWrap>
                {expertStep5RouteDone ? (
                  <DoneBadge>
                    <CheckCircle2 size={14} /> Eingereicht
                  </DoneBadge>
                ) : (
                  <ActionButton type="button" onClick={handleStepExpertRoute}>
                    Routen ansehen <ArrowRight size={14} />
                  </ActionButton>
                )}
              </StepActionWrap>
            </StepCard>

            {/* Experte 6: Mindestens 10 Likes vergeben (auf fremde Beiträge) */}
            <StepCard $done={expertStep6LikesDone}>
              <StepLeft>
                <StepIconWrap $done={expertStep6LikesDone}>
                  <Heart size={18} />
                </StepIconWrap>
                <StepTextWrap>
                  <StepTitle $done={expertStep6LikesDone}>10 Likes vergeben</StepTitle>
                  <StepDescription $done={expertStep6LikesDone}>
                    {expertStep6LikesDone
                      ? `${stats?.foreign_likes_given_count || 10} Likes an die Community verteilt`
                      : `${Math.min(stats?.foreign_likes_given_count || 0, 10)} von 10 Likes auf fremde Beiträge`}
                  </StepDescription>
                </StepTextWrap>
              </StepLeft>
              <StepActionWrap>
                {expertStep6LikesDone ? (
                  <DoneBadge>
                    <CheckCircle2 size={14} /> 10+ Likes
                  </DoneBadge>
                ) : (
                  <ActionButton type="button" onClick={handleStepExpertLikes}>
                    Aktivitäten ansehen <ArrowRight size={14} />
                  </ActionButton>
                )}
              </StepActionWrap>
            </StepCard>
          </StepsList>
        )}
      </CardContainer>

      {/* Modal zum Freunde werben */}
      <InviteFriendsModal
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        inviteCode={stats?.invite_code || ''}
        invitedCount={Number(stats?.invited_count) || 0}
        invitedPendingCount={Number(stats?.invited_pending_count) || 0}
        onShared={handleInviteShared}
      />

      {/* iOS Installationshilfe */}
      <PwaInstallModal
        open={showIosModal}
        onClose={() => setShowIosModal(false)}
      />

      {/* Eisdiele eintragen Modal */}
      {showAddShopModal && (
        <SubmitIceShopModal
          showForm={showAddShopModal}
          setShowForm={setShowAddShopModal}
          userId={effectiveUserId}
          refreshShops={loadUserStats}
          userLatitude={userPosition ? userPosition[0] : 50.83}
          userLongitude={userPosition ? userPosition[1] : 12.92}
        />
      )}
    </>
  );
}
