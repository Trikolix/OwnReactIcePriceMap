import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useUser } from "../context/UserContext";
import { SubmitButton } from "../styles/SharedStyles";

const API_BASE = process.env.REACT_APP_API_BASE_URL;

function UserSettings({ onClose }) {
  const { userId } = useUser();
  const [settings, setSettings] = useState({
    notify_checkin_mention: 1,
    notify_comment: 1,
    notify_comment_participated: 1,
    notify_news: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch(`${API_BASE}/api/get_user_notification_settings.php?user_id=${userId}`);
        const json = await res.json();
        setSettings(json);
      } catch (e) {
        setError("Fehler beim Laden der Einstellungen.");
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, [userId]);

  const handleChange = (e) => {
    const { name, checked } = e.target;
    // Wenn notify_comment_participated aktiviert wird, auch notify_comment aktivieren
    if (name === 'notify_comment_participated' && checked) {
      setSettings({ ...settings, notify_comment: 1, notify_comment_participated: 1 });
    } else if (name === 'notify_comment' && !checked) {
      // Wenn notify_comment deaktiviert wird, auch participated deaktivieren
      setSettings({ ...settings, notify_comment: 0, notify_comment_participated: 0 });
    } else {
      setSettings({ ...settings, [name]: checked ? 1 : 0 });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch(`${API_BASE}/api/update_user_notification_settings.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, ...settings }),
      });
      const json = await res.json();
      if (json.success) setSuccess(true);
      else setError(json.error || "Fehler beim Speichern.");
    } catch (e) {
      setError("Fehler beim Speichern.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <ModalOverlay><ModalBox><h2>Einstellungen</h2><p>Lade...</p></ModalBox></ModalOverlay>;

  return (
    <ModalOverlay>
      <ModalBox>
        <h2>Benachrichtigungseinstellungen</h2>
        <Label>
          <input
            type="checkbox"
            name="notify_checkin_mention"
            checked={!!settings.notify_checkin_mention}
            onChange={handleChange}
          />
          Benachrichtigung bei Verlinkung in Checkins
        </Label>
        <Label>
          <input
            type="checkbox"
            name="notify_comment"
            checked={!!settings.notify_comment}
            onChange={handleChange}
          />
          Benachrichtigung bei neuen Kommentaren an eigenen Checkins/Bewertungen
        </Label>
        <Label style={{ marginLeft: '2rem', opacity: settings.notify_comment ? 1 : 0.5 }}>
          <input
            type="checkbox"
            name="notify_comment_participated"
            checked={!!settings.notify_comment_participated}
            onChange={handleChange}
            disabled={!settings.notify_comment}
          />
          Benachrichtigung bei neuen Kommentaren an Checkins, die du auch kommentiert hast
        </Label>
        <Label>
          <input
            type="checkbox"
            name="notify_news"
            checked={!!settings.notify_news}
            onChange={handleChange}
          />
          Systemmeldungen & News (Newsletter, Aktionen, wichtige Infos)
        </Label>
        {error && <ErrorMsg>{error}</ErrorMsg>}
        {success && <SuccessMsg>Gespeichert!</SuccessMsg>}
        <ButtonRow>
          <SubmitButton onClick={handleSave} disabled={saving}>Speichern</SubmitButton>
          <CancelButton onClick={onClose}>Schließen</CancelButton>
        </ButtonRow>
      </ModalBox>
    </ModalOverlay>
  );
}

export default UserSettings;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalBox = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 16px;
  min-width: 320px;
  max-width: 90vw;
  box-shadow: 0 2px 16px rgba(0,0,0,0.15);
`;

const Label = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
`;

const CancelButton = styled.button`
  background: #eee;
  color: #333;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-weight: bold;
  &:hover {
    background: #ddd;
  }
`;

const ErrorMsg = styled.div`
  color: #d32f2f;
  margin-bottom: 1rem;
`;

const SuccessMsg = styled.div`
  color: #388e3c;
  margin-bottom: 1rem;
`;
