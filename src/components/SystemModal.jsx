// SystemModal.js
import React from "react";
import { Dialog } from "@headlessui/react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import { Overlay as SharedOverlay, Button as SharedButton } from '../styles/SharedStyles';

function SystemModal({ isOpen, onClose, title, message }) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <Dialog open={isOpen} onClose={onClose}>
        <SharedOverlay aria-hidden="true" />
        <Wrapper>
          <Dialog.Panel as={Panel}>
            <Dialog.Title as={Title}>{title}</Dialog.Title>
            <Dialog.Description as={Description}>{message}</Dialog.Description>

            <ButtonRow>
              <SharedButton onClick={onClose}>Verstanden</SharedButton>
            </ButtonRow>
          </Dialog.Panel>
        </Wrapper>
      </Dialog>,
    document.body
  );
}

export default SystemModal;

// Styled Components

// uses SharedOverlay from SharedStyles

const Wrapper = styled.div`
  --modal-viewport-gap: 1rem;
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  padding: var(--modal-viewport-gap);
  overflow: hidden;
  z-index: 9999;

  @media (min-width: 640px) {
    --modal-viewport-gap: 1.5rem;
  }
`;

const Panel = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  max-width: 420px;
  width: 100%;
  box-sizing: border-box;
  max-height: calc(100vh - (var(--modal-viewport-gap) * 2));
  max-height: calc(100dvh - (var(--modal-viewport-gap) * 2));
  overflow-y: auto;
  padding: 24px;
  z-index: 10000;
`;

const Title = styled.h2`
  font-size: 1.25rem;
  font-weight: bold;
  margin: 0;
`;

const Description = styled.p`
  margin-top: 12px;
  color: #555;
  font-size: 0.95rem;
  line-height: 1.4;
  white-space: pre-line;
`;

const ButtonRow = styled.div`
  margin-top: 20px;
  display: flex;
  justify-content: center;
`;

// uses SharedButton
