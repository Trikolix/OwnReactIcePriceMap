import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useLocation, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Bell, Camera, Check, ChevronDown, ChevronUp, Heart, IceCreamCone, Instagram, MessageSquare,
  Route, Smartphone, Store, Target, Trophy, Users, X } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { Button, Card, Notice } from './ChallengeUI';
import { usePwaInstall } from '../hooks/usePwaInstall';
import { enableBrowserPush, initializeNativePush } from '../services/pushNotifications';
import { onboardingRequest, recordOnboardingAction, setOnboardingVisible } from '../features/onboarding/api';
import InviteFriendsModal from './InviteFriendsModal';
import PwaInstallModal from './PwaInstallModal';

export default function OnboardingChecklist({ onOpenAvatarSettings }) {
  const { userId, isLoggedIn, setCurrentLevel } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const [stage, setStage] = useState(1);
  const [collapsed, setCollapsed] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const claims = useRef(new Set());
  const claiming = useRef(null);
  const account = useRef(userId);
  account.current = userId;
  const pwa = usePwaInstall();
  const load = useCallback(async () => {
    if (!isLoggedIn || !userId) return;
    try {
      setError('');
      const json = await onboardingRequest();
      if (account.current === userId) setProgress(json.data);
    } catch (reason) { if (account.current === userId) setError(reason.message); }
  }, [isLoggedIn, userId]);
  useEffect(() => {
    setProgress(null); claims.current.clear(); claiming.current = null;
    try { setCollapsed(localStorage.getItem(`iceapp:onboarding-collapsed:${userId}`) === '1'); }
    catch { setCollapsed(false); }
    let active = true;
    const controller = new AbortController();
    if (isLoggedIn && userId) onboardingRequest('onboarding.php', undefined, controller.signal)
      .then(json => {
        if (!active) return;
        setProgress(json.data); setStage(json.data.awarded_levels.includes(1) ? 2 : 1);
      }).catch(reason => { if (active && reason.name !== 'AbortError') setError(reason.message); });
    return () => { active = false; controller.abort(); };
  }, [isLoggedIn, userId]);
  useEffect(() => {
    if (!isLoggedIn) return;
    const changed = event => event.detail?.stages ? setProgress(event.detail) : load();
    const visibility = event => setProgress(previous => previous ? { ...previous, visible: event.detail } : previous);
    const events = ['onboarding:changed', 'push:changed', 'avatar-updated', 'focus'];
    events.forEach(name => window.addEventListener(name, changed));
    window.addEventListener('onboarding:visibility', visibility);
    return () => {
      events.forEach(name => window.removeEventListener(name, changed));
      window.removeEventListener('onboarding:visibility', visibility);
    };
  }, [isLoggedIn, load]);
  useEffect(() => {
    if (!isLoggedIn || !pwa.isStandalone || progress?.stats.app_installed !== false) return;
    recordOnboardingAction('app_installed').catch(reason => setError(reason.message));
  }, [isLoggedIn, pwa.isStandalone, progress]);
  useEffect(() => {
    if (!isLoggedIn || new URLSearchParams(location.search).get('onboarding') !== '1') return;
    setCollapsed(false);
    setOnboardingVisible(true).then(load).catch(reason => setError(reason.message));
  }, [isLoggedIn, location.search, load]);
  useEffect(() => {
    if (!progress || !isLoggedIn || claiming.current) return;
    const level = [1, 2].find(value => !claims.current.has(`${userId}:${value}`)
      && !progress.awarded_levels.includes(value) && Object.values(progress.stages[value]).every(Boolean));
    if (!level) return;
    const key = `${userId}:${level}`;
    claims.current.add(key); claiming.current = key;
    onboardingRequest('claim_onboarding_award.php', { level }).then(json => {
      if (claiming.current === key) claiming.current = null;
      if (account.current !== userId) return;
      if (!json.data.awarded_levels.includes(level)) claims.current.delete(key);
      setProgress(json.data);
      if (json.new_level != null) setCurrentLevel(json.new_level);
      if (json.new_awards.length) window.dispatchEvent(new CustomEvent('new-awards', { detail: json.new_awards }));
      window.dispatchEvent(new Event('onboarding:awarded'));
    }).catch(reason => {
      if (claiming.current === key) claiming.current = null;
      if (account.current === userId) setError(reason.message);
    });
  }, [progress, isLoggedIn, userId, setCurrentLevel]);

  if (!isLoggedIn || (progress && !progress.visible)) return null;
  const openSettings = () => onOpenAvatarSettings ? onOpenAvatarSettings() : navigate(`/user/${userId}?openSettings=1`);
  const checkin = () => window.dispatchEvent(new Event('iceapp:open-checkin'));
  const activatePush = async () => {
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
    } catch (reason) { setError(reason.message); }
    finally { setBusy(false); }
  };
  const steps = stage === 1 ? [
    ['avatar', Camera, 'Dein Profilbild', 'Zeige der Community, wer du bist.', 'Profil bearbeiten', openSettings],
    ['installation', Smartphone, 'Ice-App installieren', 'Deine Eis-Orte direkt auf dem Startbildschirm.', 'Installieren', pwa.installApp],
    ['push', Bell, 'Benachrichtigungen aktivieren', 'Erfahre von Kommentaren, Einladungen und Neuigkeiten.', 'Aktivieren', activatePush],
    ['checkin', IceCreamCone, 'Dein erster Check-in', 'Halte deinen nächsten Eis-Moment fest.', 'Eis einchecken', checkin],
    ['invitation', Users, 'Freunde einladen', 'Teile deinen Einladungslink.', 'Einladen', () => setInviteOpen(true)],
    ['social', Instagram, 'Accounts verlinken', 'Verbinde Instagram oder Strava mit deinem Profil.', 'Accounts verlinken', openSettings],
  ] : [
    ['shop', Store, 'Eine Eisdiele entdecken', 'Trage eine Eisdiele ein, bei der mindestens ein Check-in entsteht.', 'Eisdiele hinzufügen', () => window.dispatchEvent(new Event('iceapp:open-add-shop'))],
    ['review', MessageSquare, 'Eine Eisdiele bewerten', 'Teile deine Erfahrung mit der Community.', 'Eisdiele auswählen', () => navigate('/')],
    ['checkins', IceCreamCone, 'Fünf Eis-Momente', `${progress?.stats.checkins || 0} von 5 Check-ins gesammelt.`, 'Eis einchecken', checkin],
    ['challenge', Target, 'Eine Challenge meistern', 'Schließe deine erste Challenge ab.', 'Challenges entdecken', () => navigate('/challenge')],
    ['route', Route, 'Eine Route einreichen', 'Plane eine Tour zu deinen Eis-Orten.', 'Routen öffnen', () => navigate('/routes')],
    ['likes', Heart, 'Zehn Likes vergeben', `${Math.min(progress?.stats.foreign_likes || 0, 10)} von 10 Likes auf Beiträge anderer Nutzer.`, 'Aktivitäten entdecken', () => navigate('/dashboard')],
  ];
  const done = progress ? Object.values(progress.stages[stage]).filter(Boolean).length : 0;
  const hide = async () => {
    setBusy(true);
    try { await setOnboardingVisible(false); }
    catch (reason) { setError(reason.message); }
    finally { setBusy(false); }
  };
  return <>
    <Checklist aria-label="Dein Ice-App Einstieg">
      <Heading><div><Trophy size={24} aria-hidden="true" /><div><h2>Dein Ice-App Einstieg</h2><p>Entdecke die App Schritt für Schritt.</p></div></div>
        <Tools><Button type="button" $secondary aria-label={collapsed ? 'Checkliste aufklappen' : 'Checkliste einklappen'} aria-expanded={!collapsed}
          onClick={() => {
            setCollapsed(!collapsed);
            try { localStorage.setItem(`iceapp:onboarding-collapsed:${userId}`, collapsed ? '0' : '1'); } catch { /* Keep the current view usable. */ }
          }}>
          {collapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}</Button>
          <Button type="button" $secondary aria-label="Checkliste ausblenden" disabled={busy} onClick={hide}><X size={20} aria-hidden="true" /></Button></Tools>
      </Heading>
      {!collapsed && <>
        <Stages role="group" aria-label="Onboarding-Stufe">
          {[1, 2].map(level => <StageButton key={level} type="button" $secondary $active={stage === level} aria-pressed={stage === level} onClick={() => setStage(level)}>
            {level === 1 ? 'Startklar' : 'Ice-App Experte'}{progress?.awarded_levels.includes(level) && <Check size={18} aria-hidden="true" />}</StageButton>)}
        </Stages>
        {!progress ? <p role="status">Dein Fortschritt wird geladen …</p> : <>
          <ProgressLabel>{done} von 6 Aufgaben · {stage === 1 ? '50' : '100'} EP</ProgressLabel>
          <Progress max="6" value={done} aria-label={`${stage === 1 ? 'Startklar' : 'Experten-Stufe'}: ${done} von 6 Aufgaben`} />
          {progress.awarded_levels.includes(stage) && <Notice role="status">Stufe abgeschlossen – deine Auszeichnung ist im Profil!</Notice>}
          <Steps>{steps.map(([key, Icon, title, text, action, onClick]) => {
            const complete = progress.stages[stage][key];
            return <Step key={key} $done={complete}><StepText><Icon size={22} aria-hidden="true" /><div><strong>{title}</strong><small>{text}</small></div></StepText>
              {complete ? <Done><Check size={18} aria-hidden="true" />Erledigt</Done>
                : <Button type="button" $secondary disabled={busy} onClick={onClick}>{action}</Button>}</Step>;
          })}</Steps>
          <Footnote>Du kannst die Checkliste jederzeit in deinen Profileinstellungen wieder einblenden.</Footnote>
        </>}
        {error && <Notice $error role="alert">{error}<Button type="button" $secondary onClick={() => { claims.current.clear(); load(); }}>Erneut versuchen</Button></Notice>}
      </>}
    </Checklist>
    <InviteFriendsModal open={inviteOpen} onClose={() => { setInviteOpen(false); load(); }} inviteCode={progress?.invite_code} />
    <PwaInstallModal open={pwa.showInstructions} onClose={() => pwa.setShowInstructions(false)} />
  </>;
}
const Checklist = styled(Card)`margin: 0 0 24px; color: #2f2100;`;
const Heading = styled.div`display: flex; align-items: center; justify-content: space-between; gap: 12px; > div:first-child { display: flex; align-items: center; gap: 12px; min-width: 0; } h2 { margin: 0; font-size: 20px; text-align: left; } p { margin: 4px 0 0; color: #756951; font-size: 14px; } @media(max-width: 420px) { align-items: flex-start; > div:first-child > svg { display: none; } h2 { font-size: 18px; } }`;
const Tools = styled.div`display: flex; gap: 4px; flex-shrink: 0; > button { padding: 8px; }`;
const Stages = styled.div`display: flex; gap: 8px; margin: 20px 0 16px; > button { flex: 1; padding: 8px; }`;
const StageButton = styled(Button)`background: ${p => p.$active ? '#fff0c4' : '#fffdf8'}; border-color: ${p => p.$active ? '#e3a219' : '#e0d3ba'};`;
const ProgressLabel = styled.p`display: block; margin: 0 0 8px; font-size: 14px; color: #756951;`;
const Progress = styled.progress`display: block; width: 100%; height: 8px; border: 0; border-radius: 8px; overflow: hidden; accent-color: #e3a219; margin-bottom: 20px; &::-webkit-progress-bar { background: #eadfc9; } &::-webkit-progress-value { background: #e3a219; } &::-moz-progress-bar { background: #e3a219; }`;
const Steps = styled.div`display: grid; gap: 8px;`;
const Step = styled.div`display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px; border: 1px solid ${p => p.$done ? '#d8e1c7' : '#eadfc9'}; border-radius: 12px; background: ${p => p.$done ? '#f4f5e9' : '#fffaf0'}; @media(max-width: 600px) { flex-wrap: wrap; > button { margin-left: auto; } }`;
const StepText = styled.div`display: flex; align-items: center; gap: 12px; min-width: 0; > svg { flex-shrink: 0; color: #806d4e; } strong { font-size: 15px; } small { display: block; color: #756951; line-height: 1.5; margin-top: 4px; }`;
const Done = styled.span`display: flex; align-items: center; gap: 5px; color: #4c5c31; font-size: 14px; white-space: nowrap;`;
const Footnote = styled.p`margin: 16px 0 0; color: #756951; font-size: 13px; line-height: 1.5;`;
