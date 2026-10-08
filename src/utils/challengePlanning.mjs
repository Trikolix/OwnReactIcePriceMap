export const DIFFICULTIES = {
  leicht: {
    label: 'Leicht',
    range: '0–5 km',
    color: '#258448'
  },
  mittel: {
    label: 'Mittel',
    range: '5–15 km',
    color: '#a76608'
  },
  schwer: {
    label: 'Schwer',
    range: '15–45 km',
    color: '#bf4538'
  },
  individuell: {
    label: 'Individuell',
    range: 'Frei wählbar',
    color: '#4465b0'
  }
};
export const TEAM_ACTIVE_STATUSES = ['pending_acceptance', 'accepted', 'proposal_open', 'proposal_submitted', 'shop_finalized'];
export const TEAM_STATUS_LABELS = {
  pending_acceptance: 'Einladung offen',
  accepted: 'Ziele werden vorbereitet',
  proposal_open: 'Ziel auswählen',
  proposal_submitted: 'Vorschläge gesendet',
  shop_finalized: 'Bereit zum Einchecken',
  completed: 'Abgeschlossen',
  expired: 'Abgelaufen',
  cancelled: 'Abgesagt',
  failed_no_shops: 'Keine passenden Eisdielen'
};
export const typeLabel = type => type === 'weekly' ? 'Wöchentlich' : 'Täglich';
export function teamChallengeState(challenge, now = Date.now()) {
  if (!TEAM_ACTIVE_STATUSES.includes(challenge.status)) return challenge.status;
  const deadline = challenge.status === 'shop_finalized' ? challenge.valid_until : challenge.proposal_deadline || challenge.valid_until;
  const timestamp = parseChallengeDate(deadline)?.getTime();
  return timestamp != null && timestamp < now ? 'expired' : challenge.status;
}

// PHP DATETIME values describe Berlin wall time, even when the browser is abroad.
export function parseChallengeDate(value) {
  if (value == null || value === '') return null;
  if (value instanceof Date || typeof value === 'number') {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date : null;
  }
  if (/Z$|[+-]\d\d:\d\d$/.test(value)) {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date : null;
  }
  const wall = Date.parse(String(value).replace(' ', 'T') + 'Z');
  if (!Number.isFinite(wall)) return null;
  let result = wall;
  const seen = new Set();
  for (let i = 0; i < 3; i++) {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Berlin',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23'
    }).formatToParts(new Date(result));
    const p = Object.fromEntries(parts.map(item => [item.type, item.value]));
    const represented = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
    if (represented === wall) return new Date(result);
    const next = result + wall - represented;
    if (seen.has(next)) return new Date(Math.max(result, next));
    seen.add(result);
    result = next;
  }
  return new Date(result);
}
export function berlinDay(value = Date.now()) {
  const date = parseChallengeDate(value);
  if (!date) return '';
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const p = Object.fromEntries(parts.map(item => [item.type, item.value]));
  return `${p.year}-${p.month}-${p.day}`;
}
export function tomorrowDay(now = Date.now()) {
  const date = new Date(berlinDay(now) + 'T12:00:00Z');
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}
export const formatChallengeDate = (value, dateOnly = false) => parseChallengeDate(value)?.toLocaleString('de-DE', {
  timeZone: 'Europe/Berlin',
  day: 'numeric',
  month: 'short',
  ...(dateOnly ? {} : {
    hour: '2-digit',
    minute: '2-digit'
  })
}) || 'Termin unbekannt';
export function weeklyDeadline(now = Date.now()) {
  const date = new Date(berlinDay(now) + 'T12:00:00Z');
  date.setUTCDate(date.getUTCDate() + (7 - date.getUTCDay())); // PHP "next sunday", including next week on Sunday.
  return `${date.toISOString().slice(0, 10)} 23:59:59`;
}
export function challengeState(challenge, now = Date.now()) {
  if (challenge.completed === true || Number(challenge.completed) === 1) return 'completed';
  const end = parseChallengeDate(challenge.valid_until)?.getTime();
  if (end == null || end < now) return 'expired';
  const start = parseChallengeDate(challenge.valid_from || challenge.created_at)?.getTime();
  return start != null && start > now ? 'upcoming' : 'active';
}
export function occupiedSlot(challenges, {
  type,
  difficulty,
  forTomorrow = false
}, now = Date.now()) {
  const today = berlinDay(now),
    tomorrow = tomorrowDay(now);
  return challenges.find(challenge => {
    if (challenge.type !== type || challenge.difficulty !== difficulty) return false;
    const end = parseChallengeDate(challenge.valid_until)?.getTime();
    if (end == null || end < now) return false;
    if (type === 'weekly') return true;
    const start = berlinDay(challenge.valid_from || challenge.created_at);
    return start && (forTomorrow ? start === tomorrow : start <= today);
  }) || null;
}
export function missingStandardSlots(challenges, now = Date.now()) {
  const slots = [];
  for (const difficulty of ['leicht', 'mittel', 'schwer']) {
    for (const slot of [{
      type: 'daily',
      forTomorrow: false
    }, {
      type: 'daily',
      forTomorrow: true
    }, {
      type: 'weekly',
      forTomorrow: false
    }]) {
      const combination = {
        ...slot,
        difficulty
      };
      if (!occupiedSlot(challenges, combination, now)) slots.push(combination);
    }
  }
  return slots;
}
export const slotLabel = slot => `${slot.type === 'weekly' ? 'Diese Woche' : slot.forTomorrow ? 'Morgen' : 'Heute'} · ${DIFFICULTIES[slot.difficulty]?.label || slot.difficulty}`;
export function timeRemaining(value, now = Date.now()) {
  const end = parseChallengeDate(value)?.getTime();
  if (end == null) return 'Termin unbekannt';
  const minutes = Math.max(0, Math.ceil((end - now) / 60000));
  if (!minutes) return 'Abgelaufen';
  const days = Math.floor(minutes / 1440),
    hours = Math.floor(minutes % 1440 / 60);
  return days ? `${days} T ${hours} Std.` : hours ? `${hours} Std. ${minutes % 60} Min.` : `${minutes} Min.`;
}
export function completionDuration(challenge) {
  const start = parseChallengeDate(challenge.created_at)?.getTime(),
    end = parseChallengeDate(challenge.completed_at)?.getTime();
  if (start == null || end == null || end < start) return null;
  const hours = Math.round((end - start) / 3600000);
  return hours === 0 ? 'Unter einer Stunde' : hours < 24 ? `${hours} Std.` : `${Math.round(hours / 24)} Tage`;
}
export function sortChallenges(challenges) {
  return [...challenges].sort((a, b) => (parseChallengeDate(a.valid_until)?.getTime() || Infinity) - (parseChallengeDate(b.valid_until)?.getTime() || Infinity) || Object.keys(DIFFICULTIES).indexOf(a.difficulty) - Object.keys(DIFFICULTIES).indexOf(b.difficulty));
}
const numberOrNull = value => value == null || value === '' || !Number.isFinite(Number(value)) ? null : Number(value);
export function normalizeChallenge(raw) {
  const source = raw.challenge && typeof raw.challenge === 'object' ? {
    ...raw,
    ...raw.challenge
  } : raw;
  const shop = source.shop || {},
    id = source.id ?? source.challenge_id;
  return {
    ...source,
    id,
    completed: source.completed === true || Number(source.completed) === 1,
    recreated: source.recreated === true || Number(source.recreated) === 1,
    valid_from: source.valid_from || source.created_at,
    shop_id: source.shop_id ?? shop.id,
    shop_name: source.shop_name ?? shop.name ?? '',
    shop_address: source.shop_address ?? shop.adresse ?? shop.address ?? '',
    shop_lat: numberOrNull(source.shop_lat ?? shop.shop_lat ?? shop.lat ?? shop.latitude),
    shop_lon: numberOrNull(source.shop_lon ?? shop.shop_lon ?? shop.lon ?? shop.longitude),
    openingHours: source.openingHours ?? shop.openingHours ?? '',
    openingHoursStructured: source.openingHoursStructured ?? shop.openingHoursStructured ?? null,
    opening_hours_note: source.opening_hours_note ?? shop.opening_hours_note ?? '',
    is_open_now: source.is_open_now ?? shop.is_open_now ?? null
  };
}
export const upsertChallenge = (list, next) => [...list.filter(item => String(item.id) !== String(next.id)), next];
export function normalizeTeamList(data) {
  if (!data || typeof data !== 'object' || !Array.isArray(data.active_challenges) && !data.active && !Array.isArray(data.history)) throw new Error('Team-Challenges konnten nicht gelesen werden.');
  const items = value => Array.isArray(value) ? value : [];
  const unique = list => [...new Map(list.filter(Boolean).map(item => [String(item.id), item])).values()];
  const active = unique([...items(data.active_challenges), data.active, ...items(data.received_invitations), ...items(data.sent_invitations)]).filter(item => TEAM_ACTIVE_STATUSES.includes(item.status));
  return {
    active,
    received: active.filter(item => item.status === 'pending_acceptance' && item.viewer_role === 'invitee'),
    sent: active.filter(item => item.status === 'pending_acceptance' && item.viewer_role === 'inviter'),
    history: unique(items(data.history))
  };
}
export function teamCheckinProgress(challenge, now = Date.now()) {
  const entries = challenge.checkins || [],
    windowMinutes = Number(challenge.completion_window_minutes) || 90;
  const dated = entries.map(entry => ({
    ...entry,
    timestamp: parseChallengeDate(entry.checkin_date)?.getTime()
  })).filter(entry => entry.timestamp != null);
  // The existing PHP completion check floors the difference to whole minutes.
  const recent = dated.filter(entry => entry.timestamp <= now && Math.floor((now - entry.timestamp) / 60000) <= windowMinutes);
  const first = recent.length ? Math.min(...recent.map(entry => entry.timestamp)) : null;
  return {
    entries,
    recent,
    windowMinutes,
    deadline: first == null ? null : Math.min(first + (windowMinutes + 1) * 60000 - 1, parseChallengeDate(challenge.valid_until)?.getTime() ?? Infinity),
    needsRetry: entries.length > 0 && recent.length < entries.length
  };
}
export async function readChallengeResponse(response) {
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Ungültige Serverantwort (HTTP ${response.status}).`);
  }
  if (!response.ok || data?.status === 'error') throw new Error(data?.message || data?.error || `Anfrage fehlgeschlagen (HTTP ${response.status}).`);
  return data;
}
