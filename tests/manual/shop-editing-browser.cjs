// Runs the real form and Leaflet map in Chrome, with all API calls mocked.
// Usage: node tests/manual/shop-editing-browser.cjs
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const { buildSync } = require('esbuild');

const root = path.resolve(__dirname, '../..');
const output = path.join(root, 'build/shop-editing-browser');
fs.mkdirSync(output, { recursive: true });
buildSync({
  stdin: { resolveDir: root, sourcefile: 'shop-editing-browser.jsx', loader: 'jsx', contents: `
    import React from 'react';
    import { createRoot } from 'react-dom/client';
    import { fireEvent, getByRole, waitFor } from '@testing-library/dom';
    import SubmitIceShopModal from './src/SubmitIceShopModal';

    const root = createRoot(document.getElementById('app'));
    const results = [];
    const check = (condition, message) => { if (!condition) throw new Error(message); results.push(message); };
    const tick = () => new Promise(resolve => setTimeout(resolve, 40));
    const button = name => getByRole(document.body, 'button', { name, exact: true });
    const input = name => document.getElementById('shop-' + name);
    const coordinates = () => [input('latitude').value, input('longitude').value].join(',');
    const checkbox = () => getByRole(document.body, 'checkbox');
    let key = 0;
    let submissions = [];
    let geocodeCount = 0;
    let resolveGeocode;
    let refreshCount = 0;
    let storedPlace = null;
    let ignorePlaceTypeUpdate = false;
    let responseStatus = 'success';
    window.fetch = (url, options = {}) => {
      if (url.includes('nominatim')) {
        geocodeCount++;
        return new Promise((resolve, reject) => {
          resolveGeocode = data => resolve({ ok: true, json: async () => data });
          options.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
        });
      }
      if (url.includes('get_eisdiele.php')) {
        return Promise.resolve({ ok: true, json: async () => ({ eisdiele: storedPlace }) });
      }
      const body = JSON.parse(options.body);
      submissions.push({ url, body });
      if (!ignorePlaceTypeUpdate && responseStatus === 'success') storedPlace = { ...storedPlace, ...body };
      return Promise.resolve({ ok: true, json: async () => ({ status: responseStatus }) });
    };
    const mount = async props => {
      storedPlace = props.existingIceShop || null;
      root.render(<SubmitIceShopModal key={++key} showForm={true} setShowForm={() => {}}
        userId={42} autoCloseAfterSuccess={false} refreshShops={() => refreshCount++} {...props} />);
      await waitFor(() => { if (!document.querySelector('.leaflet-container')) throw new Error('Waiting for map'); });
      await tick();
    };
    const mapClick = async () => {
      const map = document.querySelector('.leaflet-container');
      const rect = map.getBoundingClientRect();
      fireEvent.click(map, { clientX: rect.left + rect.width / 2 + 70, clientY: rect.top + rect.height / 2 - 45 });
      await tick();
    };
    const click = async name => { fireEvent.click(button(name)); await tick(); };
    const shop = deadline => ({ id: 5, user_id: 42, name: 'Test-Eisdiele', adresse: 'Teststraße 1',
      latitude: '50.830000', longitude: '12.920000', status: 'open', place_type: 'ice_shop',
      erstellt_am: '2026-10-05 12:00:00', owner_edit_until: new Date(deadline).toISOString() });

    (async () => {
      await mount({ initialLatitude: 50.83, initialLongitude: 12.92, initialName: 'Test-Eisdiele', initialAddress: 'Teststraße 1' });
      check(button('Einreichen').disabled, 'New positions need confirmation before submission');
      const original = coordinates();
      await mapClick();
      check(coordinates() === original, 'Ordinary map clicks leave the position unchanged');
      check(!document.querySelector('.leaflet-marker-draggable'), 'The marker starts locked');
      await click('Position ändern');
      check(Boolean(document.querySelector('.leaflet-marker-draggable')), 'Deliberate editing enables marker dragging');
      await mapClick();
      check(coordinates() !== original, 'Map clicks can move the marker during editing');
      check(button('Einreichen').disabled, 'Submission stays disabled during position editing');
      await click('Abbrechen');
      check(coordinates() === original, 'Cancel restores both original coordinates');
      await click('Position ändern');
      await mapClick();
      await click('Position übernehmen');
      check(!button('Einreichen').disabled && checkbox().checked, 'Accepting the position confirms it');
      const accepted = coordinates();
      await mapClick();
      check(coordinates() === accepted && !document.querySelector('.leaflet-marker-draggable'), 'Accepted positions are locked again');
      fireEvent.input(input('latitude'), { target: { value: '51.2' } });
      await tick();
      check(!checkbox().checked && button('Einreichen').disabled, 'Manual coordinate changes invalidate confirmation');
      const address = document.querySelectorAll('input[type=text]')[1];
      fireEvent.blur(address);
      await tick();
      check(geocodeCount === 0, 'Leaving the address field never triggers an automatic relocation');
      await click('Position aus Adresse bestimmen');
      check(button('Einreichen').disabled && input('latitude').disabled, 'An address lookup blocks conflicting edits and submission');
      resolveGeocode([{ lat: '51.100000', lon: '13.200000' }]);
      await waitFor(() => { if (input('latitude').value !== '51.100000') throw new Error('Waiting for lookup'); });
      check(!checkbox().checked, 'An address lookup requires a fresh visual confirmation');
      fireEvent.click(checkbox());
      await tick();
      await click('Einreichen');
      check(submissions.length === 1 && submissions[0].body.latitude === 51.1 && submissions[0].body.longitude === 13.2,
        'The submitted coordinates match the confirmed position');
      check(refreshCount === 1, 'Successful submission refreshes shops');

      await mount({ existingIceShop: shop(Date.now() + 3600000) });
      check(!input('latitude').disabled && Boolean(button('Position ändern')), 'Recent creators can correct their shop');
      check(!button('Aktualisieren').disabled, 'Unchanged existing positions need no extra confirmation');

      await mount({ existingIceShop: shop(Date.now() - 1000), userId: 1 });
      fireEvent.change(document.getElementById('shop-place-type'), { target: { value: 'restaurant' } });
      await tick();
      await click('Aktualisieren');
      check(storedPlace.place_type === 'restaurant', 'An administrator can convert an older ice shop to a restaurant');
      check(document.body.textContent.includes('Restaurant/Café erfolgreich aktualisiert'), 'The form verifies and confirms the stored restaurant type');

      await mount({ existingIceShop: shop(Date.now() - 1000), userId: 1 });
      ignorePlaceTypeUpdate = true;
      fireEvent.change(document.getElementById('shop-place-type'), { target: { value: 'restaurant' } });
      await tick();
      const refreshesBeforeIgnoredChange = refreshCount;
      await click('Aktualisieren');
      check(document.body.textContent.includes('Der neue Ortstyp wurde vom Server nicht übernommen'), 'An older backend cannot silently report an ignored type change as success');
      check(Boolean(document.querySelector('form')) && refreshCount === refreshesBeforeIgnoredChange, 'An ignored type change keeps the editable form and prevents a false success refresh');
      ignorePlaceTypeUpdate = false;

      await mount({ existingIceShop: shop(Date.now() - 1000), userId: 43 });
      responseStatus = 'pending';
      fireEvent.change(document.getElementById('shop-place-type'), { target: { value: 'restaurant' } });
      await tick();
      await click('Vorschlag senden');
      check(submissions.at(-1).body.place_type === 'restaurant', 'Other users can submit a restaurant-type correction for review');
      check(storedPlace.place_type === 'ice_shop', 'Pending corrections do not change the live place type');
      responseStatus = 'success';

      await mount({ existingIceShop: shop(Date.now() + 3600000), userId: 43 });
      check(input('latitude').disabled, 'Other users cannot edit coordinates');
      const otherUserPosition = coordinates();
      await mapClick();
      check(coordinates() === otherUserPosition, 'Other users cannot move the map marker');
      await mount({ existingIceShop: shop(Date.now() - 1000) });
      check(input('latitude').disabled, 'Expired creator permissions lock coordinates');
      await mount({ existingIceShop: shop(Date.now() - 1000), userId: 1 });
      check(!input('latitude').disabled, 'Administrators can correct older shops');
      await mount({ existingIceShop: shop(Date.now() + 600) });
      check(!input('latitude').disabled, 'The creator can edit just before expiry');
      await waitFor(() => { if (!input('latitude').disabled) throw new Error('Waiting for expiry'); }, { timeout: 2000 });
      check(input('longitude').disabled, 'The open form locks itself when the six-hour window expires');

      await mount({ initialName: 'Test-Eisdiele' });
      check(!document.querySelector('.leaflet-marker-icon'), 'A default map center is never shown as a chosen position');
      check(button('Einreichen').disabled, 'Empty coordinates cannot be submitted');
      await click('Position auf Karte setzen');
      await mapClick();
      check(Boolean(document.querySelector('.leaflet-marker-icon')), 'A deliberate first selection creates the marker');
      await click('Position übernehmen');
      check(!button('Einreichen').disabled, 'A confirmed first selection can be submitted');

      document.getElementById('results').dataset.status = 'passed';
      document.getElementById('results').textContent = JSON.stringify({ passed: results.length, checks: results });
    })().catch(error => {
      document.getElementById('results').dataset.status = 'failed';
      document.getElementById('results').textContent = error.stack;
    });
  ` },
  bundle: true,
  outfile: path.join(output, 'test.js'),
  jsx: 'automatic',
  define: { 'import.meta.env': JSON.stringify({ VITE_API_BASE_URL: 'https://test.invalid' }), 'process.env.NODE_ENV': '"production"' },
  loader: { '.png': 'dataurl' },
});
const html = path.join(output, 'index.html');
fs.writeFileSync(html, `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="img-src data:"><link rel="stylesheet" href="test.css"><style>body{margin:0;font-family:Arial,sans-serif}*{box-sizing:border-box}</style></head><body><pre id="results" data-status="running"></pre><div id="app"></div><script src="test.js"></script></body></html>`);
const chrome = process.env.CHROME_BIN || (process.platform === 'win32' ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : 'google-chrome');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'ice-shop-editing-'));
const result = spawnSync(chrome, ['--headless', '--no-first-run', '--disable-background-networking', '--disable-extensions',
  '--disable-gpu', `--user-data-dir=${profile}`, '--window-size=390,1000', '--virtual-time-budget=8000', '--dump-dom', pathToFileURL(html).href],
  { timeout: 30000, encoding: 'utf8', maxBuffer: 2 * 1024 * 1024 });
const match = result.stdout?.match(/<pre id="results" data-status="(.*?)">(.*?)<\/pre>/s);
if (result.error || !match || match[1] !== 'passed') {
  throw new Error(result.error?.message || (match ? match[2] : result.stderr));
}
console.log(match[2]);
