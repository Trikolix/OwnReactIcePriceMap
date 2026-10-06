import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
const source = readFileSync(new URL('../../src/utils/systemMessages.js', import.meta.url), 'utf8');
const { safeSystemLink, validateSystemMessage, systemMessageRequest } = await import(`data:text/javascript;base64,${Buffer.from(source.replace('import.meta.env.VITE_API_BASE_URL', JSON.stringify('https://test.invalid'))).toString('base64')}`);
test('unsafe links never become app actions', () => {
  for (const url of ['javascript:alert(1)', '//evil.invalid', '/\\evil.invalid', 'https://user:pass@example.invalid', 'data:text/html,hello', '/map\nunsafe']) assert.equal(safeSystemLink(url), '');
  assert.equal(safeSystemLink('/map'), '/map');
  assert.equal(safeSystemLink('https://example.invalid/path'), 'https://example.invalid/path');
});
test('publication requires content only for enabled channels', () => {
  const form = { title: 'News', message: 'Hello', link_url: '', link_label: '', email_subject: '', email_heading: '', email_body: '', email_buttons: [], mail_send_mode: 'none' };
  assert.deepEqual(validateSystemMessage(form), {});
  assert.equal(validateSystemMessage({ ...form, mail_send_mode: 'subscribers' }).email_body, 'Mailtext ist erforderlich.');
  assert.ok(validateSystemMessage({ ...form, email_buttons: [{ label: 'Open', url: 'javascript:alert(1)' }] }).email_buttons);
});
test('API failures retain status, recipient changes and field errors', async () => {
  globalThis.fetch = async () => ({ ok: false, status: 409, json: async () => ({ status: 'error', message: 'Changed', counts: { in_app: 4 }, fields: { title: 'Required' } }) });
  await assert.rejects(systemMessageRequest('publish', {}), error => error.status === 409 && error.counts.in_app === 4 && error.fields.title === 'Required');
});
