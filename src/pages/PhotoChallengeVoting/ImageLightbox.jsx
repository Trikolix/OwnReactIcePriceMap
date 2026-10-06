import React from 'react';
import styled from 'styled-components';
import { ChallengeDialog } from '../../components/ChallengeUI';
import { buildAssetUrl } from './utils';
const Image = styled.img`display: block; width: 100%; max-height: 75dvh; object-fit: contain;`;
export default function ImageLightbox({ imagePreview, setImagePreview }) {
  const close = () => {
    const trigger = imagePreview?.returnFocusTo;
    setImagePreview(null);
    // Restore the originating image button after the parent dialog regains its focus trap.
    if (trigger) requestAnimationFrame(() => requestAnimationFrame(() => { if (trigger.isConnected) trigger.focus({ preventScroll: true }); }));
  };
  return <ChallengeDialog open={Boolean(imagePreview)} title={imagePreview?.label || 'Foto ansehen'} onClose={close} wide>
    {imagePreview && <Image src={buildAssetUrl(imagePreview.url)} alt={imagePreview.label || 'Foto in voller Größe'} />}
  </ChallengeDialog>;
}
