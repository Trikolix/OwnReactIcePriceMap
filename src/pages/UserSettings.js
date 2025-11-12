import React, { useEffect, useState } from "react";
import Cropper from "react-easy-crop";
import getCroppedImg from "../utils/cropImage";
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

const normalizePath = (value) => (value || "").replace(/^\/+/, "");

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
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [objectUrl, setObjectUrl] = useState(null);
  const [presetAvatars, setPresetAvatars] = useState([]);
  const [selectedPresetId, setSelectedPresetId] = useState(null);
  const [showPresetPicker, setShowPresetPicker] = useState(false);
  const selectedPreset = selectedPresetId
    ? presetAvatars.find((preset) => preset.id === selectedPresetId) || null
    : null;
  const normalizedCurrentAvatar = normalizePath(currentAvatar);
  const normalizedSelectedPresetPath = normalizePath(selectedPreset?.path);
  const hasPresetChange = !!selectedPreset && normalizedSelectedPresetPath !== normalizedCurrentAvatar;
  const canResetAvatar = !!avatarFile || removeAvatar || hasPresetChange;

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
    let ignore = false;
    async function fetchPresets() {
      try {
        const res = await fetch(`${API_BASE}/api/get_preset_avatars.php`);
        const json = await res.json();
        if (!ignore && Array.isArray(json.avatars)) {
          setPresetAvatars(json.avatars);
        }
      } catch (e) {
        console.error("Fehler beim Laden der Comic-Avatare", e);
      }
    }
    fetchPresets();
    return () => {
      ignore = true;
    };
  }, []);

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

  useEffect(() => {
    if (!presetAvatars.length) return;
    const normalizedCurrent = normalizePath(currentAvatar);
    if (!normalizedCurrent) {
      setSelectedPresetId((prev) => (prev ? null : prev));
      setShowPresetPicker(false);
      return;
    }
    const match = presetAvatars.find((preset) => normalizePath(preset.path) === normalizedCurrent);
    if (match) {
      setSelectedPresetId((prev) => (prev === match.id ? prev : match.id));
      setShowPresetPicker(true);
    } else {
      setSelectedPresetId((prev) => (prev ? null : prev));
      setShowPresetPicker(false);
    }
  }, [currentAvatar, presetAvatars]);

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

    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
    setError(null);
    event.target.value = "";
  };

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropSave = async () => {
    try {
      const croppedBlob = await getCroppedImg(cropImageSrc, croppedAreaPixels);
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      const previewUrl = URL.createObjectURL(croppedBlob);
      setObjectUrl(previewUrl);
      setAvatarPreview(previewUrl);
      setAvatarFile(new File([croppedBlob], "avatar.jpg", { type: "image/jpeg" }));
      setRemoveAvatar(false);
      setSelectedPresetId(null);
      setShowPresetPicker(false);
      setShowCropModal(false);
      setCropImageSrc(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
      setError(null);
    } catch (e) {
      setError("Fehler beim Zuschneiden des Bildes.");
    }
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setCropImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const handleAvatarRemoval = () => {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      setObjectUrl(null);
    }
    setAvatarFile(null);
    setAvatarPreview(null);
    setRemoveAvatar(true);
    setSelectedPresetId(null);
    setShowPresetPicker(false);
    setError(null);
  };

  const handlePresetSelect = (preset) => {
    if (!preset) return;
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      setObjectUrl(null);
    }
    setAvatarFile(null);
    setRemoveAvatar(false);
    setSelectedPresetId(preset.id);
    setAvatarPreview(buildAssetUrl(preset.path));
    setError(null);
    setShowPresetPicker(true);
  };

  const handleResetAvatarSelection = () => {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      setObjectUrl(null);
    }
    setAvatarFile(null);
    setRemoveAvatar(false);
    setSelectedPresetId(null);
    setAvatarPreview(buildAssetUrl(currentAvatar));
    setShowPresetPicker(false);
    setError(null);
  };

  const persistAvatarChange = async () => {
    const selectedPresetPath = selectedPreset ? selectedPreset.path : null;
    const normalizedSelectedPreset = normalizePath(selectedPresetPath);
    const hasPresetChangeForSave = !!selectedPreset && normalizedSelectedPreset !== normalizedCurrentAvatar;

    if (!avatarFile && !removeAvatar && !hasPresetChangeForSave) return null;
    const formData = new FormData();
    formData.append("user_id", userId);
    if (removeAvatar) {
      formData.append("remove_avatar", "1");
    } else if (avatarFile) {
      formData.append("avatar", avatarFile);
    } else if (hasPresetChangeForSave && selectedPresetPath) {
      formData.append("preset_avatar", selectedPresetPath);
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
            <FileButtonsRow>
              <FileLabel>
                <span>Bild hochladen</span>
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatarSelect} />
              </FileLabel>
              <SmallNote>PNG, JPG oder WebP · max. 5 MB</SmallNote>
              <PresetToggle
                type="button"
                onClick={() => setShowPresetPicker((prev) => !prev)}
                disabled={!presetAvatars.length}
              >
                Comic Avatar auswählen
              </PresetToggle>
            </FileButtonsRow>
            <InlineButtons>
              <MiniButton type="button" onClick={handleAvatarRemoval} disabled={!avatarPreview && !avatarFile}>
                Avatar entfernen
              </MiniButton>
              <ResetButton type="button" onClick={handleResetAvatarSelection} disabled={!canResetAvatar}>
                Zurücksetzen
              </ResetButton>
              {avatarFile && <SelectedFile>{avatarFile.name}</SelectedFile>}
            </InlineButtons>
            {presetAvatars.length > 0 && showPresetPicker && (
              <PresetSection>
                <PresetHeader>
                  <h4>Comic-Avatare</h4>
                  <PresetInfo>Wähle eine Illustration statt eines eigenen Fotos.</PresetInfo>
                </PresetHeader>
                <PresetGrid>
                  {presetAvatars.map((preset) => {
                    const presetUrl = buildAssetUrl(preset.path);
                    const isActive = !avatarFile && !removeAvatar && selectedPresetId === preset.id;
                    return (
                      <PresetButton
                        key={preset.id}
                        type="button"
                        onClick={() => handlePresetSelect(preset)}
                        aria-pressed={isActive}
                        $selected={isActive}
                      >
                        <img src={presetUrl} alt={preset.label} />
                        <span>{preset.label}</span>
                      </PresetButton>
                    );
                  })}
                </PresetGrid>
              </PresetSection>
            )}
          </AvatarActions>
        </AvatarSection>
        {showCropModal && (
          <CropModalOverlay>
            <CropModalBox>
              <h3>Bild zuschneiden</h3>
              <div className="cropper-area">
                <Cropper
                  image={cropImageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>
              <CropModalActions>
                <SubmitButton type="button" onClick={handleCropSave}>Zuschneiden & übernehmen</SubmitButton>
                <CancelButton type="button" onClick={handleCropCancel}>Abbrechen</CancelButton>
              </CropModalActions>
            </CropModalBox>
          </CropModalOverlay>
        )}
        <Divider />
        <h3>Benachrichtigungseinstellungen</h3>
        {/* ...existing code... */}
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
  max-height: 90vh;
  overflow-y: auto;
  overscroll-behavior: contain;
  box-shadow: 0 2px 16px rgba(0,0,0,0.15);

  @media (max-width: 600px) {
    width: 90vw;
    min-width: unset;
    padding: 1.5rem;
  }
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
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 999px;
  background: #f3f3f3;
  cursor: pointer;
  font-weight: 600;
  white-space: nowrap;
  min-width: 160px;

  input {
    display: none;
  }

  @media (max-width: 600px) {
    width: 100%;
  }
`;

const FileButtonsRow = styled.div`
  display: flex;
  align-items: center;
  align-content: flex-start;
  flex-direction: column;
  flex-wrap: wrap;
  gap: 0.75rem;

  @media (max-width: 600px) {
    align-items: stretch;
  }
`;

const PresetToggle = styled.button`
  border: none;
  border-radius: 999px;
  padding: 0.5rem 1rem;
  background: #e8f5e9;
  color: #2e7d32;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;

  &:hover:enabled {
    background: #d0f0d3;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
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

const ResetButton = styled.button`
  background: transparent;
  border: none;
  color: #1976d2;
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

const PresetSection = styled.div`
  margin-top: 1.5rem;
`;

const PresetHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;

  h4 {
    margin: 0;
  }
`;

const PresetInfo = styled.p`
  margin: 0;
  font-size: 0.8rem;
  color: #777;
`;

const PresetGrid = styled.div`
  margin-top: 0.75rem;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: 0.75rem;
`;

const PresetButton = styled.button`
  border: 2px solid ${({ $selected }) => ($selected ? '#4caf50' : 'transparent')};
  border-radius: 16px;
  padding: 0.5rem;
  background: ${({ $selected }) => ($selected ? 'rgba(76,175,80,0.12)' : '#f9f9f9')};
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  transition: border 0.2s ease, background 0.2s ease, transform 0.2s ease;

  &:hover {
    transform: translateY(-2px);
  }

  img {
    width: 72px;
    height: 72px;
    border-radius: 16px;
    border: 1px solid rgba(0,0,0,0.08);
    background: white;
    object-fit: cover;
  }

  span {
    font-size: 0.75rem;
    color: #555;
    text-align: center;
  }
`;

// Crop modal styles
const CropModalOverlay = styled(ModalOverlay)`
  z-index: 2000;
  background: rgba(0,0,0,0.6);
`;

const CropModalBox = styled(ModalBox)`
  max-width: 420px;
  min-width: 300px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  min-height: 520px;

  h3 {
    margin-bottom: 1rem;
    text-align: center;
  }

  .reactEasyCrop_CropArea {
    border-radius: 50%;
  }

  .cropper-area {
    flex: 1 1 auto;
    min-height: 360px;
    max-height: 380px;
    margin-bottom: 1.5rem;
    position: relative;
    width: 100%;
  }
`;

const CropModalActions = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  justify-content: center;

  button {
    font-size: 1rem;
    padding: 0.5rem 1.2rem;
    min-width: 0;
    border-radius: 8px;
  }
`;
