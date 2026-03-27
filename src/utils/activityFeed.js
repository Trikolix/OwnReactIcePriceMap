const ACTIVITY_FEED_CACHE_VERSION = 'v1';

const getStorage = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
};

const getUserCacheScope = (userId) => (userId ? `user-${userId}` : 'guest');

export const getActivityFeedCacheKey = (userId) => (
  `activity-feed:${ACTIVITY_FEED_CACHE_VERSION}:${getUserCacheScope(userId)}`
);

export const getActivityFeedSeenKey = (userId) => (
  `activity-feed-seen:${ACTIVITY_FEED_CACHE_VERSION}:${getUserCacheScope(userId)}`
);

export const parseActivityDate = (rawValue) => {
  if (!rawValue) return null;
  if (rawValue instanceof Date) return rawValue;

  const value = typeof rawValue === 'string'
    ? (rawValue.includes('T') ? rawValue : rawValue.replace(' ', 'T'))
    : rawValue;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const extractActivityDate = (data) => {
  if (!data) return null;
  return parseActivityDate(data.aktivitaet_am || data.datum || data.erstellt_am || data.created_at || null);
};

const getGroupedItemDate = (item) => {
  if (!item) return null;

  if (item.typ === 'group_checkin') {
    const latestCheckin = item.data?.reduce((latest, current) => {
      const currentDate = extractActivityDate(current);
      if (!currentDate) return latest;
      if (!latest) return current;
      const latestDate = extractActivityDate(latest);
      return (!latestDate || currentDate > latestDate) ? current : latest;
    }, null);

    return extractActivityDate(latestCheckin);
  }

  if (item.typ === 'award_bundle') {
    const lastAward = Array.isArray(item.data) ? item.data[item.data.length - 1] : null;
    return extractActivityDate(lastAward);
  }

  if (item.typ === 'award_wave') {
    const lastAward = Array.isArray(item.data?.recipients) ? item.data.recipients[item.data.recipients.length - 1] : null;
    return extractActivityDate(lastAward);
  }

  return extractActivityDate(item.data);
};

export const groupActivities = (activities) => {
  const grouped = {};
  const singles = [];
  const awards = [];

  activities.forEach((activity) => {
    if (activity.typ === 'checkin' && activity.data.group_id) {
      const groupId = activity.data.group_id;
      if (!grouped[groupId]) {
        grouped[groupId] = [];
      }
      grouped[groupId].push(activity);
      return;
    }

    if (activity.typ === 'award') {
      awards.push(activity);
      return;
    }

    singles.push(activity);
  });

  const awardBundles = [];
  const sortedAwards = awards.slice().sort((a, b) => {
    const dateA = extractActivityDate(a.data);
    const dateB = extractActivityDate(b.data);

    if (!dateA && !dateB) return 0;
    if (!dateA) return -1;
    if (!dateB) return 1;
    return dateA - dateB;
  });

  let bundle = [];
  for (let index = 0; index < sortedAwards.length; index += 1) {
    const current = sortedAwards[index];
    const currentUserId = current.data?.user_id ?? current.data?.nutzer_id;
    const currentUserName = current.data?.user_name;
    const currentDate = extractActivityDate(current.data);

    if (bundle.length === 0) {
      bundle.push(current);
      continue;
    }

    const last = bundle[bundle.length - 1];
    const lastUserId = last.data?.user_id ?? last.data?.nutzer_id;
    const lastUserName = last.data?.user_name;
    const lastDate = extractActivityDate(last.data);
    const diffMs = (currentDate && lastDate)
      ? Math.abs(currentDate - lastDate)
      : Number.POSITIVE_INFINITY;

    if (currentUserId === lastUserId && currentUserName === lastUserName && diffMs <= 5 * 60 * 1000) {
      bundle.push(current);
      continue;
    }

    if (bundle.length > 1) {
      const bundleDate = extractActivityDate(bundle[bundle.length - 1].data);
      const bundleUserId = lastUserId ?? 'unknown';
      const bundleDateKey = bundleDate ? bundleDate.getTime() : 'unknown';
      awardBundles.push({
        typ: 'award_bundle',
        id: `awardbundle-${bundleUserId}-${bundleDateKey}`,
        data: bundle.map((item) => item.data),
      });
    } else {
      awardBundles.push(bundle[0]);
    }

    bundle = [current];
  }

  if (bundle.length > 1) {
    const lastData = bundle[bundle.length - 1].data;
    const bundleDate = extractActivityDate(lastData);
    const bundleUserId = lastData?.user_id ?? lastData?.nutzer_id ?? 'unknown';
    const bundleDateKey = bundleDate ? bundleDate.getTime() : 'unknown';
    awardBundles.push({
      typ: 'award_bundle',
      id: `awardbundle-${bundleUserId}-${bundleDateKey}`,
      data: bundle.map((item) => item.data),
    });
  } else if (bundle.length === 1) {
    awardBundles.push(bundle[0]);
  }

  const groupedAwardItems = [];
  const standaloneAwardSingles = awardBundles
    .filter((item) => item.typ === 'award')
    .sort((a, b) => {
      const dateA = extractActivityDate(a.data);
      const dateB = extractActivityDate(b.data);
      if (!dateA && !dateB) return 0;
      if (!dateA) return -1;
      if (!dateB) return 1;
      return dateA - dateB;
    });

  let awardWave = [];
  for (let index = 0; index < standaloneAwardSingles.length; index += 1) {
    const current = standaloneAwardSingles[index];
    const currentDate = extractActivityDate(current.data);

    if (awardWave.length === 0) {
      awardWave.push(current);
      continue;
    }

    const last = awardWave[awardWave.length - 1];
    const lastDate = extractActivityDate(last.data);
    const diffMs = (currentDate && lastDate)
      ? Math.abs(currentDate - lastDate)
      : Number.POSITIVE_INFINITY;
    const hasSameAward = current.data?.award_id === last.data?.award_id && current.data?.level === last.data?.level;
    const currentUserId = current.data?.user_id ?? current.data?.nutzer_id;
    const lastUserId = last.data?.user_id ?? last.data?.nutzer_id;

    if (hasSameAward && currentUserId !== lastUserId && diffMs <= 10 * 60 * 1000) {
      awardWave.push(current);
      continue;
    }

    if (awardWave.length > 1) {
      const recipients = awardWave.map((item) => item.data);
      const lastRecipient = recipients[recipients.length - 1];
      groupedAwardItems.push({
        typ: 'award_wave',
        id: `awardwave-${lastRecipient?.award_id ?? 'unknown'}-${lastRecipient?.level ?? 'unknown'}-${extractActivityDate(lastRecipient)?.getTime?.() ?? 'unknown'}`,
        data: {
          award_id: lastRecipient?.award_id,
          level: lastRecipient?.level,
          title_de: lastRecipient?.title_de,
          description_de: lastRecipient?.description_de,
          icon_path: lastRecipient?.icon_path,
          ep: lastRecipient?.ep,
          datum: lastRecipient?.datum,
          recipients,
        },
      });
    } else {
      groupedAwardItems.push(awardWave[0]);
    }

    awardWave = [current];
  }

  if (awardWave.length > 1) {
    const recipients = awardWave.map((item) => item.data);
    const lastRecipient = recipients[recipients.length - 1];
    groupedAwardItems.push({
      typ: 'award_wave',
      id: `awardwave-${lastRecipient?.award_id ?? 'unknown'}-${lastRecipient?.level ?? 'unknown'}-${extractActivityDate(lastRecipient)?.getTime?.() ?? 'unknown'}`,
      data: {
        award_id: lastRecipient?.award_id,
        level: lastRecipient?.level,
        title_de: lastRecipient?.title_de,
        description_de: lastRecipient?.description_de,
        icon_path: lastRecipient?.icon_path,
        ep: lastRecipient?.ep,
        datum: lastRecipient?.datum,
        recipients,
      },
    });
  } else if (awardWave.length === 1) {
    groupedAwardItems.push(awardWave[0]);
  }

  return [
    ...singles,
    ...Object.keys(grouped).flatMap((groupId) => {
      const items = grouped[groupId];
      if (items.length === 1) {
        return items;
      }

      return {
        typ: 'group_checkin',
        id: `group-${groupId}`,
        data: items.map((item) => item.data),
      };
    }),
    ...awardBundles.filter((item) => item.typ === 'award_bundle'),
    ...groupedAwardItems,
  ].sort((a, b) => {
    const dateA = getGroupedItemDate(a);
    const dateB = getGroupedItemDate(b);

    if (!dateB && !dateA) return 0;
    if (!dateB) return -1;
    if (!dateA) return 1;
    return dateB - dateA;
  });
};

export const countActivitiesSince = (activities, since) => {
  const sinceDate = parseActivityDate(since);
  if (!sinceDate) {
    return 0;
  }

  return groupActivities(activities).filter((activity) => {
    const activityDate = getGroupedItemDate(activity);
    return activityDate && activityDate > sinceDate;
  }).length;
};

export const getLatestActivityTimestamp = (activities) => {
  const latestItem = groupActivities(activities)[0];
  const latestDate = getGroupedItemDate(latestItem);
  return latestDate ? latestDate.toISOString() : null;
};

export const readActivityFeedCache = (userId) => {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  try {
    const raw = storage.getItem(getActivityFeedCacheKey(userId));
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.activities)) {
      return null;
    }

    return parsed;
  } catch (error) {
    console.warn('Activity feed cache could not be read:', error);
    return null;
  }
};

export const writeActivityFeedCache = (userId, payload) => {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  try {
    storage.setItem(getActivityFeedCacheKey(userId), JSON.stringify(payload));
  } catch (error) {
    console.warn('Activity feed cache could not be written:', error);
  }
};

export const readActivityFeedSeenAt = (userId) => {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  return storage.getItem(getActivityFeedSeenKey(userId));
};

export const writeActivityFeedSeenAt = (userId, value) => {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.setItem(getActivityFeedSeenKey(userId), value);
};
