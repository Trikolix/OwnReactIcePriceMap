self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

const readPushConfig = async () => {
  const cache = await caches.open("iceapp-push-config");
  const response = await cache.match("/__push_config__");
  if (!response) return {};
  try {
    return await response.json();
  } catch {
    return {};
  }
};

const fetchPendingDeliveries = async () => {
  const config = await readPushConfig();
  if (!config.subscriptionToken) return [];
  const apiBase = config.apiBase || "";
  const endpoint = `${apiBase}/api/push/web-subscriptions/pull.php?subscription_token=${encodeURIComponent(config.subscriptionToken)}`;

  const response = await fetch(endpoint, {
    credentials: "same-origin",
  });
  const json = await response.json();
  return Array.isArray(json.deliveries) ? json.deliveries : [];
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

    for (const payload of deliveries) {
      await self.registration.showNotification(payload.title || "Ice App", {
        body: payload.body || "",
        data: payload,
        tag: payload.tag || undefined,
        renotify: true,
      });
    }
  })());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const deeplink = event.notification?.data?.deeplink || "/";

  event.waitUntil((async () => {
    const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of allClients) {
      if ("focus" in client) {
        client.navigate(deeplink);
        return client.focus();
      }
    }
    if (self.clients.openWindow) {
      return self.clients.openWindow(deeplink);
    }
    return undefined;
  })());
});
