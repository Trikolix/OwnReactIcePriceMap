import React, { useEffect } from 'react';
import * as S from './PhotoChallengeVoting.styles';
import { buildAssetUrl } from './utils';

const ZoomIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="11" cy="11" r="5.5" stroke="currentColor" strokeWidth="2" />
    <path d="M15.5 15.5L20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M11 8.5V13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M8.5 11H13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

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
  isLoggedIn,
}) => {
  useEffect(() => {
    if (!groupModal || !activeModalGroup) {
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
  }, [groupModal, activeModalGroup]);

  if (!groupModal || !activeModalGroup) {
    return null;
  }

  const openPreview = (url, label) => {
    setImagePreview({ url, label });
  };

  return (
    <S.ModalOverlay>
      <S.ModalCard>
        <S.ModalHeader>
          <S.ModalHeaderMain>
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
          </S.ModalHeaderMain>
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
        <S.ModalBody $lockScroll={groupModal.mode === 'active'}>
          {groupModal.mode === 'active' && activeModalMatch && (
            <S.ModalVoteWrapper>
              {modalSides.map((side) => (
                <S.ModalVoteCard
                  key={side.id}
                  $disabled={activeModalMatch.status !== 'open' || !isLoggedIn}
                  $selected={activeModalMatch.user_choice === side.id}
                >
                  <S.ModalVoteMedia>
                    <S.ModalVotePreviewButton
                      type="button"
                      onClick={() => handleModalVote(activeModalMatch, side.id)}
                      disabled={activeModalMatch.status !== 'open' || !isLoggedIn}
                      aria-label={`Für Bild ${side.id} abstimmen`}
                    >
                      <S.ModalVoteImage src={buildAssetUrl(side.url)} alt={`Bild ${side.id}`} />
                    </S.ModalVotePreviewButton>
                    <S.ModalZoomButton
                      type="button"
                      onClick={() => openPreview(side.url, side.title || `Bild #${side.id}`)}
                      aria-label={`Bild ${side.id} in Vollbild ansehen`}
                    >
                      <ZoomIcon />
                    </S.ModalZoomButton>
                  </S.ModalVoteMedia>
                  <S.ModalVoteMeta>
                    <strong>{side.title ? `"${side.title}"` : `Bild #${side.id}`}</strong>
                    {!isLoggedIn ? (
                      <span style={{ color: 'red', fontWeight: 'bold' }}>Zum Abstimmen bitte anmelden oder registrieren</span>
                    ) : activeModalMatch.user_choice === side.id ? (
                      <span>Deine aktuelle Stimme</span>
                    ) : activeModalMatch.has_voted ? (
                      <span>Tippe hier, um deine Stimme zu ändern</span>
                    ) : (
                      <span>Tippe zum Abstimmen</span>
                    )}
                  </S.ModalVoteMeta>
                </S.ModalVoteCard>
              ))}
            </S.ModalVoteWrapper>
          )}
        {groupModal.mode === 'upcoming' && (
            <S.PreviewGrid>
              {activeModalGroup.entries.map((entry) => (
                <S.PreviewCard key={entry.image_id}>
                  <S.PreviewImageButton
                    type="button"
                    onClick={() => openPreview(entry.url, entry.title || `Bild #${entry.image_id}`)}
                    aria-label={`Bild ${entry.image_id} in Vollbild ansehen`}
                  >
                    <S.PreviewImage src={buildAssetUrl(entry.url)} alt={entry.beschreibung || `Bild ${entry.image_id}`} />
                  </S.PreviewImageButton>
                  <S.PreviewMeta>
                    <strong>{entry.title || `Bild #${entry.image_id}`}</strong>
                  </S.PreviewMeta>
                </S.PreviewCard>
              ))}
            </S.PreviewGrid>
          )}
          {groupModal.mode === 'finished' && (
            <S.ResultsList>
              {activeModalGroup.results && activeModalGroup.results.length ? (
                activeModalGroup.results.map((result) => (
                  <S.ResultItem
                    key={result.image_id}
                    className={
                      result.is_advancer
                        ? 'advancer'
                        : result.is_lucky_loser
                        ? 'lucky-loser'
                        : ''
                    }
                  >
                    <S.ResultInfo>
                      <S.ResultImageButton
                        type="button"
                        onClick={() => openPreview(result.url, result.title || `Bild #${result.image_id}`)}
                      >
                        <S.ResultImage src={buildAssetUrl(result.url)} alt={result.title || `Bild ${result.image_id}`} />
                      </S.ResultImageButton>
                      <div>
                        <strong>{result.title ? `"${result.title}"` : `Bild #${result.image_id}`}</strong><br />
                        <small>{result.username || 'Unbekannt'}</small>
                        {result.is_advancer && (
                          <S.AdvancerBadge title="Direkt weitergekommen">Direkt Weiter</S.AdvancerBadge>
                        )}
                        {result.is_lucky_loser && (
                          <S.LuckyLoserBadge title="Lucky Loser: Nachgerückt">Lucky Loser</S.LuckyLoserBadge>
                        )}
                      </div>
                    </S.ResultInfo>
                    <S.ResultWins>{result.votes} Stimmen</S.ResultWins>
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
