import React from 'react';
import { Link } from 'react-router-dom';
import * as S from './PhotoChallengeVoting.styles';
import { buildAssetUrl } from './utils';

const ResultMeta = ({ result }) => (
  <S.WinnerMeta>
    <h2>{result.title || `Bild #${result.image_id}`}</h2>
    <p>
      von{' '}
      {result.nutzer_id ? (
        <S.WinnerUserLink as={Link} to={`/user/${result.nutzer_id}`}>
          {result.username}
        </S.WinnerUserLink>
      ) : (
        result.username || 'Unbekannt'
      )}
    </p>
    {result.beschreibung && <small>{result.beschreibung}</small>}
    <S.WinnerSubline>Entschieden in Runde {result.round}</S.WinnerSubline>
  </S.WinnerMeta>
);

const Winner = ({ winner, thirdPlace }) => {
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
        <ResultMeta result={winner} />
      </S.WinnerCard>
      {thirdPlace && (
        <S.ThirdPlaceCard>
          <S.WinnerBadge>Platz 3</S.WinnerBadge>
          <S.ThirdPlaceContent>
            <S.ThirdPlaceImage src={buildAssetUrl(thirdPlace.url)} alt={thirdPlace.title || `Bild #${thirdPlace.image_id}`} />
            <ResultMeta result={thirdPlace} />
          </S.ThirdPlaceContent>
        </S.ThirdPlaceCard>
      )}
    </S.WinnerSection>
  )
};

export default Winner;
