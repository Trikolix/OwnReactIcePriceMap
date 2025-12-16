import React from 'react';
import * as S from './PhotoChallengeVoting.styles';
import GroupCard from './GroupCard';

const Group = ({ groups, openGroupModal }) => {
  return (
    <S.GroupsGrid>
      {groups.length ? (
        groups.map((group) => (
          <GroupCard key={group.id} group={group} openGroupModal={openGroupModal} />
        ))
      ) : (
        <S.EmptyState>Noch keine Gruppen.</S.EmptyState>
      )}
    </S.GroupsGrid>
  );
};

export default Group;
