import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useLocation } from 'react-router-dom';
import { Bell, Camera, Check, ChevronDown, ChevronUp, Heart, IceCreamCone, Instagram, MessageSquare,
  Pin, PinOff, Route, Smartphone, Store, Target, Trophy, Users, X } from 'lucide-react';
import { Button, Card, Notice } from './ChallengeUI';
import { OnboardingProvider, useOnboarding } from '../features/onboarding/OnboardingContext';
import { currentQuestChapter } from '../features/quests/progress.mjs';

const icons = { bell: Bell, camera: Camera, heart: Heart, ice: IceCreamCone, social: Instagram,
  review: MessageSquare, route: Route, phone: Smartphone, store: Store, target: Target, users: Users };

export default function OnboardingChecklist(props) {
  const state = useOnboarding();
  if (!state) return <OnboardingProvider><OnboardingChecklist {...props} /></OnboardingProvider>;
  return <ChecklistView {...props} state={state} />;
}

function ChecklistView({ onOpenAvatarSettings, presentation, state }) {
  const { userId, isLoggedIn, progress, quest, error, busy, pinned, pin, openChapter, runAction, hide, retry } = state;
  const dialog = presentation === 'dialog';
  const location = useLocation();
  const current = currentQuestChapter(quest);
  const [stage, setStage] = useState(current?.id || 1);
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    if (dialog || current?.id) setStage(current?.id || 1);
  }, [current?.id, dialog]);
  useEffect(() => {
    try { setCollapsed(localStorage.getItem(`iceapp:onboarding-collapsed:${userId}`) === '1'); }
    catch { setCollapsed(false); }
  }, [userId]);
  useEffect(() => {
    if (new URLSearchParams(location.search).get('onboarding') === '1') setCollapsed(false);
  }, [location.search]);
  if (!isLoggedIn || (progress && !progress.visible)) return null;
  if (pinned && !dialog) return <Pinned aria-label="Angepinnter Ice-App Einstieg">
    <Trophy size={23} aria-hidden="true" /><div><strong>Dein Ice-App Einstieg</strong><small>{current?.title || 'Deine Aufgaben'} · am Bildschirmrand angepinnt</small></div>
    <Button type="button" $secondary onClick={openChapter}>Kapitel öffnen</Button>
    <Button type="button" $secondary aria-label="Ice-App Einstieg loslösen" onClick={() => pin(false)}><PinOff size={19} aria-hidden="true" /></Button>
  </Pinned>;
  const chapter = quest?.chapters.find(item => item.id === stage);
  const done = chapter?.tasks.filter(task => task.complete).length || 0;
  const content = <>
    <Stages role="group" aria-label="Onboarding-Stufe">
      {(quest?.chapters || [{ id: 1, title: 'Startklar' }, { id: 2, title: 'Ice-App Experte' }]).map(item =>
        <StageButton key={item.id} type="button" $secondary $active={stage === item.id} aria-pressed={stage === item.id} onClick={() => setStage(item.id)}>
          {item.title}{item.awarded && <Check size={18} aria-hidden="true" />}</StageButton>)}
    </Stages>
    {!chapter ? <p role="status">Dein Fortschritt wird geladen …</p> : <>
      <ProgressLabel>{done} von {chapter.tasks.length} Aufgaben · {chapter.reward} EP</ProgressLabel>
      <Progress max={chapter.tasks.length} value={done} aria-label={`${chapter.title}: ${done} von ${chapter.tasks.length} Aufgaben`} />
      {chapter.awarded && <Notice role="status">Stufe abgeschlossen – deine Auszeichnung ist im Profil!</Notice>}
      <Steps>{chapter.tasks.map(task => {
        const Icon = icons[task.icon];
        return <Step key={task.id} $done={task.complete}><StepText><Icon size={22} aria-hidden="true" /><div><strong>{task.title}</strong><small>{task.description}</small></div></StepText>
          {task.complete ? <Done><Check size={18} aria-hidden="true" />Erledigt</Done>
            : <Button type="button" $secondary disabled={busy} onClick={() => runAction(task.action, onOpenAvatarSettings)}>{task.actionLabel}</Button>}</Step>;
      })}</Steps>
      {!dialog && <Footnote>Du kannst die Checkliste jederzeit in deinen Profileinstellungen wieder einblenden.</Footnote>}
    </>}
    {error && <Notice $error role="alert">{error}<Button type="button" $secondary onClick={retry}>Erneut versuchen</Button></Notice>}
  </>;
  if (dialog) return content;
  return <Checklist aria-label="Dein Ice-App Einstieg">
    <Heading><div><Trophy size={24} aria-hidden="true" /><div><h2>Dein Ice-App Einstieg</h2><p>Entdecke die App Schritt für Schritt.</p></div></div>
      <Tools><Button type="button" $secondary aria-label="Ice-App Einstieg anpinnen" title="Am Bildschirmrand anpinnen" disabled={!quest} onClick={() => pin(true)}><Pin size={20} aria-hidden="true" /></Button>
        <Button type="button" $secondary aria-label={collapsed ? 'Checkliste aufklappen' : 'Checkliste einklappen'} aria-expanded={!collapsed}
          onClick={() => { setCollapsed(!collapsed); try { localStorage.setItem(`iceapp:onboarding-collapsed:${userId}`, collapsed ? '0' : '1'); } catch { /* Keep the view usable. */ } }}>
          {collapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}</Button>
        <Button type="button" $secondary aria-label="Checkliste ausblenden" disabled={busy} onClick={hide}><X size={20} aria-hidden="true" /></Button></Tools>
    </Heading>
    {!collapsed && content}
  </Checklist>;
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

const Pinned = styled(Card)`display: flex; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; > div { flex: 1; min-width: min(100%, 180px); } strong { display: block; } small { display: block; color: #756951; margin-top: 4px; line-height: 1.4; }`;
