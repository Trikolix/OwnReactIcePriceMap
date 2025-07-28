import React from "react";
import styled from "styled-components";

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 1001;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalBox = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
  text-align: center;
`;

const Icon = styled.img`
  width: 150px;
  height: 150px;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: bold;
  color: #3b0764;
  margin-bottom: 0.5rem;
`;

const Description = styled.p`
  font-size: 0.95rem;
  color: #333;
  margin-bottom: 1.5rem;
`;

const StatusMessage = styled.p`
  font-size: 0.9rem;
  font-weight: 500;
  color: ${(props) => (props.$needsLogin ? "#b91c1c" : "#047857")};
`;

const CloseButton = styled.button`
  margin-top: 1.5rem;
  padding: 0.6rem 1.2rem;
  background-color: #7e22ce;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background-color: #6b21a8;
  }
`;

export default function QrScanModal({ open, onClose, data, needsLogin }) {
  if (!open || !data) return null;

  return (
    <Overlay>
      <ModalBox>
        <Icon src={`https://ice-app.de/${data.icon}`} alt={data.name} />
        <Title>{data.name}</Title>
        <Description>{data.description}</Description>
        <StatusMessage $needsLogin={needsLogin}>
          {needsLogin
            ? "Bitte logge dich ein oder registriere dich, um den Scan zu speichern."
            : "Scan erfolgreich gespeichert!"}
        </StatusMessage>
        <CloseButton onClick={onClose}>Schließen</CloseButton>
      </ModalBox>
    </Overlay>
  );
}
