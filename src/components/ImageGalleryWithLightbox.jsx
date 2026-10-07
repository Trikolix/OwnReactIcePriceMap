import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled, { css } from 'styled-components';
import { useSwipeable } from 'react-swipeable';
import { Modal } from "./Modal";


// Styled Components
const GalleryWrapper = styled.div`
  display: flex;
  overflow-x: auto;
  gap: 8px;
  padding-bottom: 8px;
  width: 100%;

  @media (min-width: 768px) {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(96px, 1fr));
    gap: 8px;
    overflow: visible;
    padding-bottom: 0;
  }

  @media (min-width: 1200px) {
    grid-template-columns: repeat(auto-fit, minmax(108px, 1fr));
  }
  ${({ $large }) => $large && css`
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    overflow: visible;
    > button { width: 100%; height: auto; aspect-ratio: 1; }
    > button:first-child { grid-column: 1 / -1; aspect-ratio: 4 / 3; }
    @media (min-width: 768px) { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  `}
`;

const ThumbnailWrapper = styled.button.attrs({ type: 'button' })`
  padding: 0;
  flex: 0 0 auto;
  width: 100px;
  height: 100px;
  overflow: hidden;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid rgba(47, 33, 0, 0.08);
  background: rgba(255, 255, 255, 0.9);

  @media (min-width: 768px) {
    width: 100%;
    height: auto;
    aspect-ratio: 1 / 1;
    border-radius: 10px;
  }
`;

const ThumbnailImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.2s ease;

  ${ThumbnailWrapper}:hover & {
    transform: scale(1.03);
  }
`;

const LightboxOverlay = styled.div`
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const LightboxContent = styled.div`
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  text-align: center;
`;

const LightboxImage = styled.img`
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
`;

const LightboxTitle = styled.div`
  margin-top: 16px;
  color: white;
  font-size: 1rem;
`;

const NavButton = styled.button`
  min-width: 44px;
  min-height: 44px;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-size: 2.5rem;
  color: white;
  background: rgba(0, 0, 0, 0.4);
  border: none;
  cursor: pointer;
  padding: 8px 12px;
  z-index: 1;

  &:hover {
    background: rgba(0, 0, 0, 0.6);
  }
  &:focus-visible { outline: 3px solid #ffb522; outline-offset: 3px; }

  @media (max-width: 600px) {
    font-size: 2rem;
    padding: 6px 10px;
  }
`;

const CloseButton = styled.button`
  min-width: 44px;
  min-height: 44px;
  position: fixed;
  top: 16px;
  right: 16px;
  background: transparent;
  color: white;
  font-size: 2rem;
  border: none;
  cursor: pointer;
  z-index: 1001;

  &:hover {
    color: #ccc;
  }
  &:focus-visible { outline: 3px solid #ffb522; outline-offset: 3px; }
`;

const PrevButton = styled(NavButton)`
  left: 8px;

  @media (max-width: 600px) {
    left: 4px;
  }
`;

const NextButton = styled(NavButton)`
  right: 8px;

  @media (max-width: 600px) {
    right: 4px;
  }
`;

const ImageGalleryWithLightbox = ({ images = [], fallbackTitle, large = false }) => {
  const lightboxRef = useRef(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const showPrev = () => {
    setLightboxIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const showNext = () => {
    setLightboxIndex((prev) => (prev + 1) % images.length);
  };

  // ⌨️ Tastatursteuerung
  const handleKeyDown = useCallback((e) => {
    if (!lightboxOpen) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); setLightboxIndex(prev => (prev + 1) % images.length); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); setLightboxIndex(prev => (prev - 1 + images.length) % images.length); }
    if (e.key === 'Escape') setLightboxOpen(false);
    if (e.key === 'Tab') {
      const controls = [...(lightboxRef.current?.querySelectorAll('button') || [])];
      const first = controls[0], last = controls.at(-1);
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }, [lightboxOpen, images.length]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const previous = document.activeElement;
    lightboxRef.current?.querySelector('button')?.focus();
    return () => { if (previous?.isConnected) previous.focus(); };
  }, [lightboxOpen]);

  // 📱 Swipe-Handling
  const swipeHandlers = useSwipeable({
    onSwipedLeft: showNext,
    onSwipedRight: showPrev,
    trackMouse: true,
  });

  return (
    <>
      <GalleryWrapper $large={large}>
        {images.map((img, idx) => (
          <ThumbnailWrapper key={idx} onClick={() => openLightbox(idx)} aria-label={`Foto ${idx + 1} öffnen`}>
            <ThumbnailImage src={img.url} alt={img.alt || `Bild ${idx + 1}`} />
          </ThumbnailWrapper>
        ))}
      </GalleryWrapper>

      {lightboxOpen && (
        <Modal onClose={() => setLightboxOpen(false)}>
          <LightboxOverlay onClick={() => setLightboxOpen(false)}>
            <LightboxContent {...swipeHandlers} ref={node => { lightboxRef.current = node; swipeHandlers.ref(node); }} role="dialog" aria-modal="true" aria-label={fallbackTitle || "Fotogalerie"} onClick={(e) => e.stopPropagation()}>
              <CloseButton onClick={() => setLightboxOpen(false)} aria-label="Fotogalerie schließen">×</CloseButton>
              <PrevButton onClick={showPrev} aria-label="Vorheriges Foto">‹</PrevButton>
              <LightboxImage src={images[lightboxIndex].url} alt={images[lightboxIndex].alt || `Bild ${lightboxIndex + 1}`} />
              <NextButton onClick={showNext} aria-label="Nächstes Foto">›</NextButton>
              <LightboxTitle>
                {images[lightboxIndex].beschreibung || fallbackTitle}
              </LightboxTitle>
            </LightboxContent>
          </LightboxOverlay>
        </Modal>
      )}
    </>
  );
};

export default ImageGalleryWithLightbox;
