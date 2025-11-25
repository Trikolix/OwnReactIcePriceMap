import React from 'react';
import * as S from './PhotoChallengeVoting.styles';
import { buildAssetUrl } from './utils';

const ImageLightbox = ({ imagePreview, setImagePreview }) => {
  if (!imagePreview) {
    return null;
  }

  return (
    <S.LightboxOverlay onClick={() => setImagePreview(null)}>
      <S.LightboxCard onClick={(event) => event.stopPropagation()}>
        <S.LightboxCloseRow>
          <S.CloseModalButton type="button" onClick={() => setImagePreview(null)}>
            ×
          </S.CloseModalButton>
        </S.LightboxCloseRow>
        <S.LightboxImage src={buildAssetUrl(imagePreview.url)} alt={imagePreview.label || 'Bild in voller Größe'} />
        {imagePreview.label && <S.LightboxCaption>{imagePreview.label}</S.LightboxCaption>}
      </S.LightboxCard>
    </S.LightboxOverlay>
  )
};

export default ImageLightbox;
