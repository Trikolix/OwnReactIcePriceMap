import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useUser } from "../context/UserContext";
import { SubmitButton } from "../styles/SharedStyles";

const API_BASE = process.env.REACT_APP_API_BASE_URL;
const ASSET_BASE = (process.env.REACT_APP_ASSET_BASE_URL || "https://ice-app.de/").replace(/\/+$/, "");
const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5 MB

const buildAssetUrl = (path) => {
  if (!path) return null;
  return `${ASSET_BASE}/${path.replace(/^\/+/, "")}`;
};

function UserSettings({ onClose, currentAvatar, onAvatarUpdated }) {
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
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(buildAssetUrl(currentAvatar));
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [objectUrl, setObjectUrl] = useState(null);

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

  useEffect(() => {
    if (!avatarFile && !removeAvatar) {
      setAvatarPreview(buildAssetUrl(currentAvatar));
    }
  }, [currentAvatar, avatarFile, removeAvatar]);

  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

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

  const handleAvatarSelect = (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (file.size > MAX_AVATAR_SIZE) {
      setError("Bitte wähle ein Bild mit maximal 5 MB.");
      event.target.value = "";
      return;
    }

    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }

    const previewUrl = URL.createObjectURL(file);
    setObjectUrl(previewUrl);
    setAvatarPreview(previewUrl);
    setAvatarFile(file);
    setRemoveAvatar(false);
    setError(null);
    event.target.value = "";
  };

  const handleAvatarRemoval = () => {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      setObjectUrl(null);
    }
    setAvatarFile(null);
    setAvatarPreview(null);
    setRemoveAvatar(true);
    setError(null);
  };

  const persistAvatarChange = async () => {
    if (!avatarFile && !removeAvatar) return null;
    const formData = new FormData();
    formData.append("user_id", userId);
    if (removeAvatar) {
      formData.append("remove_avatar", "1");
    } else if (avatarFile) {
      formData.append("avatar", avatarFile);
    }

    const res = await fetch(`${API_BASE}/userManagement/update_avatar.php`, {
      method: "POST",
      body: formData,
    });
    const json = await res.json();
    if (!res.ok || json.error) {
      throw new Error(json.error || "Fehler beim Speichern des Avatars.");
    }
    const newPath = json.avatar_path ?? null;
    setAvatarFile(null);
    setRemoveAvatar(false);
    setAvatarPreview(buildAssetUrl(newPath));
    setObjectUrl(null);
    if (onAvatarUpdated) {
      onAvatarUpdated(newPath);
    }
    return newPath;
  };

  const persistNotificationSettings = async () => {
    const res = await fetch(`${API_BASE}/api/update_user_notification_settings.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, ...settings }),
    });
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error || "Fehler beim Speichern.");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await persistAvatarChange();
      await persistNotificationSettings();
      setSuccess(true);
    } catch (e) {
      setError(e.message || "Fehler beim Speichern.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <ModalOverlay><ModalBox><h2>Einstellungen</h2><p>Lade...</p></ModalBox></ModalOverlay>;

  return (
    <ModalOverlay>
      <ModalBox>
        <h2>Profil & Benachrichtigungen</h2>
        <AvatarSection>
          <AvatarPreviewCircle>
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar Vorschau" />
            ) : (
              <span>Kein Bild</span>
            )}
          </AvatarPreviewCircle>
          <AvatarActions>
            <p>Profilbild</p>
            <FileLabel>
              <span>Bild auswählen</span>
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatarSelect} />
            </FileLabel>
            <SmallNote>PNG, JPG oder WebP · max. 5 MB</SmallNote>
            <InlineButtons>
              <MiniButton type="button" onClick={handleAvatarRemoval} disabled={!avatarPreview && !avatarFile}>
                Avatar entfernen
              </MiniButton>
              {avatarFile && <SelectedFile>{avatarFile.name}</SelectedFile>}
            </InlineButtons>
          </AvatarActions>
        </AvatarSection>
        <Divider />
        <h3>Benachrichtigungseinstellungen</h3>
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

const AvatarSection = styled.div`
  display: flex;
  gap: 1.5rem;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
`;

const AvatarPreviewCircle = styled.div`
  width: 96px;
  height: 96px;
  border-radius: 50%;
  border: 2px dashed #ddd;
  background: #fafafa;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-size: 0.8rem;
  color: #999;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const AvatarActions = styled.div`
  flex: 1;
  min-width: 240px;

  p {
    margin: 0 0 0.5rem;
    font-weight: 600;
  }
`;

const FileLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 999px;
  background: #f3f3f3;
  cursor: pointer;
  font-weight: 600;

  input {
    display: none;
  }
`;

const SmallNote = styled.p`
  font-size: 0.8rem;
  color: #777;
  margin: 0.5rem 0 0;
`;

const InlineButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.5rem;
  flex-wrap: wrap;
`;

const MiniButton = styled.button`
  background: transparent;
  border: none;
  color: #c62828;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const SelectedFile = styled.span`
  font-size: 0.85rem;
  color: #555;
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid #eee;
  margin: 1.5rem 0;
`;
