import { useState } from 'react';
import styled from 'styled-components';
import { useAppVersionCheck } from '../hooks/useAppVersionCheck';

const Banner = styled.div`
  position: fixed;
  left: 12px;
  right: 12px;
  bottom: 12px;
  z-index: 4000;
  background: #143a19;
  color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
  padding: 0.8rem 0.9rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const PrimaryButton = styled.button`
  border: none;
  border-radius: 8px;
  padding: 0.45rem 0.8rem;
  font-weight: 700;
  cursor: pointer;
  background: #ffcc35;
  color: #2d2100;
`;

const GhostButton = styled.button`
  border: 1px solid rgba(255, 255, 255, 0.45);
  border-radius: 8px;
  padding: 0.45rem 0.8rem;
  background: transparent;
  color: #ffffff;
  cursor: pointer;
`;

export default function AppUpdateBanner() {
  const { updateAvailable, remoteInfo } = useAppVersionCheck();
  const [dismissed, setDismissed] = useState(false);

  if (!updateAvailable || dismissed) {
    return null;
  }

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <Banner role="status" aria-live="polite">
      <div>
        <strong>Neue Version verfügbar</strong>
        <div style={{ fontSize: '0.9rem', opacity: 0.95 }}>
          Die App wurde aktualisiert{remoteInfo?.appVersion ? ` (v${remoteInfo.appVersion})` : ''}. Lade neu, um die neueste Version zu nutzen.
        </div>
      </div>
      <Actions>
        <PrimaryButton onClick={handleReload}>Jetzt aktualisieren</PrimaryButton>
        <GhostButton onClick={() => setDismissed(true)}>Später</GhostButton>
      </Actions>
    </Banner>
  );
}
