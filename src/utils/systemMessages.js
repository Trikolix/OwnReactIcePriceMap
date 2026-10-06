export const SYSTEM_MESSAGE_MAX = { title: 160, message: 16000, email_subject: 180, email_heading: 180, email_body: 100000, link_label: 100, link_url: 255 };

export function safeSystemLink(value = '') {
  const link = String(value).trim();
  if (!link || /[\s\\\x00-\x1f]/.test(link) || link.startsWith('//')) return '';
  if (link.startsWith('/')) return link;
  try {
    const url = new URL(link);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? link : '';
  } catch { return ''; }
}

export function validateSystemMessage(form) {
  const errors = {};
  if (!form.title.trim()) errors.title = 'Titel ist erforderlich.';
  if (!form.message.trim()) errors.message = 'App-Nachricht ist erforderlich.';
  if (form.mail_send_mode !== 'none' && !form.email_body.trim()) errors.email_body = 'Mailtext ist erforderlich.';
  for (const [field, max] of Object.entries(SYSTEM_MESSAGE_MAX)) {
    if ([...form[field]].length > max) errors[field] = `Höchstens ${max} Zeichen erlaubt.`;
  }
  if (form.link_url && !safeSystemLink(form.link_url)) errors.link_url = 'Gültiger interner Link oder http(s)-Adresse erforderlich.';
  if (form.email_buttons.some(button => (button.label || button.url) && (!button.label.trim() || !safeSystemLink(button.url)))) {
    errors.email_buttons = 'Buttonbeschriftung und gültiger Link erforderlich.';
  }
  return errors;
}

export async function systemMessageRequest(action, body, signal) {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/systemmeldung.php?action=${action}`, body === undefined ? { signal } : {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal,
  });
  const data = await response.json();
  if (!response.ok || data.status !== 'success') {
    const error = new Error(data.message || 'Aktion konnte nicht abgeschlossen werden.');
    error.status = response.status;
    error.fields = data.fields;
    error.counts = data.counts;
    throw error;
  }
  return data;
}

export function notifyNotificationsChanged() {
  window.dispatchEvent(new Event('ice-notifications-changed'));
}
