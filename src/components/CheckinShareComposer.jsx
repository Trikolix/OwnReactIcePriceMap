import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { Capacitor } from '@capacitor/core';
import { Check, Copy, Download, Image as ImageIcon, MapPinned, Share2, Smartphone, ZoomIn, ZoomOut } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { buildAssetUrl } from '../utils/assets';
import { Button, ChallengeDialog, Field, Notice } from './ChallengeUI';
import { fetchCheckinShareImage, fetchCheckinShareManifest } from '../features/socialMedia/api';
import { buildCheckinShareText, canShareCheckinImage, copyShareText, downloadStoryBlob, shareCheckinStory } from '../features/socialMedia/shareStory';

export default function CheckinShareComposer({ checkinId, onClose }) {
  const { authToken } = useUser();
  const [manifest, setManifest] = useState(null);
  const [slide, setSlide] = useState('');
  const [imageId, setImageId] = useState(null);
  const [format, setFormat] = useState('story');
  const [includeAwards, setIncludeAwards] = useState(true);
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState('');
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [captionOpen, setCaptionOpen] = useState(false);
  const [manifestAttempt, setManifestAttempt] = useState(0);
  const [renderAttempt, setRenderAttempt] = useState(0);
  const copiedTimer = useRef(null);
  const captionRef = useRef(null);
  useEffect(() => () => clearTimeout(copiedTimer.current), []);
  useEffect(() => {
    if (error?.kind === 'copy' && captionOpen) {
      captionRef.current?.focus({ preventScroll: true });
      captionRef.current?.select();
      captionRef.current?.scrollIntoView({ block: 'center' });
    }
  }, [captionOpen, error]);
  // A previous preview stays visible while updating; release it only on replacement or close.
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true); setError(null);
    fetchCheckinShareManifest(authToken, checkinId, controller.signal)
      .then(payload => {
        if (!active) return;
        const data = payload.data;
        if (!data?.slides || !Array.isArray(data.images)) throw new Error('Der Check-in konnte nicht geladen werden.');
        setManifest(data);
        setImageId(data.images[0]?.image_id ?? null);
        setSlide(data.slides.photo ? 'photo' : 'review');
      })
      .catch(reason => { if (active && reason.name !== 'AbortError') setError({ kind: 'manifest', message: reason.message || 'Der Check-in konnte nicht geladen werden.' }); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [authToken, checkinId, manifestAttempt]);

  useEffect(() => {
    if (!manifest || !slide || (slide === 'photo' && !imageId)) return undefined;
    const controller = new AbortController();
    let active = true;
    setRendering(true); setError(null); setNotice(''); setImage(null);
    fetchCheckinShareImage(authToken, {
      checkin_id: checkinId, slide, format,
      image_id: slide === 'photo' ? imageId : undefined,
      include_awards: slide === 'review' && includeAwards,
    }, controller.signal)
      .then(result => {
        if (!active) return;
        setPreviewUrl(URL.createObjectURL(result.blob));
        setImage(result);
      })
      .catch(reason => { if (active && reason.name !== 'AbortError') setError({ kind: 'render', message: reason.message || 'Das Bild konnte nicht erstellt werden.' }); })
      .finally(() => { if (active) setRendering(false); });
    return () => { active = false; controller.abort(); };
  }, [authToken, checkinId, manifest, slide, format, imageId, includeAwards, renderAttempt]);

  const shareText = buildCheckinShareText(manifest?.shop_name);
  const ready = Boolean(image) && !loading && !rendering && !sharing;
  const supportsSharing = canShareCheckinImage(image || undefined);
  const nativePlatform = Capacitor.isNativePlatform();
  const handleDownload = () => {
    if (!ready) return;
    downloadStoryBlob(image.blob, image.filename);
    setError(null);
    setNotice('Download gestartet. Wähle das Bild danach in Instagram aus.');
  };
  const handleShare = async () => {
    if (!ready) return;
    setSharing(true); setError(null); setNotice('');
    try {
      const result = await shareCheckinStory({ ...image, shopName: manifest.shop_name });
      if (!result.shared) {
        downloadStoryBlob(image.blob, image.filename);
        setNotice('Download gestartet. Wähle das Bild danach in Instagram aus.');
      } else setNotice('Bild an das Teilen-Menü übergeben.');
    } catch (reason) {
      if (reason.name !== 'AbortError') setError({ kind: 'share', message: nativePlatform ? 'Das Teilen-Menü konnte nicht geöffnet werden. Versuche es erneut.' : 'Das Teilen hat nicht geklappt. Du kannst das Bild auch speichern.' });
    } finally { setSharing(false); }
  };
  const handleCopy = async () => {
    setError(null);
    try {
      await copyShareText(shareText);
      setCopied(true); setNotice('Begleittext kopiert.');
      clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      setCaptionOpen(true);
      setError({ kind: 'copy', message: 'Markiere den Begleittext und kopiere ihn selbst.' });
    }
  };
  const feedback = error ? <Feedback $error role="alert">
    {error.message}
    {error.kind === 'render' && <Retry type="button" $secondary onClick={() => setRenderAttempt(value => value + 1)}>Erneut versuchen</Retry>}
  </Feedback> : notice ? <Feedback role="status">{notice}</Feedback> : null;

  return <ChallengeDialog open title="Check-in teilen" onClose={onClose} wide busy={sharing} footer={manifest && <Footer>
    <Actions>
      {supportsSharing ? <>
        <Button type="button" aria-label="Bild teilen" disabled={!ready} onClick={handleShare}><Share2 size={18} aria-hidden="true" />{sharing ? 'Öffnen …' : 'Teilen'}</Button>
        {nativePlatform ? <Button type="button" $secondary aria-label="Begleittext kopieren" onClick={handleCopy}><Copy size={18} aria-hidden="true" />Text kopieren</Button>
          : <Button type="button" $secondary aria-label="PNG herunterladen" disabled={!ready} onClick={handleDownload}><Download size={18} aria-hidden="true" />Speichern</Button>}
      </> : <>
        <Button type="button" aria-label="PNG herunterladen" disabled={!ready} onClick={handleDownload}><Download size={18} aria-hidden="true" />Speichern</Button>
        <Button type="button" $secondary aria-label="Begleittext kopieren" onClick={handleCopy}>{copied ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}Text kopieren</Button>
      </>}
    </Actions>
    {feedback}
  </Footer>}>
    {loading ? <p role="status">Lade deinen Check-in …</p> : !manifest ? <>
      <Notice $error role="alert">{error?.message}</Notice>
      <Button type="button" $secondary onClick={() => setManifestAttempt(value => value + 1)}>Erneut versuchen</Button>
    </> : <Grid $expanded={expanded}>
      <Controls>
        <ControlGroup><strong>Format</strong><Tabs role="group" aria-label="Format auswählen">
          <Tab type="button" $secondary $active={format === 'story'} aria-label="Story · 9:16" aria-pressed={format === 'story'} disabled={sharing} onClick={() => setFormat('story')}><Smartphone size={18} aria-hidden="true" />Story <small>9:16</small></Tab>
          <Tab type="button" $secondary $active={format === 'feed'} aria-label="Beitrag · 4:5" aria-pressed={format === 'feed'} disabled={sharing} onClick={() => setFormat('feed')}><ImageIcon size={18} aria-hidden="true" />Beitrag <small>4:5</small></Tab>
        </Tabs></ControlGroup>
        {manifest.slides.photo && <ControlGroup><strong>Motiv</strong><Tabs role="group" aria-label="Bildinhalt auswählen">
          <Tab type="button" $secondary $active={slide === 'photo'} aria-pressed={slide === 'photo'} disabled={sharing} onClick={() => setSlide('photo')}><ImageIcon size={18} aria-hidden="true" />Foto</Tab>
          <Tab type="button" $secondary $active={slide === 'review'} aria-label="Check-in-Karte" aria-pressed={slide === 'review'} disabled={sharing} onClick={() => setSlide('review')}><MapPinned size={18} aria-hidden="true" />Check-in</Tab>
        </Tabs></ControlGroup>}
      <PreviewColumn>
        <Preview type="button" aria-label={expanded ? 'Bildvorschau verkleinern' : 'Bildvorschau vergrößern'} aria-pressed={expanded} $format={format} $expanded={expanded} aria-busy={rendering} disabled={!previewUrl} onClick={() => setExpanded(value => !value)}>
          {previewUrl && <img src={previewUrl} alt={`${format === 'story' ? 'Story' : 'Beitragsbild'} für ${manifest.shop_name}`} />}
          {rendering ? <PreviewStatus role="status">Bild wird gestaltet …</PreviewStatus> : previewUrl && <Zoom>{expanded ? <ZoomOut size={16} /> : <ZoomIn size={16} />}{expanded ? 'Verkleinern' : 'Vergrößern'}</Zoom>}
        </Preview>
        <PreviewCaption>Vorschau · {format === 'story' ? '1080 × 1920' : '1080 × 1350'} px</PreviewCaption>
      </PreviewColumn>
        {slide === 'photo' && manifest.images.length > 1 && <ControlGroup aria-label="Foto auswählen">
          <strong>Foto auswählen</strong>
          <Thumbnails>{manifest.images.map((item, index) => <Thumbnail key={item.image_id} type="button" $active={Number(imageId) === Number(item.image_id)} aria-label={`Foto ${index + 1} auswählen`} aria-pressed={Number(imageId) === Number(item.image_id)} disabled={sharing} onClick={() => setImageId(item.image_id)}>
            <img src={buildAssetUrl(item.image_url)} alt="" />
            {Number(imageId) === Number(item.image_id) && <Selected><Check size={14} aria-hidden="true" /></Selected>}
          </Thumbnail>)}</Thumbnails>
        </ControlGroup>}
        <Extras>
          {slide === 'review' && manifest.awards?.length > 0 && <details><summary>Weitere Optionen</summary><AwardToggle>
            <input type="checkbox" checked={includeAwards} disabled={sharing} onChange={event => setIncludeAwards(event.target.checked)} />Auszeichnungen anzeigen
          </AwardToggle></details>}
          <details open={captionOpen} onToggle={event => setCaptionOpen(event.currentTarget.open)}><summary>Begleittext</summary>
            <Field><span>Text zum Kopieren</span><textarea ref={captionRef} readOnly value={shareText} onFocus={event => event.target.select()} /></Field>
            <Button type="button" $secondary onClick={handleCopy}>{copied ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}{copied ? 'Kopiert' : 'Text kopieren'}</Button>
          </details>
          <Hint>{nativePlatform ? 'Teile das Bild über eine App. Zum Speichern wähle eine Datei- oder Foto-App im Teilen-Menü.' : supportsSharing ? 'Teile das Bild über eine App oder speichere es für später.' : 'Speichere das Bild und wähle es in Instagram als Story oder Beitrag aus.'}</Hint>
        </Extras>
      </Controls>

    </Grid>}
  </ChallengeDialog>;
}

const Grid = styled.div`display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, ${p => p.$expanded ? '1.3fr' : '.9fr'}); grid-template-rows: repeat(3, min-content) 1fr; gap: 24px; align-items: start; @media(max-width: 719px) { grid-template-columns: minmax(0, 1fr); grid-template-rows: none; gap: 16px; }`;
const Controls = styled.div`display: contents;`;
const ControlGroup = styled.section`display: grid; gap: 8px; min-width: 0; grid-column: 1; > strong { font-size: 14px; color: #756951; }`;
const Tabs = styled.div`display: flex; gap: 8px; > button { flex: 1; padding: 8px 10px; font-size: 14px; } small { font-size: 11px; color: #79664c; font-weight: 500; }`;
const Tab = styled(Button)`background: ${p => p.$active ? '#fff0c4' : '#fffdf8'}; border-color: ${p => p.$active ? '#e3a219' : '#e0d3ba'};`;
const PreviewColumn = styled.div`display: grid; justify-items: center; gap: 8px; grid-column: 2; grid-row: 1 / span 4; @media(max-width:719px) { grid-column: 1; grid-row: auto; }`;
const Preview = styled.button`position: relative; display: block; padding: 0; width: min(100%, ${p => p.$expanded ? 420 : 300}px); aspect-ratio: ${p => p.$format === 'feed' ? '4 / 5' : '9 / 16'}; background: #eadfc9; border: 1px solid #dfd1b6; border-radius: 14px; overflow: hidden; cursor: zoom-in; img { display: block; width: 100%; height: 100%; object-fit: contain; } &:focus-visible { outline: 3px solid #835500; outline-offset: 3px; } @media(max-width: 719px) { width: ${p => p.$expanded ? '100%' : 'min(100%, 220px)'}; }`;
const PreviewStatus = styled.div`position: absolute; inset: auto 12px 12px; background: #fffdf8ed; border-radius: 10px; padding: 10px; text-align: center; font-size: 14px; color: #5d4929;`;
const Zoom = styled.span`position: absolute; right: 8px; bottom: 8px; display: inline-flex; align-items: center; gap: 5px; background: #fffdf8ed; border-radius: 8px; padding: 7px 9px; color: #5d4929; font-size: 12px;`;
const PreviewCaption = styled.small`font-size: 12px; color: #756951;`;
const Thumbnails = styled.div`display: flex; flex-wrap: wrap; gap: 8px;`;
const Thumbnail = styled.button`position: relative; width: 56px; height: 56px; padding: 0; overflow: hidden; border: 2px solid ${p => p.$active ? '#e3a219' : '#e0d3ba'}; border-radius: 10px; cursor: pointer; background: #eadfc9; img { width: 100%; height: 100%; object-fit: cover; } &:focus-visible { outline: 3px solid #835500; outline-offset: 2px; }`;
const Selected = styled.span`position: absolute; right: 2px; bottom: 2px; display: grid; place-items: center; width: 20px; height: 20px; background: #ffbe35; border-radius: 50%; color: #2f2100;`;
const AwardToggle = styled.label`display: flex; align-items: center; gap: 12px; min-height: 44px; cursor: pointer; input { accent-color: #e3a219; width: 20px; height: 20px; } input:focus-visible { outline: 3px solid #835500; outline-offset: 3px; }`;
const Extras = styled.div`display: grid; gap: 10px; grid-column: 1; details summary { min-height: 44px; align-content: center; cursor: pointer; font-size: 14px; } details[open] ${Field} { margin: 8px 0 12px; } summary:focus-visible { outline: 3px solid #835500; outline-offset: 2px; }`;
const Hint = styled.p`margin: 0; color: #756951; font-size: 13px; line-height: 1.5;`;
const Footer = styled.div`width: 100%; display: grid; gap: 8px;`;
const Actions = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: 10px; > button { padding: 10px 8px; font-size: 14px; }`;
const Feedback = styled.div`font-size: 13px; line-height: 1.45; color: ${p => p.$error ? '#8e3528' : '#53653d'}; overflow-wrap: anywhere;`;
const Retry = styled(Button)`margin: 8px 0 0; display: flex;`;
