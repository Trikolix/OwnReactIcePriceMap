import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const WEB_SUBSCRIPTION_TOKEN_KEY = "iceapp:web-push-subscription-token";
const NATIVE_DEVICE_TOKEN_KEY = "iceapp:native-device-token";
const PUSH_SW_PATH = "/push-sw.js";
const PUSH_CONFIG_CACHE_URL = "/__push_config__";
const APP_VERSION = import.meta.env.VITE_APP_VERSION || "dev";
const ANDROID_NOTIFICATION_CHANNEL_ID = "ice_app_notifications";
const SUBSCRIPTION_TOKEN_PATTERN = /^[a-f0-9]{32,64}$/i;

let nativeListenersRegistered = false;
let activeNativeUserId = null;
let navigationHandler = null;

export const setPushNavigationHandler = (handler) => {
  navigationHandler = handler;
};

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

const savePushConfigToIndexedDb = (config) => new Promise((resolve) => {
  if (typeof window === "undefined" || !("indexedDB" in window)) return resolve();
  try {
    const request = indexedDB.open("iceapp-push-db", 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("config")) {
        db.createObjectStore("config");
      }
    };
    request.onsuccess = (e) => {
      const db = e.target.result;
      try {
        const tx = db.transaction("config", "readwrite");
        const store = tx.objectStore("config");
        store.put(config, "pushConfig");
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    };
    request.onerror = () => resolve();
  } catch {
    resolve();
  }
});

export const registerPushServiceWorker = async () => {
  if (!isWebPushSupported()) return null;
  const registration = await navigator.serviceWorker.register(PUSH_SW_PATH, { scope: "/" });
  await navigator.serviceWorker.ready;
  return registration;
};

const persistServiceWorkerToken = async (subscriptionToken, userId = null) => {
  const config = { subscriptionToken, apiBase: API_BASE, userId };

  if ("caches" in window) {
    try {
      const cache = await caches.open("iceapp-push-config");
      const body = JSON.stringify(config);
      await cache.put(PUSH_CONFIG_CACHE_URL, new Response(body, {
        headers: { "Content-Type": "application/json" },
      }));
    } catch (cacheErr) {
      console.warn("Could not cache push config in CacheStorage", cacheErr);
    }
  }

  await savePushConfigToIndexedDb(config);
};

const persistBrowserSubscriptionToken = async (subscriptionToken, userId = null) => {
  if (!SUBSCRIPTION_TOKEN_PATTERN.test(String(subscriptionToken || ""))) {
    throw new Error("Ungültiger Web-Push-Subscription-Token vom Server.");
  }

  await persistServiceWorkerToken(subscriptionToken, userId);

  try {
    localStorage.setItem(WEB_SUBSCRIPTION_TOKEN_KEY, subscriptionToken);
  } catch (error) {
    console.warn("Web push token could not be stored in localStorage. Service worker cache was updated instead.", error);
  }
};

export const syncPushConfigToServiceWorker = async (userId = null) => {
  const token = localStorage.getItem(WEB_SUBSCRIPTION_TOKEN_KEY);
  if (token) {
    await persistServiceWorkerToken(token, userId);
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

export const reportNativePushClick = async (deliveryId) => {
  const numericDeliveryId = Number(deliveryId || 0);
  if (!numericDeliveryId || !API_BASE) return;

  try {
    await fetch(`${API_BASE}/api/push/events.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        delivery_id: numericDeliveryId,
        event: "clicked",
      }),
    });
  } catch (error) {
    console.warn("Native push click could not be reported", error);
  }
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

  await persistBrowserSubscriptionToken(json.subscription_token, userId);
  return { permission };
};

export const disableBrowserPush = async (userId, allDevices = false) => {
  ensureApiBase();
  if (!isWebPushSupported()) return;

  const registration = await navigator.serviceWorker.getRegistration("/");
  const subscription = await registration?.pushManager?.getSubscription?.();
  const endpoint = subscription?.endpoint || null;

  if (userId) {
    try {
      await fetch(`${API_BASE}/api/push/web-subscriptions/index.php`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: Number(userId),
          endpoint,
          all_devices: Boolean(allDevices),
        }),
      });
    } catch (err) {
      console.warn("Could not inform server of push unsubscription", err);
    }
  }

  if (subscription) {
    try {
      await subscription.unsubscribe();
    } catch (err) {
      console.warn("PushManager unsubscribe error", err);
    }
  }

  localStorage.removeItem(WEB_SUBSCRIPTION_TOKEN_KEY);
  await persistServiceWorkerToken("", null);
};

export const ensurePushSubscriptionSynced = async (userId) => {
  ensureApiBase();
  if (!userId || !isWebPushSupported()) {
    return { synced: false, reason: "unsupported" };
  }

  if (Notification.permission !== "granted") {
    return { synced: false, reason: "permission_not_granted", permission: Notification.permission };
  }

  try {
    const registration = await registerPushServiceWorker();
    if (!registration) {
      return { synced: false, reason: "registration_failed" };
    }

    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      const publicKey = await fetchWebPushPublicKey();
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
    if (response.ok && json.success && json.subscription_token) {
      await persistBrowserSubscriptionToken(json.subscription_token, userId);
      return { synced: true, subscribed: true, subscriptionToken: json.subscription_token };
    }

    return { synced: false, reason: json.message || "sync_error" };
  } catch (error) {
    console.warn("[Push] ensurePushSubscriptionSynced failed:", error);
    return { synced: false, error: error.message };
  }
};

export const fetchUserWebPushDevices = async () => {
  ensureApiBase();
  try {
    const res = await fetch(`${API_BASE}/api/push/web-subscriptions/index.php?devices=1`);
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json.devices) ? json.devices : [];
  } catch (err) {
    console.warn("Could not fetch user push devices", err);
    return [];
  }
};

export const sendPushTest = async (userId) => {
  ensureApiBase();
  const res = await fetch(`${API_BASE}/api/push/send-test.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId ? Number(userId) : undefined }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Test-Benachrichtigung konnte nicht versendet werden.");
  }
  return json;
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
    const data = event?.notification?.data || {};
    reportNativePushClick(data.delivery_id);
    const deeplink = data.deeplink;
    if (deeplink) {
      if (navigationHandler) {
        navigationHandler(deeplink);
      } else {
        window.location.href = deeplink;
      }
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

  if (typeof PushNotifications.createChannel === "function") {
    await PushNotifications.createChannel({
      id: ANDROID_NOTIFICATION_CHANNEL_ID,
      name: "Ice App",
      description: "Benachrichtigungen der Ice App",
      importance: 5,
      visibility: 1,
      lights: true,
      vibration: true,
    });
  }

  try {
    await PushNotifications.register();
  } catch (error) {
    console.error("PushNotifications.register() failed. This is expected if google-services.json is missing:", error);
  }
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
      subscribed: false,
      hasToken: false,
      endpoint: null,
    };
  }

  const registration = await navigator.serviceWorker.getRegistration("/");
  const subscription = await registration?.pushManager?.getSubscription?.();
  const hasToken = Boolean(localStorage.getItem(WEB_SUBSCRIPTION_TOKEN_KEY));
  return {
    supported: true,
    permission: Notification.permission,
    subscribed: Boolean(subscription),
    hasToken,
    endpoint: subscription?.endpoint || null,
  };
};
