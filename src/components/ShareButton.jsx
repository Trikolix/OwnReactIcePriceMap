import React, { useState } from 'react';
import styled from 'styled-components';
import { Share2 } from 'lucide-react';

const StyledShareButton = styled.button.attrs({ type: 'button' })`
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: transparent;
  color: #6b6b6b;
  cursor: pointer;
  transition: transform 0.2s;
  position: absolute;
  top: 3px;
  left: 24px;

  &:hover {
    transform: scale(1.1);
  }
  &:focus-visible { outline: 3px solid #986b0e; outline-offset: 3px; }
`;

const ShareIcon = ({ path, title = 'Link teilen', text = 'Schau dir das mal an!', onFeedback }) => {
  const [busy, setBusy] = useState(false);
  const shareUrl = `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`;

  const handleShare = async () => {
    if (busy) return;
    setBusy(true);
    onFeedback?.(null);
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        onFeedback?.({ message: 'Link kopiert.', error: false });
      }
    } catch (error) {
      if (error.name !== 'AbortError') onFeedback?.({ message: 'Du kannst den Link zum Teilen hier kopieren:', error: true, url: shareUrl });
    } finally {
      setBusy(false);
    }
  };

  return <StyledShareButton onClick={handleShare} disabled={busy} title="Eisdiele teilen" aria-label="Eisdiele teilen"><Share2 size={20} aria-hidden="true" /></StyledShareButton>;
};

export default ShareIcon;
