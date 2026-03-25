import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const DEFAULT_FLAVOURS = [
  "Vanille",
  "Schoko",
  "Erdbeere",
  "Haselnuss",
  "Joghurt",
  "Zitrone",
  "Mango",
  "Himbeere",
  "Pistazie",
  "Salted Caramel",
];

const DEFAULT_COMMENT_TEMPLATES = [
  "Kurzer Stopp auf der Runde.",
  "Schneller Check-in und weiter.",
  "Gute Pause, jetzt geht es weiter.",
  "Kurze Erfrischung am Checkpoint.",
  "Alles entspannt auf der Strecke.",
];

const DEFAULT_TRANSPORTS = ["Fahrrad", "Fahrrad", "Fahrrad", "Fahrrad", "Bus / Bahn"];
const DEFAULT_TYPES = ["Kugel", "Kugel", "Kugel", "Softeis", "Eisbecher"];

function printHelp() {
  console.log(`Event-Simulator fuer Test-Live-Map und Dashboard

Verwendung:
  node scripts/simulate-event-traffic.mjs --config scripts/event-simulator.config.json

Optionen:
  --config <pfad>             JSON-Konfiguration mit Admin- und Teilnehmerdaten
  --duration-minutes <zahl>   Ueberschreibt die Laufzeit der Simulation
  --participants <zahl>       Begrenze Teilnehmer auf die ersten N Identitaeten
  --checkin-share <0..1>      Anteil der Stopps mit echtem Check-in
  --seed <zahl>               Deterministischer Zufalls-Seed
  --dry-run                   Nur Zeitplan berechnen, nichts schreiben
  --help                      Diese Hilfe anzeigen

Konfiguration:
  Siehe scripts/event-simulator.config.example.json
`);
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    if (["dry-run", "help"].includes(key)) {
      args[key] = true;
      continue;
    }
    const value = argv[index + 1];
    if (value === undefined || value.startsWith("--")) {
      throw new Error(`Fehlender Wert fuer --${key}`);
    }
    args[key] = value;
    index += 1;
  }
  return args;
}

function createRng(seedInput) {
  let seed = Number(seedInput);
  if (!Number.isFinite(seed)) {
    seed = Date.now();
  }
  let state = seed >>> 0;
  return {
    seed,
    next() {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 4294967296;
    },
  };
}

function randBetween(rng, min, max) {
  return min + (max - min) * rng.next();
}

function pickOne(rng, items) {
  return items[Math.floor(rng.next() * items.length)];
}

function sampleWithoutReplacement(rng, items, count) {
  const copy = [...items];
  const result = [];
  const safeCount = Math.min(count, copy.length);
  for (let index = 0; index < safeCount; index += 1) {
    const itemIndex = Math.floor(rng.next() * copy.length);
    result.push(copy.splice(itemIndex, 1)[0]);
  }
  return result;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatDuration(ms) {
  if (ms < 1000) return `${ms} ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)} s`;
  return `${(seconds / 60).toFixed(1)} min`;
}

function formatDateTime(value) {
  return new Date(value).toLocaleString("de-DE");
}

async function loadJson(filePath) {
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(repoRoot, filePath);
  const contents = await fs.readFile(absolutePath, "utf8");
  return JSON.parse(contents);
}

async function loadEnvFile(filePath) {
  try {
    const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(repoRoot, filePath);
    const contents = await fs.readFile(absolutePath, "utf8");
    const parsed = {};
    for (const line of contents.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      const rawValue = trimmed.slice(eqIndex + 1).trim();
      parsed[key] = rawValue.replace(/^['"]|['"]$/g, "");
    }
    return parsed;
  } catch {
    return {};
  }
}

function normalizeBaseUrl(url) {
  if (!url) return "";
  return url.replace(/\/+$/, "");
}

function buildUrl(baseUrl, endpointPath) {
  return `${normalizeBaseUrl(baseUrl)}${endpointPath.startsWith("/") ? endpointPath : `/${endpointPath}`}`;
}

async function requestJson(baseUrl, endpointPath, options = {}) {
  const response = await fetch(buildUrl(baseUrl, endpointPath), options);
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();
  return { response, payload };
}

async function loginIdentity(baseUrl, identity) {
  if (identity.token && identity.userId) {
    return {
      token: identity.token,
      userId: Number(identity.userId),
      username: identity.username || null,
    };
  }

  if (!identity.username || !identity.password) {
    throw new Error("Identitaet braucht entweder token+userId oder username+password.");
  }

  const { response, payload } = await requestJson(baseUrl, "/userManagement/login.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: identity.username,
      password: identity.password,
    }),
  });

  if (!response.ok || payload?.status !== "success") {
    throw new Error(payload?.message || `Login fehlgeschlagen fuer ${identity.username}`);
  }

  return {
    token: payload.token,
    userId: Number(payload.userId),
    username: payload.username || identity.username,
  };
}

async function fetchParticipantMeta(baseUrl, authToken) {
  const { response, payload } = await requestJson(baseUrl, "/event2026/me.php", {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok || payload?.status !== "success") {
    throw new Error(payload?.message || "Event-Teilnehmerdaten konnten nicht geladen werden.");
  }

  return payload;
}

async function fetchTestCheckpoints(baseUrl, authToken) {
  const { response, payload } = await requestJson(baseUrl, "/event2026/live_checkpoints.php?mode=test", {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok || payload?.status !== "success") {
    throw new Error(payload?.message || "Test-Checkpoints konnten nicht geladen werden.");
  }

  return payload;
}

function buildCheckinFormData({ userId, shopId, runDateTime, rng, flavourPool, commentTemplates }) {
  const type = pickOne(rng, DEFAULT_TYPES);
  const flavourCount = type === "Eisbecher" ? 3 : 2;
  const flavours = sampleWithoutReplacement(rng, flavourPool, flavourCount).map((name) => ({
    name,
    bewertung: String((Math.round(randBetween(rng, 3.6, 5.0) * 10) / 10).toFixed(1)),
  }));
  const tasteRating = Number((Math.round(randBetween(rng, 3.8, 5.0) * 10) / 10).toFixed(1));
  const form = new FormData();
  form.append("userId", String(userId));
  form.append("shopId", String(shopId));
  form.append("type", type);
  form.append("geschmackbewertung", String(tasteRating.toFixed(1)));
  form.append("preisleistungsbewertung", String((Math.round(randBetween(rng, 3.5, 5.0) * 10) / 10).toFixed(1)));
  form.append("waffelbewertung", type === "Kugel" ? String((Math.round(randBetween(rng, 3.5, 5.0) * 10) / 10).toFixed(1)) : "");
  form.append("größenbewertung", type === "Kugel" ? String((Math.round(randBetween(rng, 3.5, 5.0) * 10) / 10).toFixed(1)) : "");
  form.append("anreise", pickOne(rng, DEFAULT_TRANSPORTS));
  form.append("kommentar", pickOne(rng, commentTemplates));
  form.append("sorten", JSON.stringify(flavours));
  form.append("mentionedUsers", JSON.stringify([]));
  form.append("datum", new Date(runDateTime).toISOString().slice(0, 19).replace("T", " "));
  return form;
}

async function createCheckin(baseUrl, action, summary) {
  const formData = buildCheckinFormData({
    userId: action.participant.userId,
    shopId: action.checkpoint.shop_id,
    runDateTime: action.scheduledAt,
    rng: action.rng,
    flavourPool: action.simulation.flavours,
    commentTemplates: action.simulation.commentTemplates,
  });

  const startedAt = Date.now();
  const { response, payload } = await requestJson(baseUrl, "/checkin/checkin_upload.php", {
    method: "POST",
    body: formData,
  });
  const durationMs = Date.now() - startedAt;

  summary.endpointStats.checkin_upload.attempted += 1;
  summary.endpointStats.checkin_upload.durationMs += durationMs;

  if (!response.ok || payload?.status !== "success" || !payload?.checkin_id) {
    summary.endpointStats.checkin_upload.failed += 1;
    throw new Error(payload?.error || payload?.message || "Check-in konnte nicht gespeichert werden.");
  }

  summary.endpointStats.checkin_upload.succeeded += 1;
  summary.shopCounts[action.checkpoint.shop_id] = (summary.shopCounts[action.checkpoint.shop_id] || 0) + 1;
  return Number(payload.checkin_id);
}

async function createCheckpointPassage(baseUrl, action, checkinId, summary) {
  const startedAt = Date.now();
  const { response, payload } = await requestJson(baseUrl, "/event2026/checkpoints_pass.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${action.participant.token}`,
    },
    body: JSON.stringify({
      checkpoint_id: action.checkpoint.checkpoint_id,
      source: "onsite_form",
      checkin_id: checkinId || null,
    }),
  });
  const durationMs = Date.now() - startedAt;

  summary.endpointStats.checkpoints_pass.attempted += 1;
  summary.endpointStats.checkpoints_pass.durationMs += durationMs;

  if (!response.ok || payload?.status !== "success") {
    summary.endpointStats.checkpoints_pass.failed += 1;
    throw new Error(payload?.message || "Checkpoint-Passage konnte nicht gespeichert werden.");
  }

  summary.endpointStats.checkpoints_pass.succeeded += 1;
  summary.checkpointCounts[action.checkpoint.checkpoint_id] = (summary.checkpointCounts[action.checkpoint.checkpoint_id] || 0) + 1;
}

function createSummary() {
  return {
    endpointStats: {
      checkin_upload: { attempted: 0, succeeded: 0, failed: 0, durationMs: 0 },
      checkpoints_pass: { attempted: 0, succeeded: 0, failed: 0, durationMs: 0 },
    },
    checkpointCounts: {},
    shopCounts: {},
    errors: [],
    actionsAttempted: 0,
    actionsSucceeded: 0,
  };
}

function createSimulationProfile(config, args) {
  const durationMinutes = Number(args["duration-minutes"] ?? config.simulation?.durationMinutes ?? 12);
  const minStops = Number(config.simulation?.minStopsPerParticipant ?? 2);
  const maxStops = Number(config.simulation?.maxStopsPerParticipant ?? 3);
  const checkinShare = clamp(Number(args["checkin-share"] ?? config.simulation?.checkinShare ?? 0.8), 0, 1);
  const flavours = Array.isArray(config.simulation?.flavours) && config.simulation.flavours.length ? config.simulation.flavours : DEFAULT_FLAVOURS;
  const commentTemplates =
    Array.isArray(config.simulation?.commentTemplates) && config.simulation.commentTemplates.length
      ? config.simulation.commentTemplates
      : DEFAULT_COMMENT_TEMPLATES;

  return {
    durationMs: Math.max(1, durationMinutes) * 60 * 1000,
    minStops: Math.max(1, minStops),
    maxStops: Math.max(minStops, maxStops),
    checkinShare,
    flavours,
    commentTemplates,
  };
}

function buildParticipantSchedule({ participant, checkpoints, simulation, rng, startedAt }) {
  const availableCheckpoints = [...checkpoints].sort((a, b) => a.order_index - b.order_index);
  const stopCount = clamp(
    Math.round(randBetween(rng, simulation.minStops, simulation.maxStops)),
    1,
    availableCheckpoints.length
  );
  const chosenCheckpoints = availableCheckpoints.slice(0, stopCount);

  const profileAnchor = Math.pow(rng.next(), 1.6);
  const baseStartOffset = Math.round(profileAnchor * simulation.durationMs * 0.28);
  const availableTravelWindow = Math.max(simulation.durationMs - baseStartOffset, simulation.durationMs * 0.35);
  const segmentWindow = availableTravelWindow / Math.max(1, chosenCheckpoints.length);

  return chosenCheckpoints.map((checkpoint, index) => {
    const segmentStart = baseStartOffset + segmentWindow * index;
    const segmentOffset = randBetween(rng, segmentWindow * 0.18, segmentWindow * 0.92);
    const scheduledAt = startedAt + Math.round(segmentStart + segmentOffset);
    return {
      participant,
      checkpoint,
      scheduledAt,
      shouldCreateCheckin: rng.next() <= simulation.checkinShare && Number(checkpoint.shop_id) > 0,
      rng,
      simulation,
    };
  });
}

function printDryRun(actions) {
  console.log(`Dry Run: ${actions.length} Aktionen geplant\n`);
  for (const action of actions.slice(0, 50)) {
    console.log(
      `${formatDateTime(action.scheduledAt)} | ${action.participant.label} | ${action.checkpoint.name} | ${
        action.shouldCreateCheckin ? "Passage + Check-in" : "Nur Passage"
      }`
    );
  }
  if (actions.length > 50) {
    console.log(`... ${actions.length - 50} weitere Aktionen`);
  }
}

function printSummary(summary, startedAt, finishedAt, actions, checkpointCatalog) {
  console.log("\nSimulation abgeschlossen");
  console.log(`Laufzeit: ${formatDuration(finishedAt - startedAt)}`);
  console.log(`Geplante Aktionen: ${actions.length}`);
  console.log(`Erfolgreiche Aktionen: ${summary.actionsSucceeded}`);
  console.log(`Fehler: ${summary.errors.length}`);

  console.log("\nEndpoints");
  for (const [endpoint, stats] of Object.entries(summary.endpointStats)) {
    const averageMs = stats.succeeded ? (stats.durationMs / stats.succeeded).toFixed(1) : "0.0";
    console.log(
      `- ${endpoint}: ${stats.succeeded}/${stats.attempted} erfolgreich, ${stats.failed} Fehler, Ø ${averageMs} ms`
    );
  }

  console.log("\nCheckpoints");
  for (const checkpoint of checkpointCatalog) {
    const count = summary.checkpointCounts[checkpoint.checkpoint_id] || 0;
    console.log(`- ${checkpoint.name}: ${count} Passagen`);
  }

  console.log("\nShops");
  const shops = checkpointCatalog.filter((checkpoint) => Number(checkpoint.shop_id) > 0);
  for (const checkpoint of shops) {
    const count = summary.shopCounts[checkpoint.shop_id] || 0;
    console.log(`- ${checkpoint.name}: ${count} Check-ins`);
  }

  if (summary.errors.length) {
    console.log("\nFehlerdetails");
    for (const error of summary.errors.slice(0, 20)) {
      console.log(`- ${error}`);
    }
    if (summary.errors.length > 20) {
      console.log(`- ... ${summary.errors.length - 20} weitere Fehler`);
    }
  }
}

async function runSimulation({ baseUrl, adminIdentity, participants, simulation, dryRun, rng }) {
  const adminAuth = await loginIdentity(baseUrl, adminIdentity);
  const checkpointPayload = await fetchTestCheckpoints(baseUrl, adminAuth.token);
  const checkpointCatalog = checkpointPayload.items || [];
  if (!checkpointCatalog.length) {
    throw new Error("Keine Test-Checkpoints gefunden.");
  }

  const preparedParticipants = [];
  for (const identity of participants) {
    const auth = await loginIdentity(baseUrl, identity);
    const participantMeta = await fetchParticipantMeta(baseUrl, auth.token);
    const ownSlot = participantMeta?.slots?.find((slot) => Number(slot.user_id) === Number(auth.userId)) || participantMeta?.slots?.[0];
    if (!ownSlot) {
      throw new Error(`Keine Event-Slot-Daten fuer ${identity.label || auth.username || auth.userId} gefunden.`);
    }
    preparedParticipants.push({
      label: identity.label || ownSlot.full_name || auth.username || `user-${auth.userId}`,
      token: auth.token,
      userId: auth.userId,
      username: auth.username || null,
      fullName: ownSlot.full_name || null,
      routeKey: ownSlot.route_key || null,
      routeName: ownSlot.route_name || null,
    });
  }

  const startedAt = Date.now();
  const allActions = preparedParticipants
    .flatMap((participant) => buildParticipantSchedule({ participant, checkpoints: checkpointCatalog, simulation, rng, startedAt }))
    .sort((a, b) => a.scheduledAt - b.scheduledAt);

  if (dryRun) {
    printDryRun(allActions);
    return {
      dryRun: true,
      actions: allActions,
      summary: createSummary(),
      checkpointCatalog,
      startedAt,
      finishedAt: Date.now(),
    };
  }

  const summary = createSummary();
  let cursor = 0;
  while (cursor < allActions.length) {
    const nextAt = allActions[cursor].scheduledAt;
    const waitMs = nextAt - Date.now();
    if (waitMs > 0) {
      await sleep(waitMs);
    }

    const dueActions = [];
    while (cursor < allActions.length && allActions[cursor].scheduledAt - nextAt <= 150) {
      dueActions.push(allActions[cursor]);
      cursor += 1;
    }

    const results = await Promise.allSettled(
      dueActions.map(async (action) => {
        summary.actionsAttempted += 1;
        let checkinId = null;
        if (action.shouldCreateCheckin) {
          checkinId = await createCheckin(baseUrl, action, summary);
        }
        await createCheckpointPassage(baseUrl, action, checkinId, summary);
        summary.actionsSucceeded += 1;
      })
    );

    results.forEach((result, index) => {
      if (result.status === "rejected") {
        const action = dueActions[index];
        summary.errors.push(`${action.participant.label} @ ${action.checkpoint.name}: ${result.reason?.message || result.reason}`);
      }
    });
  }

  return {
    dryRun: false,
    actions: allActions,
    summary,
    checkpointCatalog,
    startedAt,
    finishedAt: Date.now(),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const configPath = args.config || "scripts/event-simulator.config.json";
  const config = await loadJson(configPath);
  const envFile = await loadEnvFile(".env.development");
  const baseUrl = normalizeBaseUrl(
    config.apiBaseUrl || process.env.EVENT_SIM_API_BASE_URL || process.env.VITE_API_BASE_URL || envFile.VITE_API_BASE_URL || ""
  );

  if (!baseUrl) {
    throw new Error("Keine API-Base-URL gefunden. Bitte apiBaseUrl in der Config oder EVENT_SIM_API_BASE_URL setzen.");
  }

  if (!config.admin) {
    throw new Error("In der Config fehlt der admin-Block.");
  }
  if (!Array.isArray(config.participants) || !config.participants.length) {
    throw new Error("In der Config fehlen participants.");
  }

  const participantLimit = args.participants ? Math.max(1, Number(args.participants)) : config.participants.length;
  const participants = config.participants.slice(0, participantLimit);
  const simulation = createSimulationProfile(config, args);
  const rng = createRng(args.seed ?? config.simulation?.seed);

  console.log("Event-Simulator startet");
  console.log(`API: ${baseUrl}`);
  console.log(`Seed: ${rng.seed}`);
  console.log(`Teilnehmer: ${participants.length}`);
  console.log(`Laufzeit: ${formatDuration(simulation.durationMs)}`);
  console.log(`Check-in-Anteil: ${(simulation.checkinShare * 100).toFixed(0)}%`);
  if (args["dry-run"]) {
    console.log("Modus: Dry Run");
  }

  const result = await runSimulation({
    baseUrl,
    adminIdentity: config.admin,
    participants,
    simulation,
    dryRun: Boolean(args["dry-run"]),
    rng,
  });

  printSummary(result.summary, result.startedAt, result.finishedAt, result.actions, result.checkpointCatalog);
}

main().catch((error) => {
  console.error(`\nFehler: ${error.message}`);
  process.exitCode = 1;
});
