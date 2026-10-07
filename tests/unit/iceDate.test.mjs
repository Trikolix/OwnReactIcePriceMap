import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultStart, groupDates, readDraft, reservationCounts, toApiDate } from '../../src/utils/iceDate.mjs';

test('reservations include the organizer, invitations and maybe; declined guests release seats', () => {
  const date = { participants: [{ role: 'organizer', status: 'declined' }, { role: 'participant', status: 'invited' }, { role: 'participant', status: 'maybe' }, { role: 'participant', status: 'declined' }] };
  assert.deepEqual(reservationCounts(date), { capacity: 8, reserved: 3, free: 5 });
  assert.deepEqual(reservationCounts({ ...date, reserved_count: 8, free_places: 0 }), { capacity: 8, reserved: 8, free: 0 });
});
test('upcoming dates are chronological; ongoing dates stay reachable throughout the check-in window', () => {
  const now = new Date('2026-10-07T12:00:00').getTime();
  const dates = [{ id: 1, starts_at: '2026-10-09 18:00:00', status: 'planned' }, { id: 2, starts_at: '2026-10-07 11:00:00', status: 'planned' }, { id: 3, starts_at: '2026-10-08 18:00:00', status: 'cancelled' }, { id: 4, starts_at: '2026-10-05 18:00:00', status: 'planned' }, { id: 5, starts_at: '2026-10-07 10:00:00', status: 'completed' }];
  assert.deepEqual(groupDates(dates, now).upcoming.map(date => date.id), [2, 1]);
  assert.deepEqual(groupDates(dates, now).past.map(date => date.id), [3, 5, 4]);
});
test('login drafts survive reload and tolerate invalid storage', () => {
  const storage = { getItem: () => JSON.stringify({ shopId: 2, startsAt: '2026-10-09T18:00', title: 'Feierabendeis', note: 'Treffpunkt', selectedUsers: [{ id: 5, username: 'Clara' }, { id: 5, username: 'Clara' }, { id: null }] }) };
  assert.deepEqual(readDraft(storage), { shopId: '2', startsAt: '2026-10-09T18:00', title: 'Feierabendeis', note: 'Treffpunkt', selectedUsers: [{ id: 5, username: 'Clara' }] });
  assert.equal(readDraft({ getItem: () => '{' }), null);
  assert.equal(readDraft({ getItem: () => { throw new Error('Unavailable'); } }), null);
});
test('local calendar dates and API values preserve the intended wall time', () => {
  assert.equal(defaultStart(new Date(2026, 9, 30, 23)), '2026-11-01T18:00');
  assert.equal(toApiDate('2026-11-01T18:00'), '2026-11-01 18:00:00');
});
