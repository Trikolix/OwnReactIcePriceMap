import { buildScheduleItems } from '../../src/pages/Event/eventParticipantInfoConfig.js';

describe('buildScheduleItems', () => {
    it('returns Genussrunde schedule correctly with no start time', () => {
        const items = buildScheduleItems(null, "family_2");
        expect(items[0].time).toBe('ab 07:00 Uhr');
        expect(items[1].time).toBe('11:00 - 12:30 Uhr');
    });
});
