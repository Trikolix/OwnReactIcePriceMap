import {
  dedupeActivities,
  groupActivities,
  mergeActivities,
} from '../../src/utils/activityFeed';

describe('activity feed stability helpers', () => {
  it('deduplicates activities by type and id while keeping the newest payload', () => {
    const activities = dedupeActivities([
      { typ: 'award', id: 12, data: { likes_count: 1 } },
      { typ: 'award', id: 12, data: { likes_count: 2 } },
      { typ: 'new_user', id: 7, data: { username: 'Mia' } },
    ]);

    expect(activities).toHaveLength(2);
    expect(activities.find((activity) => activity.id === 12).data.likes_count).toBe(2);
  });

  it('merges pages without rendering duplicate raw activities', () => {
    const merged = mergeActivities(
      [{ typ: 'checkin', id: 1, data: { datum: '2026-08-01 12:00:00' } }],
      [
        { typ: 'checkin', id: 1, data: { datum: '2026-08-01 12:00:00', likes_count: 3 } },
        { typ: 'award', id: 2, data: { datum: '2026-07-01 12:00:00' } },
      ],
    );

    expect(merged.map((activity) => `${activity.typ}:${activity.id}`)).toEqual([
      'checkin:1',
      'award:2',
    ]);
  });

  it('does not duplicate grouped check-ins after a repeated page', () => {
    const grouped = groupActivities([
      { typ: 'checkin', id: 1, data: { id: 1, group_id: 4, datum: '2026-08-01 12:00:00' } },
      { typ: 'checkin', id: 1, data: { id: 1, group_id: 4, datum: '2026-08-01 12:00:00' } },
      { typ: 'checkin', id: 2, data: { id: 2, group_id: 4, datum: '2026-08-01 12:01:00' } },
    ]);

    expect(grouped).toHaveLength(1);
    expect(grouped[0].typ).toBe('group_checkin');
    expect(grouped[0].data).toHaveLength(2);
  });
});
