import React from 'react';
import styled, { keyframes, css } from 'styled-components';
import { Flame, Snowflake } from 'lucide-react';

const flare = keyframes`0%,100% { transform: scale(1); } 40% { transform: scale(1.22); filter: brightness(1.2); }`;
const tones = { active: '#b94700', at_risk: '#856544', frozen: '#176bba', none: '#717171' };
export const AvatarBadgeFrame = styled.div`
  position: relative; display: inline-flex; flex-shrink: 0; align-self: center;
`;
const Badge = styled.span`
  position: absolute; right: -5px; bottom: -5px; z-index: 1;
  min-width: ${p => p.$large ? 30 : 20}px; height: ${p => p.$large ? 30 : 20}px;
  padding: 0 3px; box-sizing: border-box; border-radius: 50%; border: 2px solid white;
  display: inline-flex; align-items: center; justify-content: center;
  background: #633e14; color: white; font-size: ${p => p.$large ? 13 : 10}px; font-weight: 800;
  box-shadow: 0 1px 4px #0003;
`;
export function LevelBadge({ level, large = false }) {
  if (level == null || !Number.isFinite(Number(level))) return null;
  return <Badge $large={large} title={`Level ${level}`} aria-label={`Level ${level}`}>{level}</Badge>;
}
const Row = styled.span`
  display: inline-flex; gap: 6px; flex-wrap: wrap; align-items: center;
  ${p => p.$compact && css`padding-right: 5px; @media (max-width: 768px) { flex-direction: column; gap: 0; & > span { padding: 0 2px; font-size: 10px; } }`}
`;
const Chip = styled.span`
  display: inline-flex; align-items: center; gap: 2px; white-space: nowrap;
  color: ${p => tones[p.$state] || tones.none}; font-weight: 700; font-size: 12px;
  padding: 3px 4px; border-radius: 10px; background: #fff9ed;
  ${p => p.$animate && css`animation: ${flare} 900ms ease-out;`}
  @media (prefers-reduced-motion: reduce) { animation: none; }
`;
export function streakHint(streak, type) {
  const name = type === 'day' ? 'Tages-Serie' : 'Wochen-Serie';
  return `${name}: ${streak?.value || 0} ${type === 'day' ? 'Tage' : 'Wochen'}. ${streakStatus(streak, type)}`;
}
export function streakStatus(streak, type) {
  const daily = type === 'day';
  if (!streak || streak.state === 'none') return 'Dein nächster Check-in startet eine neue Serie.';
  if (streak.state === 'active') return daily ? 'Heute gesichert.' : 'Diese Woche gesichert.';
  if (streak.state === 'frozen') return daily
    ? 'Gestern hat dein Schutz die Serie gerettet. Heute ist noch offen.'
    : 'Letzte Woche hat dein Schutz die Serie gerettet. Diese Woche ist noch offen.';
  return daily ? 'Für heute fehlt noch ein Check-in.' : 'Für diese Woche fehlt noch ein Check-in.';
}
export function StreakFlames({ streaks, events = [], compact = false, showLabels = false }) {
  if (!streaks) return null;
  return <Row $compact={compact}>{['day', 'week'].map(type => {
    const streak = streaks[type];
    const event = events.find(e => e.type === type && ['continue', 'start'].includes(e.kind));
    return <Chip key={`${type}:${event?.id || ''}`} $state={streak?.state} $animate={Boolean(event)} title={streakHint(streak, type)} aria-label={streakHint(streak, type)}>
      <Flame size={16} aria-hidden="true" />{streak?.state === 'frozen' && <Snowflake size={12} aria-hidden="true" />}
      {showLabels && <span>{type === 'day' ? 'Tages-Serie:' : 'Wochen-Serie:'}&nbsp;</span>}
      {streak?.value || 0}{!showLabels && <small>{type === 'day' ? 'T' : 'W'}</small>}
    </Chip>;
  })}</Row>;
}
const FreezeCard = styled.div`
  padding: 12px; border-radius: 12px; background: #edf6ff; color: #244b72;
  font-size: 13px; line-height: 1.5; p { margin: 6px 0; }
`;
export function FreezeInventory({ streaks }) {
  if (!streaks?.freezes) return null;
  return <FreezeCard>
    <strong>❄ Dein Serienschutz</strong>
    <p>Für verpasste Tage: {streaks.freezes.day} von 2 verfügbar. Für verpasste Wochen: {streaks.freezes.week} von 2 verfügbar.</p>
    <p>Wird automatisch eingesetzt, wenn du einen Tag oder eine Woche verpasst. Deine Serie bleibt erhalten.</p>
    {streaks.last_freeze && <p>Zuletzt eingesetzt: {streaks.last_freeze.type === 'day' ? 'Schutz für den Tag am' : 'Schutz für die Woche ab'} {new Date(`${streaks.last_freeze.period}T12:00:00`).toLocaleDateString('de-DE')}.</p>}
  </FreezeCard>;
}
export function StreakCelebration({ events = [] }) {
  const visible = events.filter(e => ['start', 'continue', 'consume'].includes(e.kind) || (e.kind === 'grant' && e.amount > 0));
  if (!visible.length) return null;
  const collected = kind => [...new Set(visible.filter(e => e.kind === kind).map(e => e.type))];
  const continued = [...new Set(visible.filter(e => ['start', 'continue'].includes(e.kind)).map(e => e.type))];
  const scope = types => types.length === 2 ? 'Heute und diese Woche' : types[0] === 'day' ? 'Heute' : 'Diese Woche';
  return <FreezeCard role="status" aria-live="polite">
    {continued.length > 0 && <p>🔥 <strong>{scope(continued)} gesichert!</strong> {visible.filter(e => ['start', 'continue'].includes(e.kind)).map(e => `${e.value} ${e.type === 'day' ? 'Tage' : 'Wochen'}`).join(' · ')}</p>}
    {collected('grant').length > 0 && <p>❄ Neuer Schutz verdient: {collected('grant').map(t => t === 'day' ? 'für einen verpassten Tag' : 'für eine verpasste Woche').join(' und ')}.</p>}
    {collected('consume').length > 0 && <p>❄ Dein Schutz wurde automatisch eingesetzt. Deine {collected('consume').length === 2 ? 'Serien bleiben' : 'Serie bleibt'} erhalten.</p>}
  </FreezeCard>;
}
