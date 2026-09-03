import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { Check, Copy, Download, ExternalLink, Image as ImageIcon, MapPinned, Share2 } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { buildAssetUrl } from '../utils/assets.jsx';
import { CloseButton, Modal, Overlay } from '../styles/SharedStyles';
import { fetchCheckinShareImage, fetchCheckinShareManifest } from '../features/socialMedia/api';
import {
  buildCheckinShareText,
  cleanupCheckinShareCache,
  copyShareText,
  downloadStoryBlob,
  INSTAGRAM_PROFILE_URL,
  shareCheckinStory,
} from '../features/socialMedia/shareStory';

const CheckinShareComposer = ({ checkinId, onClose }) => {
  const { authToken } = useUser();
  const [manifest, setManifest] = useState(null);
  const [slide, setSlide] = useState(null);
  const [imageId, setImageId] = useState(null);
  const [includeAwards, setIncludeAwards] = useState(true);
  const [story, setStory] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    cleanupCheckinShareCache();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetchCheckinShareManifest(authToken, checkinId, controller.signal)
      .then((payload) => {
        const next = payload.data;
        const firstImage = next.images?.[0]?.image_id || null;
        setImageId(firstImage);
        setSlide(firstImage ? 'photo' : 'review');
        setManifest(next);
      })
      .catch((loadError) => {
        if (loadError.name !== 'AbortError') setError(loadError.message || 'Share-Daten konnten nicht geladen werden.');
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [authToken, checkinId]);

  useEffect(() => {
    if (!manifest || !slide || (slide === 'photo' && !imageId)) return undefined;
    const controller = new AbortController();
    let active = true;
    let objectUrl = '';
    setRendering(true);
    setError('');
    setNotice('');
    setStory(null);
    fetchCheckinShareImage(authToken, {
      checkin_id: checkinId,
      slide,
      image_id: slide === 'photo' ? imageId : undefined,
      include_awards: slide === 'review' && includeAwards,
    }, controller.signal)
      .then((nextStory) => {
        objectUrl = URL.createObjectURL(nextStory.blob);
        if (active) {
          setStory(nextStory);
          setPreviewUrl(objectUrl);
        } else {
          URL.revokeObjectURL(objectUrl);
        }
      })
      .catch((renderError) => {
        if (active && renderError.name !== 'AbortError') {
          setError(renderError.message || 'Story konnte nicht erzeugt werden.');
        }
      })
      .finally(() => {
        if (active) setRendering(false);
      });
    return () => {
      active = false;
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [authToken, checkinId, imageId, includeAwards, slide]);

  const shareText = useMemo(() => buildCheckinShareText(manifest?.shop_name), [manifest?.shop_name]);

  const handleShare = async () => {
    if (!story) return;
    setSharing(true);
    setError('');
    setNotice('');
    try {
      const result = await shareCheckinStory({ ...story, shopName: manifest.shop_name });
      if (!result.shared) {
        downloadStoryBlob(story.blob, story.filename);
        setNotice('Datei-Sharing wird hier nicht unterstützt. Die Story wurde heruntergeladen.');
      } else {
        setNotice('Story wurde an das Teilen-Menü übergeben. Wähle dort Instagram aus.');
      }
    } catch (shareError) {
      if (shareError?.name !== 'AbortError') {
        setError(shareError.message || 'Teilen wurde nicht abgeschlossen.');
      }
    } finally {
      setSharing(false);
    }
  };

  const handleCopy = async () => {
    try {
      await copyShareText(shareText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError('Begleittext konnte nicht kopiert werden.');
    }
  };

  const content = (
    <ComposerOverlay onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <ComposerModal role="dialog" aria-modal="true" aria-labelledby="checkin-share-title">
        <CloseButton type="button" onClick={onClose} aria-label="Story-Composer schließen">×</CloseButton>
        <Header>
          <Eyebrow>Dein Eis-Moment</Eyebrow>
          <h2 id="checkin-share-title">Story teilen</h2>
          <p>Wähle eine Folie und teile sie über Instagram oder eine andere App.</p>
        </Header>

        {loading ? <Status>Lade deinen Check-in …</Status> : error && !manifest ? <ErrorBox>{error}</ErrorBox> : manifest && (
          <ComposerGrid>
            <PreviewColumn>
              <PreviewFrame>
                {previewUrl && <PreviewImage src={previewUrl} alt={`Story-Vorschau für ${manifest.shop_name}`} />}
                {rendering && <PreviewBusy>Story wird gestaltet …</PreviewBusy>}
              </PreviewFrame>
            </PreviewColumn>

            <Controls>
              <ShopTitle>{manifest.shop_name}</ShopTitle>
              <SlideTabs role="group" aria-label="Story-Folie auswählen">
                {manifest.slides.photo && (
                  <SlideButton type="button" $active={slide === 'photo'} onClick={() => setSlide('photo')}>
                    <ImageIcon size={18} /> Foto
                  </SlideButton>
                )}
                <SlideButton type="button" $active={slide === 'review'} onClick={() => setSlide('review')}>
                  <MapPinned size={18} /> Check-in
                </SlideButton>
              </SlideTabs>

              {slide === 'photo' && manifest.images.length > 1 && (
                <ControlSection>
                  <strong>Foto auswählen</strong>
                  <ThumbnailRow>
                    {manifest.images.map((image) => (
                      <ThumbnailButton key={image.image_id} type="button" $active={Number(imageId) === Number(image.image_id)} onClick={() => setImageId(image.image_id)}>
                        <img src={buildAssetUrl(image.image_url)} alt={image.description || 'Check-in-Foto'} />
                        {Number(imageId) === Number(image.image_id) && <ThumbnailCheck><Check size={14} /></ThumbnailCheck>}
                      </ThumbnailButton>
                    ))}
                  </ThumbnailRow>
                </ControlSection>
              )}

              {slide === 'review' && manifest.awards.length > 0 && (
                <AwardToggle>
                  <input type="checkbox" checked={includeAwards} onChange={(event) => setIncludeAwards(event.target.checked)} />
                  <span><strong>Award-Badge anzeigen</strong><small>{manifest.awards.length} neue Auszeichnung{manifest.awards.length === 1 ? '' : 'en'} bei diesem Check-in</small></span>
                </AwardToggle>
              )}

              {error && <ErrorBox>{error}</ErrorBox>}
              {notice && <NoticeBox>{notice}</NoticeBox>}

              <PrimaryButton type="button" onClick={handleShare} disabled={!story || rendering || sharing}>
                <Share2 size={18} /> {sharing ? 'Öffne Teilen-Menü …' : 'Auf Instagram & mehr teilen'}
              </PrimaryButton>
              <SecondaryActions>
                <SecondaryButton type="button" disabled={!story} onClick={() => story && downloadStoryBlob(story.blob, story.filename)}>
                  <Download size={17} /> PNG laden
                </SecondaryButton>
                <SecondaryButton type="button" onClick={handleCopy}>
                  {copied ? <Check size={17} /> : <Copy size={17} />} {copied ? 'Kopiert' : 'Text kopieren'}
                </SecondaryButton>
              </SecondaryActions>
              <InstagramLink href={INSTAGRAM_PROFILE_URL} target="_blank" rel="noreferrer">
                @ice_app.de öffnen <ExternalLink size={15} />
              </InstagramLink>
              <Hint>Instagram kann Link und Begleittext beim Story-Import ausblenden. Deshalb steht @ice_app.de zusätzlich sichtbar im Bild.</Hint>
            </Controls>
          </ComposerGrid>
        )}
      </ComposerModal>
    </ComposerOverlay>
  );

  return typeof document === 'undefined' ? null : createPortal(content, document.body);
};

export default CheckinShareComposer;

const ComposerOverlay = styled(Overlay)`z-index: 4200; padding: 1rem; box-sizing: border-box;`;
const ComposerModal = styled(Modal)`width: min(960px, 96vw); max-width: 960px; padding: 1.25rem; background: #fffaf0;`;
const Header = styled.header`padding-right: 2.5rem; h2 { margin: .2rem 0 .3rem; font-size: clamp(1.55rem, 4vw, 2.2rem); } p { margin: 0 0 1rem; color: #74532d; }`;
const Eyebrow = styled.div`color: #d77c00; font-size: .74rem; font-weight: 900; letter-spacing: .14em; text-transform: uppercase;`;
const ComposerGrid = styled.div`display: grid; grid-template-columns: minmax(270px, .8fr) minmax(300px, 1.2fr); gap: 1.25rem; align-items: start; @media (max-width: 720px) { grid-template-columns: 1fr; }`;
const PreviewColumn = styled.div`display: grid; place-items: center;`;
const PreviewFrame = styled.div`position: relative; width: min(100%, 330px); aspect-ratio: 9 / 16; overflow: hidden; border-radius: 18px; background: #eadfc9; box-shadow: 0 14px 38px rgba(66, 41, 5, .18);`;
const PreviewImage = styled.img`display: block; width: 100%; height: 100%; object-fit: contain;`;
const PreviewBusy = styled.div`position: absolute; inset: auto 1rem 1rem; padding: .55rem; border-radius: 999px; background: rgba(255,255,255,.94); color: #684000; text-align: center; font-size: .8rem; font-weight: 800;`;
const Controls = styled.div`display: grid; gap: .8rem; align-content: start;`;
const ShopTitle = styled.h3`margin: 0; color: #352207; font-size: 1.18rem;`;
const SlideTabs = styled.div`display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .5rem;`;
const SlideButton = styled.button`display: inline-flex; align-items: center; justify-content: center; gap: .4rem; padding: .75rem; border: 1px solid ${p => p.$active ? '#f0a500' : '#e4cca0'}; border-radius: 12px; background: ${p => p.$active ? '#fff0c4' : '#fff'}; color: #5b3906; font: inherit; font-weight: 800; cursor: pointer;`;
const ControlSection = styled.section`display: grid; gap: .45rem; color: #684b22; font-size: .86rem;`;
const ThumbnailRow = styled.div`display: flex; gap: .5rem; overflow-x: auto; padding-bottom: .25rem;`;
const ThumbnailButton = styled.button`position: relative; flex: 0 0 72px; height: 72px; overflow: hidden; padding: 0; border: 3px solid ${p => p.$active ? '#f0a500' : 'transparent'}; border-radius: 12px; background: #eadfc9; cursor: pointer; img { width: 100%; height: 100%; object-fit: cover; }`;
const ThumbnailCheck = styled.span`position: absolute; right: 4px; bottom: 4px; display: grid; place-items: center; width: 22px; height: 22px; border-radius: 50%; background: #f0a500; color: #fff;`;
const AwardToggle = styled.label`display: flex; align-items: flex-start; gap: .65rem; padding: .75rem; border-radius: 12px; background: #fff0c4; color: #5b3906; cursor: pointer; input { margin-top: .25rem; accent-color: #f0a500; } span { display: grid; gap: .15rem; } small { color: #80643c; }`;
const PrimaryButton = styled.button`display: inline-flex; align-items: center; justify-content: center; gap: .45rem; border: 0; border-radius: 12px; padding: .85rem 1rem; background: #f0a500; color: #fff; font: inherit; font-weight: 900; cursor: pointer; &:disabled { opacity: .55; cursor: wait; }`;
const SecondaryActions = styled.div`display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .5rem;`;
const SecondaryButton = styled.button`display: inline-flex; align-items: center; justify-content: center; gap: .35rem; border: 1px solid #e4cca0; border-radius: 10px; padding: .65rem; background: #fff; color: #704908; font: inherit; font-size: .86rem; font-weight: 800; cursor: pointer; &:disabled { opacity: .5; }`;
const InstagramLink = styled.a`display: inline-flex; align-items: center; justify-content: center; gap: .3rem; color: #c46d00; font-weight: 800; text-decoration: none;`;
const Hint = styled.p`margin: 0; color: #806b4a; font-size: .78rem; line-height: 1.4;`;
const Status = styled.div`padding: 2rem; text-align: center; color: #74532d;`;
const ErrorBox = styled.div`padding: .7rem .85rem; border-radius: 10px; background: #ffe5df; color: #9b2b1f;`;
const NoticeBox = styled.div`padding: .7rem .85rem; border-radius: 10px; background: #e5f6e8; color: #256638;`;
