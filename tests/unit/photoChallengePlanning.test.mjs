import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSync } from 'esbuild';
const bundle = buildSync({ entryPoints: ['src/utils/photoChallengePlanning.js'], bundle: true, write: false, format: 'esm', platform: 'node' }).outputFiles[0].text;
const { suggestPhotoPlan, evaluatePhotoPlan, photoSchedulePreview } = await import('data:text/javascript;base64,' + Buffer.from(bundle).toString('base64'));
const dateBundle = buildSync({ entryPoints: ['src/utils/photoChallengePresentation.js'], bundle: true, write: false, format: 'esm', platform: 'node' }).outputFiles[0].text;
const { photoDateValue } = await import('data:text/javascript;base64,' + Buffer.from(dateBundle).toString('base64'));
const timed = plan => ({ ...plan, startAt: '2026-10-05T12:00', groupSchedule: [] });
test('proposals preserve all images and satisfy the existing group and KO constraints', () => {
  for (let count = 0; count <= 500; count++) {
    const suggestion = suggestPhotoPlan(count);
    if (!suggestion.valid) {
      assert.equal(suggestPhotoPlan(suggestion.upper).valid, true);
      if (suggestion.lower !== null) assert.equal(suggestPhotoPlan(suggestion.lower).valid, true);
      continue;
    }
    assert.equal(suggestion.groupSize * suggestion.plannedGroupCount, count);
    assert.ok(suggestion.plannedGroupCount >= 2);
    assert.deepEqual(evaluatePhotoPlan(count, timed(suggestion)).errors, [], `count ${count}`);
  }
});
test('four-image groups are preferred; tied alternatives use the smaller size', () => {
  assert.equal(suggestPhotoPlan(24).groupSize, 4);
  assert.equal(suggestPhotoPlan(30).groupSize, 3);
  assert.equal(suggestPhotoPlan(14).groupSize, 2);
  assert.deepEqual(suggestPhotoPlan(11), { valid: false, lower: 10, upper: 12 });
});
test('non-power-of-two KO fields stay valid and wrong group counts are rejected', () => {
  assert.deepEqual(evaluatePhotoPlan(30, timed({ groupSize: 3, groupAdvancers: 2, luckyLoserSlots: 0, koBracketSize: 20 })).errors, []);
  assert.ok(evaluatePhotoPlan(11, timed({ groupSize: 4, groupAdvancers: 2, luckyLoserSlots: 2, koBracketSize: '' })).errors.length);
  assert.ok(evaluatePhotoPlan(12, timed({ groupSize: 4, groupAdvancers: 2, luckyLoserSlots: 0, koBracketSize: 8 })).errors.length);
});
test('preview retains configured times and mirrors automatic remaining-group scheduling', () => {
  const slots = photoSchedulePreview({ startAt: '2026-10-05T12:00', groupSchedule: [{ startAt: '2026-10-10T15:30', durationDays: 14, groups: 2 }] }, 4);
  assert.deepEqual(slots[0], { start: '2026-10-10T15:30', end: '2026-10-24 15:30:00' });
  assert.equal(slots[2].start, '2026-10-24 00:00:00');
  assert.equal(slots[3].start, '2026-11-07 00:00:00');
  assert.equal(photoSchedulePreview({ startAt: '2026-10-05T12:00', groupSchedule: [] }, 4)[2].start, '2026-10-12 00:00:00');
});
test('incomplete schedules do not become hidden defaults or crash previews', () => {
  const form = { ...suggestPhotoPlan(12), startAt: '', groupSchedule: [{ startAt: '', groups: 2, durationDays: '' }] };
  assert.ok(evaluatePhotoPlan(12, form).errors.length);
  assert.deepEqual(photoSchedulePreview(form, 3), []);
});
test('deadlines use Berlin time across DST independently of browser timezone', () => {
  assert.equal(photoDateValue('2026-07-01 12:00:00').toISOString(), '2026-07-01T10:00:00.000Z');
  assert.equal(photoDateValue('2026-12-01T12:00').toISOString(), '2026-12-01T11:00:00.000Z');
  assert.equal(photoDateValue('2026-10-25 00:00:00').toISOString(), '2026-10-24T22:00:00.000Z');
  assert.equal(photoDateValue('2026-03-29 02:30:00').toISOString(), '2026-03-29T01:30:00.000Z');
  assert.equal(photoDateValue('2026-10-25 02:30:00').toISOString(), '2026-10-25T01:30:00.000Z');
  assert.equal(photoDateValue('invalid'), null);
  assert.equal(photoDateValue('invalidZ'), null);
});
