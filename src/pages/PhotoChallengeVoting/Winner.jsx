import React from 'react';
import * as S from './PhotoChallengeVoting.styles';
import { buildAssetUrl } from './utils';

const Winner = ({ winner }) => {
  if (!winner) {
    return null;
  }
  return (
    <S.WinnerSection>
      <S.WinnerCard>
        <S.WinnerBadge>Champion</S.WinnerBadge>
        <S.WinnerImageWrapper>
          <S.WinnerImage src={buildAssetUrl(winner.url)} alt={winner.title || winner.beschreibung || `Bild ${winner.image_id}`} />
        </S.WinnerImageWrapper>
        <S.WinnerMeta>
          <h2>{winner.title || `Bild #${winner.image_id}`}</h2>
          <p>von {winner.username || 'Unbekannt'}</p>
          {winner.beschreibung && <small>{winner.beschreibung}</small>}
          <S.WinnerSubline>Entschieden in Runde {winner.round}</S.WinnerSubline>
        </S.WinnerMeta>
      </S.WinnerCard>
    </S.WinnerSection>
  )
};

export default Winner;
