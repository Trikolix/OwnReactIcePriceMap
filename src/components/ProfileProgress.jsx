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
  const name = type === 'day' ? 'Tages-Streak' : 'Wochen-Streak';
  if (!streak || streak.state === 'none') return `${name}: Noch keine aktive Serie. Ein Check-in startet sie.`;
  if (streak.state === 'active') return `${name}: ${streak.value}. Für ${type === 'day' ? 'heute' : 'diese Woche'} gesichert.`;
  const minutes = Math.max(0, Math.ceil(Number(streak.seconds_left || 0) / 60));
  const remaining = minutes >= 60 ? `${Math.floor(minutes / 60)} Std. ${minutes % 60} Min.` : `${minutes} Min.`;
  return `${name}: ${streak.value}. ${streak.state === 'frozen' ? 'Letzte Periode durch Freeze geschützt. ' : ''}Noch ${remaining} für einen Check-in; danach wird ein verfügbarer Freeze eingesetzt, sonst endet die Serie.`;
}
export function StreakFlames({ streaks, events = [], compact = false }) {
  if (!streaks) return null;
  return <Row $compact={compact}>{['day', 'week'].map(type => {
    const streak = streaks[type];
    const event = events.find(e => e.type === type && ['continue', 'start'].includes(e.kind));
    return <Chip key={`${type}:${event?.id || ''}`} $state={streak?.state} $animate={Boolean(event)} title={streakHint(streak, type)} aria-label={streakHint(streak, type)}>
      <Flame size={16} aria-hidden="true" />{streak?.state === 'frozen' && <Snowflake size={12} aria-hidden="true" />}
      {streak?.value || 0}<small>{type === 'day' ? 'T' : 'W'}</small>
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
    <strong>❄ Tages-Freezes: {streaks.freezes.day}/2 · Wochen-Freezes: {streaks.freezes.week}/2</strong>
    <p>Eine persönliche Eisdielen-Challenge gibt je einen Freeze. Sieben echte Streak-Tage geben einen Tages-Freeze, vier echte Streak-Wochen einen Wochen-Freeze. Maximal zwei je Typ; zusätzliche Belohnungen verfallen.</p>
    <p>Bei einer verpassten Periode wird automatisch ein Freeze eingesetzt. Er erhält deine Serie auch für Awards, zählt aber nicht als Check-in. Tages-Freezes ersetzen keinen Wochen-Check-in.</p>
    {streaks.last_freeze && <p>Zuletzt eingesetzt: {streaks.last_freeze.type === 'day' ? 'Tages-Freeze am' : 'Wochen-Freeze für die Woche ab'} {new Date(`${streaks.last_freeze.period}T12:00:00`).toLocaleDateString('de-DE')}.</p>}
  </FreezeCard>;
}
export function StreakCelebration({ events = [] }) {
  const visible = events.filter(e => ['start', 'continue', 'consume'].includes(e.kind) || (e.kind === 'grant' && e.amount > 0));
  if (!visible.length) return null;
  return <FreezeCard role="status" aria-live="polite">{visible.map(event => <p key={event.id}>
    {event.kind === 'grant' ? `❄ ${event.type === 'day' ? 'Tages' : 'Wochen'}-Freeze verdient!` :
      event.kind === 'consume' ? `❄ ${event.type === 'day' ? 'Tages' : 'Wochen'}-Freeze eingesetzt – Serie geschützt.` :
        `🔥 ${event.value} ${event.type === 'day' ? 'Tage' : 'Wochen'} – Streak ${event.kind === 'start' ? 'gestartet' : 'fortgesetzt'}!`}
  </p>)}</FreezeCard>;
}
