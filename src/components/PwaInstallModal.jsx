import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { Share, PlusSquare, CheckCircle2, X, Download, Smartphone } from 'lucide-react';
import { isIosDevice } from '../hooks/usePwaInstall';

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 99999;
  padding: 1rem;
  box-sizing: border-box;
  animation: pwaFadeIn 0.2s ease-out;

  @keyframes pwaFadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const ModalCard = styled.div`
  background: #ffffff;
  width: 100%;
  max-width: 440px;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  animation: pwaSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);

  @keyframes pwaSlideUp {
    from {
      transform: translateY(20px) scale(0.97);
      opacity: 0;
    }
    to {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
  }
`;

const ModalHeader = styled.div`
  padding: 1.25rem 1.25rem 0.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #f0f0f0;
`;

const AppBrand = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const AppIcon = styled.img`
  width: 38px;
  height: 38px;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
`;

const AppBrandText = styled.div`
  display: flex;
  flex-direction: column;
`;

const AppBrandTitle = styled.span`
  font-size: 1.05rem;
  font-weight: 800;
  color: #1a1a1a;
  line-height: 1.2;
`;

const AppBrandSubtitle = styled.span`
  font-size: 0.76rem;
  color: #666;
`;

const CloseButton = styled.button`
  background: #f3f4f6;
  border: none;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: #e5e7eb;
    color: #111827;
  }
`;

const ModalBody = styled.div`
  padding: 1.25rem;
  max-height: min(70vh, 520px);
  overflow-y: auto;
`;

const InstructionsTitle = styled.h3`
  font-size: 1.15rem;
  font-weight: 800;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
`;

const InstructionsDescription = styled.p`
  font-size: 0.88rem;
  color: #4b5563;
  line-height: 1.45;
  margin: 0 0 1.2rem 0;
`;

const StepList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  margin-bottom: 1.25rem;
`;

const StepItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: #f9fafb;
  border: 1px solid #f0f2f5;
  padding: 10px 12px;
  border-radius: 12px;
`;

const StepBadge = styled.div`
  background: #ffb522;
  color: #231900;
  font-size: 0.85rem;
  font-weight: 800;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
`;

const StepText = styled.div`
  font-size: 0.88rem;
  color: #1f2937;
  line-height: 1.4;

  strong {
    color: #111827;
  }

  .icon-inline {
    display: inline-flex;
    align-items: center;
    vertical-align: text-bottom;
    margin: 0 3px;
    color: #0277bd;
  }
`;

const BenefitGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  background: #fffbeb;
  border: 1px solid #fef3c7;
  padding: 10px 12px;
  border-radius: 12px;
  margin-bottom: 1.25rem;
`;

const BenefitItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  color: #92400e;
  font-weight: 600;

  svg {
    color: #d97706;
    flex-shrink: 0;
  }
`;

const ModalFooter = styled.div`
  padding: 0.75rem 1.25rem 1.25rem;
  display: flex;
  gap: 10px;
`;

const ConfirmButton = styled.button`
  flex: 1;
  background: #ffb522;
  color: #231900;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 800;
  border: none;
  padding: 0.8rem 1rem;
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.15s ease, transform 0.1s ease;
  box-shadow: 0 4px 10px rgba(255, 181, 34, 0.35);

  &:hover {
    background: #e5a015;
  }

  &:active {
    transform: scale(0.98);
  }
`;

export default function PwaInstallModal({ isOpen, onClose }) {
  const isIos = isIosDevice();

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <ModalOverlay onClick={onClose} aria-modal="true" role="dialog">
      <ModalCard onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <AppBrand>
            <AppIcon src="/favicon.ico" alt="Ice App Icon" />
            <AppBrandText>
              <AppBrandTitle>Ice App</AppBrandTitle>
              <AppBrandSubtitle>Web-App für deinen Startbildschirm</AppBrandSubtitle>
            </AppBrandText>
          </AppBrand>
          <CloseButton onClick={onClose} aria-label="Schließen">
            <X size={18} />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          {isIos ? (
            <>
              <InstructionsTitle>Auf dem Home-Bildschirm installieren</InstructionsTitle>
              <InstructionsDescription>
                Füge die Ice App in Safari mit 3 schnellen Schritten zu deinem iPhone oder iPad hinzu:
              </InstructionsDescription>

              <StepList>
                <StepItem>
                  <StepBadge>1</StepBadge>
                  <StepText>
                    Tippe unten in der Safari-Leiste auf das <strong>Teilen-Symbol</strong>{' '}
                    <span className="icon-inline">
                      <Share size={18} />
                    </span>
                    .<br />
                    <small style={{ color: '#6b7280' }}>
                      (Beim iPad befindet sich das Symbol oben rechts)
                    </small>
                  </StepText>
                </StepItem>

                <StepItem>
                  <StepBadge>2</StepBadge>
                  <StepText>
                    Scrolle in den Optionen etwas nach unten und wähle{' '}
                    <strong>„Zum Home-Bildschirm“</strong>{' '}
                    <span className="icon-inline">
                      <PlusSquare size={18} />
                    </span>
                    .
                  </StepText>
                </StepItem>

                <StepItem>
                  <StepBadge>3</StepBadge>
                  <StepText>
                    Tippe oben rechts auf <strong>„Hinzufügen“</strong>. Fertig! 🍦
                  </StepText>
                </StepItem>
              </StepList>
            </>
          ) : (
            <>
              <InstructionsTitle>App zum Startbildschirm hinzufügen</InstructionsTitle>
              <InstructionsDescription>
                Nutze die Ice App wie eine native App direkt von deinem Desktop oder Smartphone:
              </InstructionsDescription>

              <StepList>
                <StepItem>
                  <StepBadge>1</StepBadge>
                  <StepText>
                    Öffne das <strong>Browser-Menü</strong> (die 3 Punkte oben oder unten rechts).
                  </StepText>
                </StepItem>

                <StepItem>
                  <StepBadge>2</StepBadge>
                  <StepText>
                    Wähle <strong>„App installieren“</strong> oder <strong>„Zum Startbildschirm hinzufügen“</strong>.
                  </StepText>
                </StepItem>

                <StepItem>
                  <StepBadge>3</StepBadge>
                  <StepText>
                    Bestätige die Installation. Die Ice App wird sofort hinzugefügt!
                  </StepText>
                </StepItem>
              </StepList>
            </>
          )}

          <BenefitGrid>
            <BenefitItem>
              <CheckCircle2 size={16} />
              <span>Direkter Start ohne Browser-URL-Leiste</span>
            </BenefitItem>
            <BenefitItem>
              <CheckCircle2 size={16} />
              <span>Optimierte Kartenansicht im Vollbild</span>
            </BenefitItem>
            <BenefitItem>
              <CheckCircle2 size={16} />
              <span>Sofortiger Zugriff auf Favoriten &amp; Check-ins</span>
            </BenefitItem>
          </BenefitGrid>
        </ModalBody>

        <ModalFooter>
          <ConfirmButton onClick={onClose}>Alles klar!</ConfirmButton>
        </ModalFooter>
      </ModalCard>
    </ModalOverlay>,
    document.body
  );
}

