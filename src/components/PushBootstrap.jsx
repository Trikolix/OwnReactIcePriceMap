import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import { PushNotifications } from "@capacitor/push-notifications";
import {
  initializeNativePush,
  registerPushServiceWorker,
  syncPushConfigToServiceWorker,
} from "../services/pushNotifications";

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

    nativeInitializedForUserRef.current = userId;
    initializeNativePush(userId).catch((error) => {
      console.error("Native push initialization failed", error);
    });
  }, [isLoggedIn, userId]);

  return null;
};

export default PushBootstrap;
