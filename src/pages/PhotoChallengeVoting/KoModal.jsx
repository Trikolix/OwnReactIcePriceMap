import React from 'react';
import PhotoVoteDialog from './PhotoVoteDialog';

export default function KoModal({ koModal, activeKoModalMatch, closeKoModal, goPrevKoModalMatch, goNextKoModalMatch,
  koModalSides, handleKoModalVote, getKoRoundLabel, setImagePreview, isLoggedIn, showCountryBadges = false, mutationBusy, actionError, onLogin }) {
  if (!koModal || !activeKoModalMatch) return null;
  return <PhotoVoteDialog open title={activeKoModalMatch.bracket_type === 'third_place' ? 'Duell um Platz 3' : getKoRoundLabel(activeKoModalMatch.round)}
    onClose={closeKoModal} progress={`Duell ${koModal.matchIndex + 1} von ${koModal.matchIds.length}`}
    match={activeKoModalMatch} sides={koModalSides} onVote={handleKoModalVote} onPreview={setImagePreview}
    onPrevious={goPrevKoModalMatch} onNext={goNextKoModalMatch} canPrevious={koModal.matchIndex > 0} canNext={koModal.matchIndex < koModal.matchIds.length - 1}
    isLoggedIn={isLoggedIn} showCountryBadges={showCountryBadges} busy={mutationBusy} error={actionError} onLogin={onLogin} />;
}
