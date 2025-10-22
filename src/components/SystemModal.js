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
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 9999;
`;

const Panel = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  max-width: 420px;
  width: 100%;
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
