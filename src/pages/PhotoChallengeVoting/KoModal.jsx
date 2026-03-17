import React, { useEffect } from 'react';
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
  isLoggedIn,
}) => {
  useEffect(() => {
    if (!koModal || !activeKoModalMatch) {
      return undefined;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [koModal, activeKoModalMatch]);

  if (!koModal || !activeKoModalMatch) {
    return null;
  }

  const openPreview = (url, label) => {
    setImagePreview({ url, label });
  };

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
        <S.ModalBody $lockScroll={activeKoModalMatch.status === 'open'}>
          <S.ModalVoteWrapper>
            {koModalSides.map((side) => (
              <S.ModalVoteCard
                key={side.id}
                $disabled={activeKoModalMatch.status !== 'open' || !isLoggedIn}
                $selected={activeKoModalMatch.user_choice === side.id}
              >
                <S.ModalVotePreviewButton
                  type="button"
                  onClick={() => openPreview(side.url, side.title || `Bild #${side.id}`)}
                  aria-label={`Bild ${side.id} in Vollbild ansehen`}
                >
                  <S.ModalVoteImage src={buildAssetUrl(side.url)} alt={side.title || `Bild ${side.id}`} />
                </S.ModalVotePreviewButton>
                <S.ModalVoteMeta>
                  <strong>{side.title ? `"${side.title}"` : `Bild #${side.id}`}</strong>
                  {!isLoggedIn ? (
                    <span style={{ color: 'red', fontWeight: 'bold' }}>Zum Abstimmen bitte anmelden oder registrieren</span>
                  ) : activeKoModalMatch.user_choice === side.id ? (
                    <span>Deine aktuelle Stimme</span>
                  ) : activeKoModalMatch.has_voted ? (
                    <span>Tippe hier, um deine Stimme zu ändern</span>
                  ) : (
                    <span>Tippe zum Abstimmen</span>
                  )}
                </S.ModalVoteMeta>
                <S.ModalVoteActionButton
                  type="button"
                  onClick={() => handleKoModalVote(activeKoModalMatch, side.id)}
                  disabled={activeKoModalMatch.status !== 'open' || !isLoggedIn}
                  $selected={activeKoModalMatch.user_choice === side.id}
                >
                  {activeKoModalMatch.user_choice === side.id
                    ? 'Stimme aktuell gesetzt'
                    : activeKoModalMatch.has_voted
                    ? 'Stimme auf dieses Bild ändern'
                    : 'Für dieses Bild abstimmen'}
                </S.ModalVoteActionButton>
              </S.ModalVoteCard>
            ))}
          </S.ModalVoteWrapper>
          {activeKoModalMatch.status !== 'open' && (
            <S.ResultsList>
              {koModalSides.map((side) => (
                <S.ResultItem key={side.id}>
                  <S.ResultInfo>
                    <S.ResultImageButton
                      type="button"
                      onClick={() => openPreview(side.url, side.title || `Bild #${side.id}`)}
                    >
                      <S.ResultImage src={buildAssetUrl(side.url)} alt={side.title || `Bild ${side.id}`} />
                    </S.ResultImageButton>
                    <div>
                      <strong>{side.title || `Bild #${side.id}`}</strong>
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
