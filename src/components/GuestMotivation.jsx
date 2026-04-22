import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useUser } from '../context/UserContext';
import LoginModal from '../LoginModal';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 10, 0, 0.5);
  backdrop-filter: blur(2px);
  padding: 1rem;
`;

const ModalCard = styled.div`
  width: min(460px, 100%);
  background: linear-gradient(180deg, #fffdf8 0%, #fff6e6 100%);
  border: 1px solid rgba(47, 33, 0, 0.14);
  border-radius: 18px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.28);
  padding: 1.5rem;
  position: relative;
  text-align: center;
`;

const Title = styled.h2`
  margin: 0 0 1rem 0;
  color: #2f2100;
  font-size: 1.4rem;
`;

const Description = styled.p`
  margin: 0 0 1.5rem 0;
  color: #4b3500;
  font-size: 1rem;
  line-height: 1.5;
`;

const BenefitsList = styled.ul`
  text-align: left;
  margin: 0 0 1.5rem 0;
  padding-left: 1.5rem;
  color: #4b3500;
  font-size: 0.95rem;
  line-height: 1.6;

  li {
    margin-bottom: 0.5rem;
  }
`;

const PrimaryButton = styled.button`
  width: 100%;
  margin-bottom: 0.75rem;
  padding: 0.75rem;
  color: #2f2100;
  background: linear-gradient(180deg, #ffd36f 0%, #ffb522 100%);
  border: 1px solid rgba(255, 181, 34, 0.65);
  border-radius: 12px;
  font-weight: bold;
  font-size: 1.05rem;
  cursor: pointer;

  &:hover {
    background: linear-gradient(180deg, #ffd97f 0%, #ffbf3f 100%);
  }
`;

const SecondaryButton = styled.button`
  width: 100%;
  padding: 0.6rem;
  border: 1px solid rgba(47, 33, 0, 0.2);
  border-radius: 11px;
  background: rgba(255, 255, 255, 0.82);
  color: #4b3500;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.95);
  }
`;

const GUEST_MOTIVATION_KEY = 'ice_app_guest_motivation_dismissed';

export default function GuestMotivation() {
  const { isLoggedIn } = useUser();
  const [showModal, setShowModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  useEffect(() => {
    if (isLoggedIn) return;

    const hasDismissed = localStorage.getItem(GUEST_MOTIVATION_KEY);
    if (hasDismissed) return;

    // Show after 45 seconds of viewing the page
    const timer = setTimeout(() => {
      setShowModal(true);
    }, 45000);

    return () => clearTimeout(timer);
  }, [isLoggedIn]);

  const handleDismiss = () => {
    localStorage.setItem(GUEST_MOTIVATION_KEY, 'true');
    setShowModal(false);
  };

  const handleRegisterClick = () => {
    localStorage.setItem(GUEST_MOTIVATION_KEY, 'true');
    setShowModal(false);
    setShowRegisterModal(true);
  };

  if (!showModal && !showRegisterModal) return null;

  return (
    <>
      {showModal && (
        <Overlay>
          <ModalCard>
            <Title>Erlebe mehr mit der Ice-App!</Title>
            <Description>
              Du scheinst unsere App zu mögen. Wusstest du, dass du mit einem kostenlosen Account viele coole Funktionen freischalten kannst?
            </Description>
            <BenefitsList>
              <li>Bewerte Eisdielen und teile deine Erlebnisse</li>
              <li>Speichere deine Lieblings-Eisdielen als Favoriten</li>
              <li>Nimm an Challenges teil und sammle Auszeichnungen</li>
              <li>Komplett kostenlos und unverbindlich</li>
            </BenefitsList>
            <PrimaryButton onClick={handleRegisterClick}>Jetzt kostenlos registrieren</PrimaryButton>
            <SecondaryButton onClick={handleDismiss}>Vielleicht später</SecondaryButton>
          </ModalCard>
        </Overlay>
      )}

      {showRegisterModal && (
        <LoginModal
          setShowLoginModal={setShowRegisterModal}
          initialMode="register"
        />
      )}
    </>
  );
}
