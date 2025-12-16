import React from 'react';
import * as S from './PhotoChallengeVoting.styles';
import { buildAssetUrl } from './utils';

const KoModal = ({
  koModal,
  activeKoModalMatch,
  closeKoModal,
  goPrevKoModalMatch,
  goNextKoModalMatch,
  koModalSides,
  handleKoModalVote,
  getKoRoundLabel,
  setImagePreview,
}) => {
  if (!koModal || !activeKoModalMatch) {
    return null;
  }

  return (
    <S.ModalOverlay>
      <S.ModalCard>
        <S.ModalHeader>
          <div>
            <h3>{getKoRoundLabel(activeKoModalMatch.round)}</h3>
            <small>
              Duell {koModal.matchIndex + 1} / {koModal.matchIds.length}
            </small>
          </div>
          <S.CloseModalButton type="button" onClick={closeKoModal}>
            ×
          </S.CloseModalButton>
        </S.ModalHeader>
        <S.ModalNavRow>
          <S.NavButton type="button" onClick={goPrevKoModalMatch} disabled={!koModal || koModal.matchIndex === 0}>
            Zurück
          </S.NavButton>
          <S.NavButton
            type="button"
            onClick={() => goNextKoModalMatch()}
            disabled={!koModal || koModal.matchIndex >= koModal.matchIds.length - 1}
          >
            Weiter
          </S.NavButton>
        </S.ModalNavRow>
        <S.ModalBody>
          <S.ModalVoteWrapper>
            {koModalSides.map((side) => (
              <S.ModalVoteOption
                key={side.id}
                type="button"
                onClick={() => handleKoModalVote(activeKoModalMatch, side.id)}
                disabled={activeKoModalMatch.status !== 'open'}
                $selected={activeKoModalMatch.user_choice === side.id}
              >
                <S.ModalVoteImage src={buildAssetUrl(side.url)} alt={`Bild ${side.id}`} />
                <S.VoteMeta>
                  <strong>Bild #{side.id}</strong>
                  {activeKoModalMatch.user_choice === side.id ? (
                    <span>Deine aktuelle Stimme</span>
                  ) : (
                    <span>Tippe zum Abstimmen</span>
                  )}
                </S.VoteMeta>
              </S.ModalVoteOption>
            ))}
          </S.ModalVoteWrapper>
          {activeKoModalMatch.status !== 'open' && (
            <S.ResultsList>
              {koModalSides.map((side) => (
                <S.ResultItem key={side.id}>
                  <S.ResultInfo>
                    <S.ResultImageButton
                      type="button"
                      onClick={() =>
                        setImagePreview({
                          url: side.url,
                          label: `Bild #${side.id}`,
                        })
                      }
                    >
                      <S.ResultImage src={buildAssetUrl(side.url)} alt={`Bild ${side.id}`} />
                    </S.ResultImageButton>
                    <div>
                      <strong>Bild #{side.id}</strong>
                    </div>
                  </S.ResultInfo>
                  <S.ResultWins>{side.votes} Stimme(n)</S.ResultWins>
                </S.ResultItem>
              ))}
            </S.ResultsList>
          )}
        </S.ModalBody>
      </S.ModalCard>
    </S.ModalOverlay>
  )
};

export default KoModal;
