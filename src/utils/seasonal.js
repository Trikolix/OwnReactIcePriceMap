export const isSpecialTime = () => {
    const today = new Date();
    const host = typeof window !== 'undefined' ? window.location.hostname : '';
    const isLocalHost = host === 'localhost' || host === '127.0.0.1' || host === '::1';
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-11
    const currentDay = today.getDate();

    // Christmas time: December 1st to January 6th
    if ((currentMonth === 11 && currentDay >= 1) || (currentMonth === 0 && currentDay <= 6)) {
      return 'christmas';
    }

    const easterDates = {
        2026: { start: new Date('2026-04-03T00:00:00+02:00'), endExclusive: new Date('2026-04-13T00:00:00+02:00') },
        2027: { start: new Date('2027-03-26T00:00:00+01:00'), endExclusive: new Date('2027-04-05T00:00:00+02:00') },
        2028: { start: new Date('2028-04-14T00:00:00+02:00'), endExclusive: new Date('2028-04-24T00:00:00+02:00') },
        2029: { start: new Date('2029-03-29T00:00:00+01:00'), endExclusive: new Date('2029-04-09T00:00:00+02:00') },
    };

    if (easterDates[currentYear]) {
        const { start, endExclusive } = easterDates[currentYear];
        if (today >= start && today < endExclusive) {
            return 'easter';
        }
    }

    // Olympic Winter Games time: February 6th to February 22nd, 2026
    if (currentYear === 2026) {
        const olympicsStart = new Date('2026-02-06T00:00:00+01:00');
        const olympicsEndExclusive = new Date('2026-02-23T00:00:00+01:00');
        if (today >= olympicsStart && today < olympicsEndExclusive) {
            return 'olympics';
        }

        const birthdayStart = new Date('2026-03-06T00:00:00+01:00');
        const birthdayEndExclusive = new Date('2026-03-23T00:00:00+01:00');
        if (today >= birthdayStart && today < birthdayEndExclusive) {
            return 'birthday';
        }
    }

    return null;
};
