import React from 'react';
import styled from 'styled-components';
import { Overlay as SharedOverlay, Button as SharedButton } from '../styles/SharedStyles';

const ImageChooserModal = ({ onClose, onChooseCamera, onChooseGallery }) => {
  return (
    <SharedOverlay>
      <Dialog>
        <Title>Bildquelle wählen</Title>
        <Text>Wähle, ob du ein Foto aufnehmen oder aus der Galerie auswählen möchtest.</Text>
        <ButtonRow>
          <SharedButton onClick={() => { onChooseCamera(); onClose(); }}>Kamera</SharedButton>
          <SharedButton onClick={() => { onChooseGallery(); onClose(); }}>Galerie</SharedButton>
        </ButtonRow>
        <Cancel onClick={onClose}>Abbrechen</Cancel>
      </Dialog>
    </SharedOverlay>
  );
};

export default ImageChooserModal;

const Dialog = styled.div`
  background: white;
  padding: 1rem;
  border-radius: 12px;
  width: 90%;
  max-width: 360px;
  text-align: center;
`;

const Title = styled.h3`
  margin-top: 0;
`;

const Text = styled.p`
  color: #444;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin: 0.5rem 0;
`;

const ActionButton = styled.button`
  background: #ffb522;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: bold;
`;

const Cancel = styled.button`
  margin-top: 0.5rem;
  background: transparent;
  border: none;
  color: #666;
  cursor: pointer;
`;
