import React from 'react';
import * as S from './PhotoChallengeVoting.styles';
import { buildAssetUrl } from './utils';

const KoMatches = ({ koMatches, openKoModal, getKoRoundLabel, activePhase, koMatchesByRound }) => {
  if (!koMatches?.length) {
    return <S.EmptyState>Die KO-Runde hat noch nicht begonnen.</S.EmptyState>;
  }

  const activeRound = Number(activePhase.replace('ko_round_', ''));
  const rounds = Array.from(koMatchesByRound.keys()).sort((a, b) => a - b);

  if (!rounds.length) {
    return <S.EmptyState>Für diese Phase liegen keine Duelle vor.</S.EmptyState>;
  }

  return (
    <S.KoBracketShell>
      <S.KoBracketIntro>
        <div>
          <S.KoBracketEyebrow>Turnierbaum</S.KoBracketEyebrow>
          <h2>Wer zieht weiter?</h2>
        </div>
        <span>Tippe auf ein Duell, um abzustimmen oder das Ergebnis anzusehen.</span>
      </S.KoBracketIntro>
      <S.KoBracketScroller tabIndex={0} aria-label="KO-Turnierbaum">
        <S.KoBracket>
          {rounds.map((round) => {
            const matches = (koMatchesByRound.get(round) || []).slice().sort((a, b) => a.position - b.position);
            const mainMatches = matches.filter((match) => (match.bracket_type || 'main') === 'main');
            const thirdPlaceMatches = matches.filter((match) => match.bracket_type === 'third_place');
            const sections = [
              { key: 'main', label: mainMatches.length === 1 ? 'Finale' : getKoRoundLabel(round), matches: mainMatches },
              { key: 'third_place', label: 'Duell um Platz 3', matches: thirdPlaceMatches },
            ].filter((section) => section.matches.length);

            return (
              <S.KoBracketColumn key={round} $active={round === activeRound}>
                <S.KoBracketColumnHeader>
                  <strong>{mainMatches.length === 1 ? 'Finale' : getKoRoundLabel(round)}</strong>
                  <small>{matches.length} {matches.length === 1 ? 'Duell' : 'Duelle'}</small>
                </S.KoBracketColumnHeader>
                <S.KoBracketStack>
                  {sections.map((section) => (
                    <S.KoBracketLane key={section.key}>
                      {section.key === 'third_place' && <S.KoBracketLaneLabel>{section.label}</S.KoBracketLaneLabel>}
                      {section.matches.map((match) => (
                        <S.KoBracketMatch
                          key={match.id}
                          type="button"
                          onClick={() => openKoModal(match.round, match.id)}
                          $closed={match.status !== 'open'}
                          $thirdPlace={match.bracket_type === 'third_place'}
                        >
                          <S.KoBracketMatchLabel>
                            {match.bracket_type === 'third_place' ? 'Platz 3' : `Duell ${match.position}`}
                          </S.KoBracketMatchLabel>
                          <S.KoBracketParticipant $winner={match.status !== 'open' && match.winner === match.image_a_id}>
                            <S.KoBracketThumb src={buildAssetUrl(match.image_a_url)} alt="" />
                            <span>{match.image_a_title || `Bild #${match.image_a_id}`}</span>
                            {match.status !== 'open' && <b>{match.votes_a}</b>}
                          </S.KoBracketParticipant>
                          <S.KoBracketParticipant $winner={match.status !== 'open' && match.winner === match.image_b_id}>
                            <S.KoBracketThumb src={buildAssetUrl(match.image_b_url)} alt="" />
                            <span>{match.image_b_title || `Bild #${match.image_b_id}`}</span>
                            {match.status !== 'open' && <b>{match.votes_b}</b>}
                          </S.KoBracketParticipant>
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
                              ? match.user_choice ? 'Stimme abgegeben' : 'Jetzt abstimmen'
                              : 'Ergebnis ansehen'}
                          </S.StatusChip>
                        </S.KoBracketMatch>
                      ))}
                    </S.KoBracketLane>
                  ))}
                </S.KoBracketStack>
              </S.KoBracketColumn>
            );
          })}
        </S.KoBracket>
      </S.KoBracketScroller>
    </S.KoBracketShell>
  );
};

export default KoMatches;
