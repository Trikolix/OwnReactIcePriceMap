self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

const readPushConfigFromIndexedDb = () => new Promise((resolve) => {
  if (typeof indexedDB === "undefined") return resolve(null);
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
        const tx = db.transaction("config", "readonly");
        const store = tx.objectStore("config");
        const getReq = store.get("pushConfig");
        getReq.onsuccess = () => resolve(getReq.result || null);
        getReq.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    };
    request.onerror = () => resolve(null);
  } catch {
    resolve(null);
  }
});

const savePushConfigToIndexedDb = (config) => new Promise((resolve) => {
  if (typeof indexedDB === "undefined") return resolve();
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

const readPushConfig = async () => {
  let config = {};

  // 1. Zuerst aus CacheStorage lesen
  if ("caches" in self) {
    try {
      const cache = await caches.open("iceapp-push-config");
      const response = await cache.match("/__push_config__");
      if (response) {
        config = await response.json();
      }
    } catch {
      // Ignorieren und IndexedDB prüfen
    }
  }

  // 2. Falls im Cache nichts gefunden, aus IndexedDB laden
  if (!config?.subscriptionToken) {
    const idbConfig = await readPushConfigFromIndexedDb();
    if (idbConfig && typeof idbConfig === "object") {
      config = { ...idbConfig, ...config };
    }
  }

  return config || {};
};

const savePushConfig = async (config) => {
  if ("caches" in self) {
    try {
      const cache = await caches.open("iceapp-push-config");
      await cache.put("/__push_config__", new Response(JSON.stringify(config), {
        headers: { "Content-Type": "application/json" },
      }));
    } catch {}
  }
  await savePushConfigToIndexedDb(config);
};

const fetchPendingDeliveries = async () => {
  const config = await readPushConfig();
  if (!config.subscriptionToken) return [];
  const apiBase = config.apiBase || "";
  const endpoint = `${apiBase}/api/push/web-subscriptions/pull.php?subscription_token=${encodeURIComponent(config.subscriptionToken)}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(endpoint, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) return [];
    const json = await response.json();
    return Array.isArray(json.deliveries) ? json.deliveries : [];
  } catch (e) {
    clearTimeout(timeoutId);
    console.warn("[push-sw] fetchPendingDeliveries error:", e);
    return [];
  }
};

const reportPushEvent = async (payload, eventName) => {
  const deliveryId = Number(payload?.delivery_id || 0);
  if (!deliveryId) return;

  const config = await readPushConfig();
  if (!config.subscriptionToken) return;

  const apiBase = config.apiBase || "";
  await fetch(`${apiBase}/api/push/events.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      delivery_id: deliveryId,
      event: eventName,
      subscription_token: config.subscriptionToken,
    }),
  }).catch(() => {});
};

self.addEventListener("push", (event) => {
  event.waitUntil((async () => {
    let deliveries = [];
    if (event.data) {
      try {
        const parsed = event.data.json();
        deliveries = Array.isArray(parsed.deliveries) ? parsed.deliveries : [parsed];
      } catch {
        deliveries = [];
      }
    }

    if (!deliveries.length) {
      deliveries = await fetchPendingDeliveries();
    }

    // WICHTIG: Wenn keine Auslieferungen vorliegen oder das Abholen fehlschlug,
    // MUSS der Service Worker zwingend eine Benachrichtigung anzeigen,
    // da Chrome & Firefox sonst userVisibleOnly als verletzt einstufen
    // und stillschweigend die Benachrichtigungsberechtigung entziehen!
    const resolveAssetUrl = (url, fallback = "/favicon.ico") => {
      const target = url || fallback;
      if (!target) return "/favicon.ico";
      if (/^https?:\/\//i.test(target)) return target;
      const origin = self.location ? self.location.origin : "";
      return `${origin}${target.startsWith("/") ? "" : "/"}${target}`;
    };

    if (!deliveries.length) {
      await self.registration.showNotification("Ice App", {
        body: "Du hast eine neue Benachrichtigung in der Ice App.",
        icon: resolveAssetUrl("/favicon.ico"),
        badge: resolveAssetUrl("/favicon.ico"),
        tag: "ice-app-notification",
        renotify: true,
        data: { deeplink: "/" },
      });
      return;
    }

    for (const payload of deliveries) {
      const iconUrl = resolveAssetUrl(payload.icon, "/favicon.ico");
      const badgeUrl = resolveAssetUrl(payload.badge, "/favicon.ico");

      await self.registration.showNotification(payload.title || "Ice App", {
        body: payload.body || "Neue Benachrichtigung",
        icon: iconUrl,
        badge: badgeUrl,
        data: payload,
        tag: payload.tag || ("notification-" + (payload.delivery_id || Date.now())),
        renotify: true,
      });
      await reportPushEvent(payload, "shown");
    }
  })());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const payload = event.notification?.data || {};
  const deeplink = event.notification?.data?.deeplink || "/";

  event.waitUntil((async () => {
    await reportPushEvent(payload, "clicked");
    const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of allClients) {
      if ("focus" in client) {
        if ("navigate" in client) {
          client.navigate(deeplink);
        }
        return client.focus();
      }
    }
    if (self.clients.openWindow) {
      return self.clients.openWindow(deeplink);
    }
    return undefined;
  })());
});

// pushsubscriptionchange fängt Schlüssel- und Endpunkterweiterungen des Browsers ab
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil((async () => {
    const config = await readPushConfig();
    const apiBase = config.apiBase || "";
    if (!apiBase) return;

    try {
      const keyRes = await fetch(`${apiBase}/api/push/web-subscriptions/index.php`);
      const keyJson = await keyRes.json();
      if (!keyJson.public_key) return;

      const padding = "=".repeat((4 - (keyJson.public_key.length % 4)) % 4);
      const base64 = (keyJson.public_key + padding).replace(/-/g, "+").replace(/_/g, "/");
      const rawData = atob(base64);
      const applicationServerKey = Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));

      const newSubscription = await self.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      const updateRes = await fetch(`${apiBase}/api/push/web-subscriptions/index.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: config.userId || undefined,
          subscription: newSubscription.toJSON(),
        }),
      });

      const updateJson = await updateRes.json();
      if (updateJson.subscription_token) {
        await savePushConfig({
          ...config,
          subscriptionToken: updateJson.subscription_token,
        });
      }
    } catch (err) {
      console.warn("[push-sw] pushsubscriptionchange failed:", err);
    }
  })());
});
