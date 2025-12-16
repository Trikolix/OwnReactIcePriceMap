import React from 'react';
import * as S from './PhotoChallengeVoting.styles';
import { buildAssetUrl } from './utils';

const GroupModal = ({
  groupModal,
  activeModalGroup,
  closeGroupModal,
  goPrevModalMatch,
  advanceModalMatch,
  activeModalMatch,
  modalSides,
  handleModalVote,
  setImagePreview,
}) => {
  if (!groupModal || !activeModalGroup) {
    return null;
  }

  return (
    <S.ModalOverlay>
      <S.ModalCard>
        <S.ModalHeader>
          <div>
            <h3>{activeModalGroup.name}</h3>
            <S.StatusChip
              $variant={
                groupModal.mode === 'active'
                  ? 'open'
                  : groupModal.mode === 'upcoming'
                  ? 'upcoming'
                  : 'closed'
              }
            >
              {groupModal.mode === 'active' && activeModalGroup.matches.length
                ? `Duell ${groupModal.matchIndex + 1} / ${activeModalGroup.matches.length}`
                : groupModal.mode === 'upcoming'
                ? `Startet am ${
                    activeModalGroup.start_at
                      ? new Date(activeModalGroup.start_at).toLocaleDateString('de-DE')
                      : 'bald'
                  }`
                : 'Voting beendet'}
            </S.StatusChip>
          </div>
          <S.CloseModalButton type="button" onClick={closeGroupModal}>
            ×
          </S.CloseModalButton>
        </S.ModalHeader>
        {groupModal.mode === 'active' && (
          <S.ModalNavRow>
            <S.NavButton type="button" onClick={goPrevModalMatch} disabled={!groupModal || groupModal.matchIndex === 0}>
              Zurück
            </S.NavButton>
            <S.NavButton
              type="button"
              onClick={() => advanceModalMatch(false)}
              disabled={
                !groupModal || groupModal.matchIndex >= groupModal.matchOrder.length - 1
              }
            >
              Weiter
            </S.NavButton>
          </S.ModalNavRow>
        )}
        <S.ModalBody>
          {groupModal.mode === 'active' && activeModalMatch && (
            <S.ModalVoteWrapper>
              {modalSides.map((side) => (
                <S.ModalVoteOption
                  key={side.id}
                  type="button"
                  onClick={() => handleModalVote(activeModalMatch, side.id)}
                  disabled={activeModalMatch.status !== 'open'}
                  $selected={activeModalMatch.user_choice === side.id}
                >
                  <S.ModalVoteImage src={buildAssetUrl(side.url)} alt={`Bild ${side.id}`} />
                  <S.VoteMeta>
                    <strong>Bild #{side.id}</strong>
                    {activeModalMatch.user_choice === side.id ? (
                      <span>Deine aktuelle Stimme</span>
                    ) : (
                      <span>Stimme ändern</span>
                    )}
                  </S.VoteMeta>
                </S.ModalVoteOption>
              ))}
            </S.ModalVoteWrapper>
          )}
        {groupModal.mode === 'upcoming' && (
            <S.PreviewGrid>
              {activeModalGroup.entries.map((entry) => (
                <S.PreviewCard key={entry.image_id}>
                  <S.PreviewImage src={buildAssetUrl(entry.url)} alt={entry.beschreibung || `Bild ${entry.image_id}`} />
                  <S.PreviewMeta>
                    <strong>Bild #{entry.image_id}</strong>
                  </S.PreviewMeta>
                </S.PreviewCard>
              ))}
            </S.PreviewGrid>
          )}
          {groupModal.mode === 'finished' && (
            <S.ResultsList>
              {activeModalGroup.results && activeModalGroup.results.length ? (
                activeModalGroup.results.map((result) => (
                  <S.ResultItem key={result.image_id}>
                    <S.ResultInfo>
                      <S.ResultImageButton
                        type="button"
                        onClick={() =>
                          setImagePreview({
                            url: result.url,
                            label: `Bild #${result.image_id}`,
                          })
                        }
                      >
                        <S.ResultImage src={buildAssetUrl(result.url)} alt={`Bild ${result.image_id}`} />
                      </S.ResultImageButton>
                      <div>
                        <strong>Bild #{result.image_id}</strong><br />
                        <small>{result.username || 'Unbekannt'}</small>
                      </div>
                    </S.ResultInfo>
                    <S.ResultWins>{result.wins} Siege</S.ResultWins>
                  </S.ResultItem>
                ))
              ) : (
                <S.EmptyState>Keine Ergebnisse verfügbar.</S.EmptyState>
              )}
            </S.ResultsList>
          )}
        </S.ModalBody>
      </S.ModalCard>
    </S.ModalOverlay>
  )
}

export default GroupModal;
