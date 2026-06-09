import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import { PushNotifications } from "@capacitor/push-notifications";
import {
  initializeNativePush,
  reportNativePushClick,
  registerPushServiceWorker,
  syncPushConfigToServiceWorker,
} from "../services/pushNotifications";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const PushBootstrap = () => {
  const { userId, isLoggedIn } = useUser();
  const navigate = useNavigate();
  const nativeInitializedForUserRef = useRef(null);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      PushNotifications.addListener(
        "pushNotificationActionPerformed",
        (action) => {
          const data = action.notification.data;
          reportNativePushClick(data?.delivery_id);
          const deeplink = data?.deeplink;
          if (deeplink) {
            console.log("Navigating to deeplink:", deeplink);
            navigate(deeplink);
          }
        }
      );

      return () => {
        PushNotifications.removeAllListeners();
      };
    }
  }, [navigate]);

  useEffect(() => {
    registerPushServiceWorker().catch((error) => {
      console.error("Service worker registration failed", error);
    });
  }, []);

  useEffect(() => {
    syncPushConfigToServiceWorker().catch((error) => {
      console.error("Push config sync failed", error);
    });
  }, [userId, isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn || !userId) return;
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") return;
    if (nativeInitializedForUserRef.current === userId) return;
    if (!API_BASE) return;

    let cancelled = false;

    const initializeIfEnabled = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/get_user_notification_settings.php?user_id=${userId}`);
        const json = await response.json();
        if (cancelled || Number(json?.push_enabled_android || 0) !== 1) return;

        nativeInitializedForUserRef.current = userId;
        await initializeNativePush(userId);
      } catch (error) {
        console.error("Native push initialization failed", error);
      }
    };

    initializeIfEnabled();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, userId]);

  return null;
};

export default PushBootstrap;
