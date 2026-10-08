import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Camera, ImagePlus, Upload } from 'lucide-react';
import { Button, Card, ChallengeDialog, Field, Notice, ActionRow, Stack } from '../../components/ChallengeUI';
import { buildAssetUrl } from './utils';
import { photoDate, photoDateValue } from '../../utils/photoChallengePresentation';

const Grid = styled.div`display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; @media(min-width: 600px) { grid-template-columns: repeat(3, minmax(0, 1fr)); }`;
const Pick = styled.button`position: relative; width: 100%; min-height: 44px; background: #fff; border: 3px solid ${p => p.$selected ? '#b77b00' : '#eadfc9'}; border-radius: 12px; padding: 0; overflow: hidden; cursor: pointer; color: #2f2100;
  img { width: 100%; aspect-ratio: 1; object-fit: cover; display: block; } span { display: block; padding: 10px; text-align: left; overflow-wrap: anywhere; } &:disabled { opacity: .5; cursor: default; } &:focus-visible { outline: 3px solid #835500; outline-offset: 2px; }
`;
const Preview = styled.img`width: 100%; max-height: 320px; object-fit: contain; border-radius: 12px; background: #f3eee4;`;
const Row = styled.div`display: grid; grid-template-columns: 90px minmax(0, 1fr); align-items: start; gap: 16px; padding: 16px 0; border-bottom: 1px solid #eadfc9; &:last-child { border: 0; } p { margin: 0; line-height: 1.5; }`;
const Status = styled.span`font-size: 13px; color: #70654f;`;

export default function SubmissionPanel({ overview, challengeFlags, isLoggedIn, submissionsRemaining, userImages, userImagesLoading,
  submittedImageIds, submissionLimit, userImagesError, handleSubmitPhoto, handleDeleteSubmission, handleUpdateSubmissionTitle,
  userImagesHasMore, loadUserImages, userImagesPage, userSubmissions, setImagePreview, dialogOpen, setDialogOpen, mutationBusy, actionError }) {
  const [mode, setMode] = useState('gallery');
  const [selected, setSelected] = useState(null);
  const [review, setReview] = useState(false);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [titles, setTitles] = useState({});
  const [error, setError] = useState(null);
  const [removeId, setRemoveId] = useState(null);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(id); }, []);
  useEffect(() => { if (!file) { setFilePreview(null); return undefined; } const url = URL.createObjectURL(file); setFilePreview(url); return () => URL.revokeObjectURL(url); }, [file]);
  const stage = ['submission_open', 'submission_closed'].includes(overview?.challenge?.status) || challengeFlags.submission_is_open_effective || challengeFlags.submission_is_closed_effective;
  if (!stage) return null;
  const deadline = photoDateValue(overview.challenge.submission_deadline);
  const editable = Boolean(challengeFlags.submission_is_editable_for_user) && (!deadline || now <= deadline.getTime());
  const full = submissionLimit !== null && submissionsRemaining <= 0;
  const allowUploads = Boolean(overview.challenge.allow_direct_uploads);
  const close = () => setDialogOpen(false);
  const send = async () => {
    setError(null);
    const success = await handleSubmitPhoto(mode === 'upload' ? null : selected?.id, title, mode === 'upload' ? file : null);
    if (success) { setSelected(null); setReview(false); setTitle(''); setFile(null); close(); }
    else setError('Dein Foto konnte nicht eingereicht werden. Die Auswahl bleibt erhalten.');
  };
  return <Card id="einreichungen"><Stack>
    <div><h2>Meine Einreichungen</h2><p>{editable ? `Du kannst deine Fotos bis ${photoDate(overview.challenge.submission_deadline)} ändern.` : 'Die Einreichphase ist beendet. Die Fotos werden für die Abstimmung vorbereitet.'}</p>
      {submissionLimit !== null && <p><strong>{userSubmissions.length} von {submissionLimit} Plätzen belegt</strong></p>}
    </div>
    {!isLoggedIn ? <Button onClick={() => window.dispatchEvent(new CustomEvent('auth:open-login'))}>Einloggen und mitmachen</Button> : <>
      {userSubmissions.length === 0 && <p>Noch kein Foto eingereicht. Zeig uns deinen Eis-Moment!</p>}
      <div>{userSubmissions.map(item => <Row key={item.id}>
        <Pick aria-label={`Foto ${item.title || item.image_id} vergrößern`} onClick={event => setImagePreview({ url: item.url, label: item.title || 'Dein Foto', returnFocusTo: event.currentTarget })}><img src={buildAssetUrl(item.url)} alt={item.title || 'Dein Foto'} /></Pick>
        <Stack style={{ gap: 10 }}>
          {item.can_edit && editable ? <Field>Foto-Titel<input maxLength={100} value={titles[item.id] ?? item.title ?? ''} disabled={mutationBusy} onChange={event => setTitles({ ...titles, [item.id]: event.target.value })} /></Field> : <strong>{item.title || 'Dein Eis-Moment'}</strong>}
          <Status>{item.status === 'accepted' ? 'Nimmt an der Abstimmung teil' : item.status === 'rejected' ? 'Nicht für die Abstimmung ausgewählt' : 'Wartet auf Prüfung'}</Status>
          {item.can_edit && editable && <ActionRow><Button $secondary disabled={mutationBusy} onClick={() => handleUpdateSubmissionTitle(item.id, titles[item.id] ?? item.title ?? '')}>Titel speichern</Button>
            {item.can_delete && <Button $secondary disabled={mutationBusy} onClick={() => setRemoveId(item.id)}>Entfernen</Button>}
          </ActionRow>}
        </Stack>
      </Row>)}</div>
      {editable && (full ? <Notice>Alle Plätze sind belegt. Entferne ein Foto, wenn du ein anderes einreichen möchtest.</Notice> : <Button $secondary onClick={() => setDialogOpen(true)}><ImagePlus size={19} aria-hidden="true" />{userSubmissions.length ? 'Weiteres Foto einreichen' : 'Foto auswählen'}</Button>)}
    </>}
  </Stack>
  <ChallengeDialog open={Boolean(dialogOpen)} onClose={close} title="Foto einreichen" busy={Boolean(mutationBusy)} footer={<>
    <Button $secondary onClick={close} disabled={mutationBusy}>Abbrechen</Button>
    <Button disabled={mutationBusy || !editable || full || (mode === 'upload' ? !file : !selected || !review)} onClick={send}>{mutationBusy ? 'Wird eingereicht …' : 'Foto einreichen'}</Button>
  </>}><Stack>
    <p>{mode === 'gallery' && review ? 'Prüfe dein Foto und gib ihm optional einen Titel. Mit „Foto einreichen“ bestätigst du deine Auswahl.' : 'Wähle dein eigenes Foto aus. Im nächsten Schritt prüfst du die Vorschau.'}</p>
    {allowUploads && <ActionRow><Button $secondary aria-pressed={mode === 'gallery'} onClick={() => setMode('gallery')}><Camera size={18} aria-hidden="true" />Meine Fotos</Button><Button $secondary aria-pressed={mode === 'upload'} onClick={() => setMode('upload')}><Upload size={18} aria-hidden="true" />Foto hochladen</Button></ActionRow>}
    {(!editable || full) && <Notice $error>{full ? 'Alle Einreichplätze sind belegt.' : 'Die Einreichfrist ist abgelaufen.'}</Notice>}
    {mode === 'gallery' && review && <Button $secondary disabled={mutationBusy} onClick={() => setReview(false)}>Anderes Foto auswählen</Button>}
    {mode === 'gallery' ? !review && <>
      {userImagesLoading && <Notice role="status">Deine Fotos werden geladen …</Notice>}
      {userImagesError && <Notice $error role="alert">{userImagesError} <Button $secondary onClick={() => loadUserImages(1)}>Erneut versuchen</Button></Notice>}
      {!userImagesError && !userImagesLoading && !userImages.length && <Notice>{overview.challenge.min_image_created_at ? 'Keines deiner Fotos passt zum erlaubten Zeitraum.' : 'Du hast noch keine Fotos hochgeladen.'}</Notice>}
      <Grid aria-label="Eigenes Foto auswählen">{userImages.map(image => <Pick key={image.id} $selected={selected?.id === image.id} aria-pressed={selected?.id === image.id} disabled={submittedImageIds.has(image.id) || mutationBusy} onClick={() => { setSelected(image); setReview(true); }}>
        <img src={buildAssetUrl(image.url)} alt={image.beschreibung || 'Dein Foto'} loading="lazy" /><span>{submittedImageIds.has(image.id) ? 'Bereits eingereicht' : selected?.id === image.id ? '✓ Ausgewählt' : image.beschreibung || 'Foto auswählen'}</span>
      </Pick>)}</Grid>
      {userImagesHasMore && <Button $secondary disabled={userImagesLoading} onClick={() => loadUserImages(userImagesPage + 1, true)}>Mehr Fotos laden</Button>}
    </> : <Field>Foto auswählen<input type="file" accept="image/jpeg,image/png,image/webp" disabled={mutationBusy} onChange={event => setFile(event.target.files?.[0] || null)} /><small>JPG, PNG oder WebP.</small></Field>}
    {(mode === 'upload' ? filePreview : review && selected?.url) && <Preview src={mode === 'upload' ? filePreview : buildAssetUrl(selected.url)} alt="Vorschau deiner Einreichung" />}
    {(review || mode === 'upload') && <Field>Foto-Titel <small>optional</small><input maxLength={100} value={title} onChange={event => setTitle(event.target.value)} disabled={mutationBusy} placeholder="Zum Beispiel: Mein Sommermoment" /></Field>}
    {overview.challenge.min_image_created_at && <p>Vorhandene Fotos müssen ab dem {photoDate(overview.challenge.min_image_created_at)} hochgeladen worden sein.</p>}
    {(error || actionError) && <Notice $error role="alert">{actionError || error}</Notice>}
  </Stack></ChallengeDialog>
  <ChallengeDialog open={removeId !== null} onClose={() => setRemoveId(null)} title="Foto entfernen?" busy={Boolean(mutationBusy)} footer={<>
    <Button $secondary disabled={mutationBusy} onClick={() => setRemoveId(null)}>Behalten</Button><Button disabled={mutationBusy} onClick={async () => { if (await handleDeleteSubmission(removeId)) setRemoveId(null); }}>Foto entfernen</Button>
  </>}><p>Das Foto wird aus dieser Challenge entfernt. Dein ursprüngliches Foto bleibt erhalten.</p>{actionError && <Notice $error role="alert">{actionError}</Notice>}</ChallengeDialog>
  </Card>;
}
