import React from 'react';
import * as S from './PhotoChallengeVoting.styles';
import { buildAssetUrl, getPhotoChallengeCountry } from './utils';

const CountryFlagBadge = ({ country, compact = false }) => {
  if (!country) return null;
  return (
    <S.CountryFlagBadge
      $compact={compact}
      title={country.name}
      aria-label={country.name}
    >
      <img src={country.flagUrl} srcSet={country.flagSrcSet} alt="" loading="lazy" />
    </S.CountryFlagBadge>
  );
};

const GroupCard = ({ group, openGroupModal }) => {
  const totalMatches = group.matches.length;
  const completedMatches = group.user_votes ?? group.matches.filter((match) => match.has_voted).length;
  const statusVariant = group.status === 'finished' ? 'closed' : group.status === 'upcoming' ? 'upcoming' : 'open';
  const progress = totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;
  const previewEntries = (group.entries || []).slice(0, 4);
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
        <S.GroupPreviewStrip>
          {previewEntries.map((entry) => {
            const country = getPhotoChallengeCountry(entry.title);
            return (
              <S.CountryImageFrame key={entry.image_id}>
                <S.GroupPreviewThumb
                  src={buildAssetUrl(entry.url)}
                  alt={entry.title || `Bild ${entry.image_id}`}
                />
                <CountryFlagBadge country={country} compact />
              </S.CountryImageFrame>
            );
          })}
        </S.GroupPreviewStrip>
      )}
      <S.GroupCardHint>{cardHint}</S.GroupCardHint>
    </S.GroupCard>
  );
};

export default GroupCard;
