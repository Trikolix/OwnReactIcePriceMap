import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { useUser } from "../context/UserContext";
import {
  initializeNativePush,
  registerPushServiceWorker,
  syncPushConfigToServiceWorker,
} from "../services/pushNotifications";

const PushBootstrap = () => {
  const { userId, isLoggedIn } = useUser();
  const nativeInitializedForUserRef = useRef(null);

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
