const PLACE_TYPES = ['ice_shop', 'restaurant', 'temporary_stand'];

export const matchesPlaceTypeFilters = (shop, filters) => Boolean(filters[shop.place_type || 'ice_shop']);

export const getPlaceTypeFilterQuery = (filters) => `place_types=${encodeURIComponent(
  PLACE_TYPES.filter(type => filters[type]).join(',')
)}`;
