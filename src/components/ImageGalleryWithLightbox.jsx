import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
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
`;

const ThumbnailWrapper = styled.div`
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

  @media (max-width: 600px) {
    font-size: 2rem;
    padding: 6px 10px;
  }
`;

const CloseButton = styled.button`
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

const ImageGalleryWithLightbox = ({ images, fallbackTitle }) => {
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
    if (e.key === 'ArrowRight') showNext();
    if (e.key === 'ArrowLeft') showPrev();
    if (e.key === 'Escape') setLightboxOpen(false);
  }, [lightboxOpen]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // 📱 Swipe-Handling
  const swipeHandlers = useSwipeable({
    onSwipedLeft: showNext,
    onSwipedRight: showPrev,
    trackMouse: true,
  });

  return (
    <>
      <GalleryWrapper>
        {images.map((img, idx) => (
          <ThumbnailWrapper key={idx} onClick={() => openLightbox(idx)}>
            <ThumbnailImage src={img.url} alt={img.alt || `Bild ${idx + 1}`} />
          </ThumbnailWrapper>
        ))}
      </GalleryWrapper>

      {lightboxOpen && (
        <Modal>
          <LightboxOverlay onClick={() => setLightboxOpen(false)}>
            <LightboxContent {...swipeHandlers} onClick={(e) => e.stopPropagation()}>
              <CloseButton onClick={() => setLightboxOpen(false)}>×</CloseButton>
              <PrevButton onClick={showPrev}>‹</PrevButton>
              <LightboxImage src={images[lightboxIndex].url} alt={images[lightboxIndex].alt || `Bild ${lightboxIndex + 1}`} />
              <NextButton onClick={showNext}>›</NextButton>
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
