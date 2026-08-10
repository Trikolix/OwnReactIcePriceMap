export const trackEvent = (category, action, name = undefined, value = undefined) => {
  if (typeof window === 'undefined' || !Array.isArray(window._paq)) return;
  const event = ['trackEvent', category, action];
  if (name !== undefined) event.push(name);
  if (value !== undefined) event.push(value);
  window._paq.push(event);
};
