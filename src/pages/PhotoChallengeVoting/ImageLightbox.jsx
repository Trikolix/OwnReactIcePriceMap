import React, { useEffect } from 'react';
import * as S from './PhotoChallengeVoting.styles';
import { buildAssetUrl } from './utils';

const ImageLightbox = ({ imagePreview, setImagePreview }) => {
  useEffect(() => {
    if (!imagePreview) {
      return undefined;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [imagePreview]);

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
