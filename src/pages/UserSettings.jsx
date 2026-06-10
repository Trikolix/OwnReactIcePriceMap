import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { createPortal } from "react-dom";
import Cropper from "react-easy-crop";
import getCroppedImg from "../utils/cropImage";
import styled from "styled-components";
import { useUser } from "../context/UserContext";
import { SubmitButton } from "../styles/SharedStyles";
import { Capacitor } from "@capacitor/core";
import {
  disableBrowserPush,
  disableNativePush,
  enableBrowserPush,
  getBrowserPushStatus,
  initializeNativePush,
} from "../services/pushNotifications";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const ASSET_BASE = (import.meta.env.VITE_ASSET_BASE_URL || "https://ice-app.de/").replace(/\/+$/, "");
const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5 MB

const buildAssetUrl = (path) => {
  if (!path) return null;
  return `${ASSET_BASE}/${path.replace(/^\/+/, "")}`;
};

const normalizePath = (value) => (value || "").replace(/^\/+/, "");

function UserSettings({ onClose, currentAvatar, onAvatarUpdated }) {
  const { userId, currentLevel, setCurrentLevel } = useUser();
  const [socialAccounts, setSocialAccounts] = useState({ instagram_account: '', strava_account: '' });
  const [settings, setSettings] = useState({
    notify_checkin_mention: 1,
    notify_checkin_mention_push: 1,
    notify_comment: 1,
    notify_comment_push: 1,
    notify_comment_participated: 1,
    notify_comment_participated_push: 1,
    notify_news: 1,
    notify_news_push: 1,
    notify_team_challenge: 1,
    notify_team_challenge_push: 1,
    notify_photo_challenge: 1,
    notify_photo_challenge_push: 1,
    push_enabled_web: 1,
    push_enabled_android: 1,
  });
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState(null);
  const [error, setError] = useState(null);
  const [successSection, setSuccessSection] = useState(null);
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
  const [presetAvatarLevel, setPresetAvatarLevel] = useState(null);
  const [selectedPresetId, setSelectedPresetId] = useState(null);
  const [pendingPresetId, setPendingPresetId] = useState(null);
  const [showPresetPicker, setShowPresetPicker] = useState(false);
  const [browserPushStatus, setBrowserPushStatus] = useState({ supported: false, permission: "default", subscribed: false });
  const selectedPreset = selectedPresetId
    ? presetAvatars.find((preset) => preset.id === selectedPresetId) || null
    : null;
  const normalizedCurrentAvatar = normalizePath(currentAvatar);
  const normalizedSelectedPresetPath = normalizePath(selectedPreset?.path);
  const hasPresetChange = !!selectedPreset && normalizedSelectedPresetPath !== normalizedCurrentAvatar;
  const canResetAvatar = !!avatarFile || removeAvatar || hasPresetChange;
  const displayedPresetLevel = Number(presetAvatarLevel ?? currentLevel ?? 0);
  const isBusy = Boolean(savingSection);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch(`${API_BASE}/api/get_user_notification_settings.php`);
        const json = await res.json();
        setSettings(json);
      } catch (e) {
        setError("Fehler beim Laden der Einstellungen.");
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
    async function fetchProfile() {
      try {
        const profileRes = await fetch(`${API_BASE}/api/get_user_profile.php`);
        if (profileRes.ok) {
          const profileJson = await profileRes.json();
          setSocialAccounts({
            instagram_account: profileJson.instagram_account || '',
            strava_account: profileJson.strava_account || ''
          });
        }
      } catch (e) {
        console.error("Fehler beim Laden des Profils.", e);
      }
    }
    fetchProfile();
  }, [userId]);

  useEffect(() => {
    getBrowserPushStatus()
      .then(setBrowserPushStatus)
      .catch(() => {
        setBrowserPushStatus({ supported: false, permission: "unsupported", subscribed: false });
      });
  }, []);

  useEffect(() => {
    let ignore = false;
    async function fetchPresets() {
      try {
        const res = await fetch(`${API_BASE}/api/get_preset_avatars.php`);
        const json = await res.json();
        if (!ignore && Array.isArray(json.avatars)) {
          setPresetAvatars(json.avatars);
          setPresetAvatarLevel(Number(json.current_level || 0));
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
    } else {
      setSelectedPresetId((prev) => (prev ? null : prev));
    }
  }, [currentAvatar, presetAvatars]);

  useEffect(() => {
    const { body } = document;
    const previousOverflow = body.style.overflow;
    const previousTouchAction = body.style.touchAction;

    body.style.overflow = "hidden";
    body.style.touchAction = "none";

    return () => {
      body.style.overflow = previousOverflow;
      body.style.touchAction = previousTouchAction;
    };
  }, []);

  const handleChange = (e) => {
    const { name, checked } = e.target;

    setSettings((prev) => {
      const nextSettings = { ...prev, [name]: checked ? 1 : 0 };

      if (name === 'notify_comment_participated' && checked) {
        nextSettings.notify_comment = 1;
      }
      if (name === 'notify_comment_participated_push' && checked) {
        nextSettings.notify_comment_push = 1;
      }

      if (name === 'notify_comment' && !checked) {
        nextSettings.notify_comment_participated = 0;
      }
      if (name === 'notify_comment_push' && !checked) {
        nextSettings.notify_comment_participated_push = 0;
      }

      return nextSettings;
    });
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

  const openPresetPicker = () => {
    setPendingPresetId(selectedPresetId);
    setError(null);
    setShowPresetPicker(true);
  };

  const handlePendingPresetSelect = (preset) => {
    if (!preset) return;
    if (preset.unlocked === false) {
      setError(`Dieser Avatar ist erst ab Level ${preset.min_level || 0} verfügbar.`);
      return;
    }
    setPendingPresetId(preset.id);
    setError(null);
  };

  const handlePresetPickerSave = () => {
    const preset = presetAvatars.find((item) => item.id === pendingPresetId);
    if (!preset) return;
    if (preset.unlocked === false) {
      setError(`Dieser Avatar ist erst ab Level ${preset.min_level || 0} verfügbar.`);
      return;
    }
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      setObjectUrl(null);
    }
    setAvatarFile(null);
    setRemoveAvatar(false);
    setSelectedPresetId(preset.id);
    setAvatarPreview(buildAssetUrl(preset.path));
    setError(null);
    setShowPresetPicker(false);
  };

  const handlePresetPickerCancel = () => {
    setPendingPresetId(null);
    setShowPresetPicker(false);
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
    const avatarCacheKey = userId ? `avatarUrl:${userId}` : null;
    if (avatarCacheKey) {
      if (newPath) {
        localStorage.setItem(avatarCacheKey, newPath);
      } else {
        localStorage.removeItem(avatarCacheKey);
      }
      localStorage.removeItem('avatarUrl');
    }
    window.dispatchEvent(new CustomEvent("avatar-updated", {
      detail: { userId, avatarUrl: newPath }
    }));
    if (json.current_level != null) {
      setCurrentLevel(json.current_level);
      setPresetAvatarLevel(Number(json.current_level || 0));
    }
    if (Array.isArray(json.new_awards) && json.new_awards.length > 0) {
      window.dispatchEvent(new CustomEvent("new-awards", { detail: json.new_awards }));
    }
    setAvatarFile(null);
    setRemoveAvatar(false);
    setAvatarPreview(buildAssetUrl(newPath));
    setObjectUrl(null);
    if (onAvatarUpdated) {
      onAvatarUpdated(newPath);
    }
    return newPath;
  };

  const persistNotificationSettings = async (targetSettings = settings) => {
    const res = await fetch(`${API_BASE}/api/update_user_notification_settings.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(targetSettings),
    });
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error || "Fehler beim Speichern.");
    }
  };

  const handleSaveAvatar = async () => {
    setSavingSection("avatar");
    setError(null);
    setSuccessSection(null);
    try {
      await persistAvatarChange();
      setSuccessSection("avatar");
    } catch (e) {
      setError(e.message || "Fehler beim Speichern des Avatars.");
    } finally {
      setSavingSection(null);
    }
  };

  const handleSaveNotifications = async () => {
    setSavingSection("notifications");
    setError(null);
    setSuccessSection(null);
    try {
      const hasAnyPushEnabled = Object.keys(settings).some(key => key.endsWith('_push') && settings[key] === 1);
      const isNative = Capacitor.isNativePlatform();

      const updatedSettings = {
        ...settings,
        push_enabled_web: (!isNative && hasAnyPushEnabled) ? 1 : (isNative ? settings.push_enabled_web : 0),
        push_enabled_android: (isNative && hasAnyPushEnabled) ? 1 : (!isNative ? settings.push_enabled_android : 0),
      };

      await persistNotificationSettings(updatedSettings);

      if (isNative) {
        // Native Plattform (Android)
        if (hasAnyPushEnabled) {
          await initializeNativePush(userId);
        } else {
          await disableNativePush(userId);
        }
      } else {
        // Web Plattform
        if (hasAnyPushEnabled) {
          await enableBrowserPush(userId);
        } else {
          await disableBrowserPush(userId);
        }
      }

      setBrowserPushStatus(await getBrowserPushStatus());
      setSettings(updatedSettings);
      setSuccessSection("notifications");
    } catch (e) {
      setError(e.message || "Fehler beim Speichern der Benachrichtigungen.");
    } finally {
      setSavingSection(null);
    }
  };

  const handleSaveSocialAccounts = async () => {
    setSavingSection("social");
    setError(null);
    setSuccessSection(null);
    try {
      const res = await fetch(`${API_BASE}/api/update_user_profile.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(socialAccounts),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.error) {
        throw new Error(json.error || "Fehler beim Speichern der Social Media Accounts.");
      }
      setSuccessSection("social");
    } catch (e) {
      setError(e.message || "Fehler beim Speichern der Social Media Accounts.");
    } finally {
      setSavingSection(null);
    }
  };

  const handleSendTest = async () => {
    const isNative = Capacitor.isNativePlatform();
    
    if (!isNative && browserPushStatus.permission !== 'granted') {
      alert("Push-Berechtigung ist nicht erteilt. Bitte aktiviere Push zuerst in den Browsereinstellungen oder speichere die Einstellungen.");
      return;
    }
    
    try {
      const res = await fetch(`${API_BASE}/api/push/send-test.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      const json = await res.json();
      if (!json.success) {
        alert(`Senden fehlgeschlagen: ${json.message}`);
      } else {
        alert("Test-Benachrichtigung wurde versendet. Schau mal auf dein Handy!");
      }
    } catch (e) {
      alert(`Fehler: ${e.message}`);
    }
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('openDelete') === '1') {
      setShowDeleteConfirm(true);
      // Optional: Scroll to bottom after a short delay to ensure DOM is ready
      setTimeout(() => {
        const modal = document.querySelector('[class*="ModalBox"]');
        if (modal) modal.scrollTo({ top: modal.scrollHeight, behavior: 'smooth' });
      }, 300);
    }
  }, [location.search]);

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (!deletePassword) {
      setError("Bitte gib dein Passwort zur Bestätigung ein.");
      return;
    }

    if (!deleteConfirmed) {
      setError("Bitte bestätige, dass du die Konsequenzen verstehst.");
      return;
    }

    if (!window.confirm("Bist du sicher? Dein Account wird zur Löschung markiert und du wirst sofort abgemeldet.")) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/userManagement/request_deletion.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Fehler beim Beantragen der Löschung.");
      }

      alert(json.message);
      window.location.href = "/"; // Hartes Redirect zur Startseite
    } catch (e) {
      setError(e.message);
      setDeleting(false);
    }
  };

  const modalContent = (
    <ModalOverlay>
      <ModalBox>
        <TopCloseButton type="button" onClick={onClose} aria-label="Einstellungen schließen">
          ×
        </TopCloseButton>
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
                onClick={openPresetPicker}
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
          </AvatarActions>
        </AvatarSection>
        <SectionActions>
          <SubmitButton type="button" onClick={handleSaveAvatar} disabled={isBusy || !canResetAvatar}>
            {savingSection === "avatar" ? "Speichert..." : "Avatar speichern"}
          </SubmitButton>
          {successSection === "avatar" && <SuccessMsg>Avatar gespeichert.</SuccessMsg>}
        </SectionActions>
        {showPresetPicker && (
          <PresetModalOverlay>
            <PresetModalBox>
              <PresetModalHeader>
                <div>
                  <h3>Comic Avatar auswählen</h3>
                  <PresetInfo>Dein Level: {displayedPresetLevel}</PresetInfo>
                </div>
                <TopCloseButton type="button" onClick={handlePresetPickerCancel} aria-label="Comic Avatar Auswahl schließen">
                  ×
                </TopCloseButton>
              </PresetModalHeader>
              <LargePresetPreview>
                {pendingPresetId ? (
                  <img
                    src={buildAssetUrl(presetAvatars.find((preset) => preset.id === pendingPresetId)?.path)}
                    alt="Ausgewählter Comic Avatar"
                  />
                ) : avatarPreview ? (
                  <img src={avatarPreview} alt="Aktueller Avatar" />
                ) : (
                  <span>Kein Avatar ausgewählt</span>
                )}
              </LargePresetPreview>
              <PresetModalGrid>
                {error && <PresetModalError>{error}</PresetModalError>}
                {presetAvatars.map((preset) => {
                  const presetUrl = buildAssetUrl(preset.path);
                  const isActive = pendingPresetId === preset.id;
                  const isUnlocked = preset.unlocked !== false;
                  const requiredLevel = Number(preset.min_level || 0);
                  return (
                    <PresetButton
                      key={preset.id}
                      type="button"
                      onClick={() => handlePendingPresetSelect(preset)}
                      aria-pressed={isActive}
                      disabled={!isUnlocked}
                      $selected={isActive}
                      $locked={!isUnlocked}
                    >
                      <img src={presetUrl} alt={preset.label} />
                      <span>{preset.label}</span>
                      {!isUnlocked && <PresetLockBadge>Ab Level {requiredLevel}</PresetLockBadge>}
                    </PresetButton>
                  );
                })}
              </PresetModalGrid>
              <PresetModalActions>
                <SubmitButton type="button" onClick={handlePresetPickerSave} disabled={!pendingPresetId}>
                  Speichern
                </SubmitButton>
                <CancelButton type="button" onClick={handlePresetPickerCancel}>Abbrechen</CancelButton>
              </PresetModalActions>
            </PresetModalBox>
          </PresetModalOverlay>
        )}
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
        
        <SettingsTable>
          <thead>
            <tr>
              <th>Ereignis</th>
              <th>E-Mail</th>
              <th>
                Push
                {Number(userId) === 1 && (
                  <MiniButton type="button" onClick={handleSendTest} style={{ color: '#0277bd', fontSize: '0.7rem', marginLeft: '0.5rem' }}>
                    (Test)
                  </MiniButton>
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Verlinkung in Checkins</td>
              <td><input type="checkbox" name="notify_checkin_mention" checked={!!settings.notify_checkin_mention} onChange={handleChange} /></td>
              <td><input type="checkbox" name="notify_checkin_mention_push" checked={!!settings.notify_checkin_mention_push} onChange={handleChange} /></td>
            </tr>
            <tr>
              <td>Kommentare an eigenen Checkins</td>
              <td><input type="checkbox" name="notify_comment" checked={!!settings.notify_comment} onChange={handleChange} /></td>
              <td><input type="checkbox" name="notify_comment_push" checked={!!settings.notify_comment_push} onChange={handleChange} /></td>
            </tr>
            <tr style={{ opacity: (settings.notify_comment || settings.notify_comment_push) ? 1 : 0.5 }}>
              <td style={{ paddingLeft: '1.5rem', fontSize: '0.85rem' }}>↳ auch wenn nur mitkommentiert</td>
              <td><input type="checkbox" name="notify_comment_participated" checked={!!settings.notify_comment_participated} onChange={handleChange} disabled={!settings.notify_comment && !settings.notify_comment_push} /></td>
              <td><input type="checkbox" name="notify_comment_participated_push" checked={!!settings.notify_comment_participated_push} onChange={handleChange} disabled={!settings.notify_comment && !settings.notify_comment_push} /></td>
            </tr>
            <tr>
              <td>Systemmeldungen & News</td>
              <td><input type="checkbox" name="notify_news" checked={!!settings.notify_news} onChange={handleChange} /></td>
              <td><input type="checkbox" name="notify_news_push" checked={!!settings.notify_news_push} onChange={handleChange} /></td>
            </tr>
            <tr>
              <td>Team-Challenges</td>
              <td><input type="checkbox" name="notify_team_challenge" checked={!!settings.notify_team_challenge} onChange={handleChange} /></td>
              <td><input type="checkbox" name="notify_team_challenge_push" checked={!!settings.notify_team_challenge_push} onChange={handleChange} /></td>
            </tr>
            <tr>
              <td>Photo-Challenges</td>
              <td><input type="checkbox" name="notify_photo_challenge" checked={!!settings.notify_photo_challenge} onChange={handleChange} /></td>
              <td><input type="checkbox" name="notify_photo_challenge_push" checked={!!settings.notify_photo_challenge_push} onChange={handleChange} /></td>
            </tr>
          </tbody>
        </SettingsTable>

        {browserPushStatus.supported && browserPushStatus.permission === 'denied' && (
          <SmallNote style={{ color: '#c62828', marginTop: '0.5rem' }}>
            Hinweis: Push-Benachrichtigungen sind im Browser blockiert. Bitte in den Browsereinstellungen freigeben.
          </SmallNote>
        )}

        <SectionActions>
          <SubmitButton type="button" onClick={handleSaveNotifications} disabled={isBusy}>
            {savingSection === "notifications" ? "Speichert..." : "Benachrichtigungen speichern"}
          </SubmitButton>
          {successSection === "notifications" && <SuccessMsg>Benachrichtigungen gespeichert.</SuccessMsg>}
        </SectionActions>

        <Divider />
        <h3>Social Media Accounts</h3>
        <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1rem' }}>Verlinke deine Accounts, um sie auf deinem Profil anzuzeigen.</p>
        <SocialInputGroup>
          <label>Instagram Benutzername oder Link:</label>
          <input 
            type="text" 
            placeholder="z.B. https://instagram.com/iceapp oder @iceapp" 
            value={socialAccounts.instagram_account}
            onChange={(e) => setSocialAccounts({...socialAccounts, instagram_account: e.target.value})}
          />
        </SocialInputGroup>
        <SocialInputGroup>
          <label>Strava Profil-Link:</label>
          <input 
            type="text" 
            placeholder="z.B. https://www.strava.com/athletes/12345" 
            value={socialAccounts.strava_account}
            onChange={(e) => setSocialAccounts({...socialAccounts, strava_account: e.target.value})}
          />
        </SocialInputGroup>
        <SectionActions>
          <SubmitButton type="button" onClick={handleSaveSocialAccounts} disabled={isBusy}>
            {savingSection === "social" ? "Speichert..." : "Social Media speichern"}
          </SubmitButton>
          {successSection === "social" && <SuccessMsg>Social Media gespeichert.</SuccessMsg>}
        </SectionActions>

        {error && <ErrorMsg>{error}</ErrorMsg>}
        <ButtonRow>
          <CancelButton type="button" onClick={onClose}>Schließen</CancelButton>
        </ButtonRow>

        <Divider />
        <DangerZone>
          <h4>Account löschen</h4>
          <p>Hier kannst du deinen Account dauerhaft löschen.</p>
          {!showDeleteConfirm ? (
            <DeleteTriggerButton type="button" onClick={() => setShowDeleteConfirm(true)}>
              Account löschen beantragen
            </DeleteTriggerButton>
          ) : (
            <DeleteForm onSubmit={handleDeleteAccount}>
              <p>Bitte gib dein Passwort ein, um die Löschung zu bestätigen:</p>
              <input 
                type="password" 
                placeholder="Dein Passwort" 
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                required
                autoFocus
              />
              <ConfirmationLabel>
                <input 
                  type="checkbox" 
                  checked={deleteConfirmed} 
                  onChange={(e) => setDeleteConfirmed(e.target.checked)} 
                />
                <span>Ich verstehe, dass mein Profil dauerhaft anonymisiert wird. Persönliche Daten (Favoriten, Profilbild) werden gelöscht, während meine Beiträge (Preise, Kommentare) anonymisiert erhalten bleiben.</span>
              </ConfirmationLabel>
              <DeleteActions>
                <ConfirmDeleteButton type="submit" disabled={deleting || !deleteConfirmed}>
                  {deleting ? "Wird verarbeitet..." : "Löschung jetzt beantragen"}
                </ConfirmDeleteButton>
                <CancelButton type="button" onClick={() => { setShowDeleteConfirm(false); setDeletePassword(""); }}>
                  Abbrechen
                </CancelButton>
              </DeleteActions>
            </DeleteForm>
          )}
        </DangerZone>
      </ModalBox>
    </ModalOverlay>
  );

  if (loading) {
    return createPortal(
      <ModalOverlay><ModalBox><h2>Einstellungen</h2><p>Lade...</p></ModalBox></ModalOverlay>,
      document.body
    );
  }

  return createPortal(modalContent, document.body);

}
export default UserSettings;



const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 4000;
`;

const ModalBox = styled.div`
  position: relative;
  background: white;
  padding: 2rem;
  border-radius: 16px;
  width: min(1040px, calc(100vw - 48px));
  min-width: 320px;
  max-width: 96vw;
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

const ButtonRow = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
  flex-wrap: wrap;
`;

const CancelButton = styled.button`
  background-color: #eee;
  color: #333;
  padding: 0.7rem 1.1rem;
  margin: 0px 4px 0px 4px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-weight: bold;
  font-size: 1rem;
  transition: background-color 0.15s ease;
`;

const TopCloseButton = styled.button`
  position: absolute;
  top: 0.9rem;
  right: 0.9rem;
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 999px;
  border: 1px solid rgba(47, 33, 0, 0.12);
  background: rgba(255, 255, 255, 0.94);
  color: #5b4520;
  font-size: 1.35rem;
  line-height: 1;
  cursor: pointer;

  &:hover {
    background: rgba(255, 181, 34, 0.14);
  }
`;

const ErrorMsg = styled.div`
  color: #d32f2f;
  margin-top: 1rem;
`;

const SuccessMsg = styled.div`
  color: #388e3c;
  margin-top: 1rem;
`;

const AvatarSection = styled.div`
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
  margin-bottom: 1rem;
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

const SectionActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1rem;
  flex-wrap: wrap;
`;

const PresetInfo = styled.p`
  margin: 0;
  font-size: 0.8rem;
  color: #777;
`;

const PresetButton = styled.button`
  border: 2px solid ${({ $selected }) => ($selected ? '#4caf50' : 'transparent')};
  border-radius: 16px;
  padding: 0.5rem;
  background: ${({ $selected, $locked }) => ($selected ? 'rgba(76,175,80,0.12)' : $locked ? '#f1f1f1' : '#f9f9f9')};
  cursor: ${({ $locked }) => ($locked ? 'not-allowed' : 'pointer')};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  transition: border 0.2s ease, background 0.2s ease, transform 0.2s ease;
  opacity: ${({ $locked }) => ($locked ? 0.72 : 1)};

  &:hover:enabled {
    transform: translateY(-2px);
  }

  img {
    width: 72px;
    height: 72px;
    border-radius: 16px;
    border: 1px solid rgba(0,0,0,0.08);
    background: white;
    object-fit: cover;
    filter: ${({ $locked }) => ($locked ? 'grayscale(1)' : 'none')};
  }

  span {
    font-size: 0.75rem;
    color: #555;
    text-align: center;
  }
`;

const PresetLockBadge = styled.small`
  display: inline-flex;
  justify-content: center;
  width: 100%;
  min-height: 1rem;
  font-size: 0.68rem;
  font-weight: 700;
  color: #8a5a00;
  text-align: center;
`;

const PresetModalOverlay = styled(ModalOverlay)`
  z-index: 5200;
  background: rgba(0,0,0,0.6);
`;

const PresetModalBox = styled.div`
  position: relative;
  background: white;
  border-radius: 16px;
  box-shadow: 0 18px 50px rgba(0,0,0,0.24);
  width: min(760px, calc(100vw - 32px));
  height: min(90vh, 820px);
  max-height: min(90vh, 820px);
  display: grid;
  grid-template-rows: 10fr 25fr 57fr 8fr;
  overflow: hidden;
`;

const PresetModalHeader = styled.div`
  min-height: 0;
  padding: 0.75rem 1.5rem 0.5rem;
  display: flex;
  align-items: center;

  h3 {
    margin: 0 2.6rem 0.15rem 0;
    color: #2f2100;
  }
`;

const LargePresetPreview = styled.div`
  min-height: 0;
  padding: 0.35rem 1.5rem 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #eee;
  color: #888;

  img {
    width: 128px;
    height: 128px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(76,175,80,0.28);
    background: #fafafa;
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  }
`;

const PresetModalError = styled(ErrorMsg)`
  grid-column: 1 / -1;
  margin: 0 0 0.25rem;
`;

const PresetModalGrid = styled.div`
  min-height: 0;
  padding: 0.85rem 1.5rem;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
  gap: 0.75rem;
  overscroll-behavior: contain;
`;

const PresetModalActions = styled.div`
  min-height: 0;
  padding: 0.45rem 0.75rem;
  border-top: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  background: #fff;

  button {
    padding: 0.45rem 0.85rem;
    font-size: 0.9rem;
    border-radius: 8px;
  }

  @media (max-width: 520px) {
    justify-content: stretch;

    button {
      flex: 1;
    }
  }
`;

// Crop modal styles
const CropModalOverlay = styled(ModalOverlay)`
  z-index: 5000;
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

const SettingsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 0.5rem;
  
  th, td {
    padding: 0.75rem 0.5rem;
    text-align: left;
    border-bottom: 1px solid #eee;
  }
  
  th {
    font-size: 0.85rem;
    color: #888;
    text-transform: uppercase;
    font-weight: 700;
  }
  
  td:first-child {
    font-weight: 500;
    color: #333;
  }
  
  td:not(:first-child) {
    text-align: center;
  }

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }
`;

const SocialInputGroup = styled.div`
  margin-bottom: 1rem;
  label {
    display: block;
    font-size: 0.9rem;
    color: #444;
    margin-bottom: 0.25rem;
  }
  input {
    width: 100%;
    padding: 0.6rem;
    border: 1px solid #ccc;
    border-radius: 6px;
    font-size: 1rem;
  }
`;

const DangerZone = styled.div`
  margin-top: 2rem;
  padding: 1rem;
  border: 1px solid #ffcdd2;
  border-radius: 12px;
  background: #fff8f8;

  h4 {
    margin: 0 0 0.5rem;
    color: #c62828;
  }

  p {
    margin: 0 0 1rem;
    font-size: 0.9rem;
    color: #666;
  }
`;

const DeleteTriggerButton = styled.button`
  background: #f44336;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  width: 100%;

  &:hover {
    background: #d32f2f;
  }
`;

const DeleteForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;

  input {
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 1rem;
  }
`;

const DeleteActions = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const ConfirmationLabel = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  font-size: 0.85rem;
  color: #555;
  cursor: pointer;
  margin: 0.5rem 0;
  max-width: 450px;

  input[type="checkbox"] {
    margin-top: 0.2rem;
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  span {
    line-height: 1.4;
  }
`;

const ConfirmDeleteButton = styled.button`
  background: #c62828;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  flex: 1;
  min-width: 150px;

  &:disabled {
    background: #e57373;
    cursor: not-allowed;
  }
`;
