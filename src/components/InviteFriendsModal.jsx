import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { Users, Copy, Check, Share2, MessageCircle, X, Sparkles } from 'lucide-react';

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
    from { opacity: 0; }
    to { opacity: 1; }
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

const HeaderBrand = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const HeaderIcon = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: #ffb522;
  color: #231900;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(255, 181, 34, 0.3);
`;

const HeaderText = styled.div`
  display: flex;
  flex-direction: column;
`;

const HeaderTitle = styled.span`
  font-size: 1.05rem;
  font-weight: 800;
  color: #1a1a1a;
  line-height: 1.2;
`;

const HeaderSubtitle = styled.span`
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
`;

const Description = styled.p`
  font-size: 0.9rem;
  color: #374151;
  line-height: 1.45;
  margin: 0 0 1rem 0;
`;

const LinkBox = styled.div`
  display: flex;
  align-items: center;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 6px 6px 6px 12px;
  margin-bottom: 1rem;
`;

const LinkInput = styled.input`
  flex: 1;
  border: none;
  background: transparent;
  font-family: inherit;
  font-size: 0.86rem;
  color: #1f2937;
  outline: none;
  user-select: all;
  min-width: 0;
`;

const CopyButton = styled.button`
  background: ${({ $copied }) => ($copied ? '#10b981' : '#ffb522')};
  color: ${({ $copied }) => ($copied ? '#ffffff' : '#231900')};
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s ease;
  white-space: nowrap;

  &:hover {
    filter: brightness(0.95);
  }
`;

const ActionsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 1.25rem;
`;

const ShareActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  border-radius: 12px;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.15s ease;
  border: none;

  ${({ $variant }) =>
    $variant === 'whatsapp'
      ? `
    background: #25d366;
    color: #ffffff;
    box-shadow: 0 2px 6px rgba(37, 211, 102, 0.25);
    &:hover { background: #20bd5a; }
  `
      : `
    background: #f3f4f6;
    color: #1f2937;
    border: 1px solid #e5e7eb;
    &:hover { background: #e5e7eb; }
  `}
`;

const BonusCard = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #fffbeb;
  border: 1px solid #fef3c7;
  padding: 10px 12px;
  border-radius: 12px;
  font-size: 0.82rem;
  color: #92400e;
  line-height: 1.35;

  svg {
    color: #d97706;
    flex-shrink: 0;
    margin-top: 1px;
  }
`;

const ReferralCounterCard = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  padding: 10px 12px;
  border-radius: 12px;
  font-size: 0.84rem;
  color: #065f46;
  margin-bottom: 1rem;
`;

export default function InviteFriendsModal({
  isOpen,
  onClose,
  inviteCode,
  invitedCount = 0,
  invitedPendingCount = 0,
  onInviteShared,
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://ice-app.de';
  const effectiveCode = inviteCode || 'ice';
  const inviteUrl = `${origin}/register/${effectiveCode}`;
  const shareMessage = `Komm zur Ice-App! Entdecke Eisdielen, Eispreise und Bewertungen in deiner Nähe: ${inviteUrl}`;

  const markShared = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('onboarding_invite_done', '1');
    }
    if (onInviteShared) {
      onInviteShared();
    }
  };

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(inviteUrl);
      } else {
        const input = document.createElement('input');
        input.value = inviteUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      markShared();
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.warn('Copy failed:', e);
    }
  };

  const handleWhatsApp = () => {
    markShared();
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Ice App Einladung',
          text: 'Finde die besten Eisdielen und Preise in deiner Umgebung!',
          url: inviteUrl,
        });
        markShared();
      } catch (e) {
        if (e.name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  return createPortal(
    <ModalOverlay onClick={onClose} aria-modal="true" role="dialog">
      <ModalCard onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <HeaderBrand>
            <HeaderIcon>
              <Users size={20} />
            </HeaderIcon>
            <HeaderText>
              <HeaderTitle>Freunde einladen</HeaderTitle>
              <HeaderSubtitle>Teile deine Begeisterung für Eis</HeaderSubtitle>
            </HeaderText>
          </HeaderBrand>
          <CloseButton onClick={onClose} aria-label="Schließen">
            <X size={18} />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          {(invitedCount > 0 || invitedPendingCount > 0) && (
            <ReferralCounterCard>
              <Check size={18} color="#059669" />
              <div>
                {invitedCount > 0 && (
                  <div>
                    Bisher <strong>{invitedCount} {invitedCount === 1 ? 'Freund' : 'Freunde'}</strong> erfolgreich geworben!
                  </div>
                )}
                {invitedPendingCount > 0 && (
                  <div style={{ fontSize: '0.74rem', color: '#047857', marginTop: '2px' }}>
                    ({invitedPendingCount} weitere Registrierung{invitedPendingCount > 1 ? 'en' : ''} noch unbestätigt)
                  </div>
                )}
              </div>
            </ReferralCounterCard>
          )}

          <Description>
            Lade deine Freunde ein! Für jeden registrierten Freund sammelst du wertvolle{' '}
            <strong>Erfahrungspunkte (EP)</strong> für dein Level in der Ice-App.
          </Description>

          <LinkBox>
            <LinkInput value={inviteUrl} readOnly onClick={(e) => e.target.select()} />
            <CopyButton type="button" onClick={handleCopy} $copied={copied}>
              {copied ? (
                <>
                  <Check size={15} /> Kopiert!
                </>
              ) : (
                <>
                  <Copy size={15} /> Kopieren
                </>
              )}
            </CopyButton>
          </LinkBox>

          <ActionsGrid>
            <ShareActionButton type="button" $variant="whatsapp" onClick={handleWhatsApp}>
              <MessageCircle size={18} />
              <span>WhatsApp</span>
            </ShareActionButton>

            <ShareActionButton type="button" onClick={handleNativeShare}>
              <Share2 size={18} />
              <span>Teilen...</span>
            </ShareActionButton>
          </ActionsGrid>

          <BonusCard>
            <Sparkles size={18} />
            <div>
              <strong>Bonus:</strong> Wenn dein Freund seinen ersten Eis-Check-in macht, erhältst du
              weitere Bonus-Punkte für deine Statistik!
            </div>
          </BonusCard>
        </ModalBody>
      </ModalCard>
    </ModalOverlay>,
    document.body
  );
}

