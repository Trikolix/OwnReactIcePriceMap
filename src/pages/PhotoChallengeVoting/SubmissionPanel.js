import React from 'react';
import * as S from './PhotoChallengeVoting.styles';
import { buildAssetUrl } from './utils';

const SubmissionPanel = ({
  overview,
  isLoggedIn,
  submissionsRemaining,
  userImages,
  userImagesLoading,
  submittedImageIds,
  submissionLimit,
  handleSubmitPhoto,
  userImagesHasMore,
  loadUserImages,
  userImagesPage,
  userSubmissions,
}) => {
  if (overview?.challenge?.status !== 'submission_open') return null;

  return (
    <S.SubmissionPanel>
      <h2>Einreichephase</h2>
      {overview.challenge.submission_deadline && (
        <p>
          Einreichungen möglich bis{' '}
          <strong>{new Date(overview.challenge.submission_deadline).toLocaleString('de-DE')}</strong>.
        </p>
      )}
      {submissionLimit ? (
        <p>
          Du kannst insgesamt {submissionLimit} Bild(er) einreichen. Verfügbar:{' '}
          <strong>{submissionsRemaining}</strong>
        </p>
      ) : (
        <p>Du kannst beliebig viele deiner Bilder einreichen.</p>
      )}
      {!isLoggedIn && <S.WarningBox>Bitte logge dich ein, um Bilder einzureichen.</S.WarningBox>}
      {isLoggedIn && (
        <>
          <S.SubmissionImagesWrapper>
            <h3>Deine Bilder</h3>
            {userImagesLoading && <S.PlaceholderText>Lade Bilder…</S.PlaceholderText>}
            {!userImagesLoading && !userImages.length && <S.PlaceholderText>Du hast noch keine Bilder hochgeladen.</S.PlaceholderText>}
            <S.SubmissionGrid>
              {userImages.map((image) => {
                const alreadySubmitted = submittedImageIds.has(image.id);
                const disabled =
                  Boolean(submissionLimit !== null && submissionsRemaining === 0) || alreadySubmitted;
                return (
                  <S.SubmissionImageCard key={image.id} $disabled={disabled}>
                    <S.SubmissionImageThumb src={buildAssetUrl(image.url)} alt={image.beschreibung || `Bild ${image.id}`} />
                    {image.beschreibung && <small>{image.beschreibung}</small>}
                    <S.SubmitButton
                      type="button"
                      onClick={() => handleSubmitPhoto(image.id)}
                      disabled={disabled}
                    >
                      {alreadySubmitted ? 'Bereits eingereicht' : 'Einreichen'}
                    </S.SubmitButton>
                  </S.SubmissionImageCard>
                );
              })}
            </S.SubmissionGrid>
            {userImagesHasMore && (
              <S.SubmitButton
                type="button"
                onClick={() => loadUserImages(userImagesPage + 1, true)}
                disabled={userImagesLoading}
              >
                Mehr laden
              </S.SubmitButton>
            )}
          </S.SubmissionImagesWrapper>
          <S.SubmissionImagesWrapper>
            <h3>Deine Einreichungen</h3>
            {!userSubmissions.length && <S.PlaceholderText>Noch keine Einreichungen.</S.PlaceholderText>}
            {!!userSubmissions.length && (
              <S.SubmissionList>
                {userSubmissions.map((submission) => (
                  <S.SubmissionCard key={`user-sub-${submission.id}`}>
                    <S.SubmissionImage
                      src={buildAssetUrl(submission.url)}
                      alt={submission.beschreibung || `Bild ${submission.image_id}`}
                    />
                    <S.SubmissionInfo>
                      <strong>Bild #{submission.image_id}</strong>
                      <small>{new Date(submission.created_at).toLocaleString()}</small>
                    </S.SubmissionInfo>
                    <S.SubmissionStatusChip $variant={submission.status}>
                      {submission.status === 'accepted'
                        ? 'Übernommen'
                        : submission.status === 'rejected'
                        ? 'Abgelehnt'
                        : 'Wartet auf Prüfung'}
                    </S.SubmissionStatusChip>
                  </S.SubmissionCard>
                ))}
              </S.SubmissionList>
            )}
          </S.SubmissionImagesWrapper>
        </>
      )}
    </S.SubmissionPanel>
  );
};

export default SubmissionPanel;
