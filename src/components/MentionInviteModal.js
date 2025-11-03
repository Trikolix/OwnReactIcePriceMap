import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Button, CloseButton } from "../styles/SharedStyles";
import { Modal } from "./Modal";


const MentionInviteModal = ({ open, onClose, checkinId, shopId, inviterName, shopName, date, userId }) => {
  const [status, setStatus] = useState(null);
  const [existingCheckins, setExistingCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    // Status von checkin_mentions abrufen
    fetch(`${process.env.REACT_APP_API_BASE_URL}/api/checkin_mentions.php?action=getStatus&checkin_id=${checkinId}&mentioned_user_id=${userId}`)
      .then(res => res.json())
      .then(data => {
        setStatus(data.status);
        setLoading(false);
      })
      .catch(err => {
        setError("Fehler beim Laden des Status");
        setLoading(false);
      });
  }, [open, checkinId, shopId, userId]);

  useEffect(() => {
    if (!open || !shopId || !date || !userId) return;
    // Suche nach bestehenden Checkins des Nutzers für die Eisdiele am selben Tag
    fetch(`${process.env.REACT_APP_API_BASE_URL}/checkin/get_checkin.php?nutzer_id=${userId}&shop_id=${shopId}&date=${date}`)
      .then(res => res.json())
      .then(data => {
        setExistingCheckins(data.checkins || []);
      })
      .catch(() => {});
  }, [open, shopId, date, userId]);

  const handleAcceptExisting = async (existingCheckinId) => {
    // Verknüpfe bestehenden Checkin
    await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/checkin_mentions.php?action=accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "accept",
        checkin_id: checkinId,
        mentioned_user_id: userId,
        responded_checkin_id: existingCheckinId
      })
    });
    setStatus("accepted");
  };

  const handleCreateNew = () => {
    if (onClose) onClose();
    window.location.href = `/#/map/activeShop/${shopId}?tab=checkins&createReferencedCheckin=${checkinId}`;
  };

  const handleDecline = async () => {
    await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/checkin_mentions.php?action=decline`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "decline",
        checkin_id: checkinId,
        mentioned_user_id: userId
      })
    });
    setStatus("declined");
  };

  const handleUndoDecline = async () => {
    await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/checkin_mentions.php?action=undoDecline`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "undoDecline",
        checkin_id: checkinId,
        mentioned_user_id: userId
      })
    });
    setStatus("pending");
  };

  if (!open) return null;

  return (
    <Modal onClose={onClose}>
      <ModalBox>
  <CloseButton onClick={onClose}>&times;</CloseButton>
        <h2>Checkin-Einladung</h2>
        <p><strong>{inviterName}</strong> hat angegeben am <strong>{new Date(date).toLocaleDateString("de-DE")}</strong> mit dir bei <strong>{shopName}</strong> Eis gegessen zu haben.</p>
        {loading && <p>Lade Status...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
        {status === "pending" && (
          <>
            {existingCheckins.length > 0 && (
              <>
                <p>Du hast bereits einen Checkin für diese Eisdiele an diesem Tag. Möchtest du diesen verknüpfen?</p>
                {existingCheckins.map(c => (
                  <Button key={c.id} onClick={() => handleAcceptExisting(c.id)}>
                    Checkin vom {new Date(c.datum).toLocaleString("de-DE")} auswählen
                  </Button>
                ))}
                <hr />
              </>
            )}
            <Button onClick={handleCreateNew}>Neuen Checkin anlegen</Button>
            <Button onClick={handleDecline} style={{ marginLeft: "1rem", background: '#f44336' }}>Anfrage ablehnen</Button>
          </>
        )}
        {status === "accepted" && (
          <p>Du hast die Einladung bereits angenommen.</p>
        )}
        {status === "declined" && (
          <>
            <p>Du hast die Einladung abgelehnt.</p>
            <Button onClick={handleUndoDecline}>Doch annehmen?</Button>
          </>
        )}
      </ModalBox>
    </Modal>
  );
};

export default MentionInviteModal;

// ModalBg entfällt, da Modal.js das Overlay übernimmt
const ModalBox = styled.div`
  background: #fff;
  border-radius: 16px;
  padding: 2rem 2.5rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
  text-align: center;
  max-width: 90vw;
  min-width: 320px;
  position: relative;
`;
// CloseBtn entfällt, da CloseButton aus SharedStyles genutzt wird
