import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { useUser } from '../../context/UserContext';
import { usePwaInstall } from '../../hooks/usePwaInstall';
import { enableBrowserPush, initializeNativePush } from '../../services/pushNotifications';
import InviteFriendsModal from '../../components/InviteFriendsModal';
import PwaInstallModal from '../../components/PwaInstallModal';
import { onboardingRequest, recordOnboardingAction, setOnboardingVisible } from './api';
import { onboardingQuest } from './quest';
import { useQuestProgress } from '../quests/useQuestProgress';

const Context = createContext(null);
export const useOnboarding = () => useContext(Context);

export function OnboardingProvider({ children }) {
  const { userId, isLoggedIn, setCurrentLevel } = useUser();
  const location = useLocation(), navigate = useNavigate();
  const [snapshot, setSnapshot] = useState(null), [error, setError] = useState('');
  const progress = snapshot?.userId === userId ? snapshot.data : null;
  const setProgress = useCallback(value => setSnapshot(previous => ({ userId,
    data: typeof value === 'function' ? value(previous?.userId === userId ? previous.data : null) : value,
  })), [userId]);
  const [pinned, setPinned] = useState(true), [chapterOpen, setChapterOpen] = useState(false);
  const [busy, setBusy] = useState(false), [inviteOpen, setInviteOpen] = useState(false);
  const claims = useRef(new Set()), claiming = useRef(null), account = useRef(userId), sequence = useRef(0);
  const setLevel = useRef(setCurrentLevel); setLevel.current = setCurrentLevel; account.current = userId;
  const pwa = usePwaInstall();
  const quest = useMemo(() => onboardingQuest(progress), [progress]);
  const feedback = useQuestProgress(quest, isLoggedIn ? userId : null, isLoggedIn && progress?.visible);
  const load = useCallback(async (signal) => {
    if (!isLoggedIn || !userId) return;
    const request = ++sequence.current;
    try {
      const json = await onboardingRequest('onboarding.php', undefined, signal);
      if (account.current === userId && sequence.current === request) { setProgress(json.data); setError(''); }
    } catch (reason) {
      if (reason.name !== 'AbortError' && account.current === userId && sequence.current === request) setError(reason.message);
    }
  }, [isLoggedIn, userId, setProgress]);
  useEffect(() => {
    setProgress(null); setError(''); setChapterOpen(false); setInviteOpen(false); claims.current.clear(); claiming.current = null;
    try { setPinned(localStorage.getItem(`iceapp:quest-pinned:${userId}:onboarding`) !== '0'); } catch { setPinned(true); }
    const controller = new AbortController();
    load(controller.signal);
    return () => { controller.abort(); sequence.current++; };
  }, [load, userId, setProgress]);
  useEffect(() => {
    if (!isLoggedIn) return;
    let timer;
    const changed = event => {
      if (event.detail?.stages) { sequence.current++; setProgress(event.detail); return; }
      clearTimeout(timer); timer = setTimeout(() => load(), 120);
    };
    const visibility = event => {
      sequence.current++;
      setProgress(previous => previous ? { ...previous, visible: event.detail } : previous);
      if (!event.detail) setChapterOpen(false);
    };
    const visible = () => { if (document.visibilityState === 'visible') changed({}); };
    const events = ['onboarding:changed', 'push:changed', 'avatar-updated', 'focus', 'iceapp:checkin-created', 'iceapp:activity-changed'];
    events.forEach(name => window.addEventListener(name, changed));
    window.addEventListener('onboarding:visibility', visibility); document.addEventListener('visibilitychange', visible);
    return () => {
      clearTimeout(timer); events.forEach(name => window.removeEventListener(name, changed));
      window.removeEventListener('onboarding:visibility', visibility); document.removeEventListener('visibilitychange', visible);
    };
  }, [isLoggedIn, load, setProgress]);
  useEffect(() => {
    if (!isLoggedIn || !pinned || !progress?.visible) return;
    const timer = setInterval(() => { if (document.visibilityState === 'visible') load(); }, 30000);
    return () => clearInterval(timer);
  }, [isLoggedIn, pinned, progress?.visible, load]);
  useEffect(() => {
    if (!isLoggedIn || !pwa.isStandalone || progress?.stats.app_installed !== false) return;
    recordOnboardingAction('app_installed').catch(reason => setError(reason.message));
  }, [isLoggedIn, pwa.isStandalone, progress?.stats.app_installed]);
  useEffect(() => {
    if (!isLoggedIn || new URLSearchParams(location.search).get('onboarding') !== '1') return;
    setOnboardingVisible(true).then(() => load()).catch(reason => setError(reason.message));
  }, [isLoggedIn, location.search, load]);
  useEffect(() => { setChapterOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!progress || !isLoggedIn || claiming.current) return;
    const level = [1, 2].find(value => !claims.current.has(`${userId}:${value}`)
      && !progress.awarded_levels.includes(value) && Object.values(progress.stages[value]).every(Boolean));
    if (!level) return;
    const key = `${userId}:${level}`; claims.current.add(key); claiming.current = key;
    onboardingRequest('claim_onboarding_award.php', { level }).then(json => {
      if (claiming.current === key) claiming.current = null;
      if (account.current !== userId) return;
      sequence.current++;
      if (!json.data.awarded_levels.includes(level)) claims.current.delete(key);
      setProgress(json.data);
      if (json.new_level != null) setLevel.current(json.new_level);
      if (json.new_awards.length) window.dispatchEvent(new CustomEvent('new-awards', { detail: json.new_awards }));
      window.dispatchEvent(new Event('onboarding:awarded'));
    }).catch(reason => { if (claiming.current === key) claiming.current = null; if (account.current === userId) setError(reason.message); });
  }, [progress, isLoggedIn, userId, setProgress]);
  const pin = value => {
    setPinned(value); if (!value) setChapterOpen(false);
    try { localStorage.setItem(`iceapp:quest-pinned:${userId}:onboarding`, value ? '1' : '0'); } catch { /* Pinning remains available for this session. */ }
  };
  const openChapter = () => { feedback.markRead(); setChapterOpen(true); load(); };
  const runAction = async (action, onOpenAvatarSettings) => {
    setChapterOpen(false);
    if (action === 'settings') { if (onOpenAvatarSettings) onOpenAvatarSettings(); else navigate(`/user/${userId}?openSettings=1`); }
    else if (action === 'checkin' || action === 'shop') window.dispatchEvent(new Event(action === 'checkin' ? 'iceapp:open-checkin' : 'iceapp:open-add-shop'));
    else if (action === 'invite') setInviteOpen(true);
    else if (action === 'install') await pwa.installApp();
    else if (action === 'push') {
      setBusy(true); setError('');
      try {
        if (Capacitor.isNativePlatform()) {
          await initializeNativePush(userId);
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/update_user_notification_settings.php`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ push_enabled_android: 1 }),
          });
          if (!response.ok || !(await response.json()).success) throw new Error('Push konnte nicht aktiviert werden.');
        } else await enableBrowserPush(userId);
        await load();
      } catch (reason) { setError(reason.message); setChapterOpen(true); } finally { setBusy(false); }
    } else navigate({ review: '/', challenge: '/challenge', route: '/routes', activities: '/dashboard' }[action] || '/dashboard');
  };
  const hide = async () => {
    setBusy(true);
    try { await setOnboardingVisible(false); } catch (reason) { setError(reason.message); } finally { setBusy(false); }
  };
  return <Context.Provider value={{ userId, isLoggedIn, progress, quest, error, busy, pinned, pin, chapterOpen, openChapter,
    closeChapter: () => setChapterOpen(false), runAction, hide, feedback, retry: () => { claims.current.clear(); load(); } }}>
    {children}
    <InviteFriendsModal open={inviteOpen} onClose={() => { setInviteOpen(false); load(); }} inviteCode={progress?.invite_code} />
    <PwaInstallModal open={pwa.showInstructions} onClose={() => pwa.setShowInstructions(false)} />
  </Context.Provider>;
}
