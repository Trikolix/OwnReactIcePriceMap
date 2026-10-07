import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { configure, fireEvent, getByRole, waitFor } from '@testing-library/dom';
import { UserProvider } from '../../../src/context/UserContext';
import Header from '../../../src/Header';
import IceCreamRadar from '../../../src/IceCreamRadar';
import MapToolbar from '../../../src/components/MapToolbar';
import DropdownSelect from '../../../src/components/DropdownSelect';
import NotificationBell from '../../../src/components/NotificationBell';
import { getResolvedSeasonalCampaigns } from '../../../src/features/seasonal/campaigns';
import '../../../src/index.css';

const options = [
  { value: 'price', label: 'Preis' }, { value: 'kugelPrice', label: 'Kugelpreis' },
  { value: 'softeisPrice', label: 'Softeispreis' }, { value: 'kugelRating', label: 'Kugel: Rating' },
  { value: 'softeisRating', label: 'Softeis: Rating' }, { value: 'eisbecherRating', label: 'Eisbecher: Rating' },
];
const root = createRoot(document.getElementById('app'));
configure({ getElementError: message => new Error(message.split('Here are')[0].slice(0, 600)) });
const results = [];
const check = (condition, message) => { if (!condition) throw new Error(message); results.push(message); };
const tick = () => new Promise(resolve => setTimeout(resolve, 60));
const button = name => getByRole(document.body, 'button', { name, exact: true });
const press = element => {
  fireEvent.pointerDown(element, { button: 0, pointerType: 'mouse', isPrimary: true });
  fireEvent.pointerUp(element, { button: 0, pointerType: 'mouse', isPrimary: true });
  fireEvent.click(element);
};
const click = async name => { press(button(name)); await tick(); };
const menu = () => document.querySelector('[data-testid=header-menu]');
const notifications = () => document.querySelector('[role=region][aria-label=Benachrichtigungen]');
const nativeDate = Date;
let fixedDate = '2026-10-05T12:00:00+02:00';
window.Date = class extends nativeDate { constructor(...args) { super(...(args.length ? args : [fixedDate])); } };
let key = 0;
let user = { userId: 42, username: 'TheGourmetCyclist', currentLevel: 59 };
let unread = 120;
let pendingChanges = 7;
let failPendingChanges = false;
const calls = [];
window.fetch = async (input, init = {}) => {
  const url = String(input);
  if (!url.startsWith('https://test.invalid/')) throw new Error('Unexpected external fetch: ' + url);
  calls.push({ url, method: init.method || 'GET', init });
  let data = { status: 'success' };
  if (url.includes('get_shop_change_request_count.php')) {
    return { ok: !failPendingChanges, json: async () => ({ status: failPendingChanges ? 'error' : 'success', pending_count: pendingChanges }) };
  }
  if (url.includes('session.php') || url.includes('login.php')) data = { ...data, ...user, token: 'test-token', expires_at: '2030-01-01' };
  else if (url.includes('list_public_challenges.php')) data.data = [{ status: 'active' }];
  else if (url.includes('get_user_stats.php')) data.avatar_url = 'fixture-avatar.png';
  else if (url.includes('streak_status.php')) data = { user_id: user.userId, level_info: { level: user.currentLevel },
    streaks: { day: { state: 'active', value: 124 }, week: { state: 'frozen', value: 1023 } }, refresh_after_seconds: 3600 };
  else if (url.includes('benachrichtigungen.php') && url.includes('action=list')) data.notifications = Array.from({ length: unread }, (_, i) => ({
    id: i + 1, text: 'Neue Nachricht mit einem längeren Benachrichtigungstext', ist_gelesen: false,
    erstellt_am: '2026-10-05T10:00:00', typ: 'systemmeldung', referenz_id: i + 1,
  }));
  else if (url.includes('activity_feed.php')) data = { activities: [], meta: { nextOffset: 0 } };
  else if (url.includes('get_all_eisdielen.php') || url.includes('get_eisdielen_list.php') || url.includes('get_attribute.php')) data = [];
  return { ok: true, json: async () => data };
};
Object.defineProperty(navigator, 'geolocation', { value: {
  getCurrentPosition: () => {}, watchPosition: () => 1, clearWatch: () => {},
}, configurable: true });

function Demo({ integrated, standalone }) {
  const [mode, setMode] = useState('price');
  const [filters, setFilters] = useState(3);
  const location = useLocation();
  window.testRoute = location.pathname;
  window.testDisplay = mode;
  if (standalone) return <><NotificationBell /><DropdownSelect options={['Preis', 'Rating']} onChange={value => { window.testDisplay = value; }} /></>;
  if (integrated) return <IceCreamRadar />;
  return <div className="demo-shell"><Header /><div className="demo-map" style={{ position: 'relative' }}>
    <MapToolbar options={options} value={mode} onChange={setMode}
      activeFilterCount={filters} onOpenFilters={() => setFilters(filters ? 0 : 3)} /></div></div>;
}
async function mount(role = 'user', { integrated = false, date = '2026-10-05T12:00:00+02:00', route = '/', standalone = false } = {}) {
  fixedDate = date;
  user = { userId: role === 'admin' ? 1 : role === 'staff' ? 2 : 42,
    username: role === 'long' ? 'EinSehrLangerNutzername'.repeat(5) : 'TheGourmetCyclist', currentLevel: role === 'low' ? 8 : 59 };
  localStorage.clear();
  if (role !== 'guest') {
    localStorage.setItem('userId', String(user.userId));
    localStorage.setItem('username', user.username);
    localStorage.setItem('authToken', 'test-token');
    localStorage.setItem('currentLevel', String(user.currentLevel));
  }
  root.render(<MemoryRouter key={++key} initialEntries={[route]}><UserProvider><Demo integrated={integrated} standalone={standalone} /></UserProvider></MemoryRouter>);
  await tick();
  await waitFor(() => button(role === 'guest' ? 'Einloggen' : 'Benachrichtigungen'));
  await tick();
}
function fits(element, message) {
  const rect = element.getBoundingClientRect();
  check(rect.left >= -1 && rect.right <= innerWidth + 1 && rect.top >= -1 && rect.bottom <= innerHeight + 1, message);
}
function headerLayout() {
  const header = document.querySelector('header');
  fits(header, 'Header fits ' + innerWidth + 'x' + innerHeight);
  check(document.documentElement.scrollWidth <= innerWidth, 'Page has no horizontal overflow');
  const expectedHeight = innerWidth < 768 ? 64 : innerWidth < 1200 ? 72 : 80;
  check(Math.abs(header.getBoundingClientRect().height - expectedHeight) <= 2, 'Header uses the correct compact height');
  const controls = [...header.querySelectorAll('a, button')].filter(element => element.getBoundingClientRect().width);
  controls.forEach(element => {
    const rect = element.getBoundingClientRect();
    check(rect.width >= 44 && rect.height >= 44, 'Header target is at least 44px: ' + (element.getAttribute('aria-label') || element.textContent));
    fits(element, 'Header control fits: ' + (element.getAttribute('aria-label') || element.textContent));
  });
  controls.forEach((element, index) => {
    const rect = element.getBoundingClientRect();
    controls.slice(index + 1).forEach(other => {
      const next = other.getBoundingClientRect();
      check(Math.min(rect.right, next.right) <= Math.max(rect.left, next.left) + 1, 'Header controls do not overlap');
    });
  });
  const nav = document.querySelector('nav[aria-label=Hauptnavigation]');
  check(Boolean(nav.getBoundingClientRect().width) === (innerWidth >= 1200), 'Desktop navigation appears only from 1200px');
  check(header.querySelectorAll('button').length === 3, 'Compact header has three main action buttons');
  const toolbar = document.querySelector('[aria-label=Kartensteuerung]');
  fits(toolbar, 'Toolbar fits the viewport');
  check(Math.abs(toolbar.getBoundingClientRect().height - 52) <= 2, 'Toolbar has the compact 52px height');
  toolbar.querySelectorAll('button').forEach(element => check(element.getBoundingClientRect().height >= 44, 'Toolbar has 44px controls'));
}
function menuLayout() {
  const panel = menu();
  fits(panel, 'Menu fits the viewport');
  check(panel.getBoundingClientRect().width <= 360, 'Menu width is at most 360px');
  const body = panel.children[1];
  check(body.scrollWidth <= body.clientWidth + 1, 'Menu content has no horizontal overflow');
  const close = button('Menü schließen');
  const before = close.getBoundingClientRect().top;
  body.scrollTop = body.scrollHeight;
  check(close.getBoundingClientRect().top === before, 'Close button stays visible while menu content scrolls');
  check(panel.contains(document.activeElement), 'Menu captures focus');
  panel.querySelectorAll('a, button').forEach(element => {
    const rect = element.getBoundingClientRect();
    check(rect.width >= 44 && rect.height >= 44, 'Menu target is at least 44px: ' + element.textContent.trim());
  });
  body.scrollTop = 0;
  if (innerWidth >= 768) check(Math.abs(panel.getBoundingClientRect().top - document.querySelector('header').getBoundingClientRect().bottom - 8) < 1, 'Popup follows actual header height');
}
async function run() {
  const params = new URL(location.href).searchParams;
  const preview = params.get('preview');
  if (preview !== null) {
    await mount(params.get('role') || 'user', { date: params.get('date') || undefined, route: params.get('route') || '/',
      integrated: ['map', 'filters'].includes(preview) });
    if (preview === 'menu') await click('Menü öffnen');
    if (preview === 'notifications') await click('Benachrichtigungen');
    if (preview === 'filters') await click('Filter');
    return 'preview';
  }
  for (const role of ['guest', 'user', 'admin', 'long', 'low', 'staff']) {
    const startCall = calls.length;
    await mount(role);
    headerLayout();
    if (role !== 'guest') {
      check(button('Benachrichtigungen').textContent === '99+', 'Large unread counts are capped visually');
      await click('Benachrichtigungen');
      fits(notifications(), 'Notifications fit the viewport');
      check(Math.abs(notifications().getBoundingClientRect().top - document.querySelector('header').getBoundingClientRect().bottom - 8) < 1, 'Notifications follow actual header height');
      await click('Menü öffnen');
      check(!notifications(), 'Opening menu closes notifications');
    } else await click('Menü öffnen');
    await waitFor(() => {
      if (!menu().contains(document.activeElement)) throw new Error('Waiting for menu focus: ' + document.activeElement.outerHTML.slice(0, 250));
    });
    menuLayout();
    if (role !== 'guest') {
      check(menu().textContent.includes('Tages-Serie:') && menu().textContent.includes('Wochen-Serie:'), 'Menu labels both streaks clearly');
      check(menu().textContent.includes(user.username), 'Menu preserves the full username');
      check(Boolean(menu().querySelector('[href="/pflege"]')) === (role !== 'low'), 'Maintenance permissions are preserved');
    }
    check(Boolean(menu().querySelector('[href="/systemmeldungenform"]')) === (role === 'admin'), 'Administrator permissions are preserved');
    check(Boolean(menu().querySelector('[href="/admin/weekly-stats"]')) === ['admin', 'staff'].includes(role), 'User 2 statistics permissions are preserved');
    check(Boolean(menu().querySelector('[href="/shop-change-requests"]')) === (role === 'admin'), 'Moderation menu is restricted to administrators');
    check(calls.slice(startCall).some(call => call.url.includes('get_shop_change_request_count.php')) === (role === 'admin'), 'Only administrators request the moderation count');
    if (role === 'admin') {
      const changeLink = () => menu().querySelector('[href="/shop-change-requests"]');
      check(changeLink().textContent === 'Änderungsvorschläge7 offen', 'Menu shows the number of pending suggestions next to the label');
      check(calls.findLast(call => call.url.includes('get_shop_change_request_count.php')).init.headers.Authorization === 'Bearer test-token', 'Moderation count uses the authenticated session');
      pendingChanges = 3;
      window.dispatchEvent(new Event('shop-change-requests-updated')); await tick();
      check(changeLink().textContent.endsWith('3 offen'), 'Decisions refresh the moderation count immediately');
      pendingChanges = 125;
      window.dispatchEvent(new Event('focus')); await tick();
      check(changeLink().textContent.endsWith('99+ offen') && changeLink().querySelector('[aria-label="125 offene Änderungsvorschläge"]'), 'Large pending counts are compact with an accessible exact total');
      failPendingChanges = true;
      window.dispatchEvent(new Event('shop-change-requests-updated')); await tick();
      check(changeLink().textContent.endsWith('99+ offen'), 'A failed refresh keeps the last confirmed count');
      failPendingChanges = false;
      pendingChanges = 0;
      window.dispatchEvent(new Event('shop-change-requests-updated')); await tick();
      check(changeLink().textContent === 'Änderungsvorschläge', 'An empty queue hides the badge');
      await click('Menü schließen');
      pendingChanges = 7;
      await click('Menü öffnen');
      check(changeLink().textContent.endsWith('7 offen'), 'Reopening the menu refreshes newly arrived suggestions');
      await click('Awards / Aktionen');
      check(menu().querySelectorAll('#menu-awards a').length === 4, 'All award administration links remain available');
    }
    fireEvent.click(menu().querySelector('a[href="/aktionen"]'));
    await tick();
    check(!menu() && window.testRoute === '/aktionen', 'Featured action opens /aktionen and closes menu');
  }
  for (const date of ['2026-04-05T12:00:00+02:00', '2026-12-20T12:00:00+01:00']) {
    await mount('user', { date });
    headerLayout();
    check(document.querySelector('header img').getAttribute('src') === getResolvedSeasonalCampaigns(new Date()).headerLogo, 'Seasonal logo is preserved');
  }
  await mount('user', { route: '/map/activeShop/42' });
  check(document.querySelector('header a[href="/"]').getAttribute('aria-label') === 'Ice-App Startseite', 'Logo links home');
  check(document.querySelector('header nav a[href="/"]').getAttribute('aria-current') === 'page', 'Map detail routes keep Karte active');
  for (const option of options) {
    press(getByRole(document.body, 'button', { name: /^Kartenanzeige:/ })); await tick();
    const list = getByRole(document.body, 'listbox');
    fits(list, 'Display options fit the viewport');
    fireEvent.click(getByRole(list, 'option', { name: option.label })); await tick();
    check(window.testDisplay === option.value && button('Kartenanzeige: ' + option.label), 'Display callback retains value ' + option.value);
  }
  await click('Filter, 3 aktiv');
  check(Boolean(button('Filter')), 'Filter callback remains connected and badge responds');

  for (const route of ['/challenge', '/photo-challenge', '/dashboard', '/aktionen']) {
    await mount('user', { route });
    const activeLinks = document.querySelectorAll('header nav [aria-current=page]');
    check(activeLinks.length === 1 && activeLinks[0].getAttribute('href') === route, 'Exactly one desktop navigation link is active: ' + route);
  }
  await mount('user');
  await click('Menü öffnen');
  await click('Eisdiele hinzufügen');
  await waitFor(() => {
    if (!document.querySelector('[data-testid=create-shop-dialog]')) throw new Error('Waiting for new-place form');
  });
  check(!menu() && Boolean(getByRole(document.body, 'heading', { name: 'Eis-Ort eintragen' })), 'Adding a place closes menu and opens the existing wizard');
  await click('Dialog schließen');
  await click('Menü öffnen');
  await click('Eis einchecken');
  check(!menu() && Boolean(getByRole(document.body, 'heading', { name: 'Wo hast du dein Eis gegessen?' })), 'Menu check-in opens the existing chooser');

  await mount('user', { integrated: true });
  headerLayout();
  for (const option of options) {
    press(getByRole(document.body, 'button', { name: /^Kartenanzeige:/ })); await tick();
    fireEvent.click(getByRole(document.body, 'option', { name: option.label })); await tick();
    check(Boolean(button('Kartenanzeige: ' + option.label)), 'Real map supports display mode ' + option.value);
  }
  await click('Filter');
  check(getByRole(document.body, 'checkbox', { name: 'Restaurants/Cafés mit Eisangebot' }).checked === false, 'Restaurants remain excluded by default');
  for (const label of ['Eisdielen', 'Aktive temporäre Stände', 'Restaurants/Cafés mit Eisangebot', 'Favoriten', 'Besucht', 'Nicht besucht', 'Kugel', 'Softeis', 'Eisbecher', 'Dauerhaft geschlossene anzeigen']) {
    const checkbox = getByRole(document.body, 'checkbox', { name: label });
    const before = checkbox.checked;
    fireEvent.click(checkbox); await tick();
    check(checkbox.checked !== before, 'Real map filter can be changed: ' + label);
    await click('Zurücksetzen');
  }
  press(getByRole(document.body, 'button', { name: /^Erweiterte Filtereinstellungen/ })); await tick();
  check(document.getElementById('advanced-filter-type') != null, 'Advanced filter controls remain available');
  await click('Zurücksetzen');
  for (const label of ['Jetzt geöffnet', 'Geöffnet am …', 'Keine Einschränkung']) {
    fireEvent.click(getByRole(document.body, 'radio', { name: label, exact: true })); await tick();
    check(getByRole(document.body, 'radio', { name: label, exact: true }).checked, 'Opening-hours mode remains available: ' + label);
  }
  fireEvent.click(getByRole(document.body, 'checkbox', { name: 'Restaurants/Cafés mit Eisangebot' })); await tick();
  await click('Fertig');
  check(Boolean(button('Filter, 1 aktiv')), 'Real map toolbar reflects active filters');
  check(calls.some(call => call.url.includes('get_all_eisdielen.php') && call.url.includes('restaurant')), 'Existing map API receives the restaurant filter');

  await mount('guest');
  await click('Eis einchecken');
  await click('Schließen');
  await click('Eis einchecken');
  check(Boolean(button('Login')), 'Cancelled guest check-in can be restarted');

  await mount('guest');
  await click('Eis einchecken');
  check(Boolean(button('Login')), 'Guest check-in opens login');
  fireEvent.input(document.querySelector('input[placeholder="Benutzername oder E-Mail"]'), { target: { value: 'Tester' } });
  fireEvent.input(document.querySelector('input[type=password]'), { target: { value: 'test-password' } });
  fireEvent.submit(document.querySelector('form')); await tick();
  await waitFor(() => getByRole(document.body, 'heading', { name: 'Wo hast du dein Eis gegessen?' }));
  check(Boolean(button('Benachrichtigungen')), 'Login updates header and continues into check-in without reloading');

  await mount('guest');
  await click('Eis einchecken');
  window.dispatchEvent(new MessageEvent('message', { origin: 'https://test.invalid', data: {
    type: 'ice-social-auth', status: 'success', ...user, token: 'test-token', expires_at: '2030-01-01',
  } })); await tick();
  check(Boolean(getByRole(document.body, 'heading', { name: 'Wo hast du dein Eis gegessen?' })), 'Social login also continues into check-in');

  await mount('user', { standalone: true });
  await click('Benachrichtigungen');
  check(Boolean(notifications()), 'NotificationBell still supports uncontrolled use');
  await click('Benachrichtigungen schließen');
  await click('Kartenanzeige: Preis');
  fireEvent.click(getByRole(document.body, 'option', { name: 'Rating' })); await tick();
  check(window.testDisplay === 'Rating' && Boolean(button('Kartenanzeige: Rating')), 'DropdownSelect still supports string options and uncontrolled values');
  return 'passed';
}
window.headerHarness = { mount, click };
run().then(status => {
  document.getElementById('results').dataset.status = status;
  document.getElementById('results').textContent = JSON.stringify({ passed: results.length, viewport: [innerWidth, innerHeight], checks: results });
}).catch(error => {
  document.getElementById('results').dataset.status = 'failed';
  document.getElementById('results').textContent = error.stack;
});
