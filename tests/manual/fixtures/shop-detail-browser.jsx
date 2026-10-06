import React from "react";
import { createRoot } from "react-dom/client";
import {
  MemoryRouter,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { configure, fireEvent, getByRole, waitFor } from "@testing-library/dom";
import { UserProvider } from "../../../src/context/UserContext";
import IceShopDetailPage from "../../../src/pages/IceShopDetailPage";
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
let mountId = 0,
  user = 4,
  failShop = false,
  delayShop = 0,
  copied = "",
  nativeShare = null;
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
    bilder: [],
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
    bilder: [],
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
  const card = main().querySelector(".shopdetail-feed-card > div");
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
  if (url.pathname.endsWith("get_eisdiele_details.php")) {
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
function Probe() {
  const location = useLocation(),
    navigate = useNavigate();
  window.shopNavigate = navigate;
  window.shopLocation = location;
  return null;
}
const main = () => document.querySelector("main.shopdetail-main");
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
  failShop = false;
  if (kind === "empty") {
    data.checkins = [];
    data.reviews = [];
    data.routen = [];
    data.foto_galerie = [];
    data.eisdiele.openingHoursStructured = null;
    data.eisdiele.is_open_now = false;
  }
  await mount(
    "/shop/1" +
      (["photos", "checkins", "stats", "routes"].includes(kind)
        ? "?tab=" + kind
        : ""),
  );
  if (kind === "cards") {
    await selectTab("Beiträge");
    main().querySelector(".shopdetail-feed-card").scrollIntoView();
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
  check(
    main().querySelectorAll(".shopdetail-feed-card").length === 12,
    "Contributions initially show twelve",
  );
  check(
    main().querySelectorAll(".shopdetail-feed-card > div").length === 12,
    "Check-in cards are directly visible",
  );
  check(
    !main().querySelector(".shopdetail-feed-card details"),
    "Cards have no disclosure wrapper",
  );
  check(
    getComputedStyle(main().querySelector(".shopdetail-feed-card > div"))
      .boxShadow !== "none",
    "Shared card appearance retained",
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
    main().querySelectorAll(".shopdetail-feed-card > div").length === 12,
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
    main().querySelectorAll(".shopdetail-feed-card > div").length === 12 &&
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
    main().querySelector(".shopdetail-feed-card[data-focused] > div"),
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
    new URL(main().querySelector("a[target=_blank]").href).searchParams.get(
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
    main().textContent.includes("Noch keine Community-Bewertungen"),
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
    !main().textContent.includes("Preise & Bewertungen"),
    "Non-ice shops omit inappropriate ratings",
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
  data = structuredClone(baseData);
  await mount("/shop/1", null);
  check(
    !main().querySelector(".favoriten-button"),
    "Guests have no unusable favorite button",
  );
  await click("Eis einchecken");
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
