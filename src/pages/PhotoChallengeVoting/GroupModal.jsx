import React from 'react';
import { photoDate } from '../../utils/photoChallengePresentation';
import { buildAssetUrl, getPhotoChallengeCountry } from './utils';
import PhotoVoteDialog, { PhotoResults, ResultItem, CountryBadge } from './PhotoVoteDialog';

export default function GroupModal({ groupModal, activeModalGroup, closeGroupModal, goPrevModalMatch, advanceModalMatch,
  activeModalMatch, modalSides, handleModalVote, setImagePreview, isLoggedIn, showCountryBadges = false, mutationBusy, actionError, onLogin }) {
  if (!groupModal || !activeModalGroup) return null;
  const active = groupModal.mode === 'active';
  return <PhotoVoteDialog open title={activeModalGroup.name} onClose={closeGroupModal}
    progress={active ? `Duell ${groupModal.matchIndex + 1} von ${groupModal.matchOrder.length}` : groupModal.mode === 'upcoming' ? `Die Abstimmung startet am ${photoDate(activeModalGroup.start_at)}` : 'Abstimmung beendet'}
    match={active ? activeModalMatch : null} sides={modalSides} onVote={handleModalVote} onPreview={setImagePreview}
    onPrevious={goPrevModalMatch} onNext={() => advanceModalMatch(false)} canPrevious={groupModal.matchIndex > 0}
    canNext={groupModal.matchIndex < (groupModal.matchOrder?.length || 0) - 1}
    isLoggedIn={isLoggedIn} showCountryBadges={showCountryBadges} busy={mutationBusy} error={actionError} onLogin={onLogin}>
    {!active && <PhotoResults>{(groupModal.mode === 'upcoming' ? activeModalGroup.entries : activeModalGroup.results || []).map(item => <ResultItem key={item.image_id} onClick={event => setImagePreview({ url: item.url, label: item.title || `Foto ${item.image_id}`, returnFocusTo: event.currentTarget })}>
      <img src={buildAssetUrl(item.url)} alt={item.title || 'Challenge-Foto'} /><span><strong>{item.title || `Foto ${item.image_id}`}</strong>
        <small>{item.username || ''}</small>{item.is_advancer && <small>Direkt weitergekommen</small>}{item.is_lucky_loser && <small>Über einen Zusatzplatz weitergekommen</small>}
        {showCountryBadges && <CountryBadge country={getPhotoChallengeCountry(item)} />}
      </span>{groupModal.mode === 'finished' && <span>{item.votes || 0} Stimmen</span>}
    </ResultItem>)}</PhotoResults>}
  </PhotoVoteDialog>;
}
