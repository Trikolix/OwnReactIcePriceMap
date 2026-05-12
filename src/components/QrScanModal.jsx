import React from "react";
import styled from "styled-components";
import { Overlay, Modal as SharedModal, Button as PrimaryButton } from '../styles/SharedStyles';
import { buildAssetUrl } from '../utils/assets.jsx';


const ModalBox = styled(SharedModal)`
  max-width: 420px;
  padding: 2rem;
  border-radius: 1rem;
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
  margin-bottom: 1rem;
  line-height: 1.45;
`;

const StatusMessage = styled.p`
  font-size: 0.9rem;
  font-weight: 500;
  color: ${(props) => (props.$needsLogin ? "#b91c1c" : "#047857")};
`;

const ActionRow = styled.div`
  display: grid;
  gap: 0.55rem;
  margin-top: 1.2rem;
`;

const CloseButton = styled(PrimaryButton)`
  background-color: #7e22ce;
  &:hover { background-color: #6b21a8; }
`;

const SecondaryButton = styled.button`
  border: 1px solid #d6c7e8;
  border-radius: 10px;
  background: #ffffff;
  color: #4c1d95;
  padding: 0.7rem 1rem;
  font-weight: 800;
  cursor: pointer;
`;

export default function QrScanModal({ open, onClose, onPrimaryAction, data, needsLogin }) {
  if (!open || !data) return null;

  const iconSrc = data.icon ? buildAssetUrl(data.icon) : null;
  const primaryLabel = data.primaryActionLabel || (needsLogin ? "Einloggen / Registrieren" : "Schließen");

  return (
    <Overlay>
      <ModalBox>
        {iconSrc && <Icon src={iconSrc} alt={data.name} />}
        <Title>{data.name}</Title>
        <Description>{data.description}</Description>
        <StatusMessage $needsLogin={needsLogin}>
          {data.statusMessage || (needsLogin
            ? "Bitte logge dich ein oder registriere dich, um den Scan zu speichern."
            : "Scan erfolgreich gespeichert!")}
        </StatusMessage>
        <ActionRow>
          <CloseButton onClick={onPrimaryAction || onClose}>{primaryLabel}</CloseButton>
          <SecondaryButton type="button" onClick={onClose}>{data.secondaryActionLabel || "Schließen"}</SecondaryButton>
        </ActionRow>
      </ModalBox>
    </Overlay>
  );
}
