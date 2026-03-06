import React from 'react';
import * as S from './PhotoChallengeVoting.styles';
import { buildAssetUrl } from './utils';

const SubmissionPanel = ({
  overview,
  challengeFlags,
  isLoggedIn,
  submissionsRemaining,
  userImages,
  userImagesLoading,
  submittedImageIds,
  submissionLimit,
  handleSubmitPhoto,
  handleDeleteSubmission,
  handleUpdateSubmissionTitle,
  userImagesHasMore,
  loadUserImages,
  userImagesPage,
  userSubmissions,
  setImagePreview,
}) => {
  const [newImageTitles, setNewImageTitles] = React.useState({});
  const [submissionTitles, setSubmissionTitles] = React.useState({});

  const challengeStatus = overview?.challenge?.status;
  const isSubmissionStage =
    ['submission_open', 'submission_closed'].includes(challengeStatus) ||
    Boolean(challengeFlags?.submission_is_open_effective) ||
    Boolean(challengeFlags?.submission_is_closed_effective);

  if (!isSubmissionStage) return null;

  const userCanEditSubmissions = Boolean(challengeFlags?.submission_is_editable_for_user);
  const isPlanningPhase = Boolean(challengeFlags?.is_planning_phase);

  const handleNewTitleChange = (imageId, value) => {
    setNewImageTitles((prev) => ({ ...prev, [imageId]: value }));
  };

  const handleSubmissionTitleChange = (submissionId, value) => {
    setSubmissionTitles((prev) => ({ ...prev, [submissionId]: value }));
  };

  const getSubmissionDraftTitle = (submission) => {
    if (Object.prototype.hasOwnProperty.call(submissionTitles, submission.id)) {
      return submissionTitles[submission.id];
    }
    return submission.title || '';
  };

  return (
    <S.SubmissionPanel>
      <h2>{isPlanningPhase ? 'Einreichphase beendet' : 'Einreichphase'}</h2>
      {overview?.challenge?.submission_deadline && (
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

      {userCanEditSubmissions ? (
        <S.WarningBox>Du kannst deine Einreichungen bis zum Ende der Einreichphase ändern oder löschen.</S.WarningBox>
      ) : isPlanningPhase ? (
        <S.WarningBox>
          Die Einreichphase ist beendet. Der Admin prüft jetzt die Einsendungen und erstellt die Turnierplanung.
        </S.WarningBox>
      ) : null}

      {!isLoggedIn && <S.WarningBox>Bitte logge dich ein, um Bilder einzureichen.</S.WarningBox>}

      {isLoggedIn && (
        <>
        <S.SubmissionImagesWrapper>
            <h3>Deine Einreichungen</h3>
            {!userSubmissions.length && <S.PlaceholderText>Noch keine Einreichungen.</S.PlaceholderText>}
            {!!userSubmissions.length && (
              <S.SubmissionList>
                {userSubmissions.map((submission) => {
                  const editable = Boolean(submission.can_edit && userCanEditSubmissions);
                  const deletable = Boolean(submission.can_delete && userCanEditSubmissions);
                  const draftTitle = getSubmissionDraftTitle(submission);
                  return (
                    <S.SubmissionCard key={`user-sub-${submission.id}`}>
                      <S.ResultImageButton
                        type="button"
                        onClick={() =>
                          setImagePreview({
                            url: submission.url,
                            label: submission.title || `Bild #${submission.image_id}`,
                          })
                        }
                      >
                        <S.SubmissionImage
                          src={buildAssetUrl(submission.url)}
                          alt={submission.title || submission.beschreibung || `Bild ${submission.image_id}`}
                        />
                      </S.ResultImageButton>
                      <S.SubmissionInfo>
                        {editable ? (
                          <input
                            type="text"
                            value={draftTitle}
                            placeholder={`Bild #${submission.image_id}`}
                            onChange={(e) => handleSubmissionTitleChange(submission.id, e.target.value)}
                            style={{ width: '100%', maxWidth: 320 }}
                          />
                        ) : (
                          <strong>{submission.title || `Bild #${submission.image_id}`}</strong>
                        )}
                        <small>{new Date(submission.created_at).toLocaleString('de-DE')}</small>
                        {editable && (
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <S.SubmitButton
                              type="button"
                              onClick={() => handleUpdateSubmissionTitle(submission.id, draftTitle)}
                            >
                              Titel speichern
                            </S.SubmitButton>
                            {deletable && (
                              <S.SubmitButton
                                type="button"
                                onClick={() => handleDeleteSubmission(submission.id)}
                              >
                                Entfernen
                              </S.SubmitButton>
                            )}
                          </div>
                        )}
                      </S.SubmissionInfo>
                      <S.SubmissionStatusChip $variant={submission.status}>
                        {submission.status === 'accepted'
                          ? 'Übernommen'
                          : submission.status === 'rejected'
                          ? 'Abgelehnt'
                          : 'Wartet auf Prüfung'}
                      </S.SubmissionStatusChip>
                    </S.SubmissionCard>
                  );
                })}
              </S.SubmissionList>
            )}
          </S.SubmissionImagesWrapper>
          <S.SubmissionImagesWrapper>
            <h3>Deine Bilder</h3>
            {userImagesLoading && <S.PlaceholderText>Lade Bilder…</S.PlaceholderText>}
            {!userImagesLoading && !userImages.length && <S.PlaceholderText>Du hast noch keine Bilder hochgeladen.</S.PlaceholderText>}
            <S.SubmissionGrid>
              {userImages.map((image) => {
                const alreadySubmitted = submittedImageIds.has(image.id);
                const disabled =
                  !userCanEditSubmissions ||
                  Boolean(submissionLimit !== null && submissionsRemaining === 0) ||
                  alreadySubmitted;
                return (
                  <S.SubmissionImageCard key={image.id} $disabled={disabled}>
                    <S.ResultImageButton
                      type="button"
                      onClick={() =>
                        setImagePreview({
                          url: image.url,
                          label: image.beschreibung || `Bild #${image.id}`,
                        })
                      }
                    >
                      <S.SubmissionImageThumb src={buildAssetUrl(image.url)} alt={image.beschreibung || `Bild ${image.id}`} />
                    </S.ResultImageButton>
                    {image.beschreibung && <small>{image.beschreibung}</small>}
                    <input
                      type="text"
                      placeholder="Bild-Titel (optional)"
                      value={newImageTitles[image.id] || ''}
                      onChange={(e) => handleNewTitleChange(image.id, e.target.value)}
                      disabled={disabled}
                      style={{ margin: '8px 0', width: '100%' }}
                    />
                    <S.SubmitButton
                      type="button"
                      onClick={() => handleSubmitPhoto(image.id, newImageTitles[image.id] || '')}
                      disabled={disabled}
                    >
                      {alreadySubmitted ? 'Bereits eingereicht' : userCanEditSubmissions ? 'Einreichen' : 'Einreichung gesperrt'}
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
        </>
      )}
    </S.SubmissionPanel>
  );
};

export default SubmissionPanel;
