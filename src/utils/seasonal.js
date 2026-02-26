export const isSpecialTime = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-11
    const currentDay = today.getDate();

    // Christmas time: December 1st to January 6th
    if ((currentMonth === 11 && currentDay >= 1) || (currentMonth === 0 && currentDay <= 6)) {
      return 'christmas';
    }

    const easterDates = {
        2026: { start: new Date('2026-04-03'), end: new Date('2026-04-12') },
        2027: { start: new Date('2027-03-26'), end: new Date('2027-04-04') },
        2028: { start: new Date('2028-04-14'), end: new Date('2028-04-23') },
        2029: { start: new Date('2029-03-29'), end: new Date('2029-04-08') },
    };

    if (easterDates[currentYear]) {
        const { start, end } = easterDates[currentYear];
        if (today >= start && today <= end) {
            return 'easter';
        }
    }

    // Olympic Winter Games visibility: active phase plus short post-event results phase
    if (currentYear === 2026) {
        const olympicsStart = new Date('2026-02-06');
        const olympicsEnd = new Date('2026-03-02');
        if (today >= olympicsStart && today <= olympicsEnd) {
            return 'olympics';
        }
    }

    return null;
};
