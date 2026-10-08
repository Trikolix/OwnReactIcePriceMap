import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, getByRole, waitFor } from '@testing-library/dom';
import { UserProvider } from '../../../src/context/UserContext';
import OnboardingChecklist from '../../../src/components/OnboardingChecklist';
import PushDeviceSettings from '../../../src/components/PushDeviceSettings';
import UserSettings from '../../../src/pages/UserSettings';
import '../../../src/index.css';

const checks = [], calls = [];
const check = (value, message) => { if (!value) throw new Error(message); checks.push(message); };
const button = name => getByRole(document.body, 'button', { name, exact: true });
const click = async name => { fireEvent.click(button(name)); await new Promise(resolve => setTimeout(resolve, 80)); };
let cancelShare = true, copied = '', deviceActive = true;
let claimsInFlight = 0, maxClaimsInFlight = 0;
let failNextSettingsSave = false;
const settings = { show_onboarding_checklist: 1, notify_comment: 0, notify_news: 0, push_enabled_web: 1, push_enabled_android: 0 };
let devices = [{ id: 11, user_agent: 'Chrome Windows', is_current: true }, { id: 12, user_agent: 'Firefox Macintosh', is_current: false }];
const progress = {
  visible: true, invite_code: 'mia-code', awarded_levels: [], stats: { app_installed: false, checkins: 0, foreign_likes: 0, invited_count: 2, invited_pending_count: 1 },
  stages: { 1: { avatar: false, installation: false, push: false, checkin: false, invitation: false, social: false },
    2: { shop: false, review: false, checkins: false, challenge: false, route: false, likes: false } },
};
window.fetch = async (input, init = {}) => {
  const url = new URL(String(input));
  if (url.origin !== 'https://test.invalid') throw new Error('Unexpected external request');
  const body = init.body ? JSON.parse(init.body) : null;
  calls.push({ path: url.pathname, method: init.method || 'GET', body });
  let json = { success: true };
  let ok = true;
  if (url.pathname.includes('session.php')) json = { status: 'success', userId: 42, username: 'Mia', token: 'fixture-token', currentLevel: 1 };
  else if (url.pathname.endsWith('/get_user_notification_settings.php')) json = { ...settings };
  else if (url.pathname.endsWith('/update_user_notification_settings.php')) {
    if (failNextSettingsSave) { failNextSettingsSave = false; ok = false; json = { success: false, error: 'Einstellungen konnten nicht gespeichert werden.' }; }
    else {
      Object.assign(settings, body);
      progress.visible = settings.show_onboarding_checklist === 1;
    }
  } else if (url.pathname.endsWith('/onboarding.php')) {
    if (body?.action === 'invite_shared') { progress.stats.invite_shared = true; progress.stages[1].invitation = true; }
    if (body?.action === 'app_installed') { progress.stats.app_installed = true; progress.stages[1].installation = true; }
    json.data = structuredClone(progress);
  } else if (url.pathname.endsWith('/claim_onboarding_award.php')) {
    maxClaimsInFlight = Math.max(maxClaimsInFlight, ++claimsInFlight);
    await new Promise(resolve => setTimeout(resolve, 30));
    progress.awarded_levels.push(body.level);
    claimsInFlight--;
    json = { success: true, data: structuredClone(progress), new_level: 2, new_awards: [{ level: body.level, title: 'Fixture award' }] };
  } else if (url.pathname.includes('web-subscriptions')) {
    if (init.method === 'DELETE') {
      devices = body.all_devices ? [] : devices.filter(device => device.id !== body.device_id);
      if (body.endpoint || body.all_devices) deviceActive = false;
    }
    json = url.searchParams.has('check') ? { success: true, active: deviceActive } : { success: true, devices: structuredClone(devices) };
  }
  return { ok, status: ok ? 200 : 500, json: async () => json };
};
Object.defineProperty(navigator, 'share', { configurable: true, value: async () => { if (cancelShare) throw new DOMException('Cancelled', 'AbortError'); } });
Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { copied = text; } } });
Object.defineProperty(window, 'Notification', { configurable: true, value: { permission: 'granted' } });
const subscription = { endpoint: 'https://push.invalid/current', unsubscribe: async () => true };
const registration = { pushManager: { getSubscription: async () => subscription } };
Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: { getRegistration: async () => registration } });
localStorage.clear();
for (const [key, value] of Object.entries({ userId: '42', username: 'Mia', authToken: 'fixture-token', currentLevel: '1' })) localStorage.setItem(key, value);
const root = createRoot(document.getElementById('app'));
function Demo() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  return <main style={{ maxWidth: 850, margin: 'auto', padding: 12 }}>
    <OnboardingChecklist /><PushDeviceSettings userId="42" settings={{ push_enabled_android: 0 }} onSettingsChanged={async () => {}} />
    <button type="button" onClick={() => setSettingsOpen(true)}>Profileinstellungen öffnen</button>
    {settingsOpen && <UserSettings onClose={() => setSettingsOpen(false)} />}
  </main>;
}
root.render(<MemoryRouter><UserProvider><Demo /></UserProvider></MemoryRouter>);
const report = document.getElementById('results');
window.prepareInviteKeyboard = () => button('Einladen').focus();
window.onboardingMeasure = () => ({ overflow: document.documentElement.scrollWidth > innerWidth,
  dialogOverflow: [...document.querySelectorAll('[role=dialog]')].some(node => node.scrollWidth > node.clientWidth) });
(async () => {
  await waitFor(() => button('Installieren'));
  await waitFor(() => button('Firefox · Mac deaktivieren'));
  if (new URLSearchParams(location.search).has('preview')) { report.dataset.status = 'preview'; return; }
  check(document.body.textContent.includes('0 von 6 Aufgaben'), 'Starter progress is visible');
  check(!document.body.textContent.includes('Test-Push'), 'Normal users have no test-push action');
  await click('Installieren');
  check(Boolean(getByRole(document.body, 'dialog', { name: 'Ice-App installieren' })), 'Installation instructions open');
  await click('Verstanden');
  check(!calls.some(call => call.body?.action === 'app_installed'), 'Reading instructions does not mark the app installed');
  await click('Einladen');
  check(document.querySelector('input[readonly]').value.endsWith('/register/mia-code'), 'Invitation uses the own registration link');
  check(document.body.textContent.includes('2 erfolgreich geworben · 1 noch unbestätigt'), 'Verified and pending invitations are displayed');
  await click('Einladen');
  check(!calls.some(call => call.body?.action === 'invite_shared'), 'Cancelling the share sheet does not complete onboarding');
  await click('Link kopieren');
  check(copied === 'https://ice-app.de/register/mia-code', 'Copy shares the complete invitation URL');
  check(calls.some(call => call.body?.action === 'invite_shared'), 'Successful copying records invitation progress');
  await click('Dialog schließen');
  await click('Ice-App Experte');
  check(document.body.textContent.includes('0 von 6 Aufgaben · 100 EP'), 'Expert stage displays its own tasks and reward');
  let openedShop = false;
  window.addEventListener('iceapp:open-add-shop', () => { openedShop = true; }, { once: true });
  await click('Eisdiele hinzufügen');
  check(openedShop, 'Shop action opens the existing entry workflow');
  await click('Startklar');
  await click('Firefox · Mac deaktivieren');
  check(calls.some(call => call.method === 'DELETE' && call.body?.device_id === 12), 'Revoking another browser targets that device only');
  check(deviceActive && devices.length === 1, 'Revoking the other browser leaves this browser active');
  await click('Checkliste ausblenden');
  check(calls.some(call => JSON.stringify(call.body) === '{"show_onboarding_checklist":0}'), 'Hiding the checklist sends only its own preference');
  await click('Profileinstellungen öffnen');
  const onboardingCheckbox = await waitFor(() => getByRole(document.body, 'checkbox', { name: 'Startklar- und Experten-Checkliste anzeigen' }));
  check(!onboardingCheckbox.checked, 'Profile settings load the saved hidden state');
  const settingsWrites = () => calls.filter(call => call.path.endsWith('/update_user_notification_settings.php'));
  const beforeEdit = settingsWrites().length;
  fireEvent.click(onboardingCheckbox);
  check(settingsWrites().length === beforeEdit && !progress.visible, 'Editing onboarding does not save or show it before confirmation');
  fireEvent.click(document.querySelector('input[name=notify_news]'));
  failNextSettingsSave = true;
  await click('Onboarding speichern');
  check(!progress.visible && document.body.textContent.includes('Einstellungen konnten nicht gespeichert werden.'), 'A failed save keeps onboarding hidden and reports the error');
  await click('Onboarding speichern');
  await waitFor(() => button('Installieren'));
  check(JSON.stringify(settingsWrites().at(-1).body) === '{"show_onboarding_checklist":1}' && settings.notify_news === 0,
    'Onboarding save submits only visibility and preserves unsaved notification edits');
  check(document.body.textContent.includes('Onboarding gespeichert.') && progress.visible, 'Successful saving confirms the change and reveals the checklist');
  fireEvent.click(onboardingCheckbox);
  await click('Benachrichtigungen speichern');
  check(settings.notify_news === 1 && progress.visible && !('show_onboarding_checklist' in settingsWrites().at(-1).body)
    && !('push_enabled_web' in settingsWrites().at(-1).body), 'Saving notifications leaves unsaved onboarding and device settings untouched');
  await click('Einstellungen schließen');
  await waitFor(() => button('Installieren'));
  window.dispatchEvent(new Event('appinstalled'));
  await waitFor(() => { if (!calls.some(call => call.body?.action === 'app_installed')) throw new Error('Waiting for installation'); });
  check(true, 'A completed browser installation records installation progress');
  const awardEvents = [];
  window.addEventListener('new-awards', event => awardEvents.push(...event.detail));
  for (const stage of Object.values(progress.stages)) for (const key of Object.keys(stage)) stage[key] = true;
  window.dispatchEvent(new CustomEvent('onboarding:changed', { detail: structuredClone(progress) }));
  await waitFor(() => { if (awardEvents.length !== 2) throw new Error('Waiting for both awards'); });
  check(calls.filter(call => call.path.endsWith('/claim_onboarding_award.php')).map(call => call.body.level).join(',') === '1,2'
    && maxClaimsInFlight === 1, 'Ready stages are claimed once each and sequentially');
  check(localStorage.getItem('currentLevel') === '2', 'Onboarding awards update the current profile level');
  check(!window.onboardingMeasure().overflow, 'Page fits the viewport');
  report.textContent = JSON.stringify({ passed: checks.length, checks, viewport: [innerWidth, innerHeight] });
  report.dataset.status = 'passed';
})().catch(error => { report.textContent = error.stack; report.dataset.status = 'failed'; });
