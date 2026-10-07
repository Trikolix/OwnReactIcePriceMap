import React from "react";
import { createRoot } from "react-dom/client";
import {
  MemoryRouter,
  Routes,
  Route,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { configure, fireEvent, getByRole, waitFor } from "@testing-library/dom";
import { UserProvider } from "../../../src/context/UserContext";
import IceShopDetailPage from "../../../src/pages/IceShopDetailPage";
import ShopDetailsView from "../../../src/ShopDetailsView";
import ShopChangeRequestsAdmin from "../../../src/pages/ShopChangeRequestsAdmin";
import {
  shopStatus,
  shopAssetUrl,
  shopDetailTab,
  shopPriceHistory,
} from "../../../src/utils/shopDetail";
import "../../../src/index.css";

configure({
  getElementError: (message) =>
    new Error(message.split("Here are")[0].slice(0, 500)),
});
const root = createRoot(document.getElementById("app")),
  checks = [],
  calls = [];
const browserErrors = [];
window.addEventListener("error", event => browserErrors.push(event.error?.stack || event.message));
let loginRequests = 0;
window.addEventListener("auth:open-login", () => loginRequests++);
let mountId = 0,
  user = 4,
  failShop = false,
  delayShop = 0,
  copied = "",
  nativeShare = null;
let offeringReports = [{ id: 1, shop_id: 1, user_id: 4, ice_type: "softeis", state: "not_offered", status: "pending", updated_at: "2026-10-07 12:00:00.000000", shop_name: "Eismanufaktur Emilia", requester_name: "Mia" }];
let shopChanges = [{ id: 1, eisdiele_id: 1, shop_name: "Eismanufaktur Emilia", requester_name: "Mia", status: "pending", created_at: "2026-10-07 12:00:00", changes: { name: "Emilia" } }];
const longName =
  "Eismanufaktur mit einem außergewöhnlich langen Namen in der historischen Altstadt";
const comment =
  "Ein ausführlicher Besuchsbericht mit Empfehlungen für Lieblingssorten. ".repeat(
    8,
  );
const baseData = {
  eisdiele: {
    id: 1,
    name: "Eismanufaktur Emilia",
    adresse: "Markt 12, 09111 Chemnitz",
    latitude: 50.83,
    longitude: 12.92,
    status: "open",
    is_open_now: true,
    place_type: "ice_shop",
    website: "https://example.invalid",
    landkreis: "Chemnitz",
    landkreis_id: 1,
    bundesland: "Sachsen",
    bundesland_id: 1,
    land: "Deutschland",
    user_id: 8,
    erstellt_am: "2025-01-02 12:00:00",
    openingHoursStructured: {
      timezone: "Europe/Berlin",
      days: Array.from({ length: 7 }, (_, i) => ({
        weekday: i + 1,
        ranges: [{ open: "12:00", close: "20:00" }],
      })),
    },
    business_permissions: { can_stamp: false },
    loyalty_program: null,
  },
  preise: {
    kugel: {
      preis: 2.2,
      waehrung_symbol: "€",
      letztes_update: "2026-10-02 12:00:00",
    },
    softeis: null,
  },
  scores: { kugel: 4.3, softeis: null, eisbecher: null },
  bewertungen: { auswahl: 24 },
  statistiken: {
    gesamt_checkins: 30,
    verschiedene_besucher: 12,
    letzter_checkin: "2026-10-06 12:00:00",
    anreise_verteilung: [
      { anreise: "Fahrrad", anzahl: 15 },
      { anreise: "Zu Fuß", anzahl: 10 },
      { anreise: "Auto", anzahl: 5 },
    ],
  },
  checkin_details_by_type: [
    { typ: "Kugel", anzahl: 20 },
    { typ: "Softeis", anzahl: 10 },
  ],
  beliebte_sorten: {
    meistgegessen: [
      { sortenname: "Pistazie", anzahl: 15, durchschnittsbewertung: 4.6 },
      {
        sortenname: "Dunkle Schokolade",
        anzahl: 10,
        durchschnittsbewertung: 4.3,
      },
      { sortenname: "Mango", anzahl: 7, durchschnittsbewertung: 4.2 },
    ],
    bestbewertet: [
      { sortenname: "Pistazie", anzahl: 15, durchschnittsbewertung: 4.6 },
    ],
  },
  attribute: Array.from({ length: 9 }, (_, i) => ({
    id: i + 1,
    name: [
      "Vegane Sorten",
      "Hausgemachtes Eis",
      "Sitzplätze",
      "Regionale Zutaten",
      "Außenterrasse",
      "Kartenzahlung",
      "LangeÖffnungszeitenOhneTrennzeichen",
      "Kinderfreundlich",
      "Waffeln",
    ][i],
    anzahl: 10 - i,
  })),
  preis_historie: [
    { typ: "kugel", preis: 1.8, datum: "2025-10-02 12:00:00" },
    { typ: "softeis", preis: 2.8, datum: "2025-12-02 12:00:00" },
    { typ: "kugel", preis: 2.2, datum: "2026-10-02 12:00:00" },
  ],
  checkins: Array.from({ length: 30 }, (_, i) => ({
    id: i + 1,
    nutzer_id: 77,
    nutzer_name:
      i === 0 ? "Mia mit einem sehr langen Anzeigenamen" : "Nutzer " + (i + 1),
    eisdiele_id: 1,
    eisdiele_name: "Eismanufaktur Emilia",
    typ: "Kugel",
    datum: "2026-10-06 12:00:00",
    eissorten: [
      { sortenname: "Pistazie", bewertung: 4.6 },
      { sortenname: "Schokolade", bewertung: 4.2 },
    ],
    geschmackbewertung: 4.4,
    größenbewertung: 4,
    waffelbewertung: 3.8,
    preisleistungsbewertung: 4.1,
    anreise: "Fahrrad",
    is_on_site: 1,
    kommentar: comment,
    bilder: i === 0 ? [{ url: "/fixture-ice.svg" }, { url: "/fixture-ice.svg?second" }] : [],
    likes_count: 2,
    has_liked: false,
    commentCount: 1,
    context_type: "ice_shop",
  })),
  reviews: Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    nutzer_id: 77,
    nutzer_name: "Eva mit einem sehr langen Namen",
    eisdiele_id: 1,
    eisdiele_name: "Eismanufaktur Emilia",
    erstellt_am: "2026-10-05 12:00:00",
    auswahl: 24,
    beschreibung: comment,
    attribute_details: [{ id: 1, name: "Vegane Sorten" }],
    bilder: i === 0 ? [{ url: "/fixture-ice.svg" }, { url: "/fixture-ice.svg?second" }] : [],
    likes_count: 2,
    has_liked: false,
    commentCount: 1,
  })),
  routen: Array.from({ length: 15 }, (_, i) => ({
    id: i + 1,
    nutzer_id: 77,
    username: "Tom",
    name: "Die große Eisrunde durch Chemnitz " + (i + 1),
    typ: "Rennrad",
    schwierigkeit: "mittel",
    laenge_km: 32.7,
    hoehenmeter: 320,
    ist_oeffentlich: 1,
    erstellt_am: "2026-10-04 12:00:00",
    beschreibung: comment,
    url: "",
    eisdielen: [{ id: 1, name: "Eismanufaktur Emilia" }],
    likes_count: 0,
    has_liked: false,
    commentCount: 1,
  })),
  foto_galerie: Array.from({ length: 16 }, (_, i) => ({
    id: i + 1,
    url: "/fixture-ice.svg?i=" + i,
    username: "Mia mit einem sehr langen Namen",
    datum: "2026-10-06 12:00:00",
  })),
  persoenliche_statistiken: {
    eigene_checkins: 3,
    letzter_besuch: "2026-10-06 12:00:00",
  },
};
let data = structuredClone(baseData);
const priceExample = () => {
  const example = structuredClone(baseData);
  example.eisdiele.ice_offerings = Object.fromEntries(["kugel", "softeis", "eisbecher"].map(type => [type, { state: "offered", source: "observed", checkin_count: type === "kugel" ? 20 : 5 }]));
  example.preise = {
    kugel: { preis: 2.1, waehrung_symbol: "EUR", letztes_update: "2026-10-01 12:00:00", beschreibung: "Premiumsorten 2,60 €" },
    softeis: { preis: 2.8, waehrung_symbol: "EUR", letztes_update: "2026-10-01 12:00:00", beschreibung: "Kleines Softeis: 2,80 € / großes Softeis: 3,80 €" },
  };
  example.scores = { kugel: 4.7, softeis: null, eisbecher: 5 };
  example.bewertungen.auswahl = 22;
  return example;
};
const tick = () => new Promise((resolve) => setTimeout(resolve, 90));
const check = (value, message) => {
  if (!value) throw new Error(message);
  checks.push(message);
};
const overflow = (message) => {
  const offending = [...document.querySelectorAll("main *")]
    .filter((element) => element.getBoundingClientRect().right > innerWidth + 1)
    .slice(0, 4)
    .map((el) => el.tagName + "." + el.className);
  check(
    document.documentElement.scrollWidth <= innerWidth + 1,
    message + " " + offending.join(","),
  );
};
const cardFits = (message) => {
  const card = main().querySelector(".shopdetail-feed-card > [data-activity-card]");
  const oversized = [card, ...card.querySelectorAll("div,table")].filter(
    (el) => el.clientWidth && el.scrollWidth > el.clientWidth + 1,
  );
  check(
    !oversized.length,
    message +
      " " +
      oversized.map((el) => el.tagName + "." + el.className).join(","),
  );
};
const response = (body, status = 200) => ({
  ok: status < 400,
  status,
  json: async () => body,
});
Object.defineProperty(navigator, "share", {
  configurable: true,
  value: undefined,
});
Object.defineProperty(navigator, "clipboard", {
  configurable: true,
  value: {
    writeText: async (value) => {
      copied = value;
    },
  },
});
window.fetch = async (input, init = {}) => {
  const url = new URL(String(input), "https://test.invalid");
  if (!url.href.startsWith("https://test.invalid/"))
    throw new Error("External API request rejected");
  calls.push({ url: url.href, init });
  if (url.pathname.endsWith("get_eisdiele_details.php") || url.pathname.endsWith("get_eisdiele.php")) {
    if (delayShop)
      await new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, delayShop);
        init.signal.addEventListener(
          "abort",
          () => {
            clearTimeout(timer);
            reject(new DOMException("Aborted", "AbortError"));
          },
          { once: true },
        );
      });
    return failShop
      ? response({ status: "error" }, 503)
      : response(structuredClone(data));
  }
  if (url.pathname.endsWith("getRoutes.php")) return response(structuredClone(data.routen));
  if (url.pathname.endsWith("shop_ice_offerings.php")) {
    if (url.searchParams.get("action") === "list") return response({ status: "success", reports: offeringReports.filter(report => url.searchParams.get("status") === "all" || report.status === url.searchParams.get("status")) });
    if (url.searchParams.get("action") === "review") { const payload = JSON.parse(init.body); offeringReports[0].status = payload.decision === "approve" ? "approved" : "rejected"; return response({ status: "success" }); }
    if (init.method === "POST") {
      const payload = JSON.parse(init.body);
      for (const [type, state] of Object.entries(payload.states)) {
        data.eisdiele.ice_offerings[type].my_state = state;
        if (user === 1) Object.assign(data.eisdiele.ice_offerings[type], { state, source: "admin" });
      }
    }
    return response({ status: "success", message: "Gespeichert" });
  }
  if (url.pathname.endsWith("get_shop_change_request_count.php")) return response({ status: "success", pending_count: shopChanges.filter(change => change.status === "pending").length + offeringReports.filter(report => report.status === "pending").length });
  if (url.pathname.endsWith("get_shop_change_requests.php")) return response({ requests: shopChanges.filter(change => url.searchParams.get("status") === "all" || change.status === url.searchParams.get("status")) });
  if (url.pathname.endsWith("handle_shop_change_request.php")) { shopChanges[0].status = JSON.parse(init.body).action === "approve" ? "approved" : "rejected"; return response({ status: "success" }); }
  if (url.pathname.includes("session.php"))
    return response({
      status: "success",
      userId: user,
      username: "Nutzer " + user,
      currentLevel: 5,
    });
  if (url.pathname.includes("get_user_stats.php"))
    return response({ status: "success", nutzername: "Nutzer " + user });
  if (url.pathname.includes("streak_status.php"))
    return response({
      level_info: { level: 5 },
      streaks: {},
      events: [],
      refresh_after_seconds: 3600,
    });
  if (url.pathname.includes("benachrichtigungen.php"))
    return response({ status: "success", notifications: [], unread_total: 0 });
  if (url.pathname.includes("is_favorit.php"))
    return response({ favorit: false });
  if (url.pathname.includes("favoriten_toggle.php"))
    return response({ status: "added", is_favorit: true });
  if (url.pathname.includes("kommentare.php"))
    return response({
      status: "success",
      kommentare: [
        {
          id: 99,
          nutzer_id: 77,
          nutzername: "Mia",
          erstellt_am: "2026-10-06 12:00:00",
          kommentar: "Ein gezielt verlinkter Kommentar.",
        },
      ],
    });
  if (url.pathname.includes("likes.php"))
    return response({ success: true, likes_count: 2, has_liked: false });
  return response({
    status: "success",
    actions: [],
    activities: [],
    checkins: [],
    awards: [],
    events: [],
    data: [],
    users: [],
  });
};
function SideFixture() {
  const { shopId } = useParams();
  return <main className="shopdetail-main"><ShopDetailsView shopId={shopId} onClose={() => window.shopNavigate("/map")} refreshMapShops={() => {}} /></main>;
}
function Probe() {
  const location = useLocation(),
    navigate = useNavigate();
  window.shopNavigate = navigate;
  window.shopLocation = location;
  return null;
}
const main = () => document.querySelector("main.shopdetail-main");
const checkShopActions = (container, checkinLabel, context) => {
  const actions = container.querySelector("[data-shop-actions]");
  check([...actions.children].map(control => control.textContent.trim()).join("|") === `${checkinLabel}|Bewerten|Eis-Date planen`, `${context}: check-in and rating precede ice dates`);
  const [checkin, review, date] = [...actions.children].map(control => control.getBoundingClientRect());
  check(checkin.width >= 44 && checkin.height >= 44 && review.width >= 44 && review.height >= 44, `${context}: both main actions stay visible and usable`);
  check(Math.abs(checkin.top - review.top) < 2 && date.top >= review.bottom, `${context}: ice dates occupy a separate, secondary row`);
};
const checkShopIdentity = (container, context) => {
  const identity = container.querySelector("[data-shop-identity]");
  const name = identity.querySelector("h1, h2").getBoundingClientRect();
  const tools = [...identity.querySelectorAll("[data-shop-utilities] > button")].map(button => button.getBoundingClientRect());
  check(name.width >= identity.getBoundingClientRect().width - 1, `${context}: the shop name uses the entire header width`);
  check(tools.every(bounds => bounds.width >= 44 && bounds.height >= 44 && Math.abs(bounds.top - tools[0].top) < 1), `${context}: header tools form one accessible row`);
  check(tools.every(bounds => bounds.bottom <= name.top), `${context}: header tools do not overlap the shop name`);
};
const button = (label) =>
  getByRole(main(), "button", { name: label, exact: true });
const click = async (label) => {
  fireEvent.click(button(label));
  await tick();
};
const selectTab = async (label) => {
  fireEvent.click(getByRole(main(), "tab", { name: new RegExp("^" + label) }));
  await tick();
};
async function mount(path = "/shop/1", id = 4) {
  user = id;
  if (id) {
    localStorage.setItem("userId", String(id));
    localStorage.setItem("username", "Nutzer " + id);
    localStorage.setItem("authToken", "test-token");
  } else {
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    localStorage.removeItem("authToken");
  }
  root.render(
    <MemoryRouter key={++mountId} initialEntries={[path]}>
      <UserProvider>
        <Probe />
        <Routes>
          <Route path="/shop/:shopId" element={<IceShopDetailPage />} />
          <Route path="/map/activeShop/:shopId" element={<SideFixture />} />
          <Route path="/admin/shop-changes" element={<ShopChangeRequestsAdmin />} />
          <Route path="*" element={<p>Andere Seite</p>} />
        </Routes>
      </UserProvider>
    </MemoryRouter>,
  );
  await tick();
  await tick();
}
window.shopPreview = async (kind) => {
  data = structuredClone(baseData);
  if (kind === "prices") data = priceExample();
  failShop = false;
  if (kind === "empty") {
    data.checkins = [];
    data.reviews = [];
    data.routen = [];
    data.foto_galerie = [];
    data.eisdiele.openingHoursStructured = null;
    data.eisdiele.is_open_now = false;
  }
  await mount(kind === "sideview" ? "/map/activeShop/1" :
    "/shop/1" +
      (["photos", "checkins", "reviews", "stats", "routes"].includes(kind)
        ? "?tab=" + kind
        : ""),
  );
  await waitFor(() => {
    if (!main().querySelector(kind === "sideview" ? "[data-shop-sideview]" : ".shopdetail-hero")) {
      throw new Error("Waiting for the shop preview to finish loading");
    }
  });
  if (kind === "cards") {
    await selectTab("Beiträge");
    await waitFor(() => {
      const card = main().querySelector(".shopdetail-feed-card");
      if (!card) throw new Error("Waiting for activity cards in the preview");
      card.scrollIntoView();
    });
  }
};
(async () => {
  const preview = new URLSearchParams(location.search).get("preview");
  if (preview) {
    await window.shopPreview(preview);
    document.getElementById("results").dataset.status = "preview";
    return;
  }
  await mount();
  check(
    main().querySelector("h1").textContent === data.eisdiele.name,
    "Shop heading displayed",
  );
  checkShopActions(main(), "Einchecken", "Full shop");
  checkShopIdentity(main(), "Full shop");
  const favorite = getByRole(main(), "button", { name: "Zu Favoriten hinzufügen" });
  fireEvent.click(favorite); await tick();
  check(favorite.getAttribute("aria-pressed") === "true" && favorite.getAttribute("aria-label") === "Aus Favoriten entfernen", "Favorite action exposes its selected state and next action");
  check(
    main().textContent.includes("2,20 €"),
    "Price uses German formatting and currency",
  );
  check(
    main().textContent.includes("Jetzt geöffnet"),
    "Opening status displayed",
  );
  check(
    main().querySelector("[role=tab][aria-selected=true]").textContent ===
      "Übersicht",
    "Overview default",
  );
  check(
    !main().querySelector(".shopdetail-feed-card") &&
      !main().querySelector(".recharts-wrapper"),
    "Overview excludes long feeds and charts",
  );
  check(
    main().querySelector('a[href="/map/activeShop/1"]'),
    "Map returns to selected shop",
  );
  check(
    calls.some(
      (call) =>
        call.url.includes("get_eisdiele_details.php") &&
        call.init.headers.Authorization === "Bearer test-token",
    ),
    "Authenticated detail fetch retained",
  );
  overflow("Overview has no horizontal overflow");
  const hours = main().querySelector(".shopdetail-disclosure summary");
  fireEvent.click(hours);
  await tick();
  check(
    main().querySelector(".shopdetail-hours").rows.length === 7,
    "All seven opening days available",
  );
  fireEvent.click(hours);
  await tick();
  await click("Eisdiele teilen");
  check(
    copied === location.origin + "/shop/1" && !copied.includes("/#/"),
    "Share copies correct BrowserRouter URL",
  );
  check(
    main().querySelector("[role=status]").textContent.includes("Link kopiert"),
    "Copy success feedback visible",
  );
  Object.defineProperty(navigator, "share", {
    configurable: true,
    value: async (payload) => {
      nativeShare = payload;
    },
  });
  await click("Eisdiele teilen");
  check(
    nativeShare.url === location.origin + "/shop/1",
    "Native share uses same URL",
  );
  Object.defineProperty(navigator, "share", {
    configurable: true,
    value: async () => {
      throw new Error("Denied");
    },
  });
  await click("Eisdiele teilen");
  check(
    main().querySelector('input[aria-label="Link zur Eisdiele"]').value ===
      copied,
    "Share failure provides manual copy field",
  );
  Object.defineProperty(navigator, "share", {
    configurable: true,
    value: undefined,
  });
  await selectTab("Beiträge");
  check(
    window.shopLocation.search === "?tab=checkins",
    "Section selection stored in URL",
  );
  await waitFor(() => check(main().querySelectorAll(".shopdetail-feed-card").length === 12, "Contributions initially show twelve"));
  check(
    main().querySelectorAll(".shopdetail-feed-card > [data-activity-card]").length === 12,
    "Check-in cards are directly visible",
  );
  const activityPhoto = main().querySelector('[data-activity-media] button');
  activityPhoto.focus(); fireEvent.click(activityPhoto); await tick();
  await waitFor(() => check(document.querySelector('[role="dialog"]')?.contains(document.activeElement), "Activity photo gallery opens with focus inside the dialog"));
  const activityDialog = document.querySelector('[role="dialog"]');
  fireEvent.keyDown(document, { key: "ArrowRight" }); await tick();
  check(activityDialog.querySelector('img').src.includes("second"), "Activity gallery keeps next-photo keyboard navigation");
  fireEvent.keyDown(document, { key: "Escape" }); await tick();
  check(!document.querySelector('[role="dialog"]') && document.activeElement === activityPhoto, "Closing activity photos restores keyboard focus");
  check(
    !main().querySelector(".shopdetail-feed-card details"),
    "Cards have no disclosure wrapper",
  );
  check(
    getComputedStyle(main().querySelector(".shopdetail-feed-card > [data-activity-card]"))
      .backgroundColor === "rgb(255, 255, 255)",
    "Cards use the white shop-panel surface",
  );
  overflow("Check-in has no horizontal overflow");
  cardFits("Check-in content fits inside its card");
  await click("Weitere Beiträge anzeigen (18 weitere)");
  check(
    main().querySelectorAll(".shopdetail-feed-card").length === 24,
    "Load more extends check-ins",
  );
  await click("Weitere Beiträge anzeigen (6 weitere)");
  check(
    main().querySelectorAll(".shopdetail-feed-card").length === 30,
    "All check-ins are reachable",
  );
  check(
    !main().querySelector(".shopdetail-load-more"),
    "Load more disappears at end",
  );
  await click("Bewertungen 20");
  check(
    window.shopLocation.search === "?tab=reviews",
    "Review subsection stored in URL",
  );
  check(
    main().querySelectorAll(".shopdetail-feed-card > [data-activity-card]").length === 12,
    "Review cards are directly visible",
  );
  overflow("Review has no horizontal overflow");
  cardFits("Review content fits inside its card");
  await selectTab("Fotos");
  check(
    main().querySelectorAll(".shopdetail-photo-grid figure").length === 12,
    "Gallery limits initial images",
  );
  await click("Weitere Fotos anzeigen (4 weitere)");
  check(
    main().querySelectorAll(".shopdetail-photo-grid figure").length === 16,
    "Remaining gallery images reachable",
  );
  const photoButton = main().querySelector(".shopdetail-photo-grid button");
  photoButton.focus();
  fireEvent.click(photoButton);
  await tick();
  const dialog = document.querySelector("[role=dialog]");
  check(
    dialog && dialog.contains(document.activeElement),
    "Photo dialog moves focus inside",
  );
  fireEvent.click(getByRole(dialog, "button", { name: "Nächstes Foto" }));
  await tick();
  check(
    dialog.querySelector("footer p").textContent.startsWith("2 / 16"),
    "Photo next button works",
  );
  fireEvent.keyDown(window, { key: "ArrowLeft" });
  await tick();
  check(
    dialog.querySelector("footer p").textContent.startsWith("1 / 16"),
    "Photo keyboard previous works",
  );
  fireEvent.error(dialog.querySelector("img"));
  await tick();
  check(
    dialog.textContent.includes("Dieses Foto konnte nicht geladen"),
    "Failed photo gets visible fallback",
  );
  fireEvent.click(
    getByRole(dialog, "button", { name: "Fotoansicht schließen" }),
  );
  await tick();
  check(
    !document.querySelector("[role=dialog]") &&
      document.activeElement === photoButton,
    "Closing photo restores trigger focus",
  );
  overflow("Gallery has no horizontal overflow");
  await selectTab("Routen");
  check(
    main().querySelectorAll(".shopdetail-feed-card > [data-activity-card]").length === 12 &&
      main().querySelector("[aria-label=Tourdaten]"),
    "Route cards are directly visible",
  );
  overflow("Route has no horizontal overflow");
  cardFits("Route content fits inside its card");
  await selectTab("Statistik");
  check(
    main().querySelector(".recharts-wrapper"),
    "Statistics chart only loads in statistics",
  );
  check(
    main()
      .querySelector(".shopdetail-distribution")
      .textContent.includes("50 %"),
    "Distribution percentages visible",
  );
  const priceTable = main().querySelector(".shopdetail-disclosure summary");
  fireEvent.click(priceTable);
  await tick();
  check(
    main().querySelector(".shopdetail-data-table tbody").rows.length > 1,
    "Accessible price table available",
  );
  check(
    main()
      .querySelector(".shopdetail-data-table tbody")
      .textContent.includes("€"),
    "Historical prices include currency",
  );
  overflow("Statistics has no horizontal overflow");
  window.shopNavigate(-1);
  await tick();
  check(
    window.shopLocation.search === "?tab=routes",
    "Back restores previous section",
  );
  await mount("/shop/1?tab=checkins&focusCheckin=30&focusComment=99");
  await waitFor(() =>
    check(
      main().querySelector(".shopdetail-feed-card li[data-focused=true]"),
      "Notification opens target comment beyond old item cap",
    ),
  );
  check(
    main().querySelector(".shopdetail-feed-card[data-focused] > [data-activity-card]"),
    "Notification highlights target card",
  );
  check(
    main().querySelectorAll(".shopdetail-feed-card").length === 30,
    "Notification target beyond first batch rendered",
  );
  cardFits("Focused comments fit inside their card");
  await selectTab("Fotos");
  check(
    !window.shopLocation.search.includes("focus"),
    "Manual section change clears temporary focus",
  );
  await mount("/shop/1?focusReview=20&focusComment=99");
  check(
    main().querySelector("[aria-pressed=true]").textContent ===
      "Bewertungen 20",
    "Review focus link chooses correct subsection",
  );
  await mount("/shop/1?tab=routes&focusRoute=15");
  check(
    main().querySelectorAll(".shopdetail-feed-card").length === 15 &&
      main().querySelector(".shopdetail-feed-card"),
    "Route notification target visible",
  );
  failShop = true;
  await click("Aktualisieren");
  check(
    main().querySelector("[role=alert]") && main().querySelector("h1"),
    "Refresh failure retains existing data",
  );
  failShop = false;
  delayShop = 300;
  fireEvent.click(button("Erneut versuchen"));
  await tick();
  check(button("Aktualisiert …").disabled, "Refresh has disabled busy state");
  check(main().querySelector("h1"), "Existing data remains while refreshing");
  await new Promise((resolve) => setTimeout(resolve, 350));
  delayShop = 0;
  check(!main().querySelector("[role=alert]"), "Retry clears error");
  failShop = true;
  await mount();
  check(
    main().textContent.includes("Eisdiele nicht verfügbar"),
    "Initial error visible",
  );
  failShop = false;
  await click("Erneut versuchen");
  check(main().querySelector(".shopdetail-hero"), "Initial retry recovers");
  data.eisdiele.name = longName;
  data.eisdiele.latitude = 0;
  data.eisdiele.longitude = 0;
  await mount();
  check(
    main().querySelector(".leaflet-container"),
    "Zero coordinates produce valid map",
  );
  check(
    new URL(getByRole(main(), "link", { name: "Route dorthin" }).href).searchParams.get(
      "query",
    ) === "0,0",
    "Zero coordinates used by route link",
  );
  overflow("Long shop name has no horizontal overflow");
  data = structuredClone(baseData);
  data.eisdiele.openingHoursStructured = null;
  data.eisdiele.is_open_now = false;
  data.eisdiele.latitude = null;
  data.eisdiele.longitude = null;
  data.foto_galerie = [];
  data.scores = { kugel: null };
  data.preise = { kugel: null };
  await mount();
  check(
    main().textContent.includes("Öffnungszeiten unbekannt"),
    "Missing hours are not falsely shown as closed",
  );
  check(
    main().textContent.includes("Noch keine Öffnungszeiten"),
    "Missing hours explained",
  );
  check(
    !main().querySelector(".shopdetail-preview-photos"),
    "No empty gallery space",
  );
  check(
    main().textContent.includes("Noch nicht bewertet"),
    "Missing scores have empty state",
  );
  await selectTab("Fotos");
  check(
    main().textContent.includes("Noch keine Fotos"),
    "Gallery empty state has check-in action",
  );
  data.eisdiele.place_type = "temporary_stand";
  data.eisdiele.active_until = "2025-01-01";
  await mount();
  check(
    !main().querySelector("#shopdetail-tab-routes"),
    "Non-ice shops omit route tab",
  );
  check(
    main().textContent.includes("Preise & Bewertungen"),
    "Non-ice shops expose their ice ratings",
  );
  check(
    main().textContent.includes("Stand beendet"),
    "Expired stand status visible",
  );
  overflow("Stand overview has no overflow");
  await selectTab("Statistik");
  check(
    !main().textContent.includes("Preisverlauf") &&
      !main().textContent.includes("Bewertungen"),
    "Stand statistics omit ice-shop-specific prices and reviews",
  );
  data = structuredClone(baseData);
  data.preis_historie[0].waehrung_symbol = "CHF";
  await mount("/shop/1?tab=stats");
  check(
    !main().querySelector(".recharts-wrapper") &&
      main().textContent.includes("unterschiedliche Währungen"),
    "Mixed currencies are not plotted as comparable values",
  );
  check(
    main().querySelector(".shopdetail-data-table").textContent.includes("CHF"),
    "Mixed-currency table retains original currency",
  );
  data = structuredClone(baseData);
  data.eisdiele.loyalty_program = {
    stamp_target: 14,
    unit: "scoop",
    reward: "Eine Kugel gratis",
  };
  await mount();
  check(
    main().querySelector('a[href="/kundenkarten?shop=1"]'),
    "Customer card remains directly reachable",
  );
  overflow("Customer card overview has no overflow");
  data.eisdiele.business_permissions = {
    can_stamp: true,
    can_edit_business: true,
  };
  await mount();
  check(
    main().querySelector('a[href="/betreiber/1"]').textContent ===
      "Als Betreiber verwalten",
    "Operator management entry retained",
  );
  data = structuredClone(baseData);
  await mount("/shop/1?tab=checkins&focusCheckin=999");
  check(
    main()
      .querySelector("[role=status]")
      .textContent.includes("nicht mehr verfügbar"),
    "Missing notification target explained",
  );
  main().querySelector(".shopdetail-feed-cards").scrollIntoView();
  window.scrollBy(0, 500);
  await selectTab("Fotos");
  check(
    Math.abs(
      main().querySelector(".shopdetail-tabs").getBoundingClientRect().top,
    ) < 2,
    "Scrolled section change places new content below tabs",
  );
  const panelTop = main()
    .querySelector("#shopdetail-content")
    .getBoundingClientRect().top;
  const tabsBottom = main()
    .querySelector(".shopdetail-tabs")
    .getBoundingClientRect().bottom;
  check(
    panelTop >= tabsBottom && panelTop <= tabsBottom + 24,
    "New section starts at its first content after scroll",
  );
  data = priceExample();
  await mount();
  const pricesPanel = getByRole(main(), "region", { name: "Preise und Bewertungen" });
  check(!pricesPanel.textContent.includes("Wird angeboten") && !pricesPanel.textContent.includes("Bei Besuchen gemeldet"), "Routine offering sources do not clutter the prices panel");
  check(pricesPanel.textContent.includes("2,10 EUR") && pricesPanel.textContent.includes("4,7 / 5") && pricesPanel.textContent.includes("5,0 / 5"), "Compact rows preserve prices and ice-type ratings");
  const priceDetails = pricesPanel.querySelector("[data-price-details]");
  check(!priceDetails.open && priceDetails.textContent.includes("Premiumsorten 2,60 €"), "Price notes remain available without expanding the initial panel");
  fireEvent.click(priceDetails.querySelector("summary")); await tick();
  check(priceDetails.open && priceDetails.textContent.includes("großes Softeis: 3,80 €") && priceDetails.textContent.includes("Gemeldet am"), "Price details expose variants and reporting dates");
  fireEvent.click(priceDetails.querySelector("summary")); await tick();
  check(!pricesPanel.querySelector("button").textContent.includes("Bewertung abgeben") && [...pricesPanel.querySelectorAll("button")].length === 2, "The prices panel keeps two focused actions while rating remains in the header");
  data = structuredClone(baseData);
  data.eisdiele.ice_offerings = {
    kugel: { state: "not_offered", source: "inferred", checkin_count: 0, my_state: "unknown" },
    softeis: { state: "offered", source: "observed", checkin_count: 14, my_state: "unknown" },
    eisbecher: { state: "unknown", source: "unknown", checkin_count: 1, my_state: "unknown" },
  };
  data.scores = { kugel: 4.9, softeis: 4.6, eisbecher: 3.8 };
  data.preise.softeis = { preis: 3.1, waehrung_symbol: "\u20ac" };
  await mount();
  check(main().querySelector('.shopdetail-glance').textContent.includes("Softeis"), "Most visited available type supplies the header rating");
  check(!main().querySelector('[data-ice-type="kugel"]') && main().querySelector('[data-ice-type="softeis"]'), "Inferred absence hides the irrelevant price and rating row");
  check(main().textContent.includes("Vermutlich nicht angeboten"), "Automatic absence is explicitly labelled");
  check(main().querySelector('a[href="/statistics/flavours/Pistazie"]'), "Aggregated flavors link without a misleading type filter");
  check(main().querySelector('a[href="/map?attributes=1"]'), "Shop attributes link to the map filter");
  await click("Angebot korrigieren");
  let offeringDialog = document.querySelector('[role="dialog"]');
  check(offeringDialog && offeringDialog.querySelectorAll("select").length === 3, "Reporting dialog exposes all three ice types");
  fireEvent.change(offeringDialog.querySelector("#offering-kugel"), { target: { value: "offered" } });
  fireEvent.click(getByRole(offeringDialog, "button", { name: "Angaben speichern" }));
  await tick(); await tick();
  check(!document.querySelector('[role="dialog"]') && data.eisdiele.ice_offerings.kugel.my_state === "offered", "Saving an offering report submits and closes the dialog");
  const reportCall = calls.findLast(call => call.url.includes("shop_ice_offerings.php"));
  check(reportCall.init.headers.Authorization === "Bearer test-token" && JSON.parse(reportCall.init.body).shop_id === 1, "Offering reporting retains authentication and shop context");
  check(Object.keys(JSON.parse(reportCall.init.body).states).join(",") === "kugel", "Reporting leaves unchanged votes and their moderation decisions untouched");
  await mount("/map/activeShop/1");
  await tick();
  const side = document.querySelector('[data-shop-sideview]');
  checkShopActions(side, "Einchecken", "Map sideview");
  checkShopIdentity(side, "Map sideview");
  check(side && side.querySelector('.shopdetail-glance').textContent.includes("Softeis"), "Sideview uses the same main ice type: " + browserErrors.join("; "));
  check(!side.querySelector('[data-ice-type="kugel"]') && side.querySelector('[data-ice-type="softeis"]'), "Sideview uses the same offering visibility");
  check(side.querySelector('a[href="/statistics/flavours/Pistazie"]'), "Sideview flavors are linked");
  check([...side.querySelectorAll("button")].every(button => {
    const bounds = button.getBoundingClientRect();
    return bounds.width >= 44 && bounds.height >= 44;
  }), "Sideview buttons provide at least 44px action surfaces");
  check(getByRole(side, "button", { name: "Eisdiele teilen" }), "Sideview sharing supports keyboard activation");
  fireEvent.click(getByRole(side, "button", { name: "Eisdiele teilen" })); await tick();
  check(copied === location.origin + "/map/activeShop/1" && side.querySelector('[role="status"]').textContent.includes("Link kopiert"), "Sideview sharing copies the route URL with inline confirmation");
  fireEvent.click(getByRole(side, "button", { name: "Angebot korrigieren" })); await tick();
  offeringDialog = document.querySelector('[role="dialog"]');
  check(offeringDialog.querySelector("#offering-kugel").value === "offered", "Sideview reporting prefills the user's own vote");
  fireEvent.click(getByRole(offeringDialog, "button", { name: "Abbrechen" })); await tick();
  fireEvent.click(getByRole(side, "button", { name: "Check-ins", exact: true })); await tick();
  const sideCard = side.querySelector('[data-activity-card]');
  const sideMedia = sideCard.querySelector('[data-activity-media]');
  const sideText = sideCard.querySelector('[data-activity-text]');
  check(sideText.getBoundingClientRect().top > sideMedia.getBoundingClientRect().top, "Photos precede text in narrow cards on every viewport");
  sideCard.style.width = "719px";
  check(sideText.getBoundingClientRect().top > sideMedia.getBoundingClientRect().top, "719px cards retain the stacked photo layout");
  sideCard.style.width = "720px";
  check(Math.abs(sideText.getBoundingClientRect().top - sideMedia.getBoundingClientRect().top) < 2, "720px cards place the photo next to their text");
  sideCard.style.width = "";
  const sideImage = side.querySelector('[data-activity-media] img');
  check(sideImage && sideImage.getBoundingClientRect().width > 180, "Narrow sideview retains a large activity photo");
  overflow("Sideview and activity photos have no horizontal overflow");
  data.eisdiele.place_type = "restaurant";
  data.eisdiele.ice_offerings.softeis.state = "not_offered";
  data.eisdiele.ice_offerings.eisbecher = { state: "offered", source: "operator", checkin_count: 20 };
  await mount();
  check(main().querySelector('.shopdetail-glance').textContent.includes("Eisbecher"), "Restaurants expose their sundae main rating");
  check(!main().querySelector('.shopdetail-glance').textContent.includes("preis"), "Sundae headers do not invent a unit price");
  check(main().querySelector('[data-ice-type="eisbecher"]'), "Restaurants retain the relevant rating tile");
  data = priceExample();
  await mount("/shop/1", 1);
  await click("Angebot korrigieren");
  offeringDialog = document.querySelector('[role="dialog"]');
  check(offeringDialog.textContent.includes("als Admin direkt übernommen") && !offeringDialog.textContent.includes("Zwei übereinstimmende"), "Admin dialog explains immediate changes without community confirmation");
  fireEvent.change(offeringDialog.querySelector("#offering-kugel"), { target: { value: "not_offered" } });
  fireEvent.click(getByRole(offeringDialog, "button", { name: "Angaben speichern" })); await tick(); await tick();
  check(!document.querySelector('[role="dialog"]') && !main().querySelector('[data-ice-type="kugel"]'), "Admin correction immediately updates the full shop without a confirmation step");
  await mount("/map/activeShop/1", 1);
  check(!document.querySelector('[data-shop-sideview] [data-ice-type="kugel"]'), "Admin correction is also effective in the map sideview");
  await click("Angebot korrigieren");
  offeringDialog = document.querySelector('[role="dialog"]');
  fireEvent.change(offeringDialog.querySelector("#offering-kugel"), { target: { value: "offered" } });
  fireEvent.click(getByRole(offeringDialog, "button", { name: "Angaben speichern" })); await tick(); await tick();
  check(!document.querySelector('[role="dialog"]') && document.querySelector('[data-shop-sideview] [data-ice-type="kugel"]'), "Admin can restore an offering directly from the sideview");
  await mount("/admin/shop-changes", 1);
  check(document.body.textContent.includes("Eisangebot aus der Community"), "Existing shop-change administration includes offering moderation");
  const toggleAdminMenu = async name => { fireEvent.click(getByRole(document.body, "button", { name, exact: true })); await tick(); };
  await toggleAdminMenu("Menü öffnen");
  check(document.querySelector('[href="/shop-change-requests"]').textContent.endsWith("2 offen"), "Menu combines pending shop changes and offering reports");
  await toggleAdminMenu("Menü schließen");
  const beforeOfferingDecision = calls.filter(call => call.url.includes("get_shop_change_request_count.php")).length;
  fireEvent.click(getByRole(document.body, "button", { name: "Freigeben", exact: true })); await tick(); await tick();
  check(offeringReports[0].status === "approved", "Offering moderation approves an individual report");
  const decisionCall = calls.findLast(call => call.url.includes("action=review"));
  check(decisionCall.init.headers.Authorization === "Bearer test-token" && JSON.parse(decisionCall.init.body).updated_at === "2026-10-07 12:00:00.000000", "Moderation sends authentication and the exact report version");
  check(calls.filter(call => call.url.includes("get_shop_change_request_count.php")).length > beforeOfferingDecision, "Offering moderation immediately refreshes the menu count");
  await toggleAdminMenu("Menü öffnen");
  check(document.querySelector('[href="/shop-change-requests"]').textContent.endsWith("1 offen"), "Approved offering reports disappear from the menu count");
  await toggleAdminMenu("Menü schließen");
  const beforeShopDecision = calls.filter(call => call.url.includes("get_shop_change_request_count.php")).length;
  fireEvent.click(getByRole(document.body, "button", { name: "Genehmigen", exact: true })); await tick(); await tick();
  check(calls.filter(call => call.url.includes("get_shop_change_request_count.php")).length > beforeShopDecision, "Shop-change moderation immediately refreshes the menu count");
  await toggleAdminMenu("Menü öffnen");
  check(document.querySelector('[href="/shop-change-requests"]').textContent === "Änderungsvorschläge", "Badge disappears after the final pending suggestion is handled");
  await toggleAdminMenu("Menü schließen");
  data = structuredClone(baseData);
  await mount("/map/activeShop/1", null);
  const guestSide = document.querySelector('[data-shop-sideview]');
  checkShopActions(guestSide, "Einchecken", "Guest map sideview");
  const previousLoginRequests = loginRequests;
  fireEvent.click(getByRole(guestSide, "button", { name: "Einchecken", exact: true }));
  fireEvent.click(getByRole(guestSide, "button", { name: "Bewerten", exact: true }));
  check(loginRequests === previousLoginRequests + 2, "Both guest sideview actions open login instead of disappearing");
  await mount("/shop/1", null);
  checkShopActions(main(), "Einchecken", "Guest full shop");
  await click("Bewerten");
  check(document.body.textContent.includes("Einloggen"), "Guest header rating opens login");
  await mount("/shop/1", null);
  check(
    !main().querySelector(".favoriten-button"),
    "Guests have no unusable favorite button",
  );
  await click("Einchecken");
  check(
    document.body.textContent.includes("Einloggen"),
    "Guest check-in opens login",
  );
  check(
    shopStatus({ status: "seasonal_closed", is_open_now: true }).tone ===
      "seasonal",
    "Seasonal closure overrides opening state",
  );
  check(
    shopAssetUrl("javascript:alert(1)") === null &&
      shopAssetUrl("//evil.invalid/image") === null,
    "Unsafe photo URLs rejected",
  );
  check(
    shopDetailTab(new URLSearchParams("focusReview=1")) === "reviews",
    "Focus-only review link supported",
  );
  const history = shopPriceHistory(baseData.preis_historie);
  check(
    history[0].softeis === null && history.at(-1).kugel === 2.2,
    "Price history preserves unknown values and latest reports",
  );
  check(
    history[0].kugelCurrency === "€" && history[0].softeisCurrency === null,
    "Currency follows carried values and missing values",
  );
  await window.shopPreview("overview");
  const result = { passed: checks.length, viewport: innerWidth, checks };
  document.getElementById("results").textContent = JSON.stringify(result);
  document.getElementById("results").dataset.status = "passed";
})().catch((error) => {
  document.getElementById("results").textContent = error.stack;
  document.getElementById("results").dataset.status = "failed";
});
