import React from 'react';
import * as S from './PhotoChallengeVoting.styles';
import { buildAssetUrl } from './utils';

const KoMatches = ({ koMatches, openKoModal, getKoRoundLabel, activePhase, koMatchesByRound }) => {

  const renderKoMatches = () => {
    if (!koMatches?.length) {
      return <S.EmptyState>Die KO-Runde hat noch nicht begonnen.</S.EmptyState>;
    }
    const activeRound = Number(activePhase.replace('ko_round_', ''));
    const matchesInRound = koMatchesByRound.get(activeRound) || [];
    if (!matchesInRound.length) {
      return <S.EmptyState>Für diese Phase liegen keine Duelle vor.</S.EmptyState>;
    }
    return (
      <S.KoGrid>
        {matchesInRound.map((match) => (
            <S.KoCardButton key={match.id} type="button" onClick={() => openKoModal(match.round, match.id)}>
            <small>{getKoRoundLabel(match.round)}</small>
            <S.KoPairPreview>
              <S.KoThumb>
                <S.VoteImage src={buildAssetUrl(match.image_a_url)} alt={`Bild ${match.image_a_id}`} />
                <S.VoteMeta>
                  <strong>#{match.image_a_id}</strong>
                  {match.status !== 'open' ? <span>{match.votes_a} Stimme(n)</span> : <span>Noch geheim</span>}
                </S.VoteMeta>
              </S.KoThumb>
              <S.KoThumb>
                <S.VoteImage src={buildAssetUrl(match.image_b_url)} alt={`Bild ${match.image_b_id}`} />
                <S.VoteMeta>
                  <strong>#{match.image_b_id}</strong>
                  {match.status !== 'open' ? <span>{match.votes_b} Stimme(n)</span> : <span>Noch geheim</span>}
                </S.VoteMeta>
              </S.KoThumb>
            </S.KoPairPreview>
            <S.StatusChip
              $variant={
                match.status !== 'open'
                  ? 'closed'
                  : match.user_choice
                  ? 'voted'
                  : 'open'
              }
            >
              {match.status === 'open'
                ? match.user_choice
                  ? 'Du hast hier bereits abgestimmt'
                  : 'Voting läuft – tippe zum Abstimmen'
                : 'Voting beendet – Ergebnisse ansehen'}
            </S.StatusChip>
          </S.KoCardButton>
        ))}
      </S.KoGrid>
    );
  };

  return (
    <>
      {renderKoMatches()}
    </>
  )
};

export default KoMatches;
