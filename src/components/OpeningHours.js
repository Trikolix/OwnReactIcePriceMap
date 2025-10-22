import React, { useState, useRef, useEffect } from 'react';
import styled from "styled-components";
import { Overlay as SharedOverlay, Input as SharedInput, SubmitButton as SharedSubmitButton, CloseButton as SharedCloseButton } from '../styles/SharedStyles';
import { useUser } from '../context/UserContext';

const OpeningHours = ({ eisdiele }) => {
    const [showOverlay, setShowOverlay] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const [newOpeningHours, setNewOpeningHours] = useState(eisdiele.openingHours);
    const overlayRef = useRef(null);
    const tooltipRef = useRef(null);
    const { userId, username, isLoggedIn } = useUser();
    const apiUrl = process.env.REACT_APP_API_BASE_URL;

    const handleReportClick = async () => {
        if (newOpeningHours === eisdiele.openingHours) {
            alert('Deine neuen Öffnungszeiten sind identisch mit den alten.');
            setShowOverlay(false);
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/submitNewOpeningHours.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    shopName: eisdiele.name,
                    shopId: eisdiele.id,
                    userId: userId,
                    username: username,
                    newOpeningHours: newOpeningHours,
                }),
            });

            const result = await response.json();

            if (result.status === 'success') {
                alert('Neue Öffnungszeiten erfolgreich gemeldet.');
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

    const handleOpeningHoursClick = () => {
        setShowTooltip(true);
        setTimeout(() => setShowTooltip(false), 5000); // Tooltip nach 5 Sekunden ausblenden
    };

    const handleTooltipClick = () => {
        setShowOverlay(true);
        setShowTooltip(false); // Tooltip ausblenden, wenn das Overlay geöffnet wird
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
            <strong>Öffnungszeiten:</strong>
            {eisdiele.status === 'seasonal_closed' && (
                <StatusInfo status="seasonal_closed">
                    🕓 Diese Eisdiele befindet sich aktuell in <strong>Saisonpause</strong>
                    {eisdiele.reopening_date && (
                        <> – voraussichtliche Wiedereröffnung am {new Date(eisdiele.reopening_date).toLocaleDateString('de-DE')}</>
                    )}
                </StatusInfo>
            )}
            {eisdiele.status === 'permanent_closed' && (
                <StatusInfo status="permanent_closed">
                    ❌ Diese Eisdiele hat <strong>dauerhaft geschlossen</strong>.
                </StatusInfo>
            )}
            <OpeningHoursContainer
                onClick={isLoggedIn ? handleOpeningHoursClick : undefined}
                isLoggedIn={isLoggedIn}
                data-show-tooltip={showTooltip}
            >
                {eisdiele.openingHours.trim() !== "" ? (eisdiele.openingHours.split(';').map((part, index) => (
                    <div key={index} style={{ whiteSpace: 'pre-wrap' }}>
                        {part.trim()}
                    </div>
                ))) : (<>Keine Öffnungszeiten eingetragen</>)}
                {showTooltip && (
                    <Tooltip ref={tooltipRef} onClick={handleTooltipClick}>
                        Änderungen an Öffnungszeiten melden
                    </Tooltip>
                )}
            </OpeningHoursContainer>
            {isLoggedIn && showOverlay && (
                <SharedOverlay ref={overlayRef}>
                    <OverlayContent>
                        <SharedCloseButton onClick={() => setShowOverlay(false)}>x</SharedCloseButton>
                        <p>Möchtest du Änderungen an den Öffnungszeiten von <strong>{eisdiele.name}</strong> melden?<br /></p>
                        <SharedInput as="textarea" rows="3" value={newOpeningHours} onChange={(e) => setNewOpeningHours(e.target.value)} />
                        <SharedSubmitButton onClick={handleReportClick}>Änderungen melden</SharedSubmitButton>
                    </OverlayContent>
                </SharedOverlay>
            )}
        </Container>
    );
};

export default OpeningHours;

const Container = styled.div``;

const OpeningHoursContainer = styled.div.withConfig({
    shouldForwardProp: (prop) => prop !== 'isLoggedIn',
})`
  position: relative;
  cursor: ${({ isLoggedIn }) => (isLoggedIn ? 'pointer' : 'default')};
  width: fit-content;
`;

const Tooltip = styled.div`
  position: absolute;
  bottom: -25px; /* Abstand unter dem Text */
  left: 0;
  background-color: #333;
  color: #fff;
  padding: 5px 10px;
  border-radius: 5px;
  font-size: 12px;
  white-space: nowrap;
  cursor: pointer;
  z-index: 1001;
`;

const OverlayContent = styled.div`
    position: relative;
    background: white;
    padding: 20px;
    border-radius: 5px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const StatusInfo = styled.div`
  background-color: ${({ status }) =>
    status === 'permanent_closed'
      ? 'rgba(120, 120, 120, 0.15)'
      : 'rgba(255, 181, 34, 0.15)'};
  color: ${({ status }) =>
    status === 'permanent_closed' ? '#555' : '#b37c00'};
  border-left: 4px solid
    ${({ status }) =>
      status === 'permanent_closed' ? '#999' : '#ffb522'};
  padding: 6px 10px;
  margin-bottom: 6px;
  border-radius: 4px;
  font-size: 0.9rem;
`;
