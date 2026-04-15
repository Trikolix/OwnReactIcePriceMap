const EXTERNAL_DISCOVERY_ALLOWED_USER_IDS = [1];

export const canUseExternalDiscovery = (userId) => {
  const numericUserId = Number(userId);
  return Number.isInteger(numericUserId) && EXTERNAL_DISCOVERY_ALLOWED_USER_IDS.includes(numericUserId);
};

export const externalDiscoveryAllowedUserIds = EXTERNAL_DISCOVERY_ALLOWED_USER_IDS;
