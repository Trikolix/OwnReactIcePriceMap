import styled from 'styled-components';

// Badge for Advancer
export const AdvancerBadge = styled.span`
  display: inline-block;
  background: #2ecc40;
  color: #fff;
  font-size: 0.85em;
  font-weight: bold;
  border-radius: 12px;
  padding: 2px 10px;
  margin-left: 8px;
  margin-top: 4px;
`;

// Badge for Lucky Loser
export const LuckyLoserBadge = styled.span`
  display: inline-block;
  background: #f39c12;
  color: #fff;
  font-size: 0.85em;
  font-weight: bold;
  border-radius: 12px;
  padding: 2px 10px;
  margin-left: 8px;
  margin-top: 4px;
`;

export const FullPage = styled.div`
  min-height: 100vh;
  background: #fefaf3;
`;

export const Content = styled.main`
  max-width: 1100px;
  margin: 0 auto;
  padding: 1rem;
`;

export const HeroSection = styled.header`
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-direction: column;

  h1 {
    margin: 0;
    font-size: 2rem;
  }

  p {
    margin: 0.2rem 0 0;
    color: #6a6381;
  }
`;

export const HeroDescription = styled.p`
  margin: 0.2rem 0 0;
  color: #6a6381;
  white-space: pre-line;
`;

export const WarningBox = styled.div`
  background: #fff1e6;
  border: 1px solid #ffd7ba;
  padding: 0.8rem 1rem;
  border-radius: 12px;
  margin-bottom: 1rem;
  color: #8f3d00;
`;

export const ActionMessage = styled.div`
  background: #e5fff4;
  border: 1px solid #6de0bb;
  color: #046747;
  padding: 0.75rem 1rem;
  border-radius: 999px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;

  button {
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 1.1rem;
    color: inherit;
  }
`;

export const PhaseSlider = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  justify-content: center;
`;

export const PhasePill = styled.button`
  border: 1px solid ${({ $active }) => ($active ? '#ffb522' : '#e5e7f0')};
  border-radius: 999px;
  padding: 0.6rem 1.2rem;
  background: ${({ $active }) => ($active ? '#fff3d4' : '#fff')};
  color: ${({ $active }) => ($active ? '#a55a00' : '#5b5f75')};
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
  font-weight: 600;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, background 0.18s ease, color 0.18s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 10px 24px rgba(255, 181, 34, 0.18);
    border-color: #ffb522;
  }
`;

export const AwardOverlay = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 1400;
  background: rgba(14, 17, 42, 0.42);

  @media (max-width: 720px) {
    padding: 0.75rem;
  }
`;

export const AwardOverlayCard = styled.div`
  position: relative;
  width: min(92vw, 760px);
  max-height: calc(100vh - 2rem);
  max-height: calc(100dvh - 2rem);
  overflow: auto;
  background: rgba(255, 255, 255, 0.985);
  border: 1px solid rgba(255, 181, 34, 0.35);
  border-radius: 24px;
  padding: 1rem 1.25rem;
  box-shadow: 0 24px 60px rgba(15, 18, 63, 0.24);

  @media (max-width: 720px) {
    width: calc(100vw - 1rem);
    max-height: calc(100vh - 1.5rem);
    max-height: calc(100dvh - 1.5rem);
    padding: 0.85rem 1rem;
    border-radius: 20px;
  }
`;

export const AwardOverlayClose = styled.button`
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  width: 2.4rem;
  height: 2.4rem;
  border: none;
  border-radius: 999px;
  background: rgba(15, 18, 32, 0.08);
  color: #343248;
  font-size: 1.35rem;
  line-height: 1;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.18s ease, transform 0.18s ease;

  &:hover {
    background: rgba(15, 18, 32, 0.14);
    transform: scale(1.03);
  }
`;

export const GroupsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
`;

export const GroupCard = styled.button`
  background: linear-gradient(180deg, #fffdfa 0%, #ffffff 100%);
  border-radius: 18px;
  border: 1px solid #f0f0f5;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-shadow: 0 15px 40px rgba(20, 21, 56, 0.08);
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 22px 48px rgba(20, 21, 56, 0.12);
    border-color: #ffd58a;
  }

  &:focus-visible {
    outline: 3px solid rgba(255, 181, 34, 0.25);
    outline-offset: 2px;
  }
`;

export const GroupHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;

  h3 {
    margin: 0;
  }

  small {
    color: #7a7a90;
  }
`;

export const ProgressTag = styled.span`
  position: relative;
  overflow: hidden;
  border-radius: 999px;
  padding: 0.45rem 0.85rem;
  background: ${({ $complete }) =>
    $complete
      ? 'linear-gradient(135deg, #ffe3a1 0%, #ffcc57 100%)'
      : '#f5f5f9'};
  border: 1px solid ${({ $complete }) => ($complete ? '#d8a324' : '#ececf5')};
  font-weight: 700;
  color: ${({ $complete }) => ($complete ? '#734600' : '#6d6d85')};
  font-size: 0.9rem;
  flex-shrink: 0;
`;

export const ProgressTagFill = styled.span`
  position: absolute;
  inset: 0;
  width: ${({ $progress }) => `${Math.max(0, Math.min(100, $progress || 0))}%`};
  background: linear-gradient(90deg, rgba(255, 194, 71, 0.18) 0%, rgba(255, 181, 34, 0.55) 100%);
  transition: width 0.25s ease;
`;

export const ProgressTagContent = styled.span`
  position: relative;
  z-index: 1;
`;

export const StatusChip = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
  background: ${({ $variant }) =>
    $variant === 'closed'
      ? '#f2f2f7'
      : $variant === 'upcoming'
      ? '#fff4e6'
      : $variant === 'voted'
      ? '#e6f6ea'
      : '#e5fff4'};
  color: ${({ $variant }) =>
    $variant === 'closed'
      ? '#666278'
      : $variant === 'upcoming'
      ? '#a85b00'
      : $variant === 'voted'
      ? '#2e7d32'
      : '#046747'};
`;

export const VoteOption = styled.button`
  border-radius: 18px;
  border: 2px solid ${({ $selected }) => ($selected ? '#ffb522' : 'transparent')};
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  background: ${({ $selected }) =>
    $selected
      ? 'linear-gradient(180deg, rgba(69, 186, 91, 0.16) 0%, rgba(255, 255, 255, 0.96) 100%)'
      : '#fff'};
  padding: 0.5rem;
  display: flex;
  gap: 0.75rem;
  align-items: center;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, background 0.18s ease;
  &.advancer {
    border: 2px solid #2ecc40;
    border-radius: 8px;
    background: rgba(46, 204, 64, 0.08);
  }
  &.lucky-loser {
    border: 2px solid #f39c12;
    border-radius: 8px;
    background: rgba(243, 156, 18, 0.08);
  }
  cursor: pointer;
  opacity: ${({ disabled }) => (disabled ? 0.75 : 1)};

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
  }
`;

export const GroupPreviewStrip = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.45rem;
`;

export const GroupPreviewThumb = styled.img`
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 12px;
  object-fit: cover;
  background: #f3f4f8;
  border: 1px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 6px 18px rgba(15, 18, 63, 0.08);
`;

export const GroupCardHint = styled.small`
  color: #8b7b58;
  font-weight: 600;
`;

export const VoteImage = styled.img`
  width: 64px;
  height: 64px;
  border-radius: 12px;
  object-fit: contain;
  background: #f7f7fa;
`;

export const VoteMeta = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.15rem;

  strong {
    font-size: 0.95rem;
  }

  span {
    font-size: 0.85rem;
    color: #7a7a90;
  }
`;

export const KoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
`;

export const KoCardButton = styled.button`
  background: #fff;
  border-radius: 16px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  box-shadow: 0 15px 40px rgba(15, 18, 63, 0.08);
  border: 1px solid #ececf3;
  cursor: pointer;
  text-align: left;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;

  small {
    color: #7a7a90;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 18px 42px rgba(15, 18, 63, 0.12);
    border-color: #ffd58a;
  }
`;

export const KoPairPreview = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
`;

export const KoThumb = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

export const WinnerSection = styled.section`
  margin-bottom: 2rem;
`;

export const WinnerCard = styled.div`
  background: linear-gradient(135deg, #ffc757, #ff5ca4);
  border-radius: 32px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.08);
`;

export const WinnerBadge = styled.span`
  padding: 0.4rem 1.2rem;
  border-radius: 999px;
  background: #ffd98dff;
  font-weight: 700;
  color: #000000ff;
  text-transform: uppercase;
  letter-spacing: 0.1em;
`;

export const WinnerImageWrapper = styled.div`
  width: min(90vw, 520px);
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
`;

export const WinnerImage = styled.img`
  width: 100%;
  height: auto;
  display: block;
`;

export const WinnerMeta = styled.div`
  text-align: center;
  color: #4a3c2f;

  h2 {
    margin: 0;
    font-size: 2rem;
  }

  p {
    margin: 0.2rem 0;
    font-size: 1.1rem;
    font-weight: 600;
  }

  small {
    color: #816c62;
  }
`;

export const WinnerSubline = styled.span`
  display: block;
  margin-top: 0.75rem;
  color: #a24d00;
  font-weight: 600;
`;

export const SubmissionPanel = styled.section`
  background: #fff;
  border-radius: 24px;
  padding: 1.5rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const SubmissionImagesWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

export const SubmissionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
`;

export const SubmissionImageCard = styled.div`
  border: 1px solid ${({ $disabled }) => ($disabled ? '#f0f0f0' : '#ececf3')};
  border-radius: 16px;
  padding: 0.75rem;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  opacity: ${({ $disabled }) => ($disabled ? 0.6 : 1)};
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 16px 34px rgba(15, 18, 63, 0.08);
    border-color: #ffd58a;
  }
`;

export const SubmissionImageThumb = styled.img`
  width: 100%;
  border-radius: 12px;
  height: 140px;
  object-fit: cover;
  background: #f7f7fa;
`;

export const SubmissionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

export const SubmissionCard = styled.div`
  border: 1px solid #ececf3;
  border-radius: 16px;
  padding: 0.75rem;
  display: grid;
  grid-template-columns: 70px 1fr auto;
  gap: 0.75rem;
  align-items: center;
  background: #fff;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 12px 28px rgba(15, 18, 63, 0.08);
    border-color: #ffd58a;
  }

  @media (max-width: 640px) {
    grid-template-columns: 60px 1fr;
  }
`;

export const SubmissionImage = styled.img`
  width: 70px;
  height: 70px;
  border-radius: 12px;
  object-fit: cover;
  background: #f1f1f6;
  @media (max-width: 640px) {
    width: 60px;
    height: 60px;
  }
`;

export const SubmissionInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;

  strong {
    font-size: 1rem;
  }

  small {
    color: #7d7b92;
  }
`;

export const SubmissionStatusChip = styled.span`
  justify-self: end;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  background: ${({ $variant }) =>
    $variant === 'accepted'
      ? '#e6f6ea'
      : $variant === 'pending'
      ? '#fff4e6'
      : '#f2f2f7'};
  color: ${({ $variant }) =>
    $variant === 'accepted'
      ? '#2e7d32'
      : $variant === 'pending'
      ? '#a85b00'
      : '#666278'};
`;

export const SubmitButton = styled.button`
  border-radius: 12px;
  border: 1px solid #bbb;
  background: #fff;
  padding: 0.45rem 0.75rem;
  font-weight: 600;
  cursor: pointer;
  text-align: center;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, background 0.18s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 10px 22px rgba(15, 18, 63, 0.08);
    border-color: #ffb522;
    background: #fff9ed;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const EmptyState = styled.div`
  border-radius: 18px;
  border: 1px dashed #dcdde6;
  padding: 2rem;
  text-align: center;
  color: #77768c;
  margin: 1rem 0;
`;

export const PlaceholderText = styled.p`
  color: #777;
`;

export const ModalNavRow = styled.div`
  display: flex;
  gap: 0.6rem;
  padding: 0 1.25rem;
  margin-bottom: 0.2rem;

  @media (max-width: 720px) {
    padding: 0 0.75rem;
  }
`;

export const NavButton = styled.button`
  flex: 1;
  min-width: 0;
  border-radius: 999px;
  border: 1px solid #d7d7e6;
  padding: 0.45rem 1rem;
  background: #fff;
  font-weight: 600;
  cursor: pointer;
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, color 0.18s ease, background 0.18s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    border-color: #ffb522;
    color: #a85b00;
    background: #fff9ed;
    box-shadow: 0 12px 24px rgba(255, 181, 34, 0.12);
  }
`;

export const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(14, 17, 42, 0.65);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0.75rem;
  z-index: 1201;

  @media (max-width: 720px) {
    padding: 0.5rem;
    align-items: center;
  }
`;

export const ModalCard = styled.div`
  background: #fff;
  border-radius: 24px;
  width: min(1100px, 100vw);
  max-height: calc(100vh - 1.5rem);
  max-height: calc(100dvh - 1.5rem);
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  z-index: 1002;

  @media (max-width: 720px) {
    width: min(100vw - 1rem, 100vw);
    height: calc(100vh - 1rem);
    height: calc(100dvh - 1rem);
    max-height: calc(100vh - 1rem);
    max-height: calc(100dvh - 1rem);
    border-radius: 20px;
  }
`;

export const LightboxOverlay = styled(ModalOverlay)`
  padding: 2rem;

  @media (max-width: 720px) {
    padding: 0.5rem;
  }
`;

export const LightboxCard = styled.div`
  position: relative;
  background: #fff;
  border-radius: 20px;
  padding: 1rem 1rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  width: min(96vw, 1200px);
  max-width: min(96vw, 1200px);
  max-height: calc(100vh - 3rem);
  max-height: calc(100dvh - 3rem);

  @media (max-width: 720px) {
    width: calc(100vw - 1rem);
    max-width: calc(100vw - 1rem);
    height: calc(100vh - 1rem);
    height: calc(100dvh - 1rem);
    max-height: calc(100vh - 1rem);
    max-height: calc(100dvh - 1rem);
    border-radius: 20px;
    padding: 0.75rem 0.75rem 1rem;
    background: #0f1220;
  }
`;

export const LightboxCloseRow = styled.div`
  width: 100%;
  display: flex;
  justify-content: flex-end;

  @media (max-width: 720px) {
    button {
      color: #f3f4fb;
    }
  }
`;

export const LightboxImage = styled.img`
  max-width: 100%;
  max-height: calc(100vh - 220px);
  max-height: calc(100dvh - 220px);
  border-radius: 16px;
  object-fit: contain;
  background: #f8f8fb;

  @media (max-width: 720px) {
    width: 100%;
    flex: 1;
    min-height: 0;
    max-height: calc(100vh - 112px);
    max-height: calc(100dvh - 112px);
    background: #0f1220;
  }
`;

export const LightboxCaption = styled.span`
  font-weight: 600;
  color: #5a5673;

  @media (max-width: 720px) {
    color: #f3f4fb;
    text-align: center;
  }
`;

export const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem 0.35rem;
  gap: 0.75rem;

  h3 {
    margin: 0;
  }

  small {
    color: #7a7a90;
  }

  @media (max-width: 720px) {
    padding: 0.8rem 0.85rem 0.25rem;
  }
`;

export const ModalHeaderMain = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 0;
  flex-wrap: wrap;

  h3,
  small {
    margin: 0;
  }
`;

export const ModalBody = styled.div`
  padding: 0.75rem 1rem 1.1rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-height: 0;
  overflow: ${({ $lockScroll }) => ($lockScroll ? 'hidden' : 'auto')};

  @media (max-width: 720px) {
    padding: 0.65rem 0.75rem 0.85rem;
    overflow: ${({ $lockScroll }) => ($lockScroll ? 'hidden' : 'auto')};
  }
`;

export const ModalVoteWrapper = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
  min-height: 0;
  height: 100%;
  align-items: stretch;
  padding-bottom: 0.35rem;
  box-sizing: border-box;
  @media (max-width: 720px) {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(2, minmax(0, calc((100% - 0.75rem - 0.35rem) / 2)));
    grid-auto-rows: unset;
    height: 100%;
    gap: 0.75rem;
  }
`;

export const ModalVoteCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 0.65rem;
  min-height: 0;
  height: 100%;
  border-radius: 18px;
  border: 2px solid ${({ $selected }) => ($selected ? '#2ecc40' : 'transparent')};
  box-shadow: ${({ $selected }) =>
    $selected
      ? '0 16px 34px rgba(46, 204, 64, 0.18)'
      : '0 6px 20px rgba(0, 0, 0, 0.08)'};
  background: ${({ $selected }) =>
    $selected
      ? 'linear-gradient(180deg, rgba(46, 204, 64, 0.14) 0%, rgba(255,255,255,0.98) 100%)'
      : '#fff'};
  overflow: hidden;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, background 0.18s ease;
  ${({ $disabled }) =>
    $disabled
      ? `
    opacity: 0.8;
  `
      : ''}

  @media (max-width: 720px) {
    padding: 0.35rem;
  }

  &:hover {
    transform: translateY(-2px);
  }
`;

export const ModalVoteMedia = styled.div`
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
`;

export const ModalVotePreviewButton = styled.button`
  border: none;
  background: #f8f8fb;
  padding: 0;
  border-radius: 16px;
  cursor: ${({ disabled }) => (disabled ? 'default' : 'pointer')};
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  width: 100%;
  transition: transform 0.18s ease, filter 0.18s ease, background 0.18s ease;

  &:hover:not(:disabled) {
    filter: saturate(1.03);
    background: #f3f7f2;
  }
`;

export const ModalVoteImage = styled.img`
  width: 100%;
  height: 100%;
  border-radius: 16px;
  object-fit: contain;
  background: white;
  flex: 1;
  min-height: 0;
`;

export const ModalVoteMeta = styled(VoteMeta)`
  margin-top: 0.45rem;
  min-height: 0;

  strong {
    word-break: break-word;
  }

  span {
    line-height: 1.25;
  }

  @media (max-width: 720px) {
    margin-top: 0.35rem;

    strong {
      font-size: 0.88rem;
    }

    span {
      font-size: 0.78rem;
    }
  }
`;

export const ModalZoomButton = styled.button`
  position: absolute;
  top: 0.7rem;
  right: 0.7rem;
  width: 2.5rem;
  height: 2.5rem;
  border: none;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 18, 32, 0.72);
  color: #fff;
  cursor: zoom-in;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.18);
  transition: transform 0.15s ease, background 0.15s ease;

  &:hover {
    transform: scale(1.04);
    background: rgba(15, 18, 32, 0.82);
  }

  svg {
    width: 1.05rem;
    height: 1.05rem;
  }

  @media (max-width: 720px) {
    width: 2.75rem;
    height: 2.75rem;
  }
`;

export const CloseModalButton = styled.button`
  border: none;
  background: transparent;
  font-size: 1.5rem;
  cursor: pointer;
  line-height: 1;
`;

export const PreviewGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  height: 100%;
  overflow: visible;
  padding-bottom: 0.5rem;
  @media (min-width: 720px) {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    padding-bottom: 0;
  }
`;

export const PreviewCard = styled.button`
  border: 1px solid #eee;
  border-radius: 16px;
  padding: 0.75rem;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 0;
  width: 100%;
  text-align: left;
  cursor: zoom-in;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 16px 34px rgba(15, 18, 63, 0.08);
    border-color: #ffd58a;
  }
`;

export const PreviewImageButton = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: #f8f8fb;
  overflow: hidden;
  transition: transform 0.18s ease, background 0.18s ease;
`;

export const PreviewImage = styled.img`
  width: 100%;
  border-radius: 12px;
  object-fit: contain;
  background: #f8f8fb;
  max-height: min(52vh, 420px);
  flex: 1;
`;

export const PreviewMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  color: #6a6882;
`;

export const ResultsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

export const ResultItem = styled.button`
  border: 1px solid #eee;
  border-radius: 14px;
  padding: 0.75rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  width: 100%;
  text-align: left;
  background: #fff;
  cursor: zoom-in;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, background 0.18s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 16px 34px rgba(15, 18, 63, 0.08);
    border-color: #ffd58a;
  }

  &.advancer {
    border: 2px solid #2ecc40;
    border-radius: 8px;
    background: linear-gradient(180deg, rgba(46, 204, 64, 0.12) 0%, rgba(255,255,255,0.98) 100%);
  }
  &.lucky-loser {
    border: 2px solid #f39c12;
    border-radius: 8px;
    background: linear-gradient(180deg, rgba(243, 156, 18, 0.12) 0%, rgba(255,255,255,0.98) 100%);
  }
`;

export const ResultInfo = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
`;

export const ResultImageButton = styled.div`
  display: flex;
`;

export const ResultImage = styled.img`
  width: 56px;
  height: 56px;
  border-radius: 12px;
  object-fit: cover;
  background: #f1f1f6;
`;

export const ResultWins = styled.span`
  font-weight: 700;
  color: #c35b00;
`;
