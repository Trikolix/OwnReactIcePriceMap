const API_BASE = import.meta.env.VITE_API_BASE_URL;

export async function onboardingRequest(path = 'onboarding.php', payload, signal) {
  const response = await fetch(`${API_BASE}/api/${path}`, {
    method: payload ? 'POST' : 'GET',
    headers: payload ? { 'Content-Type': 'application/json' } : {},
    ...(payload ? { body: JSON.stringify(payload) } : {}), signal,
  });
  const json = await response.json();
  if (!response.ok || !json.success) throw new Error(json.message || 'Dein Fortschritt konnte nicht gespeichert werden.');
  return json;
}

export async function recordOnboardingAction(action) {
  const result = await onboardingRequest('onboarding.php', { action });
  window.dispatchEvent(new CustomEvent('onboarding:changed', { detail: result.data }));
  return result;
}

export async function setOnboardingVisible(visible) {
  const response = await fetch(`${API_BASE}/api/update_user_notification_settings.php`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ show_onboarding_checklist: visible ? 1 : 0 }),
  });
  const json = await response.json();
  if (!response.ok || !json.success) throw new Error(json.error || 'Die Einstellung konnte nicht gespeichert werden.');
  window.dispatchEvent(new CustomEvent('onboarding:visibility', { detail: visible }));
}
