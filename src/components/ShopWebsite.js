import React, { useState, useRef, useEffect } from 'react';
import styled from "styled-components";
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
            
            {eisdiele.website !== "" && eisdiele.website !== null && (
                <>
                  <strong>Website:</strong> <a href={eisdiele.website} target="_blank" rel="noopener noreferrer">{eisdiele.website}</a><br />
                </>
              )}
              <WebsiteContainer
                onClick={isLoggedIn ? setShowOverlay : undefined}
                isLoggedIn={isLoggedIn}
                >
              {(eisdiele.website === "" || eisdiele.website === null) && isLoggedIn && (userId == 1 || userId == eisdiele.user_id) && (<>
                <strong>Website:</strong> <a onClick={() => setShowOverlay(true)}>Website eintragen</a>
              </>
              )}
              </WebsiteContainer>
            {isLoggedIn && showOverlay && (
                <Overlay ref={overlayRef}>
                    <OverlayContent>
                        <CloseX onClick={() => setShowOverlay(false)}>x</CloseX>
                        <p>Website für <strong>{eisdiele.name}</strong> eintragen.<br /></p>
                        <Input rows="1" placeholder="URL der Website" value={website} onChange={(e) => setWebsite(e.target.value)} />
                        <SubmitButton onClick={handleReportClick}>Absenden</SubmitButton>
                    </OverlayContent>
                </Overlay>
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

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1002;
`;

const OverlayContent = styled.div`
  text-align: center;
  position: relative;
  background: white;
  padding: 20px;
  border-radius: 5px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const CloseX = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
`;

const Input = styled.textarea`
  border: 1px solid #e5e7eb;
  padding: 6px;
  border-radius: 4px;
  font-size: 1rem;
  width: 100%;
  box-sizing: border-box;
`;

const SubmitButton = styled.button`
  background-color: #ffb522;
  color: white;
  padding: 6px 12px;
  margin-top: 5px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
`;
