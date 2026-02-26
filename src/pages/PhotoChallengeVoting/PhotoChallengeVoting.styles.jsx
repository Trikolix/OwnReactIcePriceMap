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
`;

export const GroupsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
`;

export const GroupCard = styled.div`
  background: #fff;
  border-radius: 18px;
  border: 1px solid #f0f0f5;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-shadow: 0 15px 40px rgba(20, 21, 56, 0.08);
`;

export const GroupHeader = styled.button`
  border: none;
  background: transparent;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0;
  cursor: pointer;

  h3 {
    margin: 0;
  }

  small {
    color: #7a7a90;
  }
`;

export const ProgressTag = styled.span`
  border-radius: 999px;
  padding: 0.35rem 0.75rem;
  background: #f5f5f9;
  font-weight: 600;
  color: #6d6d85;
  font-size: 0.9rem;
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
  background: #fff;
  padding: 0.5rem;
  display: flex;
  gap: 0.75rem;
  align-items: center;
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
`;

export const VoteImage = styled.img`
  width: 64px;
  height: 64px;
  border-radius: 12px;
  object-fit: cover;
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

  small {
    color: #7a7a90;
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
  gap: 0.75rem;
  padding: 0 1.5rem;
  margin-bottom: 0.5rem;
`;

export const NavButton = styled.button`
  flex: 1;
  min-width: 0;
  border-radius: 999px;
  border: 1px solid #d7d7e6;
  padding: 0.55rem 1.2rem;
  background: #fff;
  font-weight: 600;
  cursor: pointer;
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};

  &:hover:not(:disabled) {
    border-color: #ffb522;
    color: #a85b00;
  }
`;

export const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(14, 17, 42, 0.65);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0rem;
  z-index: 999;
`;

export const ModalCard = styled.div`
  background: #fff;
  border-radius: 24px;
  width: min(1100px, calc(100vw));
  max-height: calc(100vh - 1rem);
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.2);
  overflow: hidden;
`;

export const LightboxOverlay = styled(ModalOverlay)`
  padding: 2rem;
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
  max-width: min(90vw, 720px);
  max-height: calc(100vh - 3rem);
`;

export const LightboxCloseRow = styled.div`
  width: 100%;
  display: flex;
  justify-content: flex-end;
`;

export const LightboxImage = styled.img`
  max-width: 100%;
  max-height: calc(100vh - 220px);
  border-radius: 16px;
  object-fit: contain;
  background: #f8f8fb;
`;

export const LightboxCaption = styled.span`
  font-weight: 600;
  color: #5a5673;
`;

export const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem 0.5rem;
  gap: 1rem;

  h3 {
    margin: 0;
  }

  small {
    color: #7a7a90;
  }
`;

export const ModalBody = styled.div`
  padding: 1rem 1rem 1.5rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow: auto;
  @media (max-width: 720px) {
    padding: 1rem 0rem 1.5rem;
  }
`;

export const ModalVoteWrapper = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  height: calc(100vh - 320px);
  @media (max-width: 720px) {
    grid-template-columns: 1fr;
    grid-auto-rows: calc((100vh - 320px) / 2);
  }
`;

export const ModalVoteOption = styled(VoteOption)`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 0.75rem;
  min-height: 0;
  height: 100%;
  ${({ disabled }) =>
    disabled
      ? `
    cursor: default;
    pointer-events: none;
  `
      : ''}
  ${({ $selected }) =>
    $selected
      ? `
    border-color: #2ecc40;
  `
      : ''}
`;

export const ModalVoteImage = styled.img`
  width: 100%;
  border-radius: 16px;
  object-fit: contain;
  background: white;
  flex: 1;
  margin-bottom: 0.5rem;
  max-height: calc(100% - 48px);
`;

export const CloseModalButton = styled.button`
  border: none;
  background: transparent;
  font-size: 1.5rem;
  cursor: pointer;
  line-height: 1;
`;

export const PreviewGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
  overflow-x: auto;
  padding-bottom: 0.5rem;
  scroll-snap-type: x mandatory;
  @media (min-width: 720px) {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    overflow: visible;
    padding-bottom: 0;
  }
`;

export const PreviewCard = styled.div`
  border: 1px solid #eee;
  border-radius: 16px;
  padding: 0.75rem;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 240px;
  scroll-snap-align: start;
`;

export const PreviewImage = styled.img`
  width: 100%;
  border-radius: 12px;
  object-fit: contain;
  background: #f8f8fb;
  aspect-ratio: 4 / 3;
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

export const ResultItem = styled.div`
  border: 1px solid #eee;
  border-radius: 14px;
  padding: 0.75rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
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
`;

export const ResultInfo = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
`;

export const ResultImageButton = styled.button`
  border: none;
  background: transparent;
  padding: 0;
  cursor: zoom-in;
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
