import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { configure, fireEvent, getByRole, getAllByRole, waitFor } from '@testing-library/dom';
import { UserProvider, useUser } from '../../../src/context/UserContext';
import PhotoChallengeList from '../../../src/pages/PhotoChallengeList';
import PhotoChallengeVoting from '../../../src/pages/PhotoChallengeVoting';
import PhotoChallengeAdmin from '../../../src/pages/PhotoChallengeAdmin';
import UserSite from '../../../src/pages/UserSite';
import StreakOverview from '../../../src/components/StreakOverview';
import { StreakCelebration } from '../../../src/components/ProfileProgress';
import '../../../src/index.css';

configure({ getElementError: message => new Error(message.split('Here are')[0].slice(0, 550)) });
const root = createRoot(document.getElementById('app'));
const nativeDate = Date;
let fixedTime = '2026-10-05T12:00:00+02:00';
window.Date = class extends nativeDate { constructor(...args) { super(...(args.length ? args : [fixedTime])); } static now() { return new nativeDate(fixedTime).getTime(); } };
const tick = () => new Promise(resolve => setTimeout(resolve, 70));
const results = [];
const check = (condition, message) => { if (!condition) throw new Error(message); results.push(message); };
const byButton = (name, scope = document.body) => getByRole(scope, 'button', { name, exact: true });
const press = element => { fireEvent.pointerDown(element, { button: 0, pointerType: 'mouse', isPrimary: true }); fireEvent.pointerUp(element, { button: 0, pointerType: 'mouse', isPrimary: true }); fireEvent.click(element); };
const click = async (name, scope) => { press(byButton(name, scope)); await tick(); };
const dialog = () => [...document.querySelectorAll('[role=dialog]')].filter(item => !item.closest('[inert]')).at(-1);
const fill = (label, value, scope = document.body) => { const field = getByRole(scope, 'textbox', { name: label }); fireEvent.change(field, { target: { value } }); };
const image = i => ({ id: i, image_id: i, url: '/fixture-avatar.png', title: `Eis-Moment ${i}`, beschreibung: `Eisfoto ${i}`, username: 'EinSehrLangerNutzername'.repeat(3), created_at: '2026-10-01 12:00:00' });
const match = (id, round = 1) => ({ id, round, position: id, image_a_id: id * 2, image_b_id: id * 2 + 1, image_a_url: '/fixture-avatar.png', image_b_url: '/fixture-avatar.png', image_a_title: `Foto A ${id}`, image_b_title: `Foto B ${id}`, image_a_country_name: 'Deutschland', image_a_country_code: 'DE', status: 'open', user_choice: null, has_voted: false, votes_a: 8, votes_b: 6 });
const challenges = () => ['submission_open','submission_closed','group_running','ko_running','finished','draft','active'].map((status, index) => ({ id: index + 1, status, status_raw: status, title: `${status === 'submission_open' ? 'Dein schönster Eis-Moment' : 'Foto-Challenge ' + status}`, description: 'Ein sehr langer Beschreibungstext für unsere gemeinsame Foto-Challenge. '.repeat(4), submission_deadline: '2026-10-20 23:59:59', submission_limit_per_user: 3, allow_direct_uploads: true, start_at: '2026-10-01 12:00:00', group_size: 4, group_advancers: 2, lucky_loser_slots: 2, ko_bracket_size: null, image_count: 12, is_country_challenge: true, preview_images: [image(1)], winner_image: status === 'finished' ? image(3) : null, group_schedule: [{ start_at: '2026-10-06 12:00:00', duration_days: 14, groups: 2 }] }));
let user = { userId: 42, username: 'TheGourmetCyclist', currentLevel: 59 };
let database; let calls = []; let fail = null; let failReviewId = null; let delayApi = false; let own = true;
const baseStreaks = () => ({ day: { value: 12, record: 24, state: 'frozen', history: Array.from({ length: 7 }, (_, i) => ({ period: `2026-${i < 2 ? '09-' + (29 + i) : '10-0' + (i - 1)}`, state: i === 5 ? 'protected' : i === 6 ? 'open' : 'checked_in' })), reward_progress: { current: 3, target: 7, remaining: 4 } }, week: { value: 8, record: 14, state: 'active', history: ['2026-09-14','2026-09-21','2026-09-28','2026-10-05'].map(period => ({ period, state: 'checked_in' })), reward_progress: { current: 2, target: 4, remaining: 2 } }, freezes: { day: 1, week: 2 } });
function resetDatabase() { database = { challenges: challenges(), images: Array.from({ length: 12 }, (_, i) => image(i + 1)), submissions: [], groups: [{ id: 10, name: 'Gruppe A', position: 1, status: 'running', status_label: 'Abstimmung läuft', start_at: '2026-10-01 12:00:00', end_at: '2026-10-20 12:00:00', entries: [image(2), image(3), image(4)], matches: [match(101), match(102)], results: [], user_votes: 0 }], ko: [match(201), match(202), { ...match(203, 2), status: 'closed', user_choice: 406 }], streaks: baseStreaks() }; calls = []; fail = null; failReviewId = null; delayApi = false; }
window.fetch = async (input, init = {}) => {
  const url = String(input); if (!url.startsWith('https://test.invalid/')) throw new Error('External API request: ' + url);
  const parsed = new URL(url); const endpoint = parsed.pathname.split('/').at(-1); const form = init.body instanceof FormData ? Object.fromEntries(init.body.entries()) : {};
  calls.push({ endpoint, method: init.method || 'GET', form });
  if (delayApi && init.method === 'POST' && parsed.pathname.includes('photo_challenge')) await new Promise(resolve => setTimeout(resolve, 250));
  if (fail === endpoint && (!failReviewId || Number(form.submission_id) === failReviewId)) return { ok: false, status: 422, json: async () => ({ status: 'error', message: 'Testfehler: Bitte erneut versuchen.' }) };
  let data = { status: 'success' };
  const id = Number(parsed.searchParams.get('challenge_id') || form.challenge_id || 1);
  const challenge = database.challenges.find(item => item.id === id);
  if (endpoint === 'session.php' || endpoint === 'login.php') data = { ...data, ...user, token: 'test', expires_at: '2030-01-01' };
  else if (endpoint === 'list_public_challenges.php') data.data = database.challenges.filter(item => item.status !== 'draft');
  else if (endpoint === 'list_challenges.php') data.data = database.challenges;
  else if (endpoint === 'streak_status.php') {
    const target = Number(parsed.searchParams.get('user_id')) || user.userId;
    const streaks = structuredClone(database.streaks);
    if (target !== user.userId) { delete streaks.freezes; ['day','week'].forEach(type => { delete streaks[type].history; delete streaks[type].reward_progress; }); }
    data = { user_id: target, streaks, refresh_after_seconds: 3600, level_info: { level: 59, level_name: 'Eis-Profi', percent_to_next: 40, ep_current: 500, ep_to_next: 300 } };
  } else if (endpoint === 'get_user_stats.php') data = { nutzername: user.username, avatar_url: 'fixture-avatar.png', erstellungsdatum: '2025-01-01', user_awards: [], anzahl_checkins: 24, eisdielen_besucht: 8, invite_code: 'test', streaks: database.streaks, level_info: { level: 59, level_name: 'Eis-Profi', percent_to_next: 40, ep_current: 500, ep_to_next: 300 } };
  else if (endpoint === 'user_activity_feed.php' || endpoint === 'activity_feed.php') data = { activities: [], meta: { nextOffset: null, hasMore: false } };
  else if (endpoint === 'benachrichtigungen.php') data.notifications = [];
  else if (endpoint === 'get_challenge_overview.php') {
    if (!challenge) return { ok: false, status: 404, json: async () => ({ status: 'error', message: 'Nicht gefunden.' }) };
    data = { ...data, challenge, challenge_flags: { submission_is_open_effective: challenge.status === 'submission_open', submission_is_closed_effective: challenge.status === 'submission_closed', submission_is_editable_for_user: challenge.status === 'submission_open', is_planning_phase: challenge.status === 'submission_closed' }, groups: ['group_running','ko_running','finished'].includes(challenge.status) ? database.groups : [], ko_matches: ['ko_running','finished'].includes(challenge.status) ? database.ko : [], user_submissions: database.submissions, vote_stats: [{ nutzer_id: 42, username: 'Nutzer', vote_count: 14 }], winner: challenge.status === 'finished' ? { ...image(3), nutzer_id: 42, round: 2 } : null, third_place: challenge.status === 'finished' ? image(4) : null };
  } else if (endpoint === 'list_user_images.php' || endpoint === 'search_images.php') data = { ...data, data: database.images, meta: { limit: 30 } };
  else if (endpoint === 'list_challenge_images.php') data.data = database.images;
  else if (endpoint === 'list_submissions.php') data.data = database.submissions;
  else if (endpoint === 'submit_image.php') { database.submissions.push({ ...image(Number(form.image_id) || 99), id: 900 + database.submissions.length, title: form.title, status: 'pending', can_edit: true, can_delete: true }); }
  else if (endpoint === 'delete_submission.php') database.submissions = database.submissions.filter(item => item.id !== Number(form.submission_id));
  else if (endpoint === 'update_submission.php') database.submissions.find(item => item.id === Number(form.submission_id)).title = form.title;
  else if (endpoint === 'vote.php') {
    const item = [...database.groups.flatMap(group => group.matches), ...database.ko].find(item => item.id === Number(form.match_id));
    data.vote_action = item.user_choice === null ? 'created' : item.user_choice === Number(form.image_id) ? 'unchanged' : 'updated'; item.user_choice = Number(form.image_id); item.has_voted = true;
    database.groups.forEach(group => { group.user_votes = group.matches.filter(match => match.has_voted).length; });
  } else if (endpoint === 'create_challenge.php') { const created = { ...database.challenges[0], id: 100, title: form.title, description: form.description, status: form.status, status_raw: form.status, submission_deadline: form.submission_deadline, allow_direct_uploads: form.allow_direct_uploads === '1', image_count: 0 }; database.challenges.push(created); data.challenge = created; }
  else if (endpoint === 'update_challenge.php') {
    const names = { title: 'title', description: 'description', group_size: 'group_size', group_advancers: 'group_advancers', lucky_loser_slots: 'lucky_loser_slots', ko_bracket_size: 'ko_bracket_size', start_at: 'start_at', submission_deadline: 'submission_deadline', submission_limit_per_user: 'submission_limit_per_user', min_image_created_at: 'min_image_created_at', status: 'status' };
    Object.entries(names).forEach(([key,target]) => { if (key in form) challenge[target] = form[key]; });
    if ('group_schedule' in form) challenge.group_schedule = form.group_schedule ? JSON.parse(form.group_schedule) : [];
    if ('allow_direct_uploads' in form) challenge.allow_direct_uploads = form.allow_direct_uploads === '1'; challenge.status_raw = challenge.status;
  } else if (endpoint === 'review_submission.php') { const item = database.submissions.find(item => item.id === Number(form.submission_id)); item.status = form.action === 'approve' ? 'accepted' : 'rejected'; }
  else if (endpoint === 'remove_image.php') database.images = database.images.filter(item => item.image_id !== Number(form.image_id));
  else if (endpoint === 'add_images.php') database.images.push(image(99));
  else if (endpoint === 'start_group_phase.php') challenge.status = 'group_running';
  else if (endpoint === 'start_ko_phase.php') challenge.status = 'ko_running';
  else if (endpoint === 'advance_ko_round.php') challenge.status = 'finished';
  else if (endpoint === 'update_group_times.php') { const group = database.groups.find(item => item.id === Number(form.group_id)); group.start_at = form.start_at; group.end_at = form.end_at; }
  else if (endpoint === 'get_all_eisdielen.php' || endpoint === 'get_eisdielen_list.php' || endpoint === 'sorten.php') data = [];
  return { ok: true, status: 200, json: async () => structuredClone(data) };
};
Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition: () => {}, watchPosition: () => 1, clearWatch: () => {} }, configurable: true });
function Probe() { const { login } = useUser(); window.testSwitchUser = id => { user = { ...user, userId: id }; login(id, user.username, 'test', '2030-01-01', { reload: false }); }; const location = useLocation(); const navigate = useNavigate(); window.testRoute = location.pathname + location.search; window.testNavigate = navigate; return null; }
let key = 0;
async function mount(route = '/photo-challenge', role = 'user', reset = true) {
  if (reset) resetDatabase(); user = { userId: role === 'admin' ? 1 : 42, username: 'TheGourmetCyclist', currentLevel: 59 };
  localStorage.clear();
  if (role !== 'guest') { localStorage.setItem('userId', String(user.userId)); localStorage.setItem('username', user.username); localStorage.setItem('authToken', 'test'); }
  root.render(<MemoryRouter key={++key} initialEntries={[route]}><UserProvider><Probe /><Routes>
    <Route path="/photo-challenge" element={<PhotoChallengeList />} /><Route path="/photo-challenge/:challengeId" element={<PhotoChallengeVoting />} /><Route path="/photo-challenge-admin" element={<PhotoChallengeAdmin />} /><Route path="/user/:userId" element={<UserSite />} />
    <Route path="/series" element={<main style={{ padding: 16, maxWidth: 1000, margin: 'auto' }}><StreakOverview streaks={database.streaks} own={own} /><StreakCelebration events={[{ id: '1', type: 'day', kind: 'continue', value: 12 }, { id: '2', type: 'week', kind: 'continue', value: 8 }]} /></main>} />
  </Routes></UserProvider></MemoryRouter>);
  await tick(); await tick(); await tick();
}
function layout(scope = document.querySelector('main') || document.body) {
  check(document.documentElement.scrollWidth <= innerWidth + 1, 'No horizontal overflow at ' + innerWidth + ': ' + [...document.querySelectorAll('main *')].filter(el => el.getBoundingClientRect().right > innerWidth + 1).map(el => el.tagName + '.' + el.className + ':' + el.textContent.slice(0,40)).slice(0,8).join(', '));
  for (const element of scope.querySelectorAll('button, a, summary')) {
    const rect = element.getBoundingClientRect(); if (!rect.width || !rect.height) continue;
    check(rect.width >= 43.5 && rect.height >= 43.5, '44px target: ' + element.textContent.trim().slice(0,70));
    check(rect.left >= -1 && rect.right <= innerWidth + 1, 'Target stays inside viewport: ' + element.textContent.trim().slice(0,50));
  }
  scope.querySelectorAll('input:not([type=checkbox]):not([type=radio]), select, textarea').forEach(element => { if (element.getBoundingClientRect().width) check(parseFloat(getComputedStyle(element).fontSize) >= 16, '16px input text'); });
}
async function adminView(view) { window.testNavigate(`/photo-challenge-admin?challengeId=2&view=${view}`); await tick(); await tick(); }
async function runTests() {
  await mount(); check(document.querySelector('h1').textContent === 'Foto-Challenges', 'Public list title'); check(document.body.textContent.includes('Mitmachen'), 'Participation comes first'); layout();
  await mount('/photo-challenge/1'); await click('Foto einreichen'); check(dialog(), 'Submission dialog opens'); layout(dialog());
  press(dialog().querySelector('[aria-label="Eigenes Foto auswählen"] button')); await tick();
  fill('Foto-Titel optional', 'Mein Eis-Moment', dialog()); fail = 'submit_image.php'; await click('Foto einreichen', dialog());
  check(dialog().textContent.includes('Testfehler'), 'Submission error is visible in dialog'); check(getByRole(dialog(), 'textbox', { name: 'Foto-Titel optional' }).value === 'Mein Eis-Moment', 'Draft title survives failure');
  fail = null; delayApi = true; const sendButton = byButton('Foto einreichen', dialog()); press(sendButton); press(sendButton); await new Promise(resolve => setTimeout(resolve, 400));
  check(!dialog(), 'Submission dialog closes only on success'); check(calls.filter(item => item.endpoint === 'submit_image.php').length === 2, 'Double click sends no extra submission');
  await click('Entfernen'); await click('Foto entfernen', dialog()); await waitFor(() => { if (database.submissions.length) throw new Error('Removal pending'); }); check(database.submissions.length === 0, 'Removal uses existing endpoint');
  await mount('/photo-challenge/1'); database.submissions = [{ ...image(1), id: 901, status: 'pending', can_edit: true, can_delete: true }]; document.dispatchEvent(new Event('visibilitychange')); await tick(); const titleInput = getByRole(document.body, 'textbox', { name: 'Foto-Titel' }); fireEvent.change(titleInput, { target: { value: 'Neuer Titel' } }); fail = 'update_submission.php'; await click('Titel speichern'); check(titleInput.value === 'Neuer Titel', 'Title edit stays after error'); fail = null; await click('Titel speichern'); check(database.submissions[0].title === 'Neuer Titel', 'Existing title endpoint updates submission');
  await mount('/photo-challenge/1'); fail = 'list_user_images.php'; document.dispatchEvent(new Event('visibilitychange')); await mount('/photo-challenge/1', 'user', false); await click('Foto einreichen'); check(dialog().textContent.includes('Testfehler'), 'Gallery failure is actionable'); fail = null; await click('Erneut versuchen', dialog()); check(dialog().querySelector('[aria-label="Eigenes Foto auswählen"] button'), 'Gallery retry restores choices'); await click('Dialog schließen', dialog());
  await mount('/photo-challenge/1'); await click('Foto einreichen'); await click('Foto hochladen', dialog()); const file = new File(['fake'], 'eis.png', { type: 'image/png' }); fireEvent.change(dialog().querySelector('input[type=file]'), { target: { files: [file] } }); await tick(); fail = 'submit_image.php'; await click('Foto einreichen', dialog()); check(dialog().querySelector('img[alt="Vorschau deiner Einreichung"]'), 'Upload preview survives failure'); await click('Dialog schließen', dialog());
  await mount('/photo-challenge/1'); database.submissions = [1,2,3].map(id => ({ ...image(id), id: 900+id, status:'pending', can_edit:true, can_delete:true })); document.dispatchEvent(new Event('visibilitychange')); await tick(); await tick(); check(byButton('Foto einreichen').disabled, 'Server submission limit prevents another entry');
  fixedTime = '2026-10-21T12:00:00+02:00'; await mount('/photo-challenge/1'); await click('Foto einreichen'); check(byButton('Foto einreichen',dialog()).disabled && dialog().textContent.includes('abgelaufen'), 'Deadline blocks submission and explains why'); fixedTime = '2026-10-05T12:00:00+02:00';
  await mount('/photo-challenge/3'); await click('Jetzt abstimmen'); layout(dialog()); check(dialog().textContent.includes('Für dieses Foto abstimmen'), 'Voting is explicitly labeled');
  const previewButton = getAllByRole(dialog(), 'button', { name: /vergrößern/ })[0]; press(previewButton); await tick(); check(document.querySelectorAll('[role=dialog]').length === 2, 'Full image opens above voting'); await click('Dialog schließen', dialog()); check(document.querySelectorAll('[role=dialog]').length === 1, 'Closing image restores voting');
  fail = 'vote.php'; const voteButton = getAllByRole(dialog(), 'button', { name: /Für Foto/ })[0]; press(voteButton); await tick(); check(dialog().textContent.includes('Testfehler'), 'Vote error keeps duel'); fail = null; delayApi = true; press(voteButton); press(voteButton); await new Promise(resolve => setTimeout(resolve, 400)); check(calls.filter(item => item.endpoint === 'vote.php').length === 2, 'Repeated vote click blocked'); check(dialog().textContent.includes('Duell 2 von 2'), 'First vote advances to next unanswered duel'); delayApi = false; await click('Zurück', dialog()); const changeButton = getAllByRole(dialog(), 'button', { name: /Für Foto/ }).find(item => !item.disabled); press(changeButton); await tick(); check(dialog().textContent.includes('Duell 1 von 2'), 'Changing a vote keeps the selected duel'); await click('Dialog schließen', dialog());
  await mount('/photo-challenge/4'); layout(); const phase = getAllByRole(document.body, 'button').find(item => item.textContent === 'Gruppenphase'); press(phase); await tick(); await click('Jetzt abstimmen'); const koVote = getAllByRole(dialog(), 'button', { name: /Für Foto/ })[0]; press(koVote); await tick(); await click('Dialog schließen', dialog()); check(phase.getAttribute('class') === getAllByRole(document.body, 'button').find(item => item.textContent === 'Gruppenphase').getAttribute('class'), 'Refresh retains selected phase');
  await mount('/photo-challenge/5'); check(document.body.textContent.includes('Champion'), 'Winner shown'); layout();
  await mount('/photo-challenge/1', 'guest'); await click('Foto einreichen'); check(document.body.textContent.includes('Login'), 'Guest can open login'); check(window.testRoute === '/photo-challenge/1', 'Login keeps challenge route');
  await mount('/user/42'); await waitFor(() => document.getElementById('serien')); check(document.querySelectorAll('#serien h3').length === 2, 'Profile has two equal series cards'); layout(document.getElementById('serien')); await click('Jetzt einchecken', document.getElementById('serien')); check(document.body.textContent.includes('Wo hast du dein Eis gegessen?'), 'Profile starts existing global checkin flow');
  await mount('/user/42'); window.testSwitchUser(99); await tick(); await tick(); check(!document.getElementById('serien').textContent.includes('verfügbar'), 'Account change immediately hides previous owner wallet');
  await mount('/user/99'); await waitFor(() => document.getElementById('serien')); check(!document.getElementById('serien').textContent.includes('verfügbar'), 'Foreign profile hides wallet'); check(!document.getElementById('serien').querySelector('progress'), 'Foreign profile hides reward progress');
  await mount('/series'); layout(); check(document.body.textContent.includes('Vorrat voll'), 'Full protection stock is clear');
  for (const state of ['none','at_risk','frozen','active']) for (const stock of [0,1,2]) {
    resetDatabase(); database.streaks.freezes = { day: stock, week: stock }; ['day','week'].forEach(type => { database.streaks[type].state = state; database.streaks[type].value = state === 'none' ? 0 : 7; });
    await mount('/series','user',false); layout();
    check(document.body.textContent.includes(stock === 2 ? 'Vorrat voll' : stock === 0 ? 'Schutz verdienen' : '1 von 2 verfügbar'), `Series wallet ${stock} in state ${state}`);
    check((state === 'active') === ![...document.querySelectorAll('button')].some(button => button.textContent.includes('Jetzt einchecken')), `Next action matches ${state}`);
  }
  await mount('/photo-challenge-admin', 'admin'); layout(); await click('Neue Foto-Challenge'); layout(dialog()); await click('Weiter', dialog()); check(dialog().textContent.includes('Bitte gib einen Titel'), 'Creation validates title'); fill('Titel', 'Neue Test-Challenge', dialog()); await click('Weiter', dialog()); await click('Zurück', dialog()); check(getByRole(dialog(), 'textbox', { name: 'Titel' }).value === 'Neue Test-Challenge', 'Wizard back keeps draft'); await click('Dialog schließen', dialog()); check(dialog().textContent.includes('Entwurf verwerfen'), 'Closing creation protects draft'); await click('Weiter ausfüllen', dialog()); await click('Weiter', dialog()); await click('Weiter', dialog()); await click('Als Entwurf anlegen', dialog()); check(!dialog(), 'Creation succeeds'); check(window.testRoute.includes('challengeId=100'), 'New challenge has persistent URL');
  await mount('/photo-challenge-admin?challengeId=2&view=planning', 'admin'); await waitFor(() => byButton('Vorschlag übernehmen')); check(window.testRoute.includes('view=planning'), 'Admin deep link persists'); layout(); await click('Vorschlag übernehmen'); check(byButton('Gruppenabstimmung starten').disabled, 'Unsaved plan cannot start');
  await click('Planung speichern'); await tick(); check(!byButton('Gruppenabstimmung starten').disabled, 'Saved valid plan can start'); await click('Gruppenabstimmung starten'); check(dialog().textContent.includes('gesperrt'), 'Phase start requires concrete confirmation'); await click('Abbrechen', dialog());
  const details = [...document.querySelectorAll('summary')].find(item => item.textContent === 'Details anpassen'); press(details); await tick(); const input = getByRole(document.body, 'spinbutton', { name: /Zusätzliche Qualifikationsplätze/ }); fireEvent.change(input, { target: { value: '3' } });
  await adminView('images'); check(dialog().textContent.includes('Ungespeicherte'), 'Browser navigation protects plan'); await click('Weiter bearbeiten', dialog()); check(window.testRoute.includes('view=planning'), 'Cancel restores old URL');
  await adminView('images'); await click('Änderungen verwerfen', dialog()); await tick(); check(window.testRoute.includes('view=images'), 'Discard completes requested navigation');
  resetDatabase(); database.submissions = [1,2].map(id => ({ ...image(id), id: 900+id, status: 'pending' })); await mount('/photo-challenge-admin?challengeId=2&view=images', 'admin', false); await click('Offene Fotos auswählen'); fail = 'review_submission.php'; failReviewId = 902; await click('2 übernehmen'); check(document.body.textContent.includes('bleiben ausgewählt'), 'Batch failures keep selection'); check(database.submissions.filter(item => item.status === 'accepted').length === 1, 'Batch preserves successful individual decisions'); fail = null; await click('1 übernehmen'); check(database.submissions.every(item => item.status === 'accepted'), 'Batch approval uses existing endpoint');
  await mount('/photo-challenge-admin?challengeId=3&view=voting','admin'); layout(); const scheduleDetails = [...document.querySelectorAll('summary')].find(item => item.textContent === 'Gruppentermine korrigieren'); press(scheduleDetails); await tick(); layout();
  await mount('/photo-challenge-admin?challengeId=5&view=results','admin'); layout(); check(document.body.textContent.includes('Story-Grafiken'), 'Story downloads remain accessible');
  await mount('/photo-challenge-admin?challengeId=1&view=settings','admin'); layout(); const settingsTitle = getByRole(document.body,'textbox',{name:'Titel'}); fireEvent.change(settingsTitle,{target:{value:'Geänderter Titel'}}); fail='update_challenge.php'; await click('Änderungen speichern'); check(settingsTitle.value==='Geänderter Titel','Settings retain unsaved draft after API error'); fail=null; await click('Änderungen speichern'); check(database.challenges[0].title==='Geänderter Titel','Saving settings includes all shared form values'); database.challenges[0].title='Extern aktualisiert'; await click('Aktualisieren'); await tick(); check(getByRole(document.body,'textbox',{name:'Titel'}).value==='Extern aktualisiert','Explicit refresh hydrates saved settings without stale form values');
  await mount('/photo-challenge-admin?challengeId=6&view=settings','admin'); layout(); await click('Einreichungen öffnen'); check(dialog().textContent.includes('Teilnehmer können danach'),'Opening entries requires confirmation'); await click('Einreichungen öffnen',dialog()); await tick(); check(database.challenges[5].status==='submission_open','Draft opens using existing update endpoint');
  await mount('/photo-challenge-admin?challengeId=4&view=voting','admin'); layout(); await click('Runde abschließen'); fail='advance_ko_round.php'; await click('Runde abschließen',dialog()); check(dialog().textContent.includes('Testfehler'),'Round failure keeps confirmation and error'); fail=null; await click('Runde abschließen',dialog()); await tick(); check(database.challenges[3].status==='finished','Round closes using existing endpoint');
  await mount('/photo-challenge-admin?challengeId=7&view=overview','admin'); layout(); check(!document.body.textContent.includes('Gruppenabstimmung starten'),'Legacy phase keeps its existing locks');
  await mount('/photo-challenge-admin','user'); check(document.body.textContent.includes('nur Administratoren'), 'Admin permission retained'); check(!document.body.textContent.includes('Neue Foto-Challenge'), 'Nonadmin cannot create');
  return results;
}
window.prepare = async scenario => {
  if (scenario === 'list') await mount('/photo-challenge');
  else if (scenario === 'submit') { await mount('/photo-challenge/1'); await click('Foto einreichen'); }
  else if (scenario === 'vote') { await mount('/photo-challenge/3'); await click('Jetzt abstimmen'); }
  else if (scenario === 'series') await mount('/series');
  else if (scenario === 'admin') await mount('/photo-challenge-admin?challengeId=2&view=planning','admin');
  else if (scenario === 'create') { await mount('/photo-challenge-admin','admin'); await click('Neue Foto-Challenge'); }
  else if (scenario === 'images') await mount('/photo-challenge-admin?challengeId=2&view=images','admin');
  layout(dialog() || document.querySelector('main')); return results.length;
};
window.runTests = runTests;
(async () => {
  try {
    const preview = new URLSearchParams(location.search).get('preview');
    if (preview) { await window.prepare(preview); document.getElementById('results').dataset.status = 'preview'; }
    else { await runTests(); document.getElementById('results').dataset.status = 'passed'; }
    document.getElementById('results').textContent = JSON.stringify(results);
  } catch (error) { document.getElementById('results').dataset.status = 'failed'; document.getElementById('results').textContent = error.stack; }
})();
