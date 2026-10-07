import React from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { configure, fireEvent, getByRole, waitFor } from "@testing-library/dom";
import { UserProvider } from "../../../src/context/UserContext";
import IceDate from "../../../src/pages/IceDate";
import { ICE_DATE_DRAFT_KEY, defaultStart, localDateInput, toApiDate } from "../../../src/utils/iceDate.mjs";
import "../../../src/index.css";

configure({ getElementError: message => new Error(message.split("Here are")[0].slice(0, 500)) });
const root = createRoot(document.getElementById("app")), checks = [], calls = [], browserErrors = [];
window.addEventListener("error", event => browserErrors.push(event.error?.stack || event.message));
window.addEventListener("unhandledrejection", event => browserErrors.push(String(event.reason)));
let loginRequests = 0, user = 2, mountId = 0, nextId = 200, failLoad = false, failUsers = false, failShop = false, clipboardFail = false, shared = null;
window.addEventListener("auth:open-login", () => loginRequests++);
const longName = "NutzerMitEinemSehrLangenAnzeigenamenOhneTrennzeichen";
const shops = [
  { id: 1, name: "Eismanufaktur Emilia", adresse: "Markt 12, Chemnitz", place_type: "ice_shop", openingHours: "Mo–So: 12:00–20:00", status: "open" },
  { id: 2, name: "Softeis am Park", adresse: "Parkstraße 2, Chemnitz", place_type: "ice_shop", openingHours: "", status: "open" },
  { id: 3, name: "Restaurant", adresse: "Markt 13", place_type: "restaurant" },
];
const users = [{ id: 2, username: "Mia" }, { id: 3, username: "Jonas" }, { id: 4, username: longName }];
const shifted = (days, hour = 18) => { const date = new Date(); date.setDate(date.getDate() + days); date.setHours(hour, 0, 0, 0); return toApiDate(localDateInput(date)); };
let entries = {};
function makeEntry(id, creator = 1, status = "planned", days = 2) {
  const participants = [{ user_id: creator, username: creator === 2 ? "Mia" : "Organisation", role: "organizer", status: "going" },
    ...(creator !== 2 ? [{ user_id: 2, username: "Mia", role: "participant", status: "invited" }] : []),
    { user_id: 4, username: longName, role: "participant", status: "maybe", avatar_url: "/fixture-avatar.svg" }];
  return { id, creator_user_id: creator, shop_id: 1, title: "Feierabendeis", note: "Treffpunkt vor dem Eingang.", starts_at: shifted(days), status,
    invite_token: "fixture-invitation-" + id, shop_name: shops[0].name, shop_address: shops[0].adresse, shop_opening_hours: shops[0].openingHours,
    shop_status: "open", shop_is_open_at_start: true, checkin_count: status === "completed" ? 2 : 0, participants };
}
function resetEntries() { entries = Object.fromEntries([makeEntry(100), makeEntry(101, 2), makeEntry(102, 2, "completed", -3), makeEntry(103, 2, "cancelled", -2), makeEntry(104, 2, "planned", 1)].map(entry => [entry.id, entry])); }
function detail(entry) {
  const value = structuredClone(entry), participant = value.participants.find(person => person.user_id === user);
  value.is_organizer = value.creator_user_id === user;
  value.viewer_status = participant?.status || null;
  value.capacity = 8; value.reserved_count = 1 + value.participants.filter(person => person.user_id !== value.creator_user_id && person.status !== "declined").length;
  value.free_places = 8 - value.reserved_count; value.going_count = value.participants.filter(person => person.status === "going").length;
  value.checkin_window_open = Math.abs(new Date(value.starts_at.replace(" ", "T")).getTime() - Date.now()) <= 86400000;
  value.can_checkin = value.status === "planned" && value.viewer_status === "going" && value.checkin_window_open;
  return value;
}
const response = (data, status = 200) => ({ ok: status < 400, status, json: async () => data });
Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async value => { if (clipboardFail) throw new Error("Denied"); shared = value; } } });
Object.defineProperty(navigator, "geolocation", { configurable: true, value: { getCurrentPosition: success => success({ coords: { latitude: 50.83, longitude: 12.92 } }), watchPosition: success => { success({ coords: { latitude: 50.83, longitude: 12.92 } }); return 1; }, clearWatch() {} } });
window.fetch = async (input, init = {}) => {
  const url = new URL(String(input), "https://test.invalid");
  if (!url.href.startsWith("https://test.invalid/")) throw new Error("External API rejected");
  calls.push({ url: url.pathname + url.search, init });
  if (url.pathname.endsWith("get_eisdielen_list.php")) return response(shops);
  if (url.pathname.endsWith("ice_date_shop.php")) {
    if (failShop) return response({ status: "error", message: "Eisdiele konnte nicht geladen werden." }, 503);
    const shop = shops.find(place => place.id === Number(url.searchParams.get("shop_id"))), start = url.searchParams.get("starts_at");
    return response({ status: "success", shop: { ...shop, opening_reference: start, is_open_at_start: shop.id === 2 ? null : Number(start?.slice(11, 13)) >= 12 && Number(start?.slice(11, 13)) < 20 } });
  }
  if (url.pathname.endsWith("search_user.php")) return failUsers ? response({ status: "error", message: "Nutzersuche ist nicht erreichbar." }, 503) : response(users.filter(person => person.username.toLowerCase().includes(url.searchParams.get("q").toLowerCase())));
  if (url.pathname.endsWith("ice_date_create.php")) {
    const payload = JSON.parse(init.body), shop = shops.find(place => place.id === payload.shop_id);
    const entry = { ...makeEntry(++nextId, user), title: payload.title || null, note: payload.note, starts_at: payload.starts_at, shop_id: shop.id, shop_name: shop.name, shop_address: shop.adresse,
      participants: [{ user_id: user, username: "Mia", role: "organizer", status: "going" }, ...payload.participant_user_ids.map(id => ({ user_id: id, username: users.find(person => person.id === id)?.username || "Nutzer", role: "participant", status: "invited" }))] };
    entries[entry.id] = entry; return response({ status: "success", ice_date: detail(entry) });
  }
  if (url.pathname.endsWith("ice_date_detail.php")) {
    if (failLoad) return response({ status: "error", message: "Treffen konnte nicht geladen werden." }, 503);
    const entry = url.searchParams.has("token") ? Object.values(entries).find(value => value.invite_token === url.searchParams.get("token")) : entries[Number(url.searchParams.get("id"))];
    return entry ? response({ status: "success", ice_date: detail(entry) }) : response({ status: "error", message: "Einladung nicht gefunden." }, 404);
  }
  if (url.pathname.endsWith("ice_date_rsvp.php")) {
    const payload = JSON.parse(init.body), entry = entries[payload.ice_date_id];
    let person = entry.participants.find(value => value.user_id === user);
    if (!person) { person = { user_id: user, username: "Linkgast " + user, role: "participant" }; entry.participants.push(person); }
    person.status = payload.status; return response({ status: "success", ice_date: detail(entry) });
  }
  if (url.pathname.endsWith("ice_date_cancel.php")) { entries[JSON.parse(init.body).ice_date_id].status = "cancelled"; return response({ status: "success" }); }
  if (url.pathname.endsWith("ice_date_list.php")) return response({ status: "success", ice_dates: Object.values(entries).filter(entry => entry.participants.some(person => person.user_id === user)).reverse().map(detail) });
  if (url.pathname.includes("session.php")) return response({ status: "success", userId: user, username: "Mia", currentLevel: 5 });
  if (url.pathname.includes("get_user_stats.php")) return response({ status: "success", nutzername: "Mia" });
  if (url.pathname.includes("streak_status.php")) return response({ level_info: { level: 5 }, streaks: {}, events: [], refresh_after_seconds: 3600 });
  if (url.pathname.includes("benachrichtigungen.php")) return response({ status: "success", notifications: [], unread_total: 0 });
  if (url.pathname.includes("eissorten")) return response([]);
  if (url.pathname.includes("get_eisdiele")) return response({ eisdiele: shops[0], preise: {}, scores: {} });
  return response({ status: "success", actions: [], activities: [], checkins: [], awards: [], events: [], data: [], users: [] });
};
function Probe() { const location = useLocation(), navigate = useNavigate(); window.iceDateNavigate = navigate; window.iceDateLocation = location; return null; }
const tick = () => new Promise(resolve => setTimeout(resolve, 100));
const main = () => document.querySelector("main[data-ice-date]");
const button = name => getByRole(main(), "button", { name, exact: true });
const click = async name => { fireEvent.click(button(name)); await tick(); };
const input = (id, value) => fireEvent.input(document.getElementById(id), { target: { value } });
const check = (value, message) => { if (!value) throw new Error(message); checks.push(message); };
function fits(message) {
  check(document.documentElement.scrollWidth <= window.innerWidth + 1 && window.innerWidth <= Number(new URLSearchParams(location.search).get("width") || window.innerWidth) + 1, message);
  check([...main().querySelectorAll("button,a,input,textarea,summary")].filter(element => element.getBoundingClientRect().height > 0).every(element => element.getBoundingClientRect().height >= 43.5), message + ": 44px targets");
}
async function mount(path, actor = 2) {
  user = actor; localStorage.clear();
  if (user) { localStorage.setItem("userId", String(user)); localStorage.setItem("username", "Mia"); localStorage.setItem("authToken", "fixture-only"); }
  root.render(<MemoryRouter key={++mountId} initialEntries={[path]}><UserProvider><Probe /><Routes>
    <Route path="/ice-date" element={<IceDate />} /><Route path="/ice-date/new" element={<IceDate />} /><Route path="/ice-date/:token" element={<IceDate />} />
    <Route path="/shop/:id" element={<p>Eisdiele</p>} />
  </Routes></UserProvider></MemoryRouter>);
  await tick(); await tick();
}
async function waitShop(name = "Eismanufaktur Emilia") { await waitFor(() => { if (!main().querySelector(`a[href="/shop/${name === "Softeis am Park" ? 2 : 1}"]`)) throw new Error("Shop is loading"); }); await tick(); }
window.iceDatePreview = async kind => {
  sessionStorage.clear(); resetEntries(); failLoad = false; failShop = false;
  if (kind === "new") { await mount("/ice-date/new?shopId=1"); await waitShop(); }
  if (kind === "choose") await mount("/ice-date/new");
  if (kind === "detail") await mount("/ice-date?id=101");
  if (kind === "guest") await mount("/ice-date/fixture-invitation-100", null);
  if (kind === "completed") await mount("/ice-date?id=102");
  if (kind === "list") await mount("/ice-date");
  document.getElementById("results").dataset.status = "preview";
};
async function run() {
  resetEntries(); sessionStorage.clear();
  await mount("/ice-date/new");
  check(getByRole(main(), "combobox", { name: "Eisdiele suchen" }), "Direct creation provides a shop picker");
  check(!main().textContent.includes("Restaurant"), "Picker matches the supported ice shop type");
  input("ice-date-shop", "Markt 12"); await tick();
  fireEvent.keyDown(document.getElementById("ice-date-shop"), { key: "ArrowDown" }); await tick();
  fireEvent.keyDown(document.getElementById("ice-date-shop"), { key: "Enter" }); await waitShop();
  check(window.iceDateLocation.search.includes("shopId=1"), "Keyboard choice updates the shop URL");
  check([...main().querySelectorAll("form section h2")].map(element => element.textContent).join("|") === " Wo| Wann|Wer", "Form follows Where When Who");
  check([...main().querySelectorAll("details")].every(details => !details.open), "Opening hours and optional fields start collapsed");
  check(main().textContent.includes("zum Termin geöffnet"), "Appointment opening state is visible without the week");
  check(document.getElementById("ice-date-start").min && document.getElementById("ice-date-start").max, "Date range is visible to native validation");
  fits("Initial creation fits");
  const extras = [...main().querySelectorAll("summary")].find(summary => summary.textContent.includes("Titel & Nachricht")); extras.click(); await tick();
  input("ice-date-title", "Feierabendeis"); input("ice-date-note", "Am Eingang treffen");
  input("ice-date-users", "Nutzer");
  await waitFor(() => getByRole(main(), "option", { name: longName }));
  fireEvent.keyDown(document.getElementById("ice-date-users"), { key: "ArrowDown" }); await tick();
  fireEvent.keyDown(document.getElementById("ice-date-users"), { key: "Enter" }); await tick();
  check(button(longName + " entfernen").getBoundingClientRect().width >= 44, "Long user chips have named 44px remove controls");
  fits("Long invited names fit");
  await click("Ändern"); input("ice-date-shop", "Parkstraße"); await tick();
  fireEvent.click(getByRole(main(), "option", { name: /Softeis am Park/ })); await waitShop("Softeis am Park");
  check(document.getElementById("ice-date-title").value === "Feierabendeis" && document.getElementById("ice-date-note").value === "Am Eingang treffen" && button(longName + " entfernen"), "Shop changes retain optional fields and invitees");
  check(main().textContent.includes("zum Termin nicht bekannt"), "Missing opening hours remain unknown");
  input("ice-date-users", "Mia"); await new Promise(resolve => setTimeout(resolve, 450));
  check(!main().querySelector('[role="option"]') || [...main().querySelectorAll('[role="option"]')].every(element => element.hidden || element.textContent !== "Mia"), "Organizer is omitted from direct invitation results");
  failUsers = true; input("ice-date-users", "Jon"); await waitFor(() => { if (!main().textContent.includes("Nutzersuche ist nicht erreichbar")) throw new Error("Search error missing"); });
  failUsers = false; await click("Suche wiederholen"); await waitFor(() => getByRole(main(), "option", { name: "Jonas" }));
  check(getByRole(main(), "option", { name: "Jonas" }), "Failed user searches can be retried");
  input("ice-date-users", ""); await tick();
  await mount("/ice-date/new?shopId=2", null); await waitShop("Softeis am Park");
  check(document.getElementById("ice-date-title").value === "Feierabendeis", "Draft is restored for guests");
  const beforeLogin = loginRequests; await click("Anmelden & erstellen");
  check(loginRequests === beforeLogin + 1, "Guest creation opens the existing login");
  const saved = JSON.parse(sessionStorage.getItem(ICE_DATE_DRAFT_KEY));
  check(saved.note === "Am Eingang treffen" && saved.selectedUsers[0].id === 4 && saved.shopId === "2", "Login preserves the complete draft");
  await mount("/ice-date/new?shopId=2", 2); await waitShop("Softeis am Park"); await click("Eis-Date erstellen");
  await waitFor(() => button("Einladung teilen"));
  const created = calls.filter(call => call.url.endsWith("ice_date_create.php")).at(-1);
  check(JSON.parse(created.init.body).shop_id === 2 && JSON.parse(created.init.body).participant_user_ids[0] === 4, "Creation sends the retained shop and invitation IDs");
  check(!sessionStorage.getItem(ICE_DATE_DRAFT_KEY), "Successful creation consumes the draft");
  check(document.activeElement === button("Einladung teilen"), "Newly created dates focus inviting friends");
  clipboardFail = true; await click("Link kopieren");
  check(main().textContent.includes("selbst kopieren") && document.getElementById("ice-date-invite-link").readOnly, "Copy failures provide a manual link");
  document.getElementById("ice-date-invite-link").focus();
  check(document.getElementById("ice-date-invite-link").selectionEnd === document.getElementById("ice-date-invite-link").value.length, "Manual link selects its full value");
  clipboardFail = false;
  Object.defineProperty(navigator, "share", { configurable: true, value: async () => { throw new DOMException("Cancelled", "AbortError"); } });
  await click("Einladung teilen"); check(!main().textContent.includes("Teilen hat nicht funktioniert"), "Native share cancellation is silent");
  Object.defineProperty(navigator, "share", { configurable: true, value: async () => { throw new Error("Unavailable"); } });
  await click("Einladung teilen"); check(main().textContent.includes("Kopiere stattdessen"), "Native share errors expose the link fallback");
  Object.defineProperty(navigator, "share", { configurable: true, value: undefined }); await click("Link kopieren");
  check(shared.includes("/ice-date/fixture-invitation-") && main().textContent.includes("Einladungslink kopiert"), "Copy success has visible feedback");
  fits("Created invitation fits");
  window.iceDateNavigate("/ice-date/new"); await tick();
  check(document.getElementById("ice-date-title").value === "" && document.getElementById("ice-date-users").value === "", "A new date starts fresh after success in the same session");
  sessionStorage.setItem(ICE_DATE_DRAFT_KEY, JSON.stringify({ shopId: "1", startsAt: defaultStart(), title: "", note: "", selectedUsers: [3,4,5,6,7,8,9].map(id => ({ id, username: "Freund " + id })) }));
  await mount("/ice-date/new?shopId=1"); await waitShop();
  check(document.getElementById("ice-date-users").disabled && main().textContent.includes("8 von 8 Plätzen reserviert"), "Seven direct invitations fill and explain capacity");
  await click("Freund 3 entfernen");
  check(!document.getElementById("ice-date-users").disabled && document.activeElement.id === "ice-date-users", "Removing an invitation restores search and keyboard focus");
  await click("Abbrechen");
  check(!sessionStorage.getItem(ICE_DATE_DRAFT_KEY), "Cancelling creation discards the draft");

  await mount("/ice-date/fixture-invitation-100", 2);
  check(calls.filter(call => call.url.includes("ice_date_detail.php?token")).at(-1).init.headers.Authorization === "Bearer fixture-only", "Token detail carries the authenticated identity");
  await click("Vielleicht"); check(button("Vielleicht").getAttribute("aria-pressed") === "true", "Personal response is selected and announced");
  check(JSON.parse(calls.filter(call => call.url.endsWith("ice_date_rsvp.php")).at(-1).init.body).invite_token === "fixture-invitation-100", "Answers on public links carry their invitation token");
  check(main().querySelector('img[src="/fixture-avatar.svg"]'), "Participant profile pictures are rendered");
  fits("Long participant names fit");
  await mount("/ice-date/fixture-invitation-100", null);
  check(!button("Anmelden & antworten").disabled, "Guests receive an active participation login");
  const guestRequests = loginRequests; await click("Anmelden & antworten"); check(loginRequests === guestRequests + 1, "Guest participation opens login without changing the route");
  check(window.iceDateLocation.pathname.includes("fixture-invitation-100"), "The invitation route survives login opening");
  await mount("/ice-date/fixture-invitation-100", 9); await click("Dabei");
  check(button("Dabei").getAttribute("aria-pressed") === "true", "New link recipients can join in the frontend");
  entries[100].participants.push(...[10,11,12,13].map(id => ({ user_id: id, username: "Nutzer " + id, role: "participant", status: "invited" })));
  await mount("/ice-date/fixture-invitation-100", 20);
  check(button("Dabei").disabled && button("Vielleicht").disabled && !button("Nicht dabei").disabled, "Full dates distinguish new guests from reserved participants");
  await mount("/ice-date/fixture-invitation-100", 9); check(!button("Vielleicht").disabled, "Reserved participants may still change their answer at capacity");
  await click("Nicht dabei"); check(main().textContent.includes("1 Platz frei"), "Declines update free places visibly");
  resetEntries();
  entries[101].starts_at = toApiDate(localDateInput(new Date()));
  await mount("/ice-date?id=101");
  check(button("Jetzt einchecken"), "Attending participants can check in within the existing window");
  await click("Jetzt einchecken");
  check(document.body.textContent.includes("Eis-Checkin für Eismanufaktur Emilia"), "Date check-ins open the existing shop check-in form");
  await mount("/ice-date?id=101"); await click("Eis-Date absagen");
  check(button("Treffen behalten"), "Cancellation offers a clear confirmation"); await click("Ja, Eis-Date absagen");
  check(![...main().querySelectorAll("button")].some(element => ["Dabei","Einladung teilen","Jetzt einchecken"].includes(element.textContent.trim())), "Cancelled dates hide participation and invitation actions");
  await mount("/ice-date?id=102"); check(main().textContent.includes("mit 2 Check-ins festgehalten"), "Completed dates describe the actual common visit");
  fits("Completed date fits");
  await mount("/ice-date");
  check(main().textContent.includes("Vergangene & abgesagte Treffen"), "The overview groups history separately");
  const upcoming = [...main().querySelectorAll("section")].find(section => section.querySelector("h2")?.textContent === "Kommende Treffen");
  const links = [...upcoming.querySelectorAll('a[href^="/ice-date?id="]')];
  check(links[0].getAttribute("href") === "/ice-date?id=104", "Upcoming dates are sorted nearest first");
  check(main().querySelector('a[href="/ice-date?id=101"]') && main().textContent.includes("Deine Antwort"), "Cancelled dates and personal answers remain visible in the list");
  fits("Date overview fits");
  failLoad = true; await mount("/ice-date?id=101"); check(button("Erneut laden"), "Detail loading errors expose retry");
  failLoad = false; await click("Erneut laden"); await waitFor(() => { if (!main().querySelector("[data-ice-date-detail]")) throw new Error("Date retry still loading"); });
  check(main().querySelector("[data-ice-date-detail]"), "Retry restores the date");
  failShop = true; sessionStorage.clear(); await mount("/ice-date/new?shopId=1"); await new Promise(resolve => setTimeout(resolve, 350));
  check(button("Andere Eisdiele wählen"), "Shop loading errors have recovery actions"); failShop = false; await click("Erneut laden"); await waitShop();
  const late = defaultStart().slice(0,11) + "21:00"; input("ice-date-start", late); await new Promise(resolve => setTimeout(resolve, 350));
  check(main().textContent.includes("voraussichtlich geschlossen") && !button("Eis-Date erstellen").disabled, "Closed hours warn without blocking creation");
  check(browserErrors.length === 0, "No browser runtime exceptions: " + browserErrors.join(" | "));
  document.getElementById("results").textContent = JSON.stringify({ passed: checks.length, viewport: innerWidth, checks });
  document.getElementById("results").dataset.status = "passed";
}
const preview = new URLSearchParams(location.search).get("preview");
(preview ? window.iceDatePreview(preview) : run()).catch(error => { document.getElementById("results").textContent = error.stack || String(error); document.getElementById("results").dataset.status = "failed"; });
