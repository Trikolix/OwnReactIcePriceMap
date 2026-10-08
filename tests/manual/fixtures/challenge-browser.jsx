import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { UserProvider } from '../../../src/context/UserContext';
import Challenges from '../../../src/pages/Challenges';
import { fireEvent, getAllByRole } from '@testing-library/dom';
import '../../../src/index.css';
const root = createRoot(document.getElementById('app')),
  calls = [];
const RealDate = Date;
const minuteTimers = new Map(),
  realSetInterval = window.setInterval.bind(window),
  realClearInterval = window.clearInterval.bind(window);
window.setInterval = (callback, milliseconds, ...args) => {
  const id = realSetInterval(callback, milliseconds, ...args);
  if (milliseconds === 60000) minuteTimers.set(id, callback);
  return id;
};
window.clearInterval = id => {
  minuteTimers.delete(id);
  realClearInterval(id);
};
let clock = Date.parse('2026-10-07T12:00:00+02:00');
window.Date = class extends RealDate {
  constructor(...args) {
    super(...(args.length ? args : [clock]));
  }
  static now() {
    return clock;
  }
};
let mode = 'solo',
  soloDb = [],
  teamDb = [],
  geoRequests = 0,
  nextId = 9000,
  failLoad = false,
  partial = false,
  slow = false,
  slowSolo = false,
  sequence = 0;
const sample = (id, difficulty = 'leicht', extra = {}) => ({
  id,
  nutzer_id: 99,
  type: 'daily',
  difficulty,
  created_at: '2026-10-07 07:28:26',
  valid_from: '2026-10-07 07:28:26',
  valid_until: '2026-10-07 23:59:59',
  completed: 0,
  recreated: 0,
  shop_id: 7,
  shop_name: 'Eismanufaktur Emilia',
  shop_address: 'Markt 12, 09111 Chemnitz',
  shop_lat: 50.83,
  shop_lon: 12.93,
  openingHours: 'Mo - Fr: 12:00 - 20:00;Sa - So: 10:00 - 20:00',
  is_open_now: true,
  ...extra
});
const records = [sample(1), sample(2, 'mittel', {
  shop_id: 8,
  shop_name: 'Eiscafe am Park',
  shop_address: 'Ein sehr langer Strassenname 132, 09111 Chemnitz',
  shop_lat: 50.87,
  shop_lon: 12.95,
  is_open_now: null
}), sample(3, 'schwer', {
  completed: 1,
  completed_at: '2026-10-07 10:00:00'
}), sample(4, 'leicht', {
  valid_from: '2026-10-08 00:00:00',
  valid_until: '2026-10-08 23:59:59'
}), sample(5, 'mittel', {
  valid_from: '2026-10-08 00:00:00',
  valid_until: '2026-10-08 23:59:59'
}), sample(6, 'schwer', {
  valid_from: '2026-10-08 00:00:00',
  valid_until: '2026-10-08 23:59:59'
}), sample(7, 'leicht', {
  type: 'weekly',
  valid_until: '2026-10-11 23:59:59'
}), ...Array.from({
  length: 14
}, (_, i) => sample(100 + i, 'leicht', {
  completed: 1,
  valid_from: '2026-09-30 00:00:00',
  valid_until: '2026-09-30 23:59:59',
  completed_at: '2026-09-30 10:00:00'
}))];
const person = {
    id: 77,
    username: 'EinSehrLangerNutzernameOhneLeerzeichen'.repeat(3)
  },
  me = {
    id: 99,
    username: 'Mia'
  };
const shop = {
  id: 7,
  name: 'Eismanufaktur Emilia',
  address: 'Markt 12, 09111 Chemnitz',
  lat: 50.83,
  lon: 12.93
};
const team = (id, status = 'pending_acceptance', extra = {}) => ({
  id,
  type: 'weekly',
  difficulty: 'leicht',
  status,
  created_at: '2026-10-07 09:00:00',
  proposal_deadline: '2026-10-08 09:00:00',
  valid_until: '2026-10-11 23:59:59',
  completed_at: null,
  inviter: person,
  invitee: me,
  viewer_role: 'invitee',
  can_accept: status === 'pending_acceptance',
  can_decline: status === 'pending_acceptance',
  can_cancel: ['pending_acceptance', 'proposal_open', 'shop_finalized'].includes(status),
  can_finalize: status === 'proposal_open',
  center: {
    lat: 50.83,
    lon: 12.93
  },
  radius_m: 5000,
  min_radius_m: 0,
  completion_window_minutes: 60,
  final_shop: status === 'shop_finalized' || status === 'completed' ? shop : null,
  candidates: [{
    shop_id: 7,
    name: shop.name,
    address: shop.address,
    lat: shop.lat,
    lon: shop.lon,
    distance_to_center: 1000
  }],
  checkins: [],
  ...extra
});
const response = (data, status = 200) => ({
  ok: status < 400,
  status,
  json: async () => structuredClone(data)
});
const delay = ms => new Promise(resolve => setTimeout(resolve, ms)),
  tick = () => delay(160);
window.fetch = async (input, init = {}) => {
  const url = new URL(String(input), 'https://test.invalid');
  if (url.origin !== 'https://test.invalid') throw new Error('External API blocked');
  const payload = init.body instanceof FormData ? Object.fromEntries(init.body) : init.body ? JSON.parse(init.body) : null;
  calls.push({
    path: url.pathname,
    payload
  });
  if (url.pathname.includes('session.php')) return response({
    status: 'success',
    userId: mode === 'guest' ? null : 99,
    username: 'Mia',
    currentLevel: 5
  });
  if (url.pathname.endsWith('team_challenge_list.php')) {
    const active = teamDb.filter(item => !['completed', 'cancelled', 'expired', 'failed_no_shops'].includes(item.status));
    return response({
      status: 'success',
      active: active[0],
      active_challenges: active,
      received_invitations: active.filter(item => item.viewer_role === 'invitee' && item.status === 'pending_acceptance'),
      sent_invitations: [],
      history: teamDb.filter(item => !active.includes(item))
    });
  }
  if (url.pathname.endsWith('team_challenge_detail.php')) {
    const id = url.searchParams.get('team_challenge_id'),
      record = structuredClone(teamDb.find(item => String(item.id) === id));
    if (slow) await delay(id === '21' ? 600 : 20);
    return record ? response({
      status: 'success',
      team_challenge: record
    }) : response({
      status: 'error',
      message: 'Nicht gefunden'
    }, 404);
  }
  if (url.pathname.endsWith('challenge_list.php')) {
    const snapshot = structuredClone(soloDb);
    if (slowSolo) await delay(650);
    return failLoad ? response({
      status: 'error',
      message: 'Test-Ladefehler'
    }, 500) : response(snapshot);
  }
  if (url.pathname.endsWith('challenge_generate.php')) {
    if (partial && payload.type === 'daily' && payload.difficulty === 'mittel' && !payload.for_tomorrow) return response({
      status: 'error',
      message: 'Für diese Kombination fehlen Ziele.'
    });
    const old = soloDb.find(item => String(item.id) === payload.challenge_id),
      tomorrow = payload.for_tomorrow === 'true';
    const record = sample(old?.id || nextId++, payload.difficulty, {
      type: payload.type,
      valid_from: old?.valid_from || (tomorrow ? '2026-10-08 00:00:00' : '2026-10-07 12:00:00'),
      valid_until: old?.valid_until || (payload.type === 'weekly' ? '2026-10-11 23:59:59' : tomorrow ? '2026-10-08 23:59:59' : '2026-10-07 23:59:59'),
      recreated: old ? 1 : 0,
      custom_min_distance_m: Number(payload.custom_min_km || 0) * 1000,
      custom_max_distance_m: Number(payload.custom_max_km || 0) * 1000
    });
    soloDb = soloDb.filter(item => item.id !== record.id);
    soloDb.push(record);
    return response({
      status: 'success',
      challenge: record
    });
  }
  if (/team_challenge_(invite|accept|decline|cancel|finalize_shop)\.php$/.test(url.pathname)) {
    let record = teamDb.find(item => Number(item.id) === Number(payload.team_challenge_id));
    if (url.pathname.includes('_invite.php')) {
      record = team(nextId++, 'pending_acceptance', {
        inviter: me,
        invitee: person,
        viewer_role: 'inviter',
        can_accept: false
      });
      teamDb.push(record);
    } else if (url.pathname.includes('_accept.php')) Object.assign(record, {
      status: 'proposal_open',
      can_accept: false,
      can_finalize: true
    });else if (url.pathname.includes('_finalize_shop.php')) Object.assign(record, {
      status: 'shop_finalized',
      can_finalize: false,
      final_shop: shop
    });else Object.assign(record, {
      status: 'cancelled',
      can_accept: false,
      can_cancel: false
    });
    return response({
      status: 'success',
      team_challenge: record
    });
  }
  if (url.pathname.includes('search_user.php')) return url.searchParams.get('q') === 'error' ? response({
    status: 'error',
    message: 'Test-Suchfehler'
  }, 500) : response(url.searchParams.get('q') === 'none' ? [] : [person]);
  if (url.pathname.includes('streak_status.php')) return response({
    level_info: {
      level: 5
    },
    streaks: {},
    events: [],
    refresh_after_seconds: 3600
  });
  if (url.pathname.includes('benachrichtigungen.php')) return response({
    status: 'success',
    notifications: [],
    unread_total: 0
  });
  if (url.pathname.includes('get_user_stats.php')) return response({
    status: 'success',
    avatar_url: '/fixture-avatar.svg'
  });
  return response({
    status: 'success',
    actions: [],
    data: [],
    users: [],
    awards: [],
    activities: [],
    kommentare: []
  });
};
Object.defineProperty(navigator, 'geolocation', {
  configurable: true,
  value: {
    getCurrentPosition(success, error) {
      geoRequests++;
      setTimeout(() => mode === 'no-location' ? error({
        code: 1
      }) : success({
        coords: {
          latitude: 50.83,
          longitude: 12.93,
          accuracy: 35
        }
      }), 0);
    }
  }
});
function button(text, scope = document) {
  const result = getAllByRole(scope, 'button').find(item => item.textContent.trim() === text);
  if (!result) throw new Error('Missing button: ' + text);
  return result;
}
const click = async text => {
  fireEvent.click(button(text));
  await tick();
};
const radio = async (name, value) => {
  const inputs = [...document.querySelectorAll(`input[name="${name}"]`)];
  fireEvent.click(typeof value === 'number' ? inputs[value] : inputs.find(input => input.value === value));
  await tick();
};
const dialog = () => document.querySelector('[role=dialog]');
async function close() {
  fireEvent.click(dialog().querySelector('[aria-label="Dialog schließen"]'));
  await tick();
}
async function mount(kind) {
  mode = kind;
  clock = Date.parse('2026-10-07T12:00:00+02:00');
  calls.length = 0;
  geoRequests = 0;
  nextId = 9000;
  failLoad = kind === 'load-error';
  partial = false;
  slow = false;
  slowSolo = false;
  soloDb = kind === 'empty' || kind === 'result' ? [] : structuredClone(records);
  const firstStatus = kind.startsWith('team-final') || kind === 'team-progress' || kind === 'team-retry' ? 'shop_finalized' : kind === 'team-legacy' ? 'proposal_submitted' : 'pending_acceptance';
  teamDb = [team(21, firstStatus), team(22, 'proposal_open'), team(23, 'pending_acceptance', {
    inviter: me,
    invitee: person,
    viewer_role: 'inviter',
    can_accept: false,
    can_decline: false
  }), team(40, 'completed', {
    completed_at: '2026-10-06 19:00:00',
    can_cancel: false,
    checkins: [{
      user_id: 77,
      checkin_date: '2026-10-06 18:45:00'
    }, {
      user_id: 99,
      checkin_date: '2026-10-06 19:00:00'
    }]
  }), team(41, 'expired', {
    can_cancel: false
  }), team(42, 'cancelled', {
    can_cancel: false
  })];
  if (kind === 'team-progress') teamDb[0].checkins = [{
    user_id: 77,
    checkin_date: '2026-10-07 11:30:00'
  }];
  if (kind === 'team-retry') teamDb[0].checkins = [{
    user_id: 77,
    checkin_date: '2026-10-07 10:00:00'
  }];
  if (kind === 'team-create') teamDb.splice(1, 2);
  localStorage.clear();
  if (kind !== 'guest') {
    localStorage.setItem('userId', '99');
    localStorage.setItem('username', 'Mia');
    localStorage.setItem('authToken', 'audit-test-token');
  }
  const focused = kind === 'team-completed' ? 40 : kind === 'team-expired' ? 41 : kind === 'team-cancelled' ? 42 : null;
  root.render(<MemoryRouter key={++sequence} initialEntries={[kind.startsWith('team') ? `/challenge?tab=team${focused ? `&teamChallengeId=${focused}` : ''}` : '/challenge']}><UserProvider><Routes><Route path="/challenge" element={<Challenges />} /></Routes></UserProvider></MemoryRouter>);
  await tick();
  await tick();
  if (kind === 'upcoming') await click('Morgen (3)');
  if (['generator', 'individual', 'result', 'no-location'].includes(kind)) {
    await click('Neue Challenge');
    if (kind === 'individual') await radio('difficulty', 'individuell');
    if (kind === 'result') await click('Challenge erstellen');
    if (kind === 'no-location') {
      await radio('challenge-type', 1);
      await radio('difficulty', 'mittel');
      await click('Challenge erstellen');
    }
  }
  if (kind === 'team-create') await click('Neue Team-Challenge');
}
window.auditMeasure = () => {
  const controls = [...document.querySelectorAll('[data-challenge-page] button,[data-challenge-page] a,[data-challenge-page] summary,[role=dialog] button,[role=dialog] a,[role=dialog] input,[role=dialog] summary')];
  return {
    requestedViewport: Number(new URLSearchParams(location.search).get('width')),
    viewport: innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    mode,
    pageHeight: document.documentElement.scrollHeight,
    overflow: document.documentElement.scrollWidth > Number(new URLSearchParams(location.search).get('width')) + 1,
    smallControls: controls.filter(item => item.getClientRects().length && !item.closest('.leaflet-control-attribution')).map(item => {
      const area = item.tagName === 'INPUT' && item.type === 'radio' ? item.closest('label') : item;
      const r = area.getBoundingClientRect();
      return {
        text: item.getAttribute('aria-label') || item.textContent,
        width: Math.round(r.width),
        height: Math.round(r.height)
      };
    }).filter(item => item.height > 0 && item.width > 0 && (item.height < 44 || item.width < 44)),
    mapY: document.querySelector('.leaflet-container') ? Math.round(document.querySelector('.leaflet-container').getBoundingClientRect().top + scrollY) : null
  };
};
window.prepareKeyboardAudit = async () => {
  const input = document.getElementById('team-user-search');
  fireEvent.change(input, {
    target: {
      value: 'li'
    }
  });
  await delay(400);
  input.focus();
};
window.feedPreview = mount;
(async () => {
  const preview = new URLSearchParams(location.search).get('preview');
  await mount(preview || 'solo');
  if (preview) {
    document.getElementById('results').dataset.status = 'preview';
    return;
  }
  let passed = 0;
  const check = (condition, message) => {
    if (!condition) throw new Error(message);
    passed++;
  };
  const baseline = window.auditMeasure();
  check(!baseline.overflow, 'Solo overflows');
  check(!baseline.smallControls.length, 'Small solo controls ' + JSON.stringify(baseline.smallControls));
  check(geoRequests === 0, 'Page requested geolocation before an action');
  check(document.querySelectorAll('[data-solo-challenge]').length === 3, 'Wrong active count');
  check(document.querySelectorAll('button').length > 0 && !document.body.textContent.includes('Zufallsziel für heute'), 'Old quickstart remains');
  check([...document.querySelectorAll('a')].some(item => item.textContent === 'Einchecken' && item.getAttribute('href') === '/shop/7?openCheckin=1'), 'Missing check-in deep link');
  check(document.body.textContent.includes('Öffnungsstatus unbekannt'), 'Unknown hours became closed');
  check(document.querySelectorAll('[data-challenge-page] button').length && document.body.textContent.includes('Mehr anzeigen (9)'), 'Archive is not limited to six');
  await click('Morgen (3)');
  check(![...document.querySelectorAll('[data-solo-challenge]')].some(card => card.textContent.includes('Jetzt geöffnet')), 'Tomorrow uses current opening status');
  await click('Aktiv (3)');
  await click('Neue Challenge');
  await radio('difficulty', 'schwer');
  check(button('Für diesen Zeitraum abgeschlossen').disabled, 'Completed today slot offered again');
  await radio('challenge-day', 1);
  check(button('Für morgen geplant').disabled, 'Tomorrow slot offered again');
  await radio('challenge-type', 1);
  await radio('difficulty', 'mittel');
  await click('Challenge erstellen');
  const request = calls.find(call => call.path.endsWith('challenge_generate.php')).payload;
  check(request.type === 'weekly' && request.difficulty === 'mittel' && !request.for_tomorrow, 'Explicit selection was ignored');
  check(dialog().textContent.includes('Dein neues Eisziel'), 'Missing result dialog');
  await close();
  await mount('empty');
  await click('Morgen (0)');
  check(button('Morgen (0)').getAttribute('aria-pressed') === 'true', 'Empty tomorrow view was switched away');
  await click('Challenge für morgen planen');
  await click('Challenge erstellen');
  check(calls.find(call => call.path.endsWith('challenge_generate.php')).payload.for_tomorrow === 'true', 'Tomorrow request lost');
  check(![...dialog().querySelectorAll('a')].some(item => item.textContent === 'Einchecken'), 'Future result offered check-in');
  await mount('empty');
  await click('Neue Challenge');
  await radio('difficulty', 'individuell');
  const ranges = dialog().querySelectorAll('input[type=range]');
  fireEvent.change(ranges[0], {
    target: {
      value: '50'
    }
  });
  await tick();
  await click('Challenge erstellen');
  check(calls.find(call => call.path.endsWith('challenge_generate.php')).payload.custom_max_km === '55', 'Individual range constraint lost');
  await mount('empty');
  partial = true;
  await click('Neue Challenge');
  fireEvent.click([...dialog().querySelectorAll('summary')].find(item => item.textContent === 'Weitere Optionen'));
  await tick();
  await click('Alle fehlenden generieren (9)');
  check(calls.filter(call => call.path.endsWith('challenge_generate.php')).length === 9, 'Batch did not use snapshot');
  check(dialog().textContent.includes('8 Challenges erstellt, 1 fehlgeschlagen'), 'Partial success missing');
  check(button('Alle fehlenden generieren (1)') && !button('Alle fehlenden generieren (1)').disabled, 'Batch retry includes successful slots');
  partial = false;
  await click('Alle fehlenden generieren (1)');
  check(calls.filter(call => call.path.endsWith('challenge_generate.php')).length === 10, 'Batch retried successful requests');
  await mount('no-location');
  check(!calls.some(call => call.payload && call.path.endsWith('challenge_generate.php')), 'Denied location still wrote a challenge');
  check(dialog().textContent.includes('Standortzugriff ist blockiert'), 'Location error missing');
  check(dialog().querySelector('input[value=mittel]').checked, 'Error reset input');
  await mount('guest');
  await click('Anmelden');
  check(Boolean(document.querySelector('input[type=password]')), 'Guest login is inactive');
  check(geoRequests === 0, 'Guest was asked for location');
  await mount('load-error');
  failLoad = false;
  await click('Erneut versuchen');
  check(document.querySelectorAll('[data-solo-challenge]').length === 3, 'Load retry failed');
  await mount('team');
  check(!window.auditMeasure().overflow, 'Team overflows with long names');
  check(document.body.textContent.includes('Einladungen an dich (1)'), 'Incoming invitation missing');
  check(Boolean(document.querySelector('[aria-label="1 offene Einladungen"]')), 'Team invitation badge missing');
  await click('Neue Team-Challenge');
  check(button('Alle drei Plätze belegt').disabled, 'Full team permits another invitation');
  await close();
  await click('Annehmen');
  check(geoRequests === 1, 'Accept did not request location');
  check(button('Als Ziel festlegen'), 'Accepted challenge has no next action');
  await click('Als Ziel festlegen');
  check(Boolean(document.querySelector('a[href="/shop/7?openCheckin=1"]')), 'Final team target has no check-in');
  fireEvent.click([...document.querySelectorAll('summary')].find(item => item.textContent === 'Weitere Aktionen'));
  await tick();
  await click('Team-Challenge abbrechen');
  check(!calls.some(call => call.path.endsWith('team_challenge_cancel.php')), 'Cancellation skipped confirmation');
  await click('Behalten');
  await click('Team-Challenge abbrechen');
  await click('Ja, abbrechen');
  check(calls.filter(call => call.path.endsWith('team_challenge_cancel.php')).length === 1, 'Cancellation wrote wrong number of requests');
  for (const kind of ['team-completed', 'team-expired', 'team-cancelled', 'team-legacy']) {
    await mount(kind);
    check(Boolean(document.querySelector('[data-team-detail]')), 'Historical/legacy detail disappeared: ' + kind);
    check(!window.auditMeasure().overflow, 'Historical detail overflows: ' + kind);
  }
  await mount('team-progress');
  check(document.body.textContent.includes('Für den nächsten gemeinsamen Check-in bleiben'), 'Shared countdown missing');
  await mount('team-retry');
  check(document.body.textContent.includes('außerhalb des gemeinsamen Zeitfensters'), 'Retry explanation missing');
  await mount('team-create');
  const input = document.getElementById('team-user-search');
  fireEvent.change(input, {
    target: {
      value: 'error'
    }
  });
  await delay(400);
  check(dialog().textContent.includes('Test-Suchfehler'), 'Search error hidden');
  fireEvent.change(input, {
    target: {
      value: 'none'
    }
  });
  await delay(400);
  check(dialog().textContent.includes('Keine passenden Nutzer'), 'Search empty state missing');
  fireEvent.change(input, {
    target: {
      value: 'li'
    }
  });
  await delay(400);
  fireEvent.keyDown(input, {
    key: 'ArrowDown'
  });
  await tick();
  fireEvent.keyDown(input, {
    key: 'Enter'
  });
  await tick();
  check(Boolean(dialog().querySelector('[aria-label$=entfernen]')), 'Keyboard selection failed');
  await click('Einladung senden');
  check(calls.some(call => call.path.endsWith('team_challenge_invite.php')), 'Team creation failed');
  await mount('team');
  slow = true;
  const selectors = [...document.querySelectorAll('button[aria-pressed]')].filter(item => item.textContent.includes(person.username));
  fireEvent.click(selectors[1]);
  await delay(20);
  fireEvent.click(selectors[0]);
  await delay(20);
  fireEvent.click(selectors[1]);
  await delay(750);
  check(document.querySelector('[data-team-detail]')?.getAttribute('data-team-detail') === '22', 'Stale team response overwrote selection');
  await mount('solo');
  soloDb[0].completed = 1;
  soloDb[0].completed_at = '2026-10-07 12:00:00';
  window.dispatchEvent(new Event('focus'));
  await tick();
  check(document.querySelectorAll('[data-challenge-page] [data-solo-challenge]').length === 2, 'Returning from check-in did not refresh challenges');
  check(geoRequests === 0, 'Returning to page requested location automatically');
  await mount('solo');
  await click('Morgen (3)');
  clock = Date.parse('2026-10-08T00:00:01+02:00');
  for (const callback of minuteTimers.values()) callback();
  await tick();
  check(button('Morgen (0)').getAttribute('aria-pressed') === 'true', 'Midnight changed the chosen view');
  await click('Aktiv (4)');
  check(document.querySelectorAll('[data-challenge-page] [data-solo-challenge]').length === 4, 'Midnight did not activate tomorrow and expire today');
  await mount('empty');
  slowSolo = true;
  window.dispatchEvent(new Event('focus'));
  await delay(10);
  await click('Neue Challenge');
  await click('Challenge erstellen');
  await delay(700);
  check(document.querySelectorAll('[data-challenge-page] [data-solo-challenge]').length === 1, 'Stale list response erased the newly created challenge');
  await mount('solo');
  const report = {
    ...baseline,
    passed
  };
  document.getElementById('results').textContent = JSON.stringify(report);
  document.getElementById('results').dataset.status = 'passed';
})().catch(error => {
  document.getElementById('results').textContent = error.stack;
  document.getElementById('results').dataset.status = 'failed';
});
