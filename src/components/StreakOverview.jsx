import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { Check, Flame, Minus, Snowflake, IceCreamBowl } from 'lucide-react';
import { streakStatus } from './ProfileProgress';
import { Button, Card, Disclosure } from './ChallengeUI';

const Overview = styled.section`margin: 24px 0; color: #2f2100; h2, h3 { text-align: left; text-shadow: none; margin: 0; } h2 { font-size: 22px; }`;
const Grid = styled.div`display: grid; gap: 16px; margin: 16px 0; @media(min-width: 768px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }`;
const SeriesCard = styled(Card)`display: flex; flex-direction: column; gap: 14px; h3 { font-size: 18px; } p { margin: 0; line-height: 1.5; }`;
const Top = styled.div`display: flex; align-items: center; gap: 10px; svg { color: #ba560b; }`;
const Count = styled.strong`font-size: 32px; line-height: 1.1; span { font-size: 17px; font-weight: 500; }`;
const Muted = styled.p`color: #756951; font-size: 14px;`;
const Status = styled.p`padding: 10px 12px; border-radius: 10px; background: ${p => p.$done ? '#edf6e9' : '#fff3d9'}; font-weight: 650;`;
const History = styled.ol`display: grid; grid-template-columns: repeat(${p => p.$weeks ? 4 : 7}, minmax(0, 1fr)); gap: 5px; list-style: none; padding: 0; margin: 0;
  li { min-width: 0; text-align: center; font-size: 12px; } small { display: block; margin-top: 5px; overflow-wrap: anywhere; }
`;
const Day = styled.span`display: flex; justify-content: center; align-items: center; height: 34px; border-radius: 10px;
  background: ${p => p.$state === 'checked_in' ? '#e8f4de' : p.$state === 'protected' ? '#e1efff' : '#f3eee4'};
  color: ${p => p.$state === 'protected' ? '#2565a2' : '#627239'}; border: 1px ${p => p.$state === 'open' ? 'dashed' : 'solid'} #d6d0c2;
`;
const Protection = styled.div`margin-top: auto; padding-top: 14px; border-top: 1px solid #eadfc9; display: grid; gap: 8px;
  strong { display: flex; align-items: center; gap: 6px; font-size: 15px; } svg { color: #2565a2; } progress { width: 100%; height: 8px; accent-color: #3677b7; }
`;
const Footer = styled.div`margin: 16px 0; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; p { margin: 0; color: #526a36; font-weight: 650; }`;
const Legend = styled.p`font-size: 12px; color: #756951; margin: 8px 0 0;`;
const formatPeriod = (period, type) => {
  const date = new Date(`${period}T12:00:00+01:00`);
  return type === 'day' ? date.toLocaleDateString('de-DE', { day: 'numeric', month: 'numeric', timeZone: 'Europe/Berlin' })
    : `ab ${date.toLocaleDateString('de-DE', { day: 'numeric', month: 'numeric', timeZone: 'Europe/Berlin' })}`;
};
export default function StreakOverview({ streaks, own = false, onCheckin }) {
  if (!streaks?.day || !streaks?.week) return null;
  const done = ['day', 'week'].every(type => streaks[type].state === 'active');
  return <Overview id="serien" aria-labelledby="series-title">
    <h2 id="series-title">{own ? 'Deine Serien' : 'Serien'}</h2>
    {own && <Footer>{done ? <p>✓ Heute und diese Woche gesichert. Gut gemacht!</p> : <Button onClick={onCheckin || (() => window.dispatchEvent(new CustomEvent('iceapp:open-checkin')))}><IceCreamBowl size={20} aria-hidden="true" />Jetzt einchecken</Button>}</Footer>}
    <Grid>{['day', 'week'].map(type => {
      const daily = type === 'day'; const streak = streaks[type];
      const available = own && streaks.freezes ? Number(streaks.freezes[type]) : null;
      const progress = streak.reward_progress;
      return <SeriesCard key={type}>
        <Top><Flame size={24} aria-hidden="true" /><h3>{daily ? 'Tages-Serie' : 'Wochen-Serie'}</h3></Top>
        <Count>{streak.value || 0} <span>{daily ? (streak.value === 1 ? 'Tag' : 'Tage') : (streak.value === 1 ? 'Woche' : 'Wochen')}</span></Count>
        <Muted>Rekord: {streak.record ?? streaks[`${type}_record`] ?? 0} {daily ? 'Tage' : 'Wochen'}</Muted>
        <p>{daily ? 'Checke jeden Tag ein.' : 'Ein Check-in pro Woche reicht.'}</p>
        <Status $done={streak.state === 'active'}>{own ? streakStatus(streak, type) : (streak.state === 'active' ? (daily ? 'Heute eingecheckt.' : 'Diese Woche eingecheckt.') : streak.state === 'none' ? 'Noch keine aktive Serie.' : 'Die Serie läuft.')}</Status>
        {own && streak.history?.length > 0 && <div>
          <History $weeks={!daily} aria-label={daily ? 'Die letzten sieben Tage' : 'Die letzten vier Wochen'}>{streak.history.map(item => {
            const label = item.state === 'checked_in' ? 'Eingecheckt' : item.state === 'protected' ? 'Geschützt' : item.state === 'open' ? 'Noch offen' : 'Verpasst';
            const Icon = item.state === 'checked_in' ? Check : item.state === 'protected' ? Snowflake : Minus;
            return <li key={item.period} aria-label={`${formatPeriod(item.period, type)}: ${label}`}><Day $state={item.state} title={label}><Icon size={18} aria-hidden="true" /></Day><small>{formatPeriod(item.period, type)}</small></li>;
          })}</History><Legend>✓ Eingecheckt · ❄ Geschützt · – Offen oder verpasst</Legend>
        </div>}
        {available !== null && <Protection>
          <strong><Snowflake size={18} aria-hidden="true" />Schutz für {daily ? 'einen verpassten Tag' : 'eine verpasste Woche'}</strong>
          <p>{available > 0 ? `${available} von 2 verfügbar. Wird automatisch eingesetzt.` : 'Kein Schutz verfügbar.'}</p>
          {available >= 2 ? <Muted>Vorrat voll</Muted> : progress && <>
            <Muted>Noch {progress.remaining} {daily ? (progress.remaining === 1 ? 'Check-in-Tag' : 'Check-in-Tage') : (progress.remaining === 1 ? 'Check-in-Woche' : 'Check-in-Wochen')} in deiner Serie bis zum nächsten Schutz.</Muted>
            <progress max={progress.target} value={progress.current} aria-label={`Fortschritt zum nächsten ${daily ? 'Tages' : 'Wochen'}schutz`} />
          </>}
          {available === 0 && <Button as={Link} $secondary to="/challenge">Schutz verdienen</Button>}
        </Protection>}
      </SeriesCard>;
    })}</Grid>
    {own && <>

      <Disclosure><summary>So funktioniert der Schutz</summary>
        <p>Wenn du einen Tag oder eine Woche verpasst, schützt die App deine laufende Serie automatisch. Du musst nichts aktivieren.</p>
        <ul>
          <li>Jede abgeschlossene Solo-Challenge gibt dir einen Schutz für Tage und einen für Wochen.</li>
          <li>Sieben neu gesammelte Check-in-Tage in deiner Serie geben dir einen Tagesschutz. Vier neu gesammelte Check-in-Wochen geben dir einen Wochenschutz.</li>
          <li>Du kannst jeweils zwei sammeln. Ist der Vorrat voll, wird zusätzlicher Schutz nicht gespeichert.</li>
          <li>Geschützte Pausen unterbrechen deine Serie nicht, erhöhen aber den Zähler nicht. Das gilt auch für Serien-Auszeichnungen.</li>
          <li>Tagesschutz gilt nur für die Tages-Serie. Für die Wochen-Serie brauchst du einen Check-in in dieser Woche oder einen Wochenschutz.</li>
          <li>Nachträglich eingetragene Check-ins korrigieren deine Serie, geben aber keinen neuen Schutz. Bereits eingesetzter Schutz wird nicht zurückgegeben.</li>
        </ul>
        <Muted>Ein Tag endet um Mitternacht; eine Woche läuft von Montag bis Sonntag. Es gilt die Zeit in Deutschland.</Muted>
      </Disclosure>
    </>}
  </Overview>;
}
