export const isSpecialTime = () => {
    const today = new Date();
    const host = typeof window !== 'undefined' ? window.location.hostname : '';
    const isLocalHost = host === 'localhost' || host === '127.0.0.1' || host === '::1';
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-11
    const currentDay = today.getDate();

    // Local development override to test birthday campaign UI before live date.
    if (isLocalHost) {
        return 'birthday';
    }

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

    // Olympic Winter Games time: February 6th to February 22nd, 2026
    if (currentYear === 2026) {
        const olympicsStart = new Date('2026-02-06');
        const olympicsEnd = new Date('2026-02-22');
        if (today >= olympicsStart && today <= olympicsEnd) {
            return 'olympics';
        }

        const birthdayStart = new Date('2026-03-06T00:00:00+01:00');
        const birthdayEnd = new Date('2026-03-22T23:59:59+01:00');
        if (today >= birthdayStart && today <= birthdayEnd) {
            return 'birthday';
        }
    }

    return null;
};
