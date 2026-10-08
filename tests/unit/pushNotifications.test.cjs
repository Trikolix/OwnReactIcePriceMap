const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const vm = require('node:vm');
const { build } = require('esbuild');

async function loadPush({ enabled = 1, optedOut = false, revoked = false, subscribed = true, cacheFails = false } = {}) {
  const calls = [], storage = new Map(), cached = new Map(), idb = [];
  const token = 'a'.repeat(64);
  if (optedOut) storage.set('iceapp:web-push-disabled:42', '1');
  const subscription = { endpoint: 'https://push.invalid/device', toJSON() { return { endpoint: this.endpoint, keys: { p256dh: 'key', auth: 'auth' } }; },
    async unsubscribe() { calls.push({ operation: 'unsubscribe' }); } };
  const registration = { pushManager: {
    async getSubscription() { return subscribed ? subscription : null; },
    async subscribe() { calls.push({ operation: 'subscribe' }); return subscription; },
  } };
  const context = { module: { exports: {} }, Response, Blob, Event, setTimeout, clearTimeout, Uint8Array,
    console: { warn() {}, error() {} },
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
    navigator: { serviceWorker: { register: async () => registration, ready: Promise.resolve(registration), getRegistration: async () => registration } },
    Notification: { permission: 'granted', requestPermission: async () => 'granted' },
    caches: { open: async () => { if (cacheFails) throw new Error('Unavailable'); return { put: async (key, response) => cached.set(key, await response.json()) }; } },
    indexedDB: { open() { const request = {}; queueMicrotask(() => {
      const transaction = { objectStore: () => ({ put: config => idb.push(config) }) };
      const db = { close() {}, transaction: () => { queueMicrotask(() => transaction.oncomplete?.()); return transaction; } };
      request.onsuccess({ target: { result: db } });
    }); return request; } },
    mockCore: { isNativePlatform: () => false }, mockNative: {},
    async fetch(url, init = {}) {
      calls.push({ url, init });
      let result = { success: true, subscription_token: token, public_key: 'YWJj', devices: [] };
      if (url.includes('get_user_notification_settings')) result = { push_enabled_web: enabled };
      if (url.includes('check=1')) result = { success: true, active: !revoked, revoked };
      return new Response(JSON.stringify(result), { status: 200 });
    },
  };
  context.window = { Notification: context.Notification, PushManager: {}, indexedDB: context.indexedDB, caches: context.caches, atob,
    dispatchEvent: event => calls.push({ event: event.type }) };
  context.globalThis = context;
  const result = await build({ entryPoints: [path.resolve(__dirname, '../../src/services/pushNotifications.js')], bundle: true, write: false, platform: 'browser', format: 'cjs',
    define: { 'import.meta.env': JSON.stringify({ VITE_API_BASE_URL: 'https://api.invalid' }) },
    plugins: [{ name: 'capacitor-fixture', setup(builder) {
      builder.onResolve({ filter: /^@capacitor\// }, args => ({ path: args.path, namespace: 'fixture' }));
      builder.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ contents: args.path.endsWith('/core')
        ? 'export const Capacitor=globalThis.mockCore;' : 'export const PushNotifications=globalThis.mockNative;' }));
    } }],
  });
  vm.runInNewContext(result.outputFiles[0].text, context);
  return { api: context.module.exports, calls, storage, cached, idb, context };
}

test('startup respects both account opt-out and a disabled device', async () => {
  for (const options of [{ enabled: 0 }, { optedOut: true }]) {
    const { api, calls } = await loadPush(options);
    assert.equal((await api.ensurePushSubscriptionSynced(42)).synced, false);
    assert.equal(calls.filter(call => call.operation === 'subscribe' || call.init?.method === 'POST').length, 0);
  }
});
test('startup cannot reactivate a device revoked from another browser', async () => {
  const { api, calls, storage } = await loadPush({ revoked: true });
  assert.equal((await api.ensurePushSubscriptionSynced(42)).reason, 'device_revoked');
  assert.equal(storage.get('iceapp:web-push-disabled:42'), '1');
  assert.equal(calls.some(call => call.init?.method === 'POST'), false);
});
test('startup repairs enabled push once and persists worker config through a cache failure', async () => {
  const { api, calls, idb } = await loadPush({ subscribed: false, cacheFails: true });
  const results = await Promise.all([api.ensurePushSubscriptionSynced(42), api.ensurePushSubscriptionSynced(42)]);
  assert.ok(results.every(result => result.synced));
  assert.equal(calls.filter(call => call.operation === 'subscribe').length, 1);
  const payload = JSON.parse(calls.find(call => call.init?.method === 'POST').init.body);
  assert.equal(payload.activate, undefined);
  assert.equal(idb.at(-1).userId, 42);
  assert.equal(idb.at(-1).subscriptionToken, 'a'.repeat(64));
  assert.equal(calls.filter(call => call.event === 'push:changed').length, 1);
});
test('manual activation opts in explicitly and clears the device opt-out', async () => {
  const { api, calls, storage } = await loadPush({ optedOut: true });
  await api.enableBrowserPush(42);
  assert.equal(JSON.parse(calls.find(call => call.init?.method === 'POST').init.body).activate, true);
  assert.equal(storage.has('iceapp:web-push-disabled:42'), false);
});
test('disabling a browser without a subscription does not request a global revocation', async () => {
  const { api, calls, storage, idb } = await loadPush({ subscribed: false });
  await api.disableBrowserPush(42);
  const payload = JSON.parse(calls.find(call => call.init?.method === 'DELETE').init.body);
  assert.equal(payload.endpoint, null);
  assert.equal(payload.all_devices, false);
  assert.equal(storage.get('iceapp:web-push-disabled:42'), '1');
  assert.equal(idb.at(-1).subscriptionToken, '');
});
test('logout detaches the device without recording a permanent opt-out', async () => {
  const { api, storage } = await loadPush();
  await api.disableBrowserPush(42, { rememberOptOut: false });
  assert.equal(storage.has('iceapp:web-push-disabled:42'), false);
});

function loadWorker({ failPull = false, idbConfig = null } = {}) {
  const handlers = {}, notifications = [], calls = [];
  const config = { apiBase: 'https://api.invalid', subscriptionToken: 'a'.repeat(64), userId: 42, updatedAt: 1 };
  const context = { Response, AbortController, Uint8Array, atob, setTimeout, clearTimeout, console: { warn() {} },
    caches: { open: async () => ({ match: async () => new Response(JSON.stringify(config)), put: async () => {} }) },
    fetch: async (url, init = {}) => {
      calls.push({ url, init });
      if (failPull) throw new Error('Offline');
      return new Response(JSON.stringify(init.method === 'POST' ? { success: true, subscription_token: 'b'.repeat(64) } : { public_key: 'YWJj', deliveries: [] }));
    },
  };
  if (idbConfig) context.indexedDB = { open() {
    const request = {};
    queueMicrotask(() => request.onsuccess({ target: { result: { close() {}, transaction: () => ({ objectStore: () => ({ get() {
      const get = { result: idbConfig }; queueMicrotask(() => get.onsuccess()); return get;
    } }) }) } } }));
    return request;
  } };
  context.self = { caches: context.caches, location: { origin: 'https://ice-app.invalid' },
    addEventListener: (name, callback) => { handlers[name] = callback; },
    registration: { showNotification: async (title, options) => notifications.push({ title, ...options }),
      pushManager: { subscribe: async () => ({ toJSON: () => ({ endpoint: 'https://push.invalid/new', keys: { auth: 'new' } }) }) } },
  };
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, '../../public/push-sw.js'), 'utf8'), context);
  return { notifications, calls, async emit(name, data) {
    let pending;
    handlers[name]({ data: data ? { json: () => data } : null, waitUntil: value => { pending = value; } });
    await pending;
  } };
}
test('a failed delivery pull still displays a visible fallback', async () => {
  const worker = loadWorker({ failPull: true });
  await worker.emit('push');
  assert.equal(worker.notifications.length, 1);
  assert.match(worker.notifications[0].body, /neue Benachrichtigung/);
});
test('system messages preserve quiet updates and render the supplied avatar', async () => {
  const worker = loadWorker();
  await worker.emit('push', { title: 'Ice App', body: 'News', type: 'systemmeldung', icon: 'https://images.invalid/avatar.png' });
  assert.equal(worker.notifications[0].renotify, false);
  assert.equal(worker.notifications[0].icon, 'https://images.invalid/avatar.png');
});
test('background renewal proves ownership using the old subscription token', async () => {
  const worker = loadWorker();
  await worker.emit('pushsubscriptionchange');
  const payload = JSON.parse(worker.calls.find(call => call.init.method === 'POST').init.body);
  assert.equal(payload.renewal, true);
  assert.equal(payload.previous_subscription_token, 'a'.repeat(64));
  assert.equal(payload.user_id, undefined);
});
test('a newer IndexedDB logout supersedes the stale token in CacheStorage', async () => {
  const worker = loadWorker({ idbConfig: { apiBase: 'https://api.invalid', subscriptionToken: '', updatedAt: 2 } });
  await worker.emit('push');
  assert.equal(worker.calls.length, 0);
  assert.equal(worker.notifications.length, 1);
});
test('worker delivery pulls use the latest token when only IndexedDB was writable', async () => {
  const worker = loadWorker({ idbConfig: { apiBase: 'https://api.invalid', subscriptionToken: 'b'.repeat(64), updatedAt: 2 } });
  await worker.emit('push');
  assert.match(worker.calls[0].url, new RegExp('subscription_token=b{64}'));
});
