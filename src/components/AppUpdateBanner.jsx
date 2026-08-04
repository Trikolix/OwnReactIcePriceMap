import styled from 'styled-components';
import { useAppVersionCheck } from '../hooks/useAppVersionCheck';

const Fallback = styled.div`
  position: fixed;
  right: 12px;
  bottom: 12px;
  z-index: 4000;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  max-width: min(420px, calc(100vw - 24px));
  padding: 0.65rem 0.75rem;
  border: 1px solid rgba(20, 58, 25, 0.25);
  border-radius: 10px;
  background: #f4fff4;
  color: #143a19;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16);
  font-size: 0.86rem;
`;

const ReloadButton = styled.button`
  flex: 0 0 auto;
  border: 0;
  border-radius: 7px;
  padding: 0.4rem 0.65rem;
  background: #143a19;
  color: #ffffff;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
`;

export default function AppUpdateBanner() {
  const { reloadFailed, reloadNow } = useAppVersionCheck();

  if (!reloadFailed) {
    return null;
  }

  return (
    <Fallback role="status" aria-live="polite">
      <span>Die Aktualisierung konnte nicht automatisch abgeschlossen werden.</span>
      <ReloadButton type="button" onClick={reloadNow}>
        Erneut laden
      </ReloadButton>
    </Fallback>
  );
}
