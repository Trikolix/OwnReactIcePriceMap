import React from 'react';
import * as S from './PhotoChallengeVoting.styles';

const GroupCard = ({ group, openGroupModal }) => {
  const totalMatches = group.matches.length;
  const completedMatches = group.user_votes ?? group.matches.filter((match) => match.has_voted).length;
  const statusVariant = group.status === 'finished' ? 'closed' : group.status === 'upcoming' ? 'upcoming' : 'open';
  return (
    <S.GroupCard key={group.id}>
      <S.GroupHeader type="button" onClick={() => openGroupModal(group)}>
        <div>
          <h3>{group.name}</h3>
          <small>{group.entries.length} Bilder</small>
        </div>
        <S.ProgressTag>
          {completedMatches}/{totalMatches} Votes
        </S.ProgressTag>
      </S.GroupHeader>
      <S.StatusChip $variant={statusVariant}>{group.status_label}</S.StatusChip>
    </S.GroupCard>
  );
};

export default GroupCard;
