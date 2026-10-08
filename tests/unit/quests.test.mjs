import assert from 'node:assert/strict';
import { test } from 'node:test';
import { clampQuestPosition, currentQuestChapter, isQuestProgressMutation, questMilestones, questProgressMessage } from '../../src/features/quests/progress.mjs';

const quest = { chapters: [
  { id: 'intro', title: 'Start', reward: 20, awarded: false, tasks: [{ id: 'visit', title: 'Ein Ort', complete: true }] },
  { id: 'tour', title: 'Tour', reward: 40, awarded: false, tasks: [{ id: 'visit', title: 'Zwei Orte', complete: false }] },
] };
test('current chapter advances after its award and remains available after the quest is complete', () => {
  assert.equal(currentQuestChapter(quest).id, 'intro');
  const next = structuredClone(quest); next.chapters[0].awarded = true;
  assert.equal(currentQuestChapter(next).id, 'tour'); next.chapters[1].awarded = true;
  assert.equal(currentQuestChapter(next).id, 'tour'); assert.equal(currentQuestChapter(null), null);
});
test('quest milestones distinguish tasks in different chapters and prioritize chapter completion', () => {
  const next = structuredClone(quest); next.chapters[0].awarded = true; next.chapters[1].tasks[0].complete = true;
  const milestones = questMilestones(next);
  assert.equal(new Set(milestones.map(item => item.id)).size, 3);
  assert.equal(questProgressMessage(milestones), 'Start abgeschlossen · +20 EP');
  assert.equal(questProgressMessage([milestones[0]]), 'Ein Ort erledigt!');
  assert.equal(questProgressMessage([milestones[0], milestones[2]]), '2 weitere Aufgaben erledigt!');
});
test('drag positions stay visible after malformed storage, edge dragging and viewport changes', () => {
  assert.deepEqual(clampQuestPosition({ x: 9999, y: -9999 }, { width: 320, height: 740 }), { x: 244, y: 12 });
  assert.deepEqual(clampQuestPosition({ x: NaN, y: Infinity }, { width: 390, height: 844 }), { x: 314, y: 658 });
  assert.deepEqual(clampQuestPosition({ x: 1100, y: 800 }, { width: 320, height: 440 }), { x: 244, y: 364 });
});
test('only activity writes trigger a quest refresh, without a feedback loop from onboarding requests', () => {
  for (const file of ['add_checkin.php', 'add_bewertung.php', 'eisdiele_submit.php', 'likes.php', 'submit_route.php', 'api/update_user_profile.php']) {
    assert.equal(isQuestProgressMutation('https://api.invalid/' + file, 'POST'), true);
    assert.equal(isQuestProgressMutation('https://api.invalid/' + file), false);
  }
  for (const file of ['api/onboarding.php', 'api/claim_onboarding_award.php', 'api/push/events.php', 'api/update_user_notification_settings.php'])
    assert.equal(isQuestProgressMutation('https://api.invalid/' + file, 'POST'), false);
});
