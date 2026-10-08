import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Copy, Share2, Users } from 'lucide-react';
import { ActionRow, Button, ChallengeDialog, Field, Notice } from './ChallengeUI';
import { copyShareText } from '../features/socialMedia/shareStory';
import { onboardingRequest, recordOnboardingAction } from '../features/onboarding/api';

export default function InviteFriendsModal({ open, onClose, inviteCode = null }) {
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setError(''); setNotice(''); setProgress(null);
    onboardingRequest('onboarding.php', undefined, controller.signal).then(json => setProgress(json.data))
      .catch(reason => { if (reason.name !== 'AbortError') setError(reason.message); });
    return () => controller.abort();
  }, [open]);
  const code = progress?.invite_code || inviteCode;
  const url = code ? `https://ice-app.de/register/${encodeURIComponent(code)}` : '';
  const share = async copy => {
    setBusy(true); setError(''); setNotice('');
    try {
      if (copy) await copyShareText(url);
      else {
        const data = { title: 'Zusammen Eis entdecken', text: 'Entdecke mit mir die Ice-App – Eis-Orte, Check-ins und Challenges.', url };
        if (Capacitor.isNativePlatform()) await Share.share(data);
        else await navigator.share(data);
      }
      setNotice(copy ? 'Einladungslink kopiert.' : 'Einladung an das Teilen-Menü übergeben.');
      try { await recordOnboardingAction('invite_shared'); }
      catch { setNotice(copy ? 'Link kopiert. Dein Onboarding-Fortschritt wird beim nächsten Versuch gespeichert.' : 'Einladung geteilt. Der Fortschritt konnte noch nicht gespeichert werden.'); }
    } catch (reason) {
      if (reason.name !== 'AbortError' && !/^share cancel(?:ed|led)$/i.test(reason.message || ''))
        setError('Der Link konnte nicht geteilt werden. Du kannst ihn im Feld auswählen und kopieren.');
    } finally { setBusy(false); }
  };
  const canShare = Capacitor.isNativePlatform() || typeof navigator.share === 'function';
  return <ChallengeDialog compact open={open} onClose={onClose} busy={busy} title="Freunde einladen">
    <p><Users size={21} aria-hidden="true" /> Zusammen schmeckt Eis noch besser. Teile deinen Link und sammle zusätzliche EP, wenn deine Freunde mitmachen.</p>
    {url ? <><Field>Dein Einladungslink<input value={url} readOnly onFocus={event => event.target.select()} /></Field>
      <ActionRow style={{ marginTop: 16 }}>
        {canShare && <Button type="button" disabled={busy} onClick={() => share(false)}><Share2 size={18} aria-hidden="true" />Einladen</Button>}
        <Button type="button" $secondary={canShare} disabled={busy} onClick={() => share(true)}><Copy size={18} aria-hidden="true" />Link kopieren</Button>
      </ActionRow></> : !error && <p role="status">Einladungslink wird geladen …</p>}
    {progress && <p>{progress.stats.invited_count} erfolgreich geworben · {progress.stats.invited_pending_count} noch unbestätigt</p>}
    {notice && <Notice role="status">{notice}</Notice>}
    {error && <Notice $error role="alert">{error}</Notice>}
  </ChallengeDialog>;
}
