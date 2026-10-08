import React from 'react';
import styled from 'styled-components';
import { Smartphone } from 'lucide-react';
import { Button, ChallengeDialog } from './ChallengeUI';
import { isIosDevice } from '../hooks/usePwaInstall';

export default function PwaInstallModal({ open, onClose }) {
  const ios = isIosDevice();
  return <ChallengeDialog compact open={open} onClose={onClose} title="Ice-App installieren"
    footer={<Button type="button" onClick={onClose}>Verstanden</Button>}>
    <Instructions><Smartphone size={32} aria-hidden="true" />
      <p>Öffne die Ice-App direkt von deinem Startbildschirm – ohne jedes Mal die Adresse einzugeben.</p>
      {ios ? <ol><li>Öffne <strong>ice-app.de in Safari</strong>.</li>
        <li>Tippe auf <strong>Teilen</strong> und anschließend auf <strong>Zum Home-Bildschirm</strong>.</li>
        <li>Bestätige mit <strong>Hinzufügen</strong> und öffne die Ice-App über das neue Symbol.</li></ol>
        : <ol><li>Öffne <strong>ice-app.de</strong> in Chrome oder Edge.</li>
          <li>Öffne das Browser-Menü und wähle <strong>App installieren</strong> oder <strong>Zum Startbildschirm hinzufügen</strong>.</li>
          <li>Bestätige die Installation und öffne die Ice-App über das neue Symbol.</li></ol>}
      <small>Die Bezeichnung kann je nach Browser abweichen. Du kannst die Ice-App weiterhin im Browser verwenden.</small>
    </Instructions>
  </ChallengeDialog>;
}
const Instructions = styled.div`color: #5a421b; line-height: 1.6; ol { padding-left: 24px; } li + li { margin-top: 12px; } small { color: #756951; }`;
