import React from 'react';
import styled from 'styled-components';
import { Share2 } from 'lucide-react';

const StyledShareIcon = styled(Share2)`
  width: 20px;
  height: 20px;
  color: #6b6b6b;
  cursor: pointer;
  transition: transform 0.2s;
  position: absolute;
  top: 15px;
  left: 36px;

  &:hover {
    transform: scale(1.1);
  }
`;

const ShareIcon = ({ path, title = 'Link teilen', text = 'Schau dir das mal an!' }) => {
  const shareUrl = `${window.location.origin}/#${path.startsWith('/') ? path : `/${path}`}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
      } catch (error) {
        console.error('Teilen abgebrochen oder fehlgeschlagen', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link wurde in die Zwischenablage kopiert!');
      } catch (err) {
        console.error('Kopieren fehlgeschlagen', err);
      }
    }
  };

  return <StyledShareIcon onClick={handleShare} title="Teilen" />;
};

export default ShareIcon;
