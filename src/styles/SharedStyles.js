import styled from 'styled-components';

// Shared modal overlay used across multiple modals
export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  height: 100dvh;
  width: 100vw;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1001;
  padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
`;

export const OverlayBackground = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.4);
  z-index: 2000;
`;

export const ContentWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
`;

export const LeftContent = styled.div`
  flex: 1 1 300px;
  min-width: 250px;
`;

export const RightContent = styled.div`
  display: flex;
  overflow-x: auto;
  gap: 8px;
  padding-bottom: 8px;
`;

export const CommentToggle = styled.button`
  margin-top: 0.5rem;
  background: transparent;
  border: none;
  color: #ffb522;
  cursor: pointer;
  font-weight: bold;
  padding: 0.25rem 0;
  text-align: left;

  &:hover {
    text-decoration: underline;
  }
`;

export const Modal = styled.div`
  background-color: #fff;
  padding: 1rem;
  border-radius: 16px;
  width: 95vw;
  max-width: 550px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
  position: relative;
  box-sizing: border-box;
  scroll-padding-bottom: 100px;
  @media (max-height: 600px) {
    max-height: 95vh;
    padding: 0.5rem;
    padding-bottom: calc(2.5rem + env(safe-area-inset-bottom));
  }
`;

export const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
`;

export const Heading = styled.h2`
  margin-bottom: 1rem;
`;

export const Form = styled.form``;
export const Section = styled.div`
  margin-bottom: 1rem;
`;

export const Label = styled.label`
  display: block;
  font-weight: bold;
  margin-bottom: 0.4rem;
`;

export const Input = styled.input`
  width: 95%;
  padding: 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid #ccc;
`;

export const Select = styled.select`
  width: 95%;
  padding: 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid #ccc;
`;

export const Textarea = styled.textarea`
  width: 95%;
  padding: 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid #ccc;
`;

export const Button = styled.button`
  background: #ffb522;
  color: white;
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: bold;
  cursor: pointer;
  &:hover { background: #ffcb4c; }
`;

export const SubmitButton = styled.button`
  background-color: #ffb522;
  color: white;
  padding: 0.7rem 1.1rem;
  margin: 0px 4px 0px 4px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-weight: bold;
  font-size: 1rem;
  transition: background-color 0.15s ease;
  &:hover { background-color: #ffcb4c; }
`;

export const SamllerSubmitButton = styled.button`
  align-self: flex-start;
  background-color: #ffb522;
  color: white;
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.15s ease;
  &:hover { background-color: #ffcb4c; }
`;

// Smaller variant for secondary/inline actions
export const SmallButton = styled(SubmitButton)`
  padding: 0.35rem 0.6rem;
  margin: 0 4px;
  font-size: 0.9rem;
  border-radius: 6px;
`;

export const ButtonGroup = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 0.5rem;
`;

export const DeleteButton = styled.button`
  background: #f44336;
  color: white;
  border: none;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  &:hover { background: #d32f2f; }
`;

export const BilderContainer = styled.div`
  display: flex;
  overflow-x: auto;
  gap: 1rem;
  padding: 0.5rem 0;
  scroll-snap-type: x mandatory;
  & > div { flex: 0 0 auto; scroll-snap-align: start; border: 1px solid #ccc; padding: 0.5rem; border-radius: 8px; background: white; min-width: 180px; max-width: 220px; }
`;

export const BildVorschau = styled.img`
  max-height: 120px;
  width: auto;
  display: block;
  margin: 0 auto;
`;

export const TabContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
`;

export const TabButton = styled.button`
  padding: 0.5rem 1rem;
  margin: 0 0.5rem;
  background-color: ${(props) => (props.active ? '#0077b6' : '#f0f0f0')};
  color: ${(props) => (props.active ? 'white' : '#333')};
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  &:hover { background-color: ${(props) => (props.active ? '#005f8a' : '#e0e0e0')}; }
`;

export const LoadMoreButton = styled.button`
  display: block;
  margin: 1rem auto;
  padding: 0.5rem 1rem;
  background-color: #0077b6;
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
  &:hover { background-color: #005f8a; }
`;

export const Message = styled.p`
  margin-top: 1rem;
  font-style: italic;
`;

export const LevelInfo = styled.div`
  margin-top: 1rem;
  border-top: 1px solid #eee;
  padding-top: 1rem;
`;

export const Card = styled.div`
  position: relative;
  background: white;
  border-radius: 16px;
  border: 1px solid #eee;
  padding: 2rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.3s;

  &:hover {
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  }
`;

export default {
  Overlay,
  OverlayBackground,
  Modal,
  CloseButton,
  Heading,
  Form,
  Section,
  Label,
  Input,
  Select,
  Textarea,
  Button,
  SubmitButton,
  ButtonGroup,
  DeleteButton,
  BilderContainer,
  BildVorschau,
  TabContainer,
  TabButton,
  LoadMoreButton,
  Message,
  LevelInfo,
  ContentWrapper,
  LeftContent,
  RightContent,
  SamllerSubmitButton,
  CommentToggle,
  Card
};
