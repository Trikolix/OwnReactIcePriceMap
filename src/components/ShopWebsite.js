import React, { useState, useRef, useEffect } from 'react';
import styled from "styled-components";
import { Overlay as SharedOverlay, CloseButton as SharedCloseButton, Input as SharedInput, SubmitButton as SharedSubmitButton } from '../styles/SharedStyles';
import { useUser } from '../context/UserContext';

const ShopWebsite = ({ eisdiele, onSuccess }) => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [website, setWebsite] = useState(eisdiele.website);
  const overlayRef = useRef(null);
  const tooltipRef = useRef(null);
  const { isLoggedIn, userId } = useUser();
  const apiUrl = process.env.REACT_APP_API_BASE_URL;

  const handleReportClick = async () => {

    try {
      const response = await fetch(`${apiUrl}/submitWebsiteForShop.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          shopId: eisdiele.id,
          website: website
        }),
      });

      const result = await response.json();

      if (result.status === 'success') {
        onSuccess && onSuccess();
        setShowOverlay(false);
        alert('Website erfolgreich gemeldet.');
      } else {
        alert('Fehler beim Melden der neuen Öffnungszeiten.');
      }
    } catch (error) {
      console.error('Fehler beim Senden der Anfrage:', error);
      alert('Fehler beim Senden der Anfrage.');
    } finally {
      setShowOverlay(false);
    }
  };

  const handleClickOutside = (event) => {
    if (overlayRef.current && !overlayRef.current.contains(event.target) && !tooltipRef.current.contains(event.target)) {
      setShowOverlay(false);
      setShowTooltip(false); // Tooltip ausblenden, wenn außerhalb geklickt wird
    }
  };

  useEffect(() => {
    if (showOverlay || showTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showOverlay, showTooltip]);

  return (
    <Container>

      {eisdiele.website && (
        <>
          <strong>Website:</strong>{" "}
          <a
            href={
              eisdiele.website.startsWith("http://") || eisdiele.website.startsWith("https://")
                ? eisdiele.website
                : `https://${eisdiele.website}`
            }
            target="_blank"
            rel="noopener noreferrer"
          >
            {eisdiele.website}
          </a>
          <br />
        </>
      )}
      <WebsiteContainer
        onClick={isLoggedIn ? setShowOverlay : undefined}
        isLoggedIn={isLoggedIn}
      >
        {(eisdiele.website === "" || eisdiele.website === null) && isLoggedIn && (userId === 1 || userId === eisdiele.user_id) && (<>
          <strong>Website:</strong> <a onClick={() => setShowOverlay(true)}>Website eintragen</a>
        </>
        )}
      </WebsiteContainer>
      {isLoggedIn && showOverlay && (
        <SharedOverlay ref={overlayRef}>
          <OverlayContent>
            <SharedCloseButton onClick={() => setShowOverlay(false)}>x</SharedCloseButton>
            <p>Website für <strong>{eisdiele.name}</strong> eintragen.<br /></p>
            <SharedInput as="textarea" rows="1" placeholder="URL der Website" value={website} onChange={(e) => setWebsite(e.target.value)} />
            <SharedSubmitButton onClick={handleReportClick}>Absenden</SharedSubmitButton>
          </OverlayContent>
        </SharedOverlay>
      )}
    </Container>
  );
};

export default ShopWebsite;

const Container = styled.div``;

const WebsiteContainer = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'isLoggedIn',
})`
    position: relative;
    cursor: ${({ isLoggedIn }) => (isLoggedIn ? 'pointer' : 'default')};
    width: fit-content;
  `;

// local Overlay replaced by SharedOverlay

const OverlayContent = styled.div`
  text-align: center;
  position: relative;
  background: white;
  padding: 20px;
  border-radius: 5px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

// uses SharedCloseButton

// uses SharedInput and SharedSubmitButton
