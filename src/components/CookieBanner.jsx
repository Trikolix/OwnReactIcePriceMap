import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

const BannerWrapper = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 -4px 10px rgba(0, 0, 0, 0.1);
  padding: 1rem 1.5rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;

  @media (min-width: 768px) {
    flex-direction: row;
    padding: 1.5rem 2rem;
  }
`;

const TextContainer = styled.div`
  flex: 1;
  font-size: 0.9rem;
  color: #333;
  line-height: 1.5;

  p {
    margin: 0 0 0.5rem 0;
  }

  a {
    color: #ffb522;
    text-decoration: underline;
    font-weight: bold;
    &:hover {
      color: #e5a015;
    }
  }
`;

const AcceptButton = styled.button`
  background-color: #ffb522;
  color: #fff;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.2s;

  &:hover {
    background-color: #e5a015;
  }
`;

const COOKIE_CONSENT_KEY = 'ice_app_cookie_consent';

const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasConsented = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!hasConsented) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <BannerWrapper>
      <TextContainer>
        <p>
          Wir verwenden Local Storage und essentielle Cookies, um dir die Nutzung unserer App zu ermöglichen (z. B. für Login, Einstellungen und Kartenanzeige via OpenStreetMap).
        </p>
        <p>
          Weitere Informationen findest du in unserer{' '}
          <Link to="/datenschutz">Datenschutzerklärung</Link>.
        </p>
      </TextContainer>
      <AcceptButton onClick={handleAccept}>Verstanden</AcceptButton>
    </BannerWrapper>
  );
};

export default CookieBanner;
