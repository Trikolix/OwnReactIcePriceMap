import React from 'react';
import styled from 'styled-components';
import { CheckCircle2, X } from 'lucide-react';
import { Button } from '../../components/ChallengeUI';

export default function QuestProgressNotice({ notification, onOpen, onDismiss }) {
  return <Live aria-live="polite" aria-atomic="true">{notification && <Toast data-testid="quest-progress-notice">
    <CheckCircle2 size={23} aria-hidden="true" /><div><strong>{notification.title}</strong><p>{notification.message}</p>
      <Button type="button" $secondary onClick={onOpen}>Kapitel ansehen</Button></div>
    <Button type="button" $secondary onClick={onDismiss} aria-label="Fortschrittshinweis schließen"><X size={18} aria-hidden="true" /></Button>
  </Toast>}</Live>;
}
const Live = styled.div`position: fixed; z-index: 1600; left: max(12px, env(safe-area-inset-left)); right: max(12px, env(safe-area-inset-right)); bottom: max(20px, env(safe-area-inset-bottom)); pointer-events: none; display: flex; justify-content: center;`;
const Toast = styled.div`pointer-events: auto; width: 100%; max-width: 420px; display: flex; align-items: flex-start; gap: 10px; background: #fffdf8; color: #3f4e28; border: 1px solid #cbd8b9; border-radius: 16px; padding: 14px; box-shadow: 0 8px 30px #241b0029; > svg { flex-shrink: 0; margin-top: 3px; } > div { flex: 1; min-width: 0; } strong { font-size: 14px; } p { margin: 4px 0 10px; font-size: 14px; line-height: 1.4; overflow-wrap: anywhere; } > button { padding: 8px; }`;
