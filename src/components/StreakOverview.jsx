import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { Check, Flame, Minus, Snowflake, IceCreamBowl, X } from 'lucide-react';
import { streakStatus } from './ProfileProgress';
import { Button, ChallengeDialog, Disclosure } from './ChallengeUI';

const Overview = styled.section`
  margin: 24px 0; color: #2f2100;
  *, *::before, *::after { box-sizing: border-box; }
  h2 { text-align: left; text-shadow: none; margin: 0; font-size: 22px; }
`;
const Grid = styled.div`
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px;
  max-width: 440px; margin: 12px auto 0;
`;
const SeriesButton = styled.button`
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  min-width: 0; min-height: 44px; padding: 12px 8px;
  border: 1px solid transparent; border-radius: 20px; background: transparent;
  color: #2f2100; font: inherit; cursor: pointer;
  &:hover, &[aria-expanded=true] { background: #fff3d9; border-color: #f2d69d; }
  &:focus-visible { outline: 3px solid #835500; outline-offset: 3px; }
  strong { font-size: 16px; }
  small { min-height: 20px; font-size: 13px; color: #756951; }
`;
const FlameFigure = styled.span`
  position: relative; display: flex; justify-content: center; align-items: center;
  width: 120px; height: 120px; max-width: 100%;
  color: ${p => p.$state === 'none' ? '#8c8170' : p.$state === 'frozen' ? '#4184bc' : '#df6a15'};
  > svg { width: 112px; height: 112px; filter: drop-shadow(0 5px 6px #ad590018); }
`;
const FlameCount = styled.span`
  position: absolute; top: 62px; left: 0; right: 0; text-align: center;
  color: #fff; font-weight: 850; line-height: 1; font-size: ${p => p.$digits > 4 ? 21 : p.$digits > 3 ? 26 : 34}px;
  text-shadow: 0 1px 3px #68390050; font-variant-numeric: tabular-nums;
`;
const StateBadge = styled.span`
  position: absolute; right: 3px; bottom: 6px; display: grid; place-items: center;
  width: 28px; height: 28px; border: 2px solid #fffdf8; border-radius: 50%;
  background: ${p => p.$protected ? '#e1efff' : '#e8f4de'}; color: ${p => p.$protected ? '#2565a2' : '#4e7430'};
`;
const Muted = styled.p`color: #756951; font-size: 14px; margin: 0; line-height: 1.5;`;
const Hint = styled(Muted)`text-align: center; margin-top: 4px; font-size: 12px;`;
const Status = styled.p`
  margin: 0; padding: 10px 12px; border-radius: 10px;
  background: ${p => p.$done ? '#edf6e9' : '#fff3d9'}; font-weight: 650; line-height: 1.5;
`;
const History = styled.ol`
  display: grid; grid-template-columns: repeat(${p => p.$weeks ? 4 : 7}, minmax(0, 1fr));
  gap: 5px; list-style: none; padding: 0; margin: 0;
  li { min-width: 0; text-align: center; font-size: 12px; }
  small { display: block; margin-top: 5px; overflow-wrap: anywhere; }
`;
const Day = styled.span`
  display: flex; justify-content: center; align-items: center; height: 34px; border-radius: 10px;
  background: ${p => p.$state === 'checked_in' ? '#e8f4de' : p.$state === 'protected' ? '#e1efff' : '#f3eee4'};
  color: ${p => p.$state === 'protected' ? '#2565a2' : '#627239'};
  border: 1px ${p => p.$state === 'open' ? 'dashed' : 'solid'} #d6d0c2;
`;
const Protection = styled.div`
  padding-top: 14px; border-top: 1px solid #eadfc9; display: grid; gap: 8px;
  strong { display: flex; align-items: center; gap: 6px; font-size: 15px; }
  svg { color: #2565a2; } progress { width: 100%; height: 8px; accent-color: #3677b7; }
`;
const Footer = styled.div`
  margin: 12px 0; display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
  p { margin: 0; color: #526a36; font-weight: 650; line-height: 1.5; }
`;
const Legend = styled.p`font-size: 12px; color: #756951; margin: 8px 0 0; line-height: 1.5;`;
const Details = styled.div`
  display: grid; gap: 14px; min-width: 0;
  > p, ${Protection} p { margin: 0; line-height: 1.5; }
`;
const HoverPanel = styled.aside`
  position: fixed; z-index: 1700; box-sizing: border-box; padding: 18px;
  border: 1px solid #e8d8b7; border-radius: 18px; background: #fffdf8; color: #2f2100;
  box-shadow: 0 12px 40px #2f210026; overflow-y: auto; overscroll-behavior: contain;
  *, *::before, *::after { box-sizing: border-box; }
  h3 { font-size: 18px; margin: 0; text-align: left; text-shadow: none; color: #2f2100; }
`;
const PanelHead = styled.div`display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 12px;`;
const nameFor = type => type === 'day' ? 'Tages-Serie' : 'Wochen-Serie';
const formatPeriod = (period, type) => {
  const date = new Date(`${period}T12:00:00+01:00`);
  const label = date.toLocaleDateString('de-DE', { day: 'numeric', month: 'numeric', timeZone: 'Europe/Berlin' });
  return type === 'day' ? label : `ab ${label}`;
};
const publicStatus = (streak, daily) => streak.state === 'active'
  ? (daily ? 'Heute eingecheckt.' : 'Diese Woche eingecheckt.')
  : streak.state === 'none' ? 'Noch keine aktive Serie.' : 'Die Serie läuft.';
const shortStatus = (streak, daily, own) => {
  if (streak.state === 'none') return 'Noch keine Serie';
  if (streak.state === 'active') return daily ? 'Heute gesichert' : 'Woche gesichert';
  if (streak.state === 'frozen') return 'Durch Schutz erhalten';
  return own ? (daily ? 'Heute noch offen' : 'Woche noch offen') : 'Serie läuft';
};

function ProtectionHelp() {
  return <Disclosure><summary>So funktioniert der Schutz</summary>
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
  </Disclosure>;
}

function SeriesDetails({ streaks, type, own }) {
  const daily = type === 'day';
  const streak = streaks[type];
  const available = own && streaks.freezes ? Number(streaks.freezes[type]) : null;
  const progress = streak.reward_progress;
  return <Details>
    <Muted><strong>{streak.value || 0} {daily ? (streak.value === 1 ? 'Tag' : 'Tage') : (streak.value === 1 ? 'Woche' : 'Wochen')}</strong> · Rekord: {streak.record ?? streaks[`${type}_record`] ?? 0} {daily ? 'Tage' : 'Wochen'}</Muted>
    <p>{daily ? 'Checke jeden Tag ein.' : 'Ein Check-in pro Woche reicht.'}</p>
    <Status $done={streak.state === 'active'}>{own ? streakStatus(streak, type) : publicStatus(streak, daily)}</Status>
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
    {own && <ProtectionHelp />}
  </Details>;
}

export default function StreakOverview({ streaks, own = false, onCheckin }) {
  const id = useId();
  const [hover, setHover] = useState(null);
  const [selected, setSelected] = useState(null);
  const triggers = useRef({});
  const gridRef = useRef(null);
  const panelRef = useRef(null);
  const closeTimer = useRef(null);
  // Removing a preview can uncover another flame beneath the stationary pointer.
  const hoverSuppressed = useRef(false);
  const cancelClose = () => clearTimeout(closeTimer.current);
  const closeHover = () => {
    cancelClose();
    hoverSuppressed.current = true;
    if (panelRef.current?.contains(document.activeElement)) triggers.current[hover?.type]?.focus({ preventScroll: true });
    setHover(null);
  };
  useEffect(() => { setSelected(null); setHover(null); }, [own]);
  useEffect(() => () => clearTimeout(closeTimer.current), []);
  useEffect(() => {
    if (!hover) return undefined;
    const dismiss = event => {
      if (panelRef.current?.contains(event.target) || triggers.current[hover.type]?.contains(event.target)) return;
      closeHover();
    };
    const escape = event => { if (event.key === 'Escape') { event.preventDefault(); closeHover(); } };
    const resize = () => closeHover();
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', escape);
    window.addEventListener('scroll', dismiss, true);
    window.addEventListener('resize', resize);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('keydown', escape);
      window.removeEventListener('scroll', dismiss, true);
      window.removeEventListener('resize', resize);
    };
  }, [hover]);

  if (!streaks?.day || !streaks?.week) return null;
  const openHover = (event, type) => {
    if (event.pointerType !== 'mouse' || !window.matchMedia('(hover: hover)').matches || selected || hoverSuppressed.current) return;
    cancelClose();
    const rect = event.currentTarget.getBoundingClientRect();
    const gridRect = gridRef.current.getBoundingClientRect();
    const margin = 12; const gap = 10;
    const width = Math.min(380, window.innerWidth - margin * 2);
    const maxHeight = Math.min(560, window.innerHeight - margin * 2);
    const left = gridRect.right + gap + width <= window.innerWidth - margin ? gridRect.right + gap
      : gridRect.left - gap - width >= margin ? gridRect.left - gap - width
        : Math.max(margin, Math.min(rect.left + (rect.width - width) / 2, window.innerWidth - width - margin));
    const top = Math.max(margin, Math.min(rect.top, window.innerHeight - maxHeight - margin));
    setHover({ type, style: { left, top, width, maxHeight } });
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => {
      if (!panelRef.current?.contains(document.activeElement)) setHover(null);
    }, 250);
  };
  const showDetails = type => { cancelClose(); setHover(null); setSelected(type); };
  const done = ['day', 'week'].every(type => streaks[type].state === 'active');
  return <Overview id="serien" aria-labelledby={`${id}-title`}>
    <h2 id={`${id}-title`}>{own ? 'Deine Serien' : 'Serien'}</h2>
    <Grid ref={gridRef} aria-label="Serienübersicht">{['day', 'week'].map(type => {
      const streak = streaks[type]; const daily = type === 'day'; const value = streak.value || 0;
      return <SeriesButton key={type} type="button" ref={element => { triggers.current[type] = element; }}
        aria-label={`${nameFor(type)}: ${value} ${daily ? (value === 1 ? 'Tag' : 'Tage') : (value === 1 ? 'Woche' : 'Wochen')}. Details anzeigen`}
        aria-describedby={`${id}-${type}-status`}
        aria-haspopup="dialog" aria-expanded={selected === type || hover?.type === type}
        aria-controls={hover?.type === type ? `${id}-hover` : undefined}
        onPointerEnter={event => openHover(event, type)} onPointerLeave={() => { hoverSuppressed.current = false; scheduleClose(); }}
        onPointerMove={event => {
          if (hoverSuppressed.current && (event.movementX || event.movementY)) {
            hoverSuppressed.current = false;
            openHover(event, type);
          }
        }}
        onClick={() => showDetails(type)}>
        <FlameFigure $state={streak.state} aria-hidden="true"><Flame fill="currentColor" strokeWidth={1.3} />
          <FlameCount $digits={String(value).length}>{value}</FlameCount>
          {['active', 'frozen'].includes(streak.state) && <StateBadge $protected={streak.state === 'frozen'}>{streak.state === 'frozen' ? <Snowflake size={16} /> : <Check size={16} />}</StateBadge>}
        </FlameFigure>
        <strong>{nameFor(type)}</strong><small id={`${id}-${type}-status`}>{shortStatus(streak, daily, own)}</small>
      </SeriesButton>;
    })}</Grid>
    <Hint>Tippen oder darüberfahren für Details.</Hint>
    {own && <Footer>{done ? <p>✓ Heute und diese Woche gesichert. Gut gemacht!</p> : <Button onClick={onCheckin || (() => window.dispatchEvent(new CustomEvent('iceapp:open-checkin')))}><IceCreamBowl size={20} aria-hidden="true" />Jetzt einchecken</Button>}</Footer>}
    {hover && createPortal(<HoverPanel ref={panelRef} id={`${id}-hover`} role="region" aria-labelledby={`${id}-hover-title`}
      style={hover.style} onPointerEnter={cancelClose} onPointerLeave={scheduleClose} onFocusCapture={cancelClose}
      onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) scheduleClose(); }}>
      <PanelHead><h3 id={`${id}-hover-title`}>{nameFor(hover.type)}</h3><Button type="button" $secondary aria-label="Seriendetails schließen" onClick={closeHover}><X size={20} aria-hidden="true" /></Button></PanelHead>
      <SeriesDetails streaks={streaks} type={hover.type} own={own} />
    </HoverPanel>, document.body)}
    <ChallengeDialog open={Boolean(selected)} onClose={() => { hoverSuppressed.current = true; setSelected(null); }} title={selected ? nameFor(selected) : 'Serie'}>
      {selected && <SeriesDetails streaks={streaks} type={selected} own={own} />}
    </ChallengeDialog>
  </Overview>;
}
