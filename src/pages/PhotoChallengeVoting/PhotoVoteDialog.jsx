import React from 'react';
import styled from 'styled-components';
import { ZoomIn, Check } from 'lucide-react';
import { ChallengeDialog, Button, Notice, ActionRow } from '../../components/ChallengeUI';
import { buildAssetUrl, getPhotoChallengeCountry } from './utils';

const Duel = styled.div`display: grid; gap: 16px; @media(min-width: 768px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }`;
const Photo = styled.div`
  min-width: 0; padding: 12px; border: 2px solid ${p => p.$selected ? '#6c8a3a' : '#eadfc9'}; border-radius: 16px; background: #fffdf8;
  display: flex; flex-direction: column; gap: 10px; strong { overflow-wrap: anywhere; } p { margin: 0; line-height: 1.5; color: #756951; }
`;
const Preview = styled.button`
  display: grid; width: 100%; padding: 0; border: 0; border-radius: 10px; overflow: hidden; background: #f4efe5; cursor: zoom-in;
  img { width: 100%; height: clamp(160px, 30dvh, 340px); object-fit: contain; } span { display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; color: #5a4930; }
  &:focus-visible { outline: 3px solid #835500; outline-offset: 3px; }
`;
export const PhotoResults = styled.div`display: grid; gap: 12px;`;
export const ResultItem = styled.button`
  display: flex; align-items: center; gap: 12px; min-height: 44px; padding: 12px; width: 100%; background: #fffdf8; border: 1px solid #eadfc9; border-radius: 12px;
  &:focus-visible { outline: 3px solid #835500; outline-offset: 3px; }
  cursor: pointer; text-align: left; color: #2f2100; font: inherit; img { width: 72px; height: 72px; object-fit: contain; } span { min-width: 0; overflow-wrap: anywhere; } small { display: block; margin-top: 4px; }
`;
const Flag = styled.span`display: flex; align-items: center; gap: 6px; font-size: 13px; img { width: 24px; height: 18px; object-fit: contain; }`;
export function CountryBadge({ country }) {
  return country ? <Flag><img src={country.flagUrl} srcSet={country.flagSrcSet} alt="" />{country.name}</Flag> : null;
}
export default function PhotoVoteDialog({ open, title, onClose, progress, match, sides = [], onVote, onPreview,
  onPrevious, onNext, canPrevious, canNext, isLoggedIn, showCountryBadges, busy, error, onLogin, children }) {
  return <ChallengeDialog open={open} title={title} onClose={onClose} busy={busy} wide footer={match && <>
    <Button $secondary onClick={onPrevious} disabled={busy || !canPrevious}>Zurück</Button>
    <Button $secondary onClick={onNext} disabled={busy || !canNext}>Weiter</Button>
  </>}>
    <p style={{ marginTop: 0, fontWeight: 700 }}>{progress}</p>
    {error && <Notice $error role="alert">{error}</Notice>}
    {!isLoggedIn && <ActionRow style={{ marginBottom: 16 }}><p>Logge dich ein, um für dein Lieblingsfoto abzustimmen.</p><Button onClick={onLogin}>Einloggen</Button></ActionRow>}
    {match && <Duel>{sides.map(side => <Photo key={side.id} $selected={String(match.user_choice) === String(side.id)}>
      <Preview type="button" aria-label={`Foto ${side.title || side.id} vergrößern`} onClick={event => onPreview({ url: side.url, label: side.title || `Foto ${side.id}`, returnFocusTo: event.currentTarget })}>
        <img src={buildAssetUrl(side.url)} alt={side.title || `Foto ${side.id}`} /><span><ZoomIn size={18} aria-hidden="true" />Foto vergrößern</span>
      </Preview>
      <strong>{side.title || `Foto ${side.id}`}</strong>
      {showCountryBadges && <CountryBadge country={getPhotoChallengeCountry(side)} />}
      {match.status === 'open' ? <Button disabled={busy || !isLoggedIn || String(match.user_choice) === String(side.id)}
        aria-label={`Für Foto ${side.title || side.id} abstimmen`} onClick={() => onVote(match, side.id)}>
        {String(match.user_choice) === String(side.id) ? <><Check size={18} aria-hidden="true" />Deine Stimme</> : busy ? 'Stimme wird gespeichert …' : match.has_voted || match.user_choice != null ? 'Stimme ändern' : 'Für dieses Foto abstimmen'}
      </Button> : <p>{side.votes || 0} Stimmen · Abstimmung beendet</p>}
    </Photo>)}</Duel>}
    {children}
  </ChallengeDialog>;
}
