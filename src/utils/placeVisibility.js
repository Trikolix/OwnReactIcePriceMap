export const PLACE_VISIBILITY_REQUEST_EVENT = 'ice-app:place-visibility-request';
export const RESTAURANT_FILTER_REQUEST_KEY = 'ice-app:show-restaurants-on-map';

export const requestRestaurantVisibility = () => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.setItem(RESTAURANT_FILTER_REQUEST_KEY, '1');
  } catch {
    // Der direkte Event funktioniert auch, wenn Session Storage nicht verfügbar ist.
  }

  window.dispatchEvent(new CustomEvent(PLACE_VISIBILITY_REQUEST_EVENT, {
    detail: { placeType: 'restaurant' },
  }));
};
