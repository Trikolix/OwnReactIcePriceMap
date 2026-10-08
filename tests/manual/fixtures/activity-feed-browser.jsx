import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { configure, fireEvent, getByRole, waitFor } from '@testing-library/dom';
import { UserProvider } from '../../../src/context/UserContext';
import DashBoard from '../../../src/pages/DashBoard';
import DashboardTarget from '../../../src/pages/DashboardTarget';
import AwardBundleCard from '../../../src/components/AwardBundleCard';
import '../../../src/index.css';

configure({ getElementError: message => new Error(message.split('Here are')[0].slice(0, 500)) });
const root = createRoot(document.getElementById('app')), checks = [], calls = [], errors = [];
window.addEventListener('error', event => errors.push(event.error?.stack || event.message));
let mountId = 0, userId = 99;
const date = '2026-10-07 12:00:00';
const longName = 'EinSehrLangerNutzernameOhneLeerzeichen'.repeat(3);
const checkin = { id: 1, nutzer_id: 99, nutzer_name: 'Mia', avatar_url: '/fixture-avatar.svg', eisdiele_id: 7, eisdiele_name: 'Eismanufaktur Emilia', context_type: 'ice_shop', typ: 'Kugel', datum: date,
  eissorten: [{ sortenname: 'Pistazie', bewertung: 4.5 }], geschmackbewertung: 4.5, größenbewertung: 4, waffelbewertung: 4, preisleistungsbewertung: 4,
  kommentar: 'Eine große Portion Pistazieneis in der Sonne.', bilder: [{ url: '/fixture-ice.svg' }, { url: '/fixture-ice.svg?second' }], anreise: 'Fahrrad', is_on_site: 1, likes_count: 2, has_liked: false, commentCount: 1 };
const review = { id: 2, nutzer_id: 77, nutzer_name: 'Jonas', avatar_url: '/fixture-avatar.svg', eisdiele_id: 7, eisdiele_name: 'Eismanufaktur Emilia', erstellt_am: date, auswahl: 22,
  beschreibung: 'Hausgemachtes Eis und ein schöner Platz auf der Terrasse.', attribute_details: [{ id: 3, name: 'Vegane Sorten' }], bilder: [{ url: '/fixture-ice.svg' }], likes_count: 2, has_liked: false, commentCount: 1 };
const route = { id: 3, nutzer_id: 77, username: longName, avatar_url: '/fixture-avatar.svg', name: 'Mit dem Rad zur besten Eiswaffel', beschreibung: 'Eine entspannte Tour mit zwei Eis-Stopps.', erstellt_am: date,
  typ: 'Gravel', schwierigkeit: 'leicht', laenge_km: 42.3, hoehenmeter: 410, ist_oeffentlich: '1', url: 'https://example.invalid/tour/3', embed_code: '<iframe src="/fixture-map.html" title="Testkarte"></iframe>',
  eisdielen: [{ id: 7, name: 'Eismanufaktur Emilia' }, { id: 8, name: 'Eiscafé am Park' }], likes_count: 2, has_liked: false, commentCount: 1 };
const shop = { id: 7, user_id: 77, nutzer_name: 'Jonas', avatar_url: '/fixture-avatar.svg', name: 'Eismanufaktur Emilia', adresse: 'Markt 12, 09111 Chemnitz', erstellt_am: date, status: 'open', website: 'https://example.invalid', openingHours: 'Mo – Fr: 12:00 – 20:00;Sa – So: 10:00 – 20:00' };
const award = { id: 100, user_id: 77, user_name: 'Jonas', avatar_url: '/fixture-avatar.svg', title_de: 'Goldene Eiswaffel', description_de: 'Für deine vielen Eis-Momente und Entdeckungen.', icon_path: 'fixture-award.svg', ep: 400, datum: date, likes_count: 2, has_liked: false, commentCount: 1 };
const awards = [{ ...award, id: 111, title_de: 'Sortenentdecker', ep: 500 }, { ...award, id: 112, title_de: 'Eisfreund', ep: 50, description_de: 'Ein weiterer Eis-Moment. '.repeat(8) }];
const group = [ { ...checkin, id: 201, nutzer_id: 77, nutzer_name: 'Jonas' }, { ...checkin, id: 202, nutzer_id: 78, nutzer_name: longName, kommentar: 'Ein ausführlicher gemeinsamer Besuch. '.repeat(20) } ];
const newUser = { id: 12, username: longName, avatar_url: '/fixture-avatar.svg', current_level: 2, erstellt_am: date, likes_count: 2, has_liked: false, commentCount: 1 };
const feed = [
  { typ: 'checkin', id: 1, data: checkin }, { typ: 'bewertung', id: 2, data: review }, { typ: 'route', id: 3, data: route },
  { typ: 'eisdiele', id: 7, data: shop }, { typ: 'award', id: 100, data: award }, { typ: 'award_bundle', id: 'bundle', data: awards },
  { typ: 'award_wave', id: 'wave', data: { ...award, title_de: 'Herbstentdecker', recipients: [{ ...award, id: 121, title_de: 'Herbstentdecker' }, { ...award, id: 122, user_id: 78, user_name: longName, title_de: 'Herbstentdecker' }] } },
  { typ: 'new_user', id: 12, data: newUser }, { typ: 'group_checkin', id: 'group', data: group },
];
const response = (data, status = 200) => ({ ok: status < 400, status, json: async () => structuredClone(data) });
window.fetch = async (input, init = {}) => {
  const url = new URL(String(input), 'https://test.invalid');
  if (url.origin !== 'https://test.invalid') throw new Error('External API requests are blocked');
  calls.push({ url: url.href, init });
  if (url.pathname.includes('session.php')) return response({ status: 'success', userId, username: 'Mia', currentLevel: 5 });
  if (url.pathname.endsWith('activity_feed.php')) {
    if (url.searchParams.get('mode') === 'target') return response({ target: { typ: 'award', id: 100, data: award }, meta: { historical: true } });
    return response({ activities: Number(url.searchParams.get('offset')) > 0 ? [{ typ: 'new_user', id: 13, data: { ...newUser, id: 13, username: 'Lea' } }] : feed, meta: { nextOffset: 9, hasMore: !Number(url.searchParams.get('offset')) } });
  }
  if (url.pathname.includes('streak_status.php')) return response({ level_info: { level: 5 }, streaks: {}, events: [], refresh_after_seconds: 3600 });
  if (url.pathname.includes('benachrichtigungen.php')) return response({ status: 'success', notifications: [], unread_total: 0 });
  if (url.pathname.includes('get_user_stats.php')) return response({ status: 'success', avatar_url: '/fixture-avatar.svg' });
  if (url.pathname.includes('get_eisdiele.php')) return response({ eisdiele: shop });
  if (url.pathname.includes('likes.php')) return response({ success: true, likes_count: init.method === 'POST' ? 3 : 2, has_liked: init.method === 'POST', users: [] });
  if (url.pathname.includes('kommentare.php')) return response({ status: 'success', kommentare: [{ id: 901, nutzer_id: 77, nutzername: 'Jonas', erstellt_am: date, kommentar: 'Dieser Kommentar bleibt erreichbar.', likes_count: 0, has_liked: false }] });
  return response({ status: 'success', actions: [], data: [], users: [], awards: [], activities: [], kommentare: [] });
};
function Probe() { window.feedLocation = useLocation(); window.feedNavigate = useNavigate(); return null; }
const tick = () => new Promise(resolve => setTimeout(resolve, 130));
const check = (value, message) => { if (!value) throw new Error(message); checks.push(message); };
const outerCards = () => [...document.querySelectorAll('[data-activity-card]')].filter(card => !card.parentElement.closest('[data-activity-card]'));
const commentsButton = card => getByRole(card, 'button', { name: /Kommentar/ });
async function mount(path = '/dashboard', guest = false) {
  userId = guest ? null : 99; localStorage.clear();
  if (userId) { localStorage.setItem('userId', '99'); localStorage.setItem('username', 'Mia'); localStorage.setItem('authToken', 'test-token'); }
  root.render(<MemoryRouter key={++mountId} initialEntries={[path]}><UserProvider><Probe /><Routes>
    <Route path="/dashboard" element={<DashBoard />} /><Route path="/dashboard/target" element={<DashboardTarget />} />
    <Route path="/bundle" element={<main style={{ width: 'min(calc(100% - 24px), 1040px)', margin: '20px auto' }}><AwardBundleCard awards={awards} userName="Jonas" date={date} focusAwardId={112} focusCommentId={901} /></main>} />
    <Route path="*" element={<p>Andere Seite</p>} />
  </Routes></UserProvider></MemoryRouter>);
  await tick(); await waitFor(() => { if (!outerCards().length) throw new Error('Waiting for activity cards'); }); await tick();
}
window.feedPreview = async kind => { await mount(kind === 'target' ? '/dashboard/target?type=award&id=100&focusComment=901' : kind === 'focus' ? '/bundle' : '/dashboard', kind === 'guest'); };
(async () => {
  const preview = new URLSearchParams(location.search).get('preview');
  if (preview) { await window.feedPreview(preview); document.getElementById('results').dataset.status = 'preview'; return; }
  await mount();
  let cards = outerCards();
  check(cards.length === 9, 'All nine activity card types render in the real dashboard');
  for (const [index, card] of cards.entries()) {
    const styles = getComputedStyle(card), bounds = card.getBoundingClientRect();
    check(styles.backgroundColor === 'rgb(255, 255, 255)' && styles.borderRadius === '18px' && styles.boxShadow === 'none', 'Card ' + index + ' uses the same clean surface');
    check(bounds.left >= 0 && bounds.right <= innerWidth + 1, 'Card ' + index + ' fits the feed width');
    check(card.querySelector('a[href^="/user/"] img'), 'Card ' + index + ' retains a user avatar');
    const identity = card.querySelector('[data-activity-header] > [data-activity-identity]').getBoundingClientRect();
    const metadata = card.querySelector('[data-activity-header] > [data-activity-meta]').getBoundingClientRect();
    const header = card.querySelector('[data-activity-header]').getBoundingClientRect();
    const timestamp = card.querySelector('time').getBoundingClientRect();
    const contentWidth = card.clientWidth - parseFloat(styles.paddingLeft) - parseFloat(styles.paddingRight);
    check(contentWidth >= 600
      ? metadata.left >= identity.right && Math.abs(metadata.top + metadata.height / 2 - identity.top - identity.height / 2) < 2
      : metadata.bottom <= identity.top && Math.abs(timestamp.right - header.right) < 2 && Math.abs(timestamp.top - header.top) < 2,
    'Card ' + index + ' shows the date first at the top right on narrow cards and beside the user on wide cards');
    check(card.querySelector('time').textContent.includes('2026') && card.querySelector('time').textContent.includes('12:00'), 'Card ' + index + ' keeps the full date and time');
    for (const control of card.querySelectorAll('button')) {
      if (control.closest('[inert]')) continue;
      const rect = control.getBoundingClientRect();
      if (rect.width && rect.height) check(rect.width >= 44 && rect.height >= 44, 'Card ' + index + ' has 44px actions: ' + (control.getAttribute('aria-label') || control.textContent));
    }
  }
  check(document.documentElement.scrollWidth <= innerWidth + 1, 'The entire activity feed has no horizontal overflow with long names');
  const singleCheckin = cards.find(card => card.textContent.includes('Eine große Portion'));
  check(singleCheckin.querySelector('.star-rating') && singleCheckin.querySelector('a[href="/statistics/flavours/Pistazie?type=Kugel"]'), 'Ratings and flavor links remain available');
  check(cards.some(card => card.querySelector('a[href="/map?attributes=3"]')), 'Review attribute links remain available');
  const flavor = singleCheckin.querySelector('a[href="/statistics/flavours/Pistazie?type=Kugel"]');
  flavor.scrollIntoView({ block: 'center' });
  const flavorDecoration = getComputedStyle(flavor, '::before'), flavorBounds = flavor.getBoundingClientRect();
  const arrival = [...singleCheckin.querySelectorAll('span')].find(span => span.textContent.includes('Anreise:'));
  const onSite = [...singleCheckin.querySelectorAll('span')].find(span => span.textContent.includes('Vor Ort eingecheckt'));
  const pillHeight = flavorBounds.height - parseFloat(flavorDecoration.top) - parseFloat(flavorDecoration.bottom);
  check(Math.abs(pillHeight - arrival.getBoundingClientRect().height) < 1 && Math.abs(pillHeight - onSite.getBoundingClientRect().height) < 1, 'Flavor, arrival and on-site pills have the same compact visual height');
  check(flavorBounds.height >= 44 && document.elementFromPoint(flavorBounds.left + flavorBounds.width / 2, flavorBounds.top + 2) === flavor, 'The area above the small flavor pill remains clickable');
  const social = singleCheckin.querySelector('[data-activity-social]');
  check(social.getBoundingClientRect().height <= 46, 'Likes and comments share a compact row while keeping large controls');
  const media = singleCheckin.querySelector('[data-activity-media]'), text = singleCheckin.querySelector('[data-activity-text]');
  const wide = singleCheckin.getBoundingClientRect().width >= 720;
  check(wide ? Math.abs(media.getBoundingClientRect().top - text.getBoundingClientRect().top) < 2 : media.getBoundingClientRect().bottom <= text.getBoundingClientRect().top + 1, 'Photo layout follows card width, including the feed gutter');
  check(media.querySelector('img').getBoundingClientRect().width > 160, 'Check-in photo stays large');
  fireEvent.click(getByRole(singleCheckin, 'button', { name: 'Gefällt mir' })); await tick();
  check(getByRole(singleCheckin, 'button', { name: 'Gefällt dir' }) && calls.some(call => call.init.method === 'POST' && call.url.includes('likes.php')), 'Likes still work after restyling');
  fireEvent.click(commentsButton(singleCheckin)); await tick();
  check(singleCheckin.textContent.includes('Dieser Kommentar bleibt erreichbar.') && commentsButton(singleCheckin).getAttribute('aria-expanded') === 'true', 'Comments open with their existing content');
  fireEvent.click(commentsButton(singleCheckin)); await tick();
  const carousels = [...document.querySelectorAll('[role="region"]')].filter(region => ['Gemeinsame Check-ins','Gesammelte Awards','Award-Empfänger'].includes(region.getAttribute('aria-label')));
  check(carousels.length === 3, 'All grouped cards share the accessible carousel');
  const embedded = getByRole(document.body, 'region', { name: 'Gemeinsame Check-ins' }).querySelector('.swiper-slide:not([inert]) > [data-activity-card]');
  const embeddedMedia = embedded.querySelector('[data-activity-media]'), embeddedText = embedded.querySelector('[data-activity-text]');
  embedded.style.width = '719px';
  check(embeddedMedia.getBoundingClientRect().bottom <= embeddedText.getBoundingClientRect().top + 1, 'Embedded check-ins keep a single column below 720px card width');
  embedded.style.width = '720px';
  check(Math.abs(embeddedMedia.getBoundingClientRect().top - embeddedText.getBoundingClientRect().top) < 2, 'Embedded check-ins switch columns at 720px card width');
  embedded.style.width = ''; await tick();
  for (const carousel of carousels) {
    const next = getByRole(carousel, 'button', { name: /^Nächster/ });
    fireEvent.click(next); await tick(); await tick(); await tick();
    check(carousel.querySelector('[role="status"]').textContent === '2 / 2', carousel.getAttribute('aria-label') + ' advances without overlay controls');
    check(carousel.querySelector('.swiper-slide:not([inert])') === carousel.querySelectorAll('.swiper-slide')[1], 'Only the active slide accepts keyboard focus');
    const active = carousel.querySelector('.swiper-slide:not([inert])');
    fireEvent.click(commentsButton(active)); await tick(); await tick();
    check(active.getBoundingClientRect().height >= active.firstElementChild.getBoundingClientRect().height - 1 && carousel.querySelector('.swiper-wrapper').getBoundingClientRect().height >= active.firstElementChild.getBoundingClientRect().height - 1, 'Carousel height grows to include comments');
    fireEvent.click(commentsButton(active)); await tick();
    fireEvent.click(getByRole(carousel, 'button', { name: /^Vorheriger/ })); await tick(); await tick(); await tick();
    check(carousel.querySelector('[role="status"]').textContent === '1 / 2', 'Carousel returns to the first entry');
  }
  const awardCard = cards.find(card => card.textContent.includes('Goldene Eiswaffel') && !card.querySelector('.swiper'));
  const iconButton = getByRole(awardCard, 'button', { name: /groß anzeigen/ }); iconButton.focus(); fireEvent.click(iconButton); await tick();
  const dialog = getByRole(document.body, 'dialog', { name: 'Award Goldene Eiswaffel' });
  check(dialog.contains(document.activeElement), 'Award gallery receives keyboard focus');
  fireEvent.keyDown(window, { key: 'Escape' }); await tick();
  check(!document.querySelector('[role="dialog"]') && document.activeElement === iconButton, 'Award gallery closes and restores focus');
  fireEvent.click(getByRole(document.body, 'button', { name: 'Aktivitätsfilter' })); await tick();
  fireEvent.click(getByRole(document.body, 'checkbox', { name: 'Neue Nutzer' })); await tick();
  check(outerCards().length === 8, 'Activity filters preserve their behavior');
  fireEvent.click(getByRole(document.body, 'checkbox', { name: 'Neue Nutzer' })); await tick();
  fireEvent.click(getByRole(document.body, 'button', { name: 'Mehr laden' })); await tick(); await tick();
  check(outerCards().length === 10, 'Loading additional activities remains available');
  await mount('/bundle');
  check(document.querySelector('[role="status"]').textContent === '2 / 2' && document.body.textContent.includes('Dieser Kommentar bleibt erreichbar.'), 'A linked award opens its slide and focused comment');
  await mount('/dashboard/target?type=award&id=100&focusComment=901');
  check(outerCards().length === 1 && document.body.textContent.includes('Dieser Kommentar bleibt erreichbar.'), 'Historical linked activities keep the same card and comments');
  await mount('/dashboard', true);
  check(outerCards().length === 9 && !document.body.textContent.includes('Eintrag bearbeiten'), 'Guests can read every activity card');
  check(document.documentElement.scrollWidth <= innerWidth + 1, 'Guest activity feed has no horizontal overflow');
  check(errors.length === 0, 'No browser runtime errors: ' + errors.join('\n'));
  document.getElementById('results').textContent = JSON.stringify({ passed: checks.length, viewport: innerWidth, checks });
  document.getElementById('results').dataset.status = 'passed';
})().catch(error => { document.getElementById('results').textContent = error.stack; document.getElementById('results').dataset.status = 'failed'; });
