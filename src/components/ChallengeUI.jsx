import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { X } from 'lucide-react';

export const Page = styled.main`
  width: 100%; max-width: ${p => p.$wide ? 1440 : 1200}px; margin: 0 auto;
  padding: clamp(16px, 3vw, 32px); box-sizing: border-box; color: #2f2100;
  *, *::before, *::after { box-sizing: border-box; }
  h1, h2, h3, h4 { text-align: left; text-shadow: none; color: #2f2100; overflow-wrap: anywhere; }
  h1 { font-size: clamp(26px, 4vw, 36px); margin: 0; line-height: 1.2; }
  h2 { font-size: 21px; margin: 0; } h3 { margin: 0; font-size: 18px; }
  input, textarea, select { font-size: 16px; max-width: 100%; }
`;
export const PageHeading = styled.div`
  display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 24px;
  p { margin: 8px 0 0; color: #72664e; line-height: 1.5; }
  @media(max-width: 767px) { align-items: stretch; flex-direction: column; }
`;
export const Card = styled.section`
  min-width: 0; padding: clamp(16px, 2vw, 24px); background: #fffdf8;
  border: 1px solid #eadfc9; border-radius: 18px;
`;
export const Button = styled.button`
  display: inline-flex; justify-content: center; align-items: center; gap: 8px;
  min-height: 44px; min-width: 44px; padding: 10px 16px; border-radius: 12px;
  border: 1px solid ${p => p.$secondary ? '#e0d3ba' : '#edaa16'};
  background: ${p => p.$secondary ? '#fffdf8' : '#ffbe35'}; color: #2f2100;
  font: inherit; font-size: 15px; font-weight: 750; cursor: pointer; text-decoration: none;
  text-align: center; line-height: 1.4;
  &:hover:not(:disabled) { background: ${p => p.$secondary ? '#fff3d9' : '#ffca55'}; }
  &:focus-visible { outline: 3px solid #835500; outline-offset: 3px; }
  &:disabled { opacity: .55; cursor: wait; }
`;
export const ActionRow = styled.div`
  display: flex; align-items: center; flex-wrap: wrap; gap: 10px;
`;
export const Field = styled.label`
  display: grid; gap: 8px; font-weight: 700; min-width: 0;
  input:not([type=checkbox]), select, textarea { width: 100%; min-height: 44px; border: 1px solid #d9cdb6;
    border-radius: 10px; padding: 10px 12px; background: #fff; color: #2f2100; font: inherit; font-size: 16px; }
  textarea { min-height: 100px; resize: vertical; }
  input:focus-visible, textarea:focus-visible, select:focus-visible { outline: 3px solid #f6c052; outline-offset: 2px; }
  small { font-weight: 400; color: #756951; line-height: 1.5; }
`;
export const Notice = styled.div`
  margin: 12px 0; padding: 12px 16px; border-radius: 12px; line-height: 1.5; overflow-wrap: anywhere;
  background: ${p => p.$error ? '#fff0eb' : '#f4f5e9'}; color: ${p => p.$error ? '#8e3528' : '#4c5c31'};
`;
export const Stack = styled.div`display: grid; gap: 20px; min-width: 0;`;
export const Disclosure = styled.details`
  border: 1px solid #eadfc9; border-radius: 14px; padding: 0 16px; background: #fffdf8;
  summary { min-height: 44px; display: list-item; align-content: center; cursor: pointer; padding: 12px 0; font-weight: 700; }
  summary:focus-visible { outline: 3px solid #835500; outline-offset: 2px; }
  > :not(summary) { margin-bottom: 16px; } p, li { line-height: 1.6; }
`;
const ModalRoot = styled(Dialog)`position: fixed; inset: 0; z-index: 1800;`;
const Backdrop = styled.div`position: fixed; inset: 0; background: #2f210065;`;
const ModalPosition = styled.div`
  position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; padding: 24px;
  @media(max-width: 767px) { padding: ${p => p.$compact ? '12px' : '0'}; align-items: ${p => p.$compact ? 'flex-end' : 'center'}; }
`;
const Panel = styled(DialogPanel)`
  width: 100%; max-width: ${p => p.$compact ? 560 : p.$wide ? 1000 : 720}px; max-height: calc(100dvh - 48px);
  display: flex; flex-direction: column; background: #fffaf0; color: #2f2100; border-radius: 20px; overflow: hidden;
  box-shadow: 0 20px 70px #241b0033; font-family: inherit;
  *, *::before, *::after { box-sizing: border-box; }
  h1, h2, h3, h4 { text-align: left; text-shadow: none; overflow-wrap: anywhere; }
  input, select, textarea { font-size: 16px; }
  @media(max-width: 767px) {
    max-width: none; height: ${p => p.$compact ? 'auto' : '100dvh'};
    max-height: ${p => p.$compact ? 'calc(100dvh - 24px)' : '100dvh'}; border-radius: ${p => p.$compact ? '20px' : '0'};
  }
`;
const ModalHead = styled.div`
  display: flex; flex-shrink: 0; align-items: center; justify-content: space-between; gap: 12px;
  padding: max(12px, env(safe-area-inset-top)) 20px 12px; border-bottom: 1px solid #eadfc9;
  h2 { margin: 0; font-size: 21px; line-height: 1.3; }
`;
const ModalBody = styled.div`min-height: 0; overflow: auto; padding: 20px; overscroll-behavior: contain;`;
const ModalFoot = styled.div`
  padding: 12px 20px max(12px, env(safe-area-inset-bottom)); border-top: 1px solid #eadfc9; flex-shrink: 0;
  display: flex; gap: 10px; justify-content: space-between; flex-wrap: wrap; background: #fffdf8;
`;
export function ChallengeDialog({ open, onClose, title, children, footer, busy = false, wide = false, compact = false }) {
  const closeRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const frame = requestAnimationFrame(() => closeRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);
  return <ModalRoot open={open} onClose={() => { if (!busy) onClose(); }} initialFocus={closeRef}>
    <Backdrop aria-hidden="true" />
    <ModalPosition $compact={compact}><Panel $wide={wide} $compact={compact}>
      <ModalHead><DialogTitle as="h2">{title}</DialogTitle>
        <Button ref={closeRef} $secondary aria-label="Dialog schließen" disabled={busy} onClick={onClose}><X size={22} aria-hidden="true" /></Button>
      </ModalHead>
      <ModalBody>{children}</ModalBody>
      {footer && <ModalFoot>{footer}</ModalFoot>}
    </Panel></ModalPosition>
  </ModalRoot>;
}
