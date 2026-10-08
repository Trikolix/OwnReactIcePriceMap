import React from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import {
  configure,
  fireEvent,
  getByLabelText,
  getByRole,
  waitFor,
} from "@testing-library/dom";
import { UserProvider } from "../../../src/context/UserContext";
import { loyaltyRoutes } from "../../../src/features/loyalty/routes";
import { loyaltyApi } from "../../../src/features/loyalty/api";
import "../../../src/index.css";

configure({
  getElementError: (message) =>
    new Error(message.split("Here are")[0].slice(0, 500)),
});
const root = createRoot(document.getElementById("app")),
  checks = [],
  calls = [],
  accepted = new Map();
let user = 4,
  mountId = 0,
  failBook = false,
  failClaim = false,
  consumed = false,
  issueCount = 0,
  failCards = false,
  expiresSoon = false;
const name =
  "Eismanufaktur mit einem außergewöhnlich langen Namen in der Altstadt";
let card = {
  id: 1,
  shop_id: 10,
  shop_name: name,
  program_id: 1,
  program_state: "active",
  user_id: 4,
  username: "Kunde mit einem sehr langen Namen",
  unit: "scoop",
  stamp_target: 14,
  reward: "Eine Kugel deiner Lieblingssorte gratis",
  total_units: 13,
  redeemed_rewards: 0,
  stamps: 13,
  available_rewards: 0,
};
let program = {
  id: 1,
  shop_id: 10,
  shop_name: name,
  unit: "scoop",
  stamp_target: 14,
  reward: card.reward,
  state: "active",
};
const check = (value, message) => {
  if (!value) throw new Error(message);
  checks.push(message);
};
const tick = () => new Promise((resolve) => setTimeout(resolve, 70));
const button = (label) =>
  getByRole(document.body, "button", { name: label, exact: true });
const click = async (label) => {
  fireEvent.click(button(label));
  await tick();
};
const field = (label, value) =>
  fireEvent.change(getByLabelText(document.body, label, { exact: true }), {
    target: { value },
  });
const response = (body, status = 200) => ({
  ok: status < 400,
  status,
  json: async () => body,
});
Object.defineProperty(navigator, "mediaDevices", {
  configurable: true,
  value: {
    getUserMedia: async () => {
      throw Object.assign(new Error("denied"), { name: "NotAllowedError" });
    },
  },
});
window.fetch = async (input, init = {}) => {
  const url = new URL(String(input), "https://test.invalid");
  if (!url.href.startsWith("https://test.invalid/"))
    throw new Error("External request rejected");
  const data = init.body ? JSON.parse(init.body) : {},
    action = url.searchParams.get("action");
  calls.push({ action, data, init });
  if (url.pathname.endsWith("/loyalty.php")) {
    check(
      init.headers.Authorization === "Bearer test-token",
      "Authenticated API call",
    );
    let result = { status: "success" };
    if (action === "cards") {
      if (failCards)
        return response(
          { status: "error", message: "Karten konnten nicht geladen werden." },
          503,
        );
      result.cards = [card];
    }
    if (action === "card") {
      result.card = card;
      result.history = [
        {
          id: 100,
          kind: "stamp",
          units: 13,
          reward_delta: 0,
          created_at: "2026-10-06 12:00:00",
        },
      ];
      result.next_cursor = url.searchParams.has("before_id") ? null : 100;
      if (url.searchParams.has("before_id"))
        result.history = [
          {
            id: 99,
            kind: "stamp",
            units: 1,
            reward_delta: 0,
            created_at: "2026-10-05 12:00:00",
          },
        ];
    }
    if (action === "shop") result.program = program;
    if (action === "join") result.card = card;
    if (action === "issue_code") {
      issueCount++;
      result = {
        ...result,
        id: issueCount,
        token: "a".repeat(64),
        manual_code: "1234567890",
        purpose: data.purpose,
        expires_at: new Date(
          Date.now() + (expiresSoon ? 1800 : 120000),
        ).toISOString(),
        card,
      };
    }
    if (action === "code_status")
      result.code = {
        consumed_at: consumed ? "2026-10-06 12:00:00" : null,
        expired: 0,
      };
    if (action === "inspect_code") {
      if (!data.code.replaceAll(" ", "").includes("1234567890"))
        return response(
          {
            status: "error",
            message: "Code abgelaufen oder bereits verwendet.",
          },
          409,
        );
      result.card = card;
      result.purpose = "stamp";
    }
    if (action === "book") {
      if (!accepted.has(data.request_key)) {
        card = {
          ...card,
          total_units: card.total_units + data.quantity,
          stamps: (card.total_units + data.quantity) % 14,
          available_rewards: Math.floor(
            (card.total_units + data.quantity) / 14,
          ),
        };
        accepted.set(data.request_key, {
          ...result,
          card,
          kind: data.purpose,
          quantity: data.quantity,
          reward_delta: 1,
        });
      }
      if (failBook) {
        failBook = false;
        throw new Error("Connection lost after commit");
      }
      return response(accepted.get(data.request_key));
    }
    if (action === "overview") {
      result.shops = [
        { id: 10, name, role: "operator", state: "active" },
        {
          id: 20,
          name: "Einladung zur zweiten Eisdiele",
          role: "staff",
          state: "invited",
        },
      ];
      result.claims = [];
    }
    if (action === "operator_shop") {
      result = {
        ...result,
        role: user === 3 ? "staff" : "operator",
        shop: {
          id: 10,
          name,
          website: "",
          status: "open",
          opening_hours: { days: [], note: "" },
        },
        programs: [program],
        members: [
          {
            user_id: 2,
            username: "Betreiber",
            role: "operator",
            state: "active",
          },
          {
            user_id: 3,
            username: "Mitarbeiter",
            role: "staff",
            state: "invited",
          },
        ],
        stats: {
          customers: 1234,
          stamp_transactions: 2700,
          units: 5421,
          redeemed: 22,
          available: 80,
        },
      };
    }
    if (action === "history")
      result = {
        ...result,
        history: [
          {
            id: 3,
            kind: "stamp",
            units: 3,
            reward_delta: 1,
            actor: "Betreiber",
            created_at: "2026-10-06 12:00:00",
            reversed: 0,
          },
        ],
        next_cursor: null,
      };
    if (action === "claim") {
      if (failClaim)
        return response(
          { status: "error", message: "Speichern fehlgeschlagen." },
          503,
        );
      result.message =
        "Dein Antrag wurde gespeichert und wird manuell geprüft.";
    }
    if (action === "claims")
      result.claims = [
        {
          id: 1,
          shop_id: 10,
          shop_name: name,
          username: "Inhaber",
          contact: "kontakt@example.invalid",
          reason: "Geschäftsinhaber mit langem Text. ".repeat(12),
          state: "pending",
        },
      ];
    if (action === "operators")
      result.operators = [
        { shop_id: 20, shop_name: "Zweite Eisdiele", username: "Betreiber" },
      ];
    if (
      [
        "publish_program",
        "update_business",
        "invite_staff",
        "revoke_staff",
        "review_claim",
        "accept_invite",
        "reverse",
      ].includes(action)
    )
      result.message = "Gespeichert.";
    return response(result);
  }
  if (url.pathname.includes("session.php"))
    return response({
      status: "success",
      userId: user,
      username: `Nutzer ${user}`,
      currentLevel: 5,
    });
  if (url.pathname.includes("get_user_stats.php"))
    return response({ status: "success", nutzername: `Nutzer ${user}` });
  if (url.pathname.includes("streak_status.php"))
    return response({
      level_info: { level: 5 },
      streaks: {},
      events: [],
      refresh_after_seconds: 3600,
    });
  if (url.pathname.includes("benachrichtigungen.php"))
    return response({ status: "success", notifications: [], unread_total: 0 });
  return response({
    status: "success",
    actions: [],
    checkins: [],
    awards: [],
    events: [],
  });
};
async function mount(path, id = 4) {
  user = id;
  localStorage.setItem("authToken", "test-token");
  localStorage.setItem("userId", String(id));
  localStorage.setItem("username", `Nutzer ${id}`);
  root.render(
    <MemoryRouter key={++mountId} initialEntries={[path]}>
      <UserProvider>
        <Routes>
          {loyaltyRoutes.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Routes>
      </UserProvider>
    </MemoryRouter>,
  );
  await tick();
  await tick();
}
const overflow = (message) =>
  check(document.documentElement.scrollWidth <= innerWidth + 1, message);
window.loyaltyPreview = async (kind) => {
  if (kind === "counter") {
    await mount("/betreiber/10", 2);
    field("Eingabecode", "1234567890");
    await click("Code prüfen");
  } else if (kind === "management") {
    await mount("/betreiber/10", 2);
    await click("Verwaltung & Statistik");
  } else if (kind === "claim") await mount("/betreiber/antrag/10");
  else if (kind === "admin") await mount("/admin/betreiber", 1);
  else await mount("/kundenkarten/1");
};
(async () => {
  const preview = new URLSearchParams(location.search).get("preview");
  if (preview) {
    await window.loyaltyPreview(preview);
    document.getElementById("results").dataset.status = "preview";
    return;
  }
  const fixtureFetch = window.fetch,
    originalTimeout = window.setTimeout;
  window.setTimeout = (callback, delay, ...args) =>
    originalTimeout(callback, delay === 20000 ? 10 : delay, ...args);
  window.fetch = (_input, init) =>
    new Promise((_resolve, reject) =>
      init.signal.addEventListener("abort", () =>
        reject(new DOMException("Aborted", "AbortError")),
      ),
    );
  try {
    await loyaltyApi("test-token", "cards");
    throw new Error("Timeout was accepted");
  } catch (error) {
    check(error.uncertain === true, "Network timeout retains uncertain result");
  } finally {
    window.fetch = fixtureFetch;
    window.setTimeout = originalTimeout;
  }
  window.fetch = async () => response(null);
  try {
    await loyaltyApi("test-token", "cards");
    throw new Error("Malformed response was accepted");
  } catch (error) {
    check(
      error.uncertain === true,
      "Malformed response retains uncertain result",
    );
  } finally {
    window.fetch = fixtureFetch;
  }
  failCards = true;
  await mount("/kundenkarten");
  check(
    document
      .querySelector("[role=alert]")
      .textContent.includes("Karten konnten"),
    "Visible initial loading failure",
  );
  failCards = false;
  await click("Erneut versuchen");
  check(document.body.textContent.includes("13 / 14"), "Retry loads cards");
  overflow("Cards no overflow");
  await mount("/kundenkarten/1");
  await click("Weitere Buchungen laden");
  check(
    document.querySelectorAll(".loyalty-history li").length === 2,
    "Customer history can load older entries",
  );
  await click("Stempel sammeln");
  await waitFor(() =>
    check(!!document.querySelector(".loyalty-qr"), "Real QR image generated"),
  );
  const { BrowserQRCodeReader } = await import("@zxing/browser");
  const decoded = await new BrowserQRCodeReader().decodeFromImageElement(
    document.querySelector(".loyalty-qr"),
  );
  check(
    decoded.getText() === "iceapp-loyalty:" + "a".repeat(64),
    "JS fallback decodes real generated QR",
  );
  check(
    document.querySelector("[role=dialog]").contains(document.activeElement),
    "Code dialog contains focus",
  );
  check(
    document.querySelector(".loyalty-manual-code").textContent ===
      "12345 67890",
    "Readable manual code",
  );
  overflow("Code dialog no overflow");
  await click("Schließen");
  check(!document.querySelector("[role=dialog]"), "Code dialog closes");
  await waitFor(() =>
    check(
      button("Stempel sammeln") === document.activeElement,
      "Focus returns to code trigger",
    ),
  );
  expiresSoon = true;
  await click("Stempel sammeln");
  const before = issueCount;
  await waitFor(
    () => {
      if (issueCount <= before + 1) throw new Error("Await code renewal");
    },
    { timeout: 4500 },
  );
  check(issueCount > before + 1, "Expired code renews automatically");
  expiresSoon = false;
  await click("Schließen");
  await mount("/betreiber/10", 2);
  overflow("Counter no overflow");
  await click("Kundenkarte scannen");
  await waitFor(
    () => {
      if (!document.body.textContent.includes("Kamerazugriff wurde abgelehnt"))
        throw new Error("Await camera error");
    },
    { timeout: 5000 },
  );
  check(
    !!document.querySelector("[role=alert]"),
    "Camera denial offers manual fallback",
  );
  await click("Eingabecode verwenden / Schließen");
  field("Eingabecode", "0000000000");
  await click("Code prüfen");
  check(
    document.body.textContent.includes("Code abgelaufen"),
    "Invalid code is visible",
  );
  field("Eingabecode", "12345 67890");
  await click("Code prüfen");
  check(
    document.body.textContent.includes(card.username),
    "Counter preview shows customer",
  );
  field("Anzahl bezahlter Kugeln", "2");
  failBook = true;
  await click("Bezahlten Kauf bestätigen");
  check(
    document.body.textContent.includes("Das Ergebnis ist noch unklar"),
    "Uncertain confirmation explained",
  );
  check(
    getByLabelText(document.body, "Anzahl bezahlter Kugeln").disabled,
    "Uncertain quantity locked",
  );
  const first = calls.filter((call) => call.action === "book").at(-1).data;
  await mount("/betreiber/10", 2);
  check(
    getByLabelText(document.body, "Anzahl bezahlter Kugeln").value === "2",
    "Open confirmation survives remount",
  );
  check(
    button("Bestätigung erneut prüfen"),
    "Pending confirmation restored for original user and shop",
  );
  await click("Bestätigung erneut prüfen");
  const last = calls.filter((call) => call.action === "book").at(-1).data;
  check(
    first.request_key === last.request_key && first.quantity === last.quantity,
    "Retry retains request key and quantity",
  );
  check(
    accepted.size === 1 &&
      document.body.textContent.includes("2 Stempel bestätigt"),
    "Single confirmation after lost response",
  );
  await click("Verwaltung & Statistik");
  overflow("Management including hours no overflow");
  check(document.body.textContent.includes("1.234"), "Readable statistics");
  field("Kugeleis", "not_offered");
  field("Softeis", "offered");
  await click("Eisdielendaten speichern");
  check(
    calls.findLast((call) => call.action === "update_business").data
      .opening_hours.days.length === 7,
    "Complete structured hours sent",
  );
  check(calls.findLast(call => call.action === "update_business").data.ice_offerings.softeis === "offered" && calls.findLast(call => call.action === "update_business").data.ice_offerings.kugel === "not_offered", "Operator saves the selected ice offering declarations");
  await click("Veröffentlichung prüfen");
  check(
    button("Verbindlich veröffentlichen"),
    "Publication confirmation visible",
  );
  await click("Verbindlich veröffentlichen");
  check(
    calls.findLast((call) => call.action === "publish_program").data
      .current_program_id === 1,
    "Program replacement confirms current version",
  );
  field("Bestehenden Nutzer einladen", "Mitarbeiter");
  await click("Als Mitarbeiter einladen");
  check(
    calls.findLast((call) => call.action === "invite_staff").data.username ===
      "Mitarbeiter",
    "Staff invitation",
  );
  await click("Verlauf");
  await click("Stornieren");
  await click("Storno bestätigen");
  check(
    calls.findLast((call) => call.action === "reverse").data.request_key
      .length >= 16,
    "Reversal idempotency key",
  );
  await mount("/betreiber/10", 3);
  check(
    !document.body.textContent.includes("Verwaltung & Statistik"),
    "Staff sees counter only",
  );
  await mount("/betreiber", 2);
  await click("Einladung annehmen");
  check(
    calls.findLast((call) => call.action === "accept_invite").data.shop_id ===
      20,
    "Invitation explicitly accepted",
  );
  await mount("/betreiber/antrag/10");
  field("Kontakt für die Prüfung", "kontakt@example.invalid");
  field("Deine Verbindung zur Eisdiele", "Ich bin Geschäftsinhaber.");
  failClaim = true;
  await click("Antrag zur Prüfung senden");
  check(
    getByLabelText(document.body, "Kontakt für die Prüfung").value ===
      "kontakt@example.invalid",
    "Failed claim preserves input",
  );
  failClaim = false;
  await click("Antrag zur Prüfung senden");
  check(
    document.body.textContent.includes("manuell geprüft"),
    "Successful claim feedback",
  );
  await mount("/admin/betreiber", 1);
  overflow("Admin no overflow");
  check(
    button("Betreiber freigeben").disabled,
    "Approval requires verification",
  );
  field("Prüfvermerk / Begründung", "Telefonisch persönlich geprüft");
  fireEvent.click(
    getByLabelText(
      document.body,
      "Ich habe die Betreiberberechtigung persönlich geprüft.",
    ),
  );
  await click("Betreiber freigeben");
  check(
    calls.findLast((call) => call.action === "review_claim").data.verified ===
      true,
    "Manual verification submitted",
  );
  document.getElementById("results").textContent = JSON.stringify({
    passed: checks.length,
    checks,
    viewport: [innerWidth, innerHeight],
  });
  document.getElementById("results").dataset.status = "passed";
})().catch((error) => {
  document.getElementById("results").textContent = error.stack;
  document.getElementById("results").dataset.status = "failed";
});
