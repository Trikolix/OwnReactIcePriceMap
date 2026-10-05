export const SHOP_OWNER_EDIT_WINDOW_MS = 6 * 60 * 60 * 1000;

export const getShopEditAccess = (shop, userId, now = Date.now()) => {
  const isAdmin = Number(userId) === 1;
  const isOwner = Number(userId) > 0 && Number(shop?.user_id) === Number(userId);
  // The API supplies an explicit timezone. Older responses use a local SQL date.
  const createdAt = shop?.erstellt_am
    ? new Date(String(shop.erstellt_am).replace(' ', 'T')).getTime()
    : NaN;
  const ownerEditUntil = shop?.owner_edit_until !== undefined
    ? shop.owner_edit_until ? new Date(shop.owner_edit_until).getTime() : NaN
    : createdAt + SHOP_OWNER_EDIT_WINDOW_MS;
  const isRecentOwner = isOwner && Number.isFinite(ownerEditUntil)
    && now >= ownerEditUntil - SHOP_OWNER_EDIT_WINDOW_MS && now <= ownerEditUntil;
  return { isAdmin, isOwner, isRecentOwner, ownerEditUntil, canEditDirectly: isAdmin || isRecentOwner };
};

export const isValidShopPosition = (latitude, longitude) => {
  const validCoordinate = (value, limit) => (typeof value === 'number' || typeof value === 'string')
    && String(value).trim() !== '' && Number.isFinite(Number(value))
    && Math.abs(Number(value)) <= limit;
  return validCoordinate(latitude, 90) && validCoordinate(longitude, 180);
};
