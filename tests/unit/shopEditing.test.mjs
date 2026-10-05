import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync(new URL('../../src/utils/shopEditing.js', import.meta.url), 'utf8');
const { getShopEditAccess, isValidShopPosition } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const filterSource = readFileSync(new URL('../../src/utils/placeTypeFilters.js', import.meta.url), 'utf8');
const { getPlaceTypeFilterQuery, matchesPlaceTypeFilters } = await import(`data:text/javascript;base64,${Buffer.from(filterSource).toString('base64')}`);
const createdAt = Date.parse('2026-10-05T12:00:00+02:00');
const deadline = createdAt + 6 * 60 * 60 * 1000;
const shop = { user_id: 42, erstellt_am: '2026-10-05 12:00:00', owner_edit_until: '2026-10-05T18:00:00+02:00' };

test('only the creator can edit during the six-hour window; administrators can always edit', () => {
  assert.equal(getShopEditAccess(shop, '42', createdAt).canEditDirectly, true);
  assert.equal(getShopEditAccess(shop, 42, deadline).canEditDirectly, true);
  assert.equal(getShopEditAccess(shop, 42, deadline + 1).canEditDirectly, false);
  assert.equal(getShopEditAccess(shop, 43, createdAt).canEditDirectly, false);
  assert.equal(getShopEditAccess(shop, 1, deadline + 1).canEditDirectly, true);
  assert.equal(getShopEditAccess(shop, null, createdAt).canEditDirectly, false);
  assert.equal(getShopEditAccess(shop, 42, createdAt - 1).canEditDirectly, false);
});

test('the API deadline is timezone-aware and invalid dates cannot grant edit access', () => {
  assert.equal(getShopEditAccess(shop, 42, createdAt).ownerEditUntil, deadline);
  assert.equal(getShopEditAccess({ user_id: 42, erstellt_am: 'invalid' }, 42, createdAt).canEditDirectly, false);
  assert.equal(getShopEditAccess({ user_id: 42 }, 42, createdAt).canEditDirectly, false);
  assert.equal(getShopEditAccess({ ...shop, owner_edit_until: null }, 42, createdAt).canEditDirectly, false);
  const legacyShop = { user_id: 42, erstellt_am: '2026-10-05 12:00:00' };
  const localCreatedAt = new Date('2026-10-05T12:00:00').getTime();
  assert.equal(getShopEditAccess(legacyShop, 42, localCreatedAt).canEditDirectly, true);
  assert.equal(getShopEditAccess(legacyShop, 42, localCreatedAt + 6 * 60 * 60 * 1000 + 1).canEditDirectly, false);
});

test('coordinates accept the equator and prime meridian, but reject empty or invalid positions', () => {
  for (const [lat, lon] of [[0, 0], ['0', '0'], [-90, -180], [90, 180], ['50.83', '12.92']]) {
    assert.equal(isValidShopPosition(lat, lon), true);
  }
  for (const [lat, lon] of [[null, 0], [undefined, 0], ['', 0], [' ', 0], ['invalid', 0], [true, 0], [[], 0], [91, 0], [0, 181], [Infinity, 0], [0, NaN]]) {
    assert.equal(isValidShopPosition(lat, lon), false);
  }
});

test('the restaurant checkbox controls both map visibility and the server query', () => {
  const filters = { ice_shop: true, restaurant: false, temporary_stand: true };
  assert.equal(matchesPlaceTypeFilters({ place_type: 'restaurant' }, filters), false);
  assert.equal(matchesPlaceTypeFilters({ place_type: 'restaurant', status: 'permanent_closed' }, filters), false);
  assert.equal(matchesPlaceTypeFilters({ place_type: 'ice_shop' }, filters), true);
  assert.equal(matchesPlaceTypeFilters({ place_type: 'temporary_stand' }, filters), true);
  assert.equal(new URLSearchParams(getPlaceTypeFilterQuery(filters)).get('place_types'), 'ice_shop,temporary_stand');
  const restaurantOnly = { ice_shop: false, restaurant: true, temporary_stand: false };
  assert.equal(matchesPlaceTypeFilters({ place_type: 'restaurant' }, restaurantOnly), true);
  assert.equal(matchesPlaceTypeFilters({ place_type: 'ice_shop' }, restaurantOnly), false);
  assert.equal(new URLSearchParams(getPlaceTypeFilterQuery(restaurantOnly)).get('place_types'), 'restaurant');
  assert.equal(getPlaceTypeFilterQuery({}), 'place_types=');
});
