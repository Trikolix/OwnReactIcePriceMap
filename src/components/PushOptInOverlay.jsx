import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import styled from "styled-components";
import { BellRing, Clock3, Settings, XCircle } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { useUser } from "../context/UserContext";
import {
  enableBrowserPush,
  getBrowserPushStatus,
  initializeNativePush,
  isWebPushSupported,
} from "../services/pushNotifications";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const REMIND_AFTER_MS = 7 * 24 * 60 * 60 * 1000;
const PUSH_KEYS = [
  "notify_checkin_mention_push",
  "notify_comment_push",
  "notify_comment_participated_push",
  "notify_news_push",
  "notify_team_challenge_push",
  "notify_photo_challenge_push",
];

const DEFAULT_SETTINGS = {
  notify_checkin_mention: 1,
  notify_comment: 1,
  notify_comment_participated: 1,
  notify_news: 0,
  notify_team_challenge: 1,
  notify_photo_challenge: 1,
  notify_checkin_mention_push: 1,
  notify_comment_push: 1,
  notify_comment_participated_push: 1,
  notify_news_push: 1,
  notify_team_challenge_push: 1,
  notify_photo_challenge_push: 1,
  push_enabled_web: 0,
  push_enabled_android: 0,
};

const storageKeyForUser = (userId) => `iceapp:push-opt-in:${userId}`;

const readPromptState = (userId) => {
  try {
    return JSON.parse(localStorage.getItem(storageKeyForUser(userId)) || "{}");
  } catch (error) {
    return {};
  }
};

const writePromptState = (userId, patch) => {
  const nextState = {
    ...readPromptState(userId),
    ...patch,
  };
  localStorage.setItem(storageKeyForUser(userId), JSON.stringify(nextState));
};

const hasPushEnabled = (settings) => (
  Number(settings?.push_enabled_web || 0) === 1
  || Number(settings?.push_enabled_android || 0) === 1
);

const hasPushEnabledForCurrentPlatform = (settings) => (
  Capacitor.isNativePlatform()
    ? Number(settings?.push_enabled_android || 0) === 1
    : Number(settings?.push_enabled_web || 0) === 1
);

const pushCanRunOnCurrentPlatform = () => {
  if (Capacitor.isNativePlatform()) {
    return Capacitor.getPlatform() === "android";
  }
  return isWebPushSupported();
};

export default function PushOptInOverlay() {
  const { userId, isLoggedIn } = useUser();
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [permissionBlocked, setPermissionBlocked] = useState(false);

  const isNative = useMemo(() => Capacitor.isNativePlatform(), []);
  const isSettingsRoute = location.pathname.startsWith("/account") || location.search.includes("openSettings=1");

  useEffect(() => {
    let cancelled = false;

    const evaluatePrompt = async () => {
      setVisible(false);
      setError("");
      setPermissionBlocked(false);

      if (!API_BASE || !isLoggedIn || !userId || isSettingsRoute || !pushCanRunOnCurrentPlatform()) {
        return;
      }

      const promptState = readPromptState(userId);
      if (promptState.dismissed) return;
      if (promptState.remindAfter && Date.now() < Number(promptState.remindAfter)) return;

      try {
        const response = await fetch(`${API_BASE}/api/get_user_notification_settings.php?user_id=${userId}`);
        const json = await response.json();
        if (cancelled) return;

        const loadedSettings = { ...DEFAULT_SETTINGS, ...json };
        setSettings(loadedSettings);

        let shouldShowPrompt = !hasPushEnabled(loadedSettings) || !hasPushEnabledForCurrentPlatform(loadedSettings);

        if (!shouldShowPrompt && !Capacitor.isNativePlatform()) {
          const status = await getBrowserPushStatus();
          shouldShowPrompt = status.supported && (status.permission !== "granted" || !status.subscribed);
        }

        if (cancelled) return;

        if (shouldShowPrompt) {
          window.setTimeout(() => {
            if (!cancelled) setVisible(true);
          }, 1200);
        }
      } catch (fetchError) {
        console.error("Push settings could not be loaded", fetchError);
      }
    };

    evaluatePrompt();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, userId, isSettingsRoute]);

  useEffect(() => {
    if (!visible) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [visible]);

  const saveSettings = async (nextSettings) => {
    const response = await fetch(`${API_BASE}/api/update_user_notification_settings.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, ...nextSettings }),
    });
    const json = await response.json();
    if (!response.ok || !json.success) {
      throw new Error(json.error || "Einstellungen konnten nicht gespeichert werden.");
    }
  };

  const handleRemindLater = () => {
    writePromptState(userId, { remindAfter: Date.now() + REMIND_AFTER_MS });
    setVisible(false);
  };

  const handleDismiss = () => {
    writePromptState(userId, { dismissed: true, dismissedAt: Date.now() });
    setVisible(false);
  };

  const handleEnablePush = async () => {
    setBusy(true);
    setError("");
    setPermissionBlocked(false);

    try {
      if (isNative) {
        await initializeNativePush(userId);
      } else {
        await enableBrowserPush(userId);
      }

      const nextSettings = {
        ...settings,
        ...Object.fromEntries(PUSH_KEYS.map((key) => [key, 1])),
        push_enabled_web: isNative ? Number(settings.push_enabled_web || 0) : 1,
        push_enabled_android: isNative ? 1 : Number(settings.push_enabled_android || 0),
      };

      await saveSettings(nextSettings);
      writePromptState(userId, { activatedAt: Date.now(), dismissed: true });
      setVisible(false);
    } catch (activationError) {
      const isBlocked = !isNative
        && typeof Notification !== "undefined"
        && Notification.permission === "denied";

      if (isBlocked) {
        setPermissionBlocked(true);
        setError("Benachrichtigungen sind für diese Website im Browser blockiert.");
      } else {
        setError(activationError.message || "Push-Benachrichtigungen konnten nicht aktiviert werden.");
      }
    } finally {
      setBusy(false);
    }
  };

  if (!visible) return null;

  return createPortal(
    <Overlay role="presentation">
      <Dialog role="dialog" aria-modal="true" aria-labelledby="push-opt-in-title">
        <IconWrap aria-hidden="true">
          <BellRing size={30} />
        </IconWrap>
        <Title id="push-opt-in-title">Push-Benachrichtigungen sind da</Title>
        <Text>
          Ice App kann dich jetzt direkt informieren, wenn es neue Kommentare, Check-in-Erwähnungen,
          Team-Challenges oder News gibt.
        </Text>
        <Hint>
          Die Details steuerst du jederzeit in deinen Benachrichtigungseinstellungen.
        </Hint>

        {error && <ErrorText>{error}</ErrorText>}
        {permissionBlocked && (
          <BrowserHelp>
            Öffne die Website-Informationen deines Browsers, meist über das Schloss- oder Regler-Symbol
            links neben der Adresse. Erlaube dort Benachrichtigungen für diese Website und klicke danach
            erneut auf Push aktivieren.
          </BrowserHelp>
        )}

        <Actions>
          <PrimaryButton type="button" onClick={handleEnablePush} disabled={busy}>
            <BellRing size={18} />
            {busy ? "Aktiviere..." : "Push aktivieren"}
          </PrimaryButton>
          <SecondaryLink to="/account/settings" onClick={() => setVisible(false)}>
            <Settings size={17} />
            Einstellungen
          </SecondaryLink>
          <SecondaryButton type="button" onClick={handleRemindLater}>
            <Clock3 size={17} />
            Spaeter erinnern
          </SecondaryButton>
          <QuietButton type="button" onClick={handleDismiss}>
            <XCircle size={17} />
            Nicht mehr anzeigen
          </QuietButton>
        </Actions>
      </Dialog>
    </Overlay>,
    document.body
  );
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 4200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(20, 16, 8, 0.52);
  backdrop-filter: blur(2px);
`;

const Dialog = styled.div`
  width: min(440px, 100%);
  border-radius: 16px;
  border: 1px solid rgba(47, 33, 0, 0.12);
  background: #fffdf8;
  box-shadow: 0 22px 48px rgba(0, 0, 0, 0.28);
  padding: 1.4rem;
  color: #2f2100;
`;

const IconWrap = styled.div`
  width: 54px;
  height: 54px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: #fff2d2;
  color: #9b5f00;
  margin-bottom: 1rem;
`;

const Title = styled.h2`
  margin: 0 0 0.7rem;
  font-size: 1.45rem;
  line-height: 1.2;
`;

const Text = styled.p`
  margin: 0;
  color: #4b3500;
  line-height: 1.5;
`;

const Hint = styled.p`
  margin: 0.8rem 0 0;
  color: #6b5a39;
  font-size: 0.92rem;
  line-height: 1.45;
`;

const ErrorText = styled.p`
  margin: 1rem 0 0;
  color: #c62828;
  font-weight: 600;
`;

const BrowserHelp = styled.p`
  margin: 0.55rem 0 0;
  padding: 0.75rem;
  border-radius: 10px;
  background: #fff4e5;
  color: #5f3f00;
  font-size: 0.9rem;
  line-height: 1.45;
`;

const Actions = styled.div`
  display: grid;
  gap: 0.65rem;
  margin-top: 1.25rem;
`;

const buttonBase = `
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  border-radius: 10px;
  border: 1px solid transparent;
  padding: 0.65rem 0.9rem;
  font-weight: 700;
  font-size: 0.98rem;
  cursor: pointer;
  text-decoration: none;
`;

const PrimaryButton = styled.button`
  ${buttonBase}
  background: #ffb522;
  border-color: rgba(255, 181, 34, 0.8);
  color: #2f2100;

  &:hover:enabled {
    background: #ffc247;
  }

  &:disabled {
    opacity: 0.7;
    cursor: wait;
  }
`;

const SecondaryButton = styled.button`
  ${buttonBase}
  background: #ffffff;
  border-color: rgba(47, 33, 0, 0.14);
  color: #4b3500;

  &:hover {
    background: #fff7e8;
  }
`;

const SecondaryLink = styled(Link)`
  ${buttonBase}
  background: #ffffff;
  border-color: rgba(47, 33, 0, 0.14);
  color: #4b3500;

  &:hover {
    background: #fff7e8;
  }
`;

const QuietButton = styled.button`
  ${buttonBase}
  background: transparent;
  color: #6b5a39;

  &:hover {
    background: rgba(47, 33, 0, 0.06);
  }
`;
