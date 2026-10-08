import { test } from 'node:test';
import assert from 'node:assert/strict';
import { berlinDay, challengeState, missingStandardSlots, normalizeChallenge, normalizeTeamList, occupiedSlot, parseChallengeDate, sortChallenges, teamChallengeState, teamCheckinProgress, tomorrowDay, weeklyDeadline } from '../../src/utils/challengePlanning.mjs';
const now = Date.parse('2026-10-07T10:00:00Z');
const daily = (extra = {}) => ({
  id: 1,
  type: 'daily',
  difficulty: 'leicht',
  valid_from: '2026-10-07 00:00:00',
  valid_until: '2026-10-07 23:59:59',
  completed: false,
  ...extra
});
test('Berlin wall time and explicit offsets remain independent of the host timezone', () => {
  for (const [input, expected] of [['2026-07-01 12:00:00', '2026-07-01T10:00:00.000Z'], ['2026-12-01 12:00:00', '2026-12-01T11:00:00.000Z'], ['2026-03-29 02:30:00', '2026-03-29T01:30:00.000Z'], ['2026-10-25 02:30:00', '2026-10-25T01:30:00.000Z'], ['2026-10-07T12:00:00+02:00', '2026-10-07T10:00:00.000Z']]) assert.equal(parseChallengeDate(input).toISOString(), expected);
  assert.equal(berlinDay('2026-10-07T22:30:00Z'), '2026-10-08');
  assert.equal(tomorrowDay(Date.parse('2026-10-24T22:30:00Z')), '2026-10-26');
  assert.equal(parseChallengeDate('invalid'), null);
});
test('active tasks start at the actual timestamp and expire without a page reload', () => {
  assert.equal(challengeState(daily(), now), 'active');
  assert.equal(challengeState(daily({
    valid_from: '2026-10-07 13:00:00'
  }), now), 'upcoming');
  assert.equal(challengeState(daily({
    valid_from: '2026-10-08 00:00:00',
    valid_until: '2026-10-08 23:59:59'
  }), now), 'upcoming');
  assert.equal(challengeState(daily({
    valid_until: '2026-10-07 11:59:59'
  }), now), 'expired');
  assert.equal(challengeState(daily({
    completed: '1'
  }), now), 'completed');
});
test('completed tasks occupy their day, but never block tomorrow or later days', () => {
  const record = daily({
    completed: true
  });
  assert.equal(occupiedSlot([record], {
    type: 'daily',
    difficulty: 'leicht'
  }, now), record);
  assert.equal(occupiedSlot([record], {
    type: 'daily',
    difficulty: 'leicht',
    forTomorrow: true
  }, now), null);
  assert.equal(occupiedSlot([record], {
    type: 'daily',
    difficulty: 'leicht'
  }, Date.parse('2026-10-08T10:00:00Z')), null);
});
test('legacy evening carryovers occupy today, and a tomorrow slot is separate', () => {
  const carry = daily({
      valid_from: null,
      created_at: '2026-10-06 19:00:00'
    }),
    tomorrow = daily({
      id: 2,
      valid_from: '2026-10-08 00:00:00',
      valid_until: '2026-10-08 23:59:59'
    });
  assert.equal(occupiedSlot([carry, tomorrow], {
    type: 'daily',
    difficulty: 'leicht'
  }, now), carry);
  assert.equal(occupiedSlot([carry, tomorrow], {
    type: 'daily',
    difficulty: 'leicht',
    forTomorrow: true
  }, now), tomorrow);
});
test('the batch contains exactly nine standard slots and excludes all occupied slots', () => {
  assert.equal(missingStandardSlots([], now).length, 9);
  const records = [daily({
    completed: true
  }), daily({
    id: 2,
    type: 'weekly',
    difficulty: 'mittel',
    completed: true,
    valid_until: '2026-10-11 23:59:59'
  })];
  const slots = missingStandardSlots(records, now);
  assert.equal(slots.length, 7);
  assert.ok(!slots.some(slot => slot.type === 'daily' && slot.difficulty === 'leicht' && !slot.forTomorrow));
  assert.ok(!slots.some(slot => slot.type === 'weekly' && slot.difficulty === 'mittel'));
  assert.ok(!slots.some(slot => slot.difficulty === 'individuell'));
});
test('weekly deadline follows PHP next Sunday, including Sunday and DST', () => {
  assert.equal(weeklyDeadline(now), '2026-10-11 23:59:59');
  assert.equal(weeklyDeadline(Date.parse('2026-10-11T12:00:00Z')), '2026-10-18 23:59:59');
  assert.equal(weeklyDeadline(Date.parse('2026-10-24T23:00:00Z')), '2026-11-01 23:59:59');
});
test('soonest-expiring tasks lead; difficulty resolves equal deadlines', () => {
  assert.deepEqual(sortChallenges([daily({
    id: 3,
    type: 'weekly',
    valid_until: '2026-10-11 23:59:59'
  }), daily({
    id: 2,
    difficulty: 'schwer'
  }), daily()]).map(item => item.id), [1, 2, 3]);
});
test('API strings and nested generation responses retain existing fields', () => {
  const record = normalizeChallenge({
    status: 'success',
    challenge_id: 5,
    shop: {
      id: 7,
      name: 'Shop',
      latitude: '50.8',
      longitude: '12.9'
    },
    challenge: {
      id: 5,
      completed: '0',
      recreated: '1',
      valid_from: '2026-10-08 00:00:00',
      custom_min_distance_m: 15000,
      custom_max_distance_m: 45000
    }
  });
  assert.equal(record.id, 5);
  assert.equal(record.shop_id, 7);
  assert.equal(record.shop_lat, 50.8);
  assert.equal(record.completed, false);
  assert.equal(record.recreated, true);
  assert.equal(record.custom_min_distance_m, 15000);
});
test('team invitations are derived from active tasks, deduplicated, and include legacy states', () => {
  const received = {
      id: 1,
      status: 'pending_acceptance',
      viewer_role: 'invitee'
    },
    sent = {
      id: 2,
      status: 'pending_acceptance',
      viewer_role: 'inviter'
    },
    legacy = {
      id: 3,
      status: 'proposal_submitted'
    };
  const result = normalizeTeamList({
    active: received,
    active_challenges: [received, sent, legacy],
    received_invitations: [received],
    sent_invitations: [sent],
    history: [{
      id: 4,
      status: 'completed'
    }]
  });
  assert.equal(result.active.length, 3);
  assert.deepEqual(result.received, [received]);
  assert.deepEqual(result.sent, [sent]);
  assert.equal(result.history.length, 1);
});
test('team expiry follows proposal deadline before target selection and final deadline afterwards', () => {
  const record = {
    status: 'proposal_open',
    proposal_deadline: '2026-10-07 11:59:59',
    valid_until: '2026-10-11 23:59:59'
  };
  assert.equal(teamChallengeState(record, now), 'expired');
  assert.equal(teamChallengeState({
    ...record,
    status: 'shop_finalized'
  }, now), 'shop_finalized');
  assert.equal(teamChallengeState({
    ...record,
    status: 'completed'
  }, now), 'completed');
});
test('team progress identifies expired check-ins and honors the challenge end', () => {
  const record = {
    completion_window_minutes: 60,
    valid_until: '2026-10-07 12:30:00',
    checkins: [{
      user_id: 1,
      checkin_date: '2026-10-07 11:30:00'
    }]
  };
  const progress = teamCheckinProgress(record, now);
  assert.equal(progress.recent.length, 1);
  assert.equal(progress.deadline, Date.parse('2026-10-07T10:30:00Z'));
  assert.equal(progress.needsRetry, false);
  const expired = teamCheckinProgress({
    ...record,
    checkins: [{
      user_id: 1,
      checkin_date: '2026-10-07 10:00:00'
    }, {
      user_id: 2,
      checkin_date: '2026-10-07 11:50:00'
    }]
  }, now);
  assert.equal(expired.recent.length, 1);
  assert.equal(expired.needsRetry, true);
  assert.equal(teamCheckinProgress({
    ...record,
    checkins: []
  }, now).deadline, null);
  assert.equal(teamCheckinProgress({
    ...record,
    checkins: [{
      user_id: 1,
      checkin_date: '2026-10-07 10:59:01'
    }]
  }, now).recent.length, 1);
  assert.equal(teamCheckinProgress({
    ...record,
    checkins: [{
      user_id: 1,
      checkin_date: '2026-10-07 10:59:00'
    }]
  }, now).recent.length, 0);
});
