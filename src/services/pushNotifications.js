import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const WEB_SUBSCRIPTION_TOKEN_KEY = "iceapp:web-push-subscription-token";
const NATIVE_DEVICE_TOKEN_KEY = "iceapp:native-device-token";
const PUSH_SW_PATH = "/push-sw.js";
const PUSH_CONFIG_CACHE_URL = "/__push_config__";
const APP_VERSION = import.meta.env.VITE_APP_VERSION || "dev";

let nativeListenersRegistered = false;
let activeNativeUserId = null;

const ensureApiBase = () => {
  if (!API_BASE) {
    throw new Error("VITE_API_BASE_URL ist nicht gesetzt.");
  }
};

const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
};

export const isWebPushSupported = () => (
  typeof window !== "undefined"
  && "serviceWorker" in navigator
  && "PushManager" in window
  && "Notification" in window
);

export const registerPushServiceWorker = async () => {
  if (!isWebPushSupported()) return null;
  const registration = await navigator.serviceWorker.register(PUSH_SW_PATH, { scope: "/" });
  await navigator.serviceWorker.ready;
  return registration;
};

const persistServiceWorkerToken = async (subscriptionToken) => {
  if (!("caches" in window)) return;
  const cache = await caches.open("iceapp-push-config");
  const body = JSON.stringify({ subscriptionToken, apiBase: API_BASE });
  await cache.put(PUSH_CONFIG_CACHE_URL, new Response(body, {
    headers: { "Content-Type": "application/json" },
  }));
};

export const syncPushConfigToServiceWorker = async () => {
  const token = localStorage.getItem(WEB_SUBSCRIPTION_TOKEN_KEY);
  if (token) {
    await persistServiceWorkerToken(token);
  }
};

const fetchWebPushPublicKey = async () => {
  ensureApiBase();
  const response = await fetch(`${API_BASE}/api/push/web-subscriptions/index.php`);
  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.message || "Web Push ist derzeit nicht verfügbar.");
  }
  return json.public_key;
};

export const enableBrowserPush = async (userId) => {
  ensureApiBase();
  if (!userId) throw new Error("Nutzer nicht gefunden.");
  if (!isWebPushSupported()) throw new Error("Browser-Push wird auf diesem Gerät nicht unterstützt.");

  const registration = await registerPushServiceWorker();
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Benachrichtigungsberechtigung wurde nicht erteilt.");
  }

  const publicKey = await fetchWebPushPublicKey();
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  const response = await fetch(`${API_BASE}/api/push/web-subscriptions/index.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: Number(userId),
      subscription: subscription.toJSON(),
    }),
  });
  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.message || "Web-Push-Subscription konnte nicht gespeichert werden.");
  }

  localStorage.setItem(WEB_SUBSCRIPTION_TOKEN_KEY, json.subscription_token);
  await persistServiceWorkerToken(json.subscription_token);
  return { permission };
};

export const disableBrowserPush = async (userId) => {
  ensureApiBase();
  if (!isWebPushSupported()) return;

  const registration = await navigator.serviceWorker.getRegistration("/");
  const subscription = await registration?.pushManager?.getSubscription?.();
  const endpoint = subscription?.endpoint || null;

  if (userId) {
    await fetch(`${API_BASE}/api/push/web-subscriptions/index.php`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: Number(userId),
        endpoint,
      }),
    });
  }

  if (subscription) {
    await subscription.unsubscribe();
  }

  localStorage.removeItem(WEB_SUBSCRIPTION_TOKEN_KEY);
  await persistServiceWorkerToken("");
};

const installNativeListeners = () => {
  if (nativeListenersRegistered) return;

  PushNotifications.addListener("registration", async (token) => {
    const deviceToken = token?.value;
    if (!activeNativeUserId || !deviceToken || !API_BASE) return;

    localStorage.setItem(NATIVE_DEVICE_TOKEN_KEY, deviceToken);
    await fetch(`${API_BASE}/api/push/mobile-devices/index.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: Number(activeNativeUserId),
        platform: "android",
        provider: "fcm",
        app_version: APP_VERSION,
        device_token: deviceToken,
      }),
    });
  });

  PushNotifications.addListener("registrationError", (error) => {
    console.error("Push registration error", error);
  });

  PushNotifications.addListener("pushNotificationActionPerformed", (event) => {
    const deeplink = event?.notification?.data?.deeplink;
    if (deeplink) {
      window.location.href = deeplink;
    }
  });

  nativeListenersRegistered = true;
};

export const initializeNativePush = async (userId) => {
  ensureApiBase();
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") return;
  if (!userId) return;

  activeNativeUserId = userId;
  installNativeListeners();

  let permissionState = "granted";
  if (typeof PushNotifications.checkPermissions === "function") {
    const permissions = await PushNotifications.checkPermissions();
    permissionState = permissions.receive;
  }

  if (permissionState !== "granted" && typeof PushNotifications.requestPermissions === "function") {
    const permissions = await PushNotifications.requestPermissions();
    permissionState = permissions.receive;
  }

  if (permissionState !== "granted") {
    throw new Error("Android-Benachrichtigungen wurden nicht freigegeben.");
  }

  await PushNotifications.register();
};

export const disableNativePush = async (userId) => {
  ensureApiBase();
  const deviceToken = localStorage.getItem(NATIVE_DEVICE_TOKEN_KEY);
  if (Capacitor.isNativePlatform() && typeof PushNotifications.unregister === "function") {
    try {
      await PushNotifications.unregister();
    } catch (error) {
      console.warn("Native push unregister failed", error);
    }
  }

  if (userId && deviceToken) {
    await fetch(`${API_BASE}/api/push/mobile-devices/index.php`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: Number(userId),
        device_token: deviceToken,
      }),
    });
  }

  localStorage.removeItem(NATIVE_DEVICE_TOKEN_KEY);
  activeNativeUserId = null;
};

export const getBrowserPushStatus = async () => {
  if (!isWebPushSupported()) {
    return {
      supported: false,
      permission: "unsupported",
    };
  }

  const registration = await navigator.serviceWorker.getRegistration("/");
  const subscription = await registration?.pushManager?.getSubscription?.();
  return {
    supported: true,
    permission: Notification.permission,
    subscribed: Boolean(subscription),
  };
};
