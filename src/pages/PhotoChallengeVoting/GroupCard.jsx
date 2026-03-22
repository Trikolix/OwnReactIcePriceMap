import React from 'react';
import * as S from './PhotoChallengeVoting.styles';
import { buildAssetUrl } from './utils';

const GroupCard = ({ group, openGroupModal }) => {
  const totalMatches = group.matches.length;
  const completedMatches = group.user_votes ?? group.matches.filter((match) => match.has_voted).length;
  const statusVariant = group.status === 'finished' ? 'closed' : group.status === 'upcoming' ? 'upcoming' : 'open';
  const progress = totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;
  const previewEntries = (group.entries || []).slice(0, 3);
  const isComplete = totalMatches > 0 && completedMatches >= totalMatches;
  const cardHint =
    group.status === 'finished'
      ? 'Ergebnisse und Bilder ansehen'
      : group.status === 'upcoming'
      ? 'Bilder vorab ansehen'
      : 'Gruppe öffnen und voten';

  return (
    <S.GroupCard key={group.id} type="button" onClick={() => openGroupModal(group)}>
      <S.GroupHeader>
        <div>
          <h3>{group.name}</h3>
          <small>{group.entries.length} Bilder</small>
        </div>
        <S.ProgressTag $complete={isComplete}>
          <S.ProgressTagFill $progress={progress} />
          <S.ProgressTagContent>
            {completedMatches}/{totalMatches} Votes
          </S.ProgressTagContent>
        </S.ProgressTag>
      </S.GroupHeader>
      <S.StatusChip $variant={statusVariant}>{group.status_label}</S.StatusChip>
      {!!previewEntries.length && (
        <S.GroupPreviewStrip aria-hidden="true">
          {previewEntries.map((entry) => (
            <S.GroupPreviewThumb
              key={entry.image_id}
              src={buildAssetUrl(entry.url)}
              alt=""
            />
          ))}
        </S.GroupPreviewStrip>
      )}
      <S.GroupCardHint>{cardHint}</S.GroupCardHint>
    </S.GroupCard>
  );
};

export default GroupCard;
