// Runs the real form and Leaflet map in Chrome, with all API calls mocked.
// Usage: node tests/manual/shop-editing-browser.cjs --all --screenshots
// Uses exact CDP viewports and mocks API, geocoding and device location.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const { buildSync } = require('esbuild');

const root = path.resolve(__dirname, '../..');
const output = path.join(root, 'build/shop-editing-browser');
fs.mkdirSync(output, { recursive: true });
buildSync({
  stdin: { resolveDir: root, sourcefile: 'shop-editing-browser.jsx', loader: 'jsx', contents: `
    import React from 'react';
    import { createRoot } from 'react-dom/client';
    import { fireEvent, getByRole, getAllByRole, waitFor } from '@testing-library/dom';
    import SubmitIceShopModal from './src/SubmitIceShopModal';
    import GlobalCheckinModal from './src/components/GlobalCheckinModal';

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
    let geocodeUrl = '';
    let resolveGeocode;
    let resolveSubmission;
    let deferSubmission = false;
    let refreshCount = 0;
    let closeCount = 0;
    let callbackResult = null;
    let storedPlace = null;
    let ignorePlaceTypeUpdate = false;
    let responseStatus = 'success';
    let responseExtra = {};
    Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition: () => {}, watchPosition: () => 1, clearWatch: () => {} }, configurable: true });
    window.fetch = (url, options = {}) => {
      if (!options.body && !url.includes('nominatim') && !url.includes('get_eisdiele.php')) {
        return Promise.resolve({ ok: true, json: async () => [] });
      }
      if (url.includes('nominatim')) {
        geocodeCount++;
        geocodeUrl = url;
        return new Promise((resolve, reject) => {
          resolveGeocode = (data, ok = true) => resolve({ ok, json: async () => data });
          options.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
        });
      }
      if (url.includes('get_eisdiele.php')) {
        return Promise.resolve({ ok: true, json: async () => ({ eisdiele: storedPlace }) });
      }
      const body = JSON.parse(options.body);
      submissions.push({ url, body });
      const finish = () => {
        if (!ignorePlaceTypeUpdate && responseStatus === 'success') storedPlace = { ...storedPlace, ...body };
        return { ok: true, json: async () => ({ status: responseStatus, place_id: 99,
          place: { id: 99, ...body }, message: responseStatus === 'error' ? 'Testfehler beim Speichern' : undefined, ...responseExtra }) };
      };
      if (deferSubmission) return new Promise(resolve => { resolveSubmission = () => resolve(finish()); });
      return Promise.resolve(finish());
    };
    const mount = async props => {
      storedPlace = props.existingIceShop || null;
      root.render(<SubmitIceShopModal key={++key} showForm={true} setShowForm={() => closeCount++}
        userId={42} autoCloseAfterSuccess={false} refreshShops={() => refreshCount++}
        onSubmitSuccess={(payload, response) => { callbackResult = { payload, response }; }} {...props} />);
      await tick();
      await waitFor(() => {
        if (!document.querySelector(props.existingIceShop ? '.leaflet-container' : '[data-testid=create-shop-dialog]')) throw new Error('Waiting for form');
      });
      await tick();
    };
    const mapClick = async () => {
      const map = document.querySelector('.leaflet-container');
      const rect = map.getBoundingClientRect();
      fireEvent.click(map, { clientX: rect.left + rect.width / 2 + 45, clientY: rect.top + rect.height / 2 - 30 });
      await tick();
    };
    const click = async name => { fireEvent.click(button(name)); await tick(); };
    const change = async (id, value) => { fireEvent.input(document.getElementById(id), { target: { value } }); await tick(); };
    const choose = async value => { fireEvent.click(document.querySelector('input[name=new-shop-place-type][value=' + value + ']')); await tick(); };
    const layout = () => {
      const panel = document.querySelector('[data-testid=create-shop-dialog]');
      const footer = panel.querySelector('footer');
      const scroll = panel.querySelector('form > div');
      const rect = panel.getBoundingClientRect();
      const foot = footer.getBoundingClientRect();
      check(rect.left >= -1 && rect.right <= innerWidth + 1 && rect.bottom <= innerHeight + 1, 'Dialog fits viewport ' + innerWidth + 'x' + innerHeight);
      check(foot.top >= rect.top && foot.bottom <= innerHeight + 1, 'Footer stays visible at ' + innerWidth + 'x' + innerHeight);
      check(scroll.scrollWidth <= scroll.clientWidth + 1, 'Content has no horizontal overflow');
      scroll.scrollTop = scroll.scrollHeight;
      check(Math.abs(footer.getBoundingClientRect().bottom - foot.bottom) < 1, 'Scrolling content keeps actions in place');
      check(footer.querySelector('button[type=submit]').getBoundingClientRect().height >= 44, 'Primary action meets touch target size');
    };
    const prefills = { initialLatitude: 50.83, initialLongitude: 12.92, initialName: 'Test-Eisdiele', initialAddress: 'Teststraße 1' };
    const shop = deadline => ({ id: 5, user_id: 42, name: 'Test-Eisdiele', adresse: 'Teststraße 1',
      latitude: '50.830000', longitude: '12.920000', status: 'open', place_type: 'ice_shop',
      erstellt_am: '2026-10-05 12:00:00', owner_edit_until: new Date(deadline).toISOString() });

    (async () => {
      const preview = new URL(location.href).searchParams.get('preview');
      if (preview !== null) {
        await mount(prefills);
        if (Number(preview) >= 1) await click('Weiter');
        if (Number(preview) === 3) await click('Position ändern');
        else if (Number(preview) >= 2) await click('Standort bestätigen & weiter');
        document.getElementById('results').dataset.status = 'preview';
        document.getElementById('results').textContent = '';
        return;
      }
      await mount({});
      check(document.querySelector('input[value=ice_shop]').checked, 'Ice shop is the default type');
      check(getByRole(document.body, 'dialog').contains(document.activeElement), 'Initial focus stays inside the accessible dialog: ' + document.activeElement.tagName);
      layout();
      if (window.visualViewport) {
        const height = Math.min(innerHeight, 350);
        Object.defineProperty(window.visualViewport, 'height', { value: height, configurable: true });
        window.visualViewport.dispatchEvent(new Event('resize')); await tick();
        check(document.querySelector('[data-testid=create-shop-dialog] footer').getBoundingClientRect().bottom <= height + 1,
          'Footer follows the visual viewport when the on-screen keyboard reduces available space');
        delete window.visualViewport.height;
        window.visualViewport.dispatchEvent(new Event('resize')); await tick();
      }
      await click('Weiter');
      check(document.body.textContent.includes('Bitte gib dem Eis-Ort einen Namen'), 'Empty names show a field error');
      check(document.activeElement.id === 'new-shop-name', 'Invalid name receives focus');
      await change('new-shop-name', '   ');
      await click('Weiter');
      check(!document.querySelector('.leaflet-container'), 'Whitespace names cannot advance');
      await change('new-shop-name', 'Gelateria');
      await click('Dialog schließen');
      check(Boolean(button('Weiter ausfüllen')) && Boolean(button('Entwurf verwerfen')), 'Closing a started draft asks before discarding');
      await click('Weiter ausfüllen');
      check(document.getElementById('new-shop-name').value === 'Gelateria', 'Continuing keeps the draft');
      await click('Weiter');
      layout();
      check(!document.querySelector('.leaflet-marker-icon'), 'A default map center is never shown as a chosen position');
      check(button('Standort bestätigen & weiter').disabled, 'Empty coordinates cannot advance');
      await click('Position auf Karte setzen');
      await mapClick();
      check(Boolean(document.querySelector('.leaflet-marker-icon')), 'A deliberate first selection creates the marker');
      await click('Standort bestätigen & weiter');
      check(Boolean(button('Eis-Ort eintragen')), 'One location confirmation opens the review step');
      check(submissions.length === 0, 'Navigating through steps never saves prematurely');
      layout();
      await click('Standort ändern');
      const accepted = coordinates();
      await mapClick();
      check(coordinates() === accepted && !document.querySelector('.leaflet-marker-draggable'), 'Confirmed locations remain locked after returning');
      await click('Zurück');
      check(document.getElementById('new-shop-name').value === 'Gelateria', 'Back navigation retains the name');
      await click('Dialog schließen');
      const closesBeforeDiscard = closeCount;
      await click('Entwurf verwerfen');
      check(closeCount === closesBeforeDiscard + 1, 'Explicit discard closes the form');

      await mount(prefills);
      check(Boolean(document.getElementById('new-shop-name')), 'Map prefills still start at step one');
      await click('Weiter');
      const original = coordinates();
      await mapClick();
      check(coordinates() === original, 'Ordinary map clicks leave the position unchanged');
      check(!document.querySelector('.leaflet-marker-draggable'), 'The marker starts locked');
      await click('Position ändern');
      check(Boolean(document.querySelector('.leaflet-marker-draggable')), 'Deliberate editing enables marker dragging');
      await mapClick();
      check(coordinates() !== original, 'Map clicks can move the marker during editing');
      await click('Abbrechen');
      check(coordinates() === original, 'Cancel restores both original coordinates');
      check(!document.querySelector('input[type=checkbox]'), 'New entries use no redundant position checkbox');
      await click('Position ändern');
      await change('shop-latitude', '100');
      check(button('Standort bestätigen & weiter').disabled, 'Out-of-range manual coordinates cannot advance');
      check(button('Bestätigen').disabled, 'Local confirmation rejects out-of-range coordinates');
      await change('shop-latitude', '0');
      await change('shop-longitude', '0');
      check(!button('Standort bestätigen & weiter').disabled, 'Zero coordinates are valid');
      const address = document.getElementById('new-shop-address');
      fireEvent.blur(address);
      await tick();
      check(geocodeCount === 0, 'Leaving the address field never triggers an automatic relocation');
      await click('Adresse auf Karte suchen');
      check(button('Standort bestätigen & weiter').disabled && input('latitude').disabled, 'Address lookups block conflicting edits');
      check(button('Bestätigen').disabled, 'Local confirmation is disabled during an address lookup');
      resolveGeocode([]);
      await tick(); await tick();
      check(document.body.textContent.includes('Adresse konnte nicht gefunden'), 'No geocoding result shows an actionable error');
      check(coordinates() === '0,0', 'Failed lookup keeps the previous position');
      await click('Adresse auf Karte suchen');
      resolveGeocode({}, false);
      await tick(); await tick();
      check(document.body.textContent.includes('Die Position konnte nicht ermittelt'), 'Geocoding HTTP failures keep the form usable');
      fireEvent.keyDown(address, { key: 'Enter', code: 'Enter' }); await tick();
      check(Boolean(document.querySelector('.leaflet-container')) && button('Standort bestätigen & weiter').disabled,
        'Enter in the address field searches instead of confirming the old location');
      resolveGeocode([{ lat: '51.100000', lon: '13.200000' }]);
      await waitFor(() => { if (input('latitude').value !== '51.100000') throw new Error('Waiting for lookup'); });
      check(!document.querySelector('.leaflet-marker-draggable'), 'Lookup results are locked for visual inspection');
      await click('Position ändern');
      await mapClick();
      const localAccepted = coordinates();
      const cancelRect = button('Abbrechen').getBoundingClientRect();
      const confirmRect = button('Bestätigen').getBoundingClientRect();
      check(cancelRect.height >= 44 && cancelRect.width >= 44 && confirmRect.height >= 44 && confirmRect.width >= 44,
        'Both position actions meet touch target sizes');
      check(Math.abs(cancelRect.top - confirmRect.top) < 1 && confirmRect.left >= cancelRect.right,
        'Cancel and confirm stay next to each other');
      check(confirmRect.right <= document.querySelector('[aria-label="Standort auf der Karte"]').getBoundingClientRect().right + 1,
        'Position actions fit within the map column');
      check(button('Adresse aus Position übernehmen').disabled, 'Reverse lookup waits until marker editing is finished');
      const savesBeforeConfirmation = submissions.length;
      await click('Bestätigen');
      check(Boolean(document.querySelector('.leaflet-container')) && coordinates() === localAccepted,
        'Local confirmation keeps step two and the selected coordinates');
      check(!document.querySelector('.leaflet-marker-draggable') && Boolean(button('Position ändern')),
        'Local confirmation locks the marker');
      check(document.activeElement === button('Position ändern'), 'Focus returns to the position control after confirming');
      check(submissions.length === savesBeforeConfirmation, 'Local confirmation never saves the place prematurely');
      await mapClick();
      check(coordinates() === localAccepted, 'Confirmed markers cannot move through ordinary map clicks');
      check(!button('Adresse aus Position übernehmen').disabled, 'Local confirmation enables reverse lookup');
      await click('Adresse aus Position übernehmen');
      const [acceptedLat, acceptedLon] = localAccepted.split(',');
      check(geocodeUrl.includes('lat=' + acceptedLat) && geocodeUrl.includes('lon=' + acceptedLon),
        'Reverse lookup uses the newly confirmed coordinates');
      resolveGeocode({ address: { road: 'Neue Eisstraße', house_number: '3', city: 'Chemnitz', postcode: '09123', country: 'Deutschland' } });
      await waitFor(() => { if (!address.value.includes('Neue Eisstraße 3')) throw new Error('Waiting for reverse lookup'); });
      check(coordinates() === localAccepted && !document.querySelector('.leaflet-marker-draggable'),
        'Reverse lookup updates the address and preserves the locked position');
      await click('Position ändern'); await mapClick();
      check(coordinates() !== localAccepted, 'The confirmed position can be edited again');
      await click('Abbrechen');
      check(coordinates() === localAccepted, 'Cancel restores the most recently confirmed position');
      await click('Position ändern'); await mapClick();
      const selected = coordinates().split(',').map(Number);
      await click('Standort bestätigen & weiter');
      check(!document.querySelector('.leaflet-container'), 'Confirmation locks and leaves the map step');
      responseStatus = 'error';
      await click('Eis-Ort eintragen');
      check(document.body.textContent.includes('Testfehler beim Speichern') && Boolean(button('Eis-Ort eintragen')), 'API failure preserves the review and allows retry');
      responseStatus = 'success';
      deferSubmission = true;
      const saveCount = submissions.length;
      await click('Eis-Ort eintragen');
      check(button('Wird eingetragen…').disabled && button('Dialog schließen').disabled, 'Saving blocks duplicate clicks and closing');
      fireEvent.submit(document.querySelector('form'));
      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
      await tick();
      check(submissions.length === saveCount + 1, 'Repeated submission cannot create a duplicate');
      resolveSubmission(); deferSubmission = false;
      await tick(); await tick();
      check(submissions.at(-1).body.latitude === selected[0] && submissions.at(-1).body.longitude === selected[1], 'Saved coordinates match the confirmed marker');
      check(refreshCount === 1, 'Successful submission refreshes shops');
      check(callbackResult.response.place.id === 99 && callbackResult.payload.name === 'Test-Eisdiele', 'Existing success callback gets the created place for check-in');
      check(document.body.textContent.includes('Dein Eis-Ort ist eingetragen'), 'Successful creation shows a dedicated confirmation');

      const importedHours = { days: [{ weekday: 1, ranges: [{ open: '12:00', close: '18:00' }] }], note: 'Nur bei Sonne' };
      await mount({ ...prefills, initialPlaceType: 'restaurant', initialWebsite: 'https://cafe.example', initialOpeningHoursStructured: importedHours,
        initialExternalSource: { name: 'Café aus Discovery', source: 'osm', external_id: 'node/123' } });
      check(document.querySelector('input[value=restaurant]').checked, 'Entry-point type preselection is retained');
      check(document.body.textContent.includes('Aus der Karten-Discovery übernommen'), 'Discovery prefills are clearly identified');
      await click('Weiter');
      await click('Standort bestätigen & weiter');
      check(document.body.textContent.includes('https://cafe.example') && document.body.textContent.includes('Mo: 12:00-18:00'), 'Prefilled optional data is summarized while collapsed');
      const optional = document.querySelectorAll('details');
      check(optional.length === 2 && [...optional].every(item => !item.open), 'Optional fields start collapsed');
      optional[0].open = true; optional[1].open = true;
      await tick();
      await change('new-shop-website', 'https://new.example');
      await change('opening-hours-note', 'Neue Notiz');
      layout();
      const actions = document.querySelectorAll('details button');
      check([...actions].every(item => item.getBoundingClientRect().height >= 44), 'Opening-hours actions meet touch target sizes');
      await click('Art und Name ändern');
      await click('Weiter');
      await click('Standort bestätigen & weiter');
      check(document.body.textContent.includes('https://new.example') && document.body.textContent.includes('Neue Notiz'), 'Optional edits survive back and forward navigation');
      responseExtra = { level_up: true, new_level: 3, level_name: 'Eisprofi', new_awards: [{ message: 'Test-Auszeichnung', ep: 10 }] };
      await click('Eis-Ort eintragen');
      check(submissions.at(-1).body.place_type === 'restaurant' && submissions.at(-1).body.external_source.external_id === 'node/123', 'Restaurant and Discovery metadata are submitted unchanged');
      check(submissions.at(-1).body.openingHoursStructured.note === 'Neue Notiz', 'Optional opening hours are kept in the API payload');
      check(document.body.textContent.includes('Eisprofi') && document.body.textContent.includes('Test-Auszeichnung'), 'Level-up and awards remain visible after creation');
      responseExtra = {};

      await mount({ ...prefills, initialPlaceType: 'temporary_stand' });
      fireEvent.click(document.querySelector('input[name=new-shop-duration][value=date]'));
      await tick();
      await click('Weiter');
      check(document.body.textContent.includes('Bitte wähle heute oder ein Datum'), 'Temporary stands require a valid end date');
      await change('new-shop-end-date', '2000-01-01');
      await click('Weiter');
      check(!document.querySelector('.leaflet-container'), 'Past temporary dates cannot advance');
      await change('new-shop-end-date', '2099-01-01');
      await click('Weiter');
      await click('Standort bestätigen & weiter');
      check(document.body.textContent.includes('01.01.2099'), 'Review shows the temporary end date');
      await click('Eis-Ort eintragen');
      check(submissions.at(-1).body.active_until === '2099-01-01 23:59:59', 'Temporary stand saves the selected day through midnight');
      for (const duration of ['today', 'tomorrow']) {
        await mount({ ...prefills, initialPlaceType: 'temporary_stand' });
        fireEvent.click(document.querySelector('input[name=new-shop-duration][value=' + duration + ']'));
        await tick(); await click('Weiter'); await click('Standort bestätigen & weiter'); await click('Eis-Ort eintragen');
        const expected = new Date(); if (duration === 'tomorrow') expected.setDate(expected.getDate() + 1);
        const date = expected.getFullYear() + '-' + String(expected.getMonth() + 1).padStart(2, '0') + '-' + String(expected.getDate()).padStart(2, '0');
        check(submissions.at(-1).body.active_until === date + ' 23:59:59', 'Quick duration ' + duration + ' saves the correct local date');
      }

      await mount({ existingIceShop: shop(Date.now() + 3600000) });
      check(!input('latitude').disabled && Boolean(button('Position ändern')), 'Recent creators can correct their shop');
      check(!button('Aktualisieren').disabled, 'Unchanged existing positions need no extra confirmation');
      const editOriginal = coordinates();
      await click('Position ändern'); await mapClick(); await click('Abbrechen');
      check(coordinates() === editOriginal, 'Compact editing keeps position cancel behavior');
      await click('Position ändern'); await mapClick(); await click('Position übernehmen');
      check(!button('Aktualisieren').disabled && checkbox().checked, 'Compact editing keeps its position confirmation');

      await mount({ existingIceShop: shop(Date.now() - 1000), userId: 1 });
      fireEvent.change(document.getElementById('shop-place-type'), { target: { value: 'restaurant' } });
      await tick(); await click('Aktualisieren');
      check(storedPlace.place_type === 'restaurant', 'An administrator can convert an older ice shop to a restaurant');
      check(document.body.textContent.includes('Restaurant/Café erfolgreich aktualisiert'), 'The form verifies and confirms the stored restaurant type');
      await mount({ existingIceShop: shop(Date.now() - 1000), userId: 1 });
      ignorePlaceTypeUpdate = true;
      fireEvent.change(document.getElementById('shop-place-type'), { target: { value: 'restaurant' } });
      await tick();
      const refreshesBeforeIgnoredChange = refreshCount;
      await click('Aktualisieren');
      check(document.body.textContent.includes('Der neue Ortstyp wurde vom Server nicht übernommen'), 'An older backend cannot silently ignore type changes');
      check(Boolean(document.querySelector('form')) && refreshCount === refreshesBeforeIgnoredChange, 'Ignored type changes keep the form without a false refresh');
      ignorePlaceTypeUpdate = false;
      await mount({ existingIceShop: shop(Date.now() - 1000), userId: 43 });
      responseStatus = 'pending';
      fireEvent.change(document.getElementById('shop-place-type'), { target: { value: 'restaurant' } });
      await tick(); await click('Vorschlag senden');
      check(submissions.at(-1).body.place_type === 'restaurant', 'Other users can submit type corrections for review');
      check(storedPlace.place_type === 'ice_shop', 'Pending corrections do not change the live type');
      responseStatus = 'success';
      await mount({ existingIceShop: shop(Date.now() + 3600000), userId: 43 });
      check(input('latitude').disabled, 'Other users cannot edit coordinates');
      const otherPosition = coordinates(); await mapClick();
      check(coordinates() === otherPosition, 'Other users cannot move the marker');
      await mount({ existingIceShop: shop(Date.now() - 1000) });
      check(input('latitude').disabled, 'Expired creator permissions lock coordinates');
      await mount({ existingIceShop: shop(Date.now() - 1000), userId: 1 });
      check(!input('latitude').disabled, 'Administrators can correct older shops');
      await mount({ existingIceShop: shop(Date.now() + 600) });
      check(!input('latitude').disabled, 'The creator can edit just before expiry');
      await waitFor(() => { if (!input('latitude').disabled) throw new Error('Waiting for expiry'); }, { timeout: 2000 });
      check(input('longitude').disabled, 'The open form locks when the six-hour window expires');
      await mount(prefills);
      const closesBeforePristine = closeCount;
      await click('Dialog schließen');
      check(closeCount === closesBeforePristine + 1, 'Untouched prefills close without asking to discard');
      await change('new-shop-name', 'Neue Eisdiele');
      fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' }); await tick();
      check(Boolean(button('Weiter ausfüllen')), 'Escape also protects a started draft');
      await click('Weiter ausfüllen');

      root.render(<GlobalCheckinModal key={++key} open onClose={() => closeCount++} userId={42} userPosition={[50.83, 12.92]} refreshShops={() => refreshCount++} />);
      await tick(); await tick();
      fireEvent.click(getByRole(document.body, 'button', { name: /Restaurant.Café mit Eisangebot/ }));
      await tick(); await tick();
      check(document.querySelector('input[value=restaurant]').checked, 'Global check-in passes its restaurant selection into step one');
      await change('new-shop-name', 'Check-in Café');
      await click('Weiter');
      await change('shop-latitude', '50.83'); await change('shop-longitude', '12.92');
      await click('Standort bestätigen & weiter'); await click('Eis-Ort eintragen');
      await waitFor(() => { if (!document.body.textContent.includes('Eis-Checkin für Check-in Café')) throw new Error('Waiting for check-in'); });
      check(!document.querySelector('[data-testid=create-shop-dialog]'), 'Successful creation leads directly into the existing check-in form');
      check(getAllByRole(document.body, 'button', { name: 'Zurück zur Ortsauswahl' }).length > 0, 'The check-in remains connected to the place chooser');

      const ReopenHarness = () => {
        const [open, setOpen] = React.useState(true);
        return <><button id="reopen" onClick={() => setOpen(true)}>Öffnen</button><SubmitIceShopModal showForm={open}
          setShowForm={setOpen} userId={42} {...prefills} /></>;
      };
      root.render(<ReopenHarness key={++key} />); await tick(); await tick();
      await click('Weiter'); await click('Standort bestätigen & weiter'); await click('Eis-Ort eintragen');
      await click('Fertig');
      fireEvent.click(document.getElementById('reopen')); await tick(); await tick();
      check(Boolean(document.getElementById('new-shop-name')), 'Reopening the same modal starts a fresh draft at step one');
      await new Promise(resolve => setTimeout(resolve, 2200));
      check(Boolean(document.querySelector('[data-testid=create-shop-dialog]')), 'A previous auto-close timer cannot dismiss a newly opened draft');

      document.getElementById('results').dataset.status = 'passed';
      document.getElementById('results').textContent = JSON.stringify({ passed: results.length, viewport: [innerWidth, innerHeight], checks: results });
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
// CDP sets exact viewports; Chrome's --window-size clamps widths below 500 px.
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const connect = async url => {
  const socket = new WebSocket(url);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  let sequence = 0;
  const pending = new Map();
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    const handler = pending.get(message.id);
    if (!handler) return;
    pending.delete(message.id);
    clearTimeout(handler.timeout);
    if (message.error) handler.reject(new Error(JSON.stringify(message.error)));
    else handler.resolve(message.result);
  });
  return {
    call(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = ++sequence;
        const timeout = setTimeout(() => { pending.delete(id); reject(new Error('CDP timed out: ' + method)); }, 15000);
        pending.set(id, { resolve, reject, timeout });
        socket.send(JSON.stringify({ id, method, params }));
      });
    },
    close: () => socket.close(),
  };
};
(async () => {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'ice-shop-editing-'));
  const browser = spawn(chrome, ['--headless', '--no-first-run', '--disable-background-networking', '--disable-extensions',
    '--disable-gpu', '--remote-debugging-port=0', '--remote-allow-origins=*', '--user-data-dir=' + profile, 'about:blank']);
  let stderr = '';
  browser.stderr.on('data', data => { stderr += data.toString(); });
  let cdp;
  try {
    const deadline = Date.now() + 15000;
    while (!stderr.includes('DevTools listening on ') && Date.now() < deadline) await delay(50);
    const endpoint = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/)?.[1];
    if (!endpoint) throw new Error('Chrome did not start: ' + stderr);
    const host = new URL(endpoint).host;
    const pages = await (await fetch('http://' + host + '/json/list')).json();
    cdp = await connect(pages.find(page => page.type === 'page').webSocketDebuggerUrl);
    await cdp.call('Page.enable');
    const evaluate = async expression => {
      const result = await cdp.call('Runtime.evaluate', { expression, returnByValue: true });
      if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
      return result.result.value;
    };
    const navigate = async (width, height, preview = null) => {
      await cdp.call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width <= 640 });
      await cdp.call('Emulation.setTouchEmulationEnabled', { enabled: width <= 640 });
      const query = '?run=' + Date.now() + (preview === null ? '' : '&preview=' + preview);
      await cdp.call('Page.navigate', { url: pathToFileURL(html).href + query });
      const deadline = Date.now() + 30000;
      while (Date.now() < deadline) {
        const state = await evaluate('JSON.stringify({query:location.search,status:document.getElementById("results")?.dataset.status,text:document.getElementById("results")?.textContent})');
        const value = JSON.parse(state);
        if (value.query === query && ['passed', 'failed', 'preview'].includes(value.status)) {
          if (value.status === 'failed') throw new Error(width + 'x' + height + ': ' + value.text);
          return value;
        }
        await delay(100);
      }
      throw new Error('Browser test timed out at ' + width + 'x' + height);
    };
    const viewports = process.argv.includes('--all') ? [[360, 780], [390, 844], [768, 900], [1280, 900], [390, 440]] : [[390, 844]];
    for (const [width, height] of viewports) {
      const result = JSON.parse((await navigate(width, height)).text);
      if (result.viewport[0] !== width || result.viewport[1] !== height) throw new Error('Viewport mismatch: ' + JSON.stringify(result.viewport));
      fs.writeFileSync(path.join(output, 'report-' + width + 'x' + height + '.json'), JSON.stringify(result, null, 2));
      console.log(JSON.stringify({ passed: result.passed, viewport: result.viewport }));
    }
    await navigate(1280, 900, 0);
    const keyPress = async (key, code, keyCode, modifiers = 0) => {
      // Enter needs its character event to activate a native button in Chrome.
      const text = key === 'Enter' ? { text: String.fromCharCode(13), unmodifiedText: String.fromCharCode(13) } : {};
      await cdp.call('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: keyCode, modifiers, ...text });
      await cdp.call('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: keyCode, modifiers });
      await delay(80);
    };
    await evaluate('document.querySelector("input[name=new-shop-place-type][value=ice_shop]").focus()');
    await keyPress('ArrowRight', 'ArrowRight', 39);
    if (!await evaluate('document.querySelector("input[value=restaurant]").checked')) throw new Error('Arrow keys must select place-type cards');
    await evaluate('document.querySelector("header button").focus()');
    await keyPress('Tab', 'Tab', 9, 8);
    if (!await evaluate('document.activeElement === document.querySelector("footer button[type=submit]")')) throw new Error('Shift+Tab must wrap to the final action');
    await keyPress('Tab', 'Tab', 9);
    if (!await evaluate('document.activeElement.getAttribute("aria-label") === "Dialog schließen"')) throw new Error('Tab must stay inside the dialog');
    await keyPress('Escape', 'Escape', 27);
    if (!await evaluate('document.body.textContent.includes("Entwurf verwerfen")')) throw new Error('Escape must protect the draft');
    await evaluate('Array.from(document.querySelectorAll("button")).find(button => button.textContent === "Weiter ausfüllen").click()');
    await delay(100);
    if (!await evaluate('document.querySelector("input[value=restaurant]").checked')) throw new Error('Continuing must retain the keyboard selection');
    console.log(JSON.stringify({ passed: 5, checks: 'Native keyboard navigation, focus trap and discard protection' }));
    await navigate(1280, 900, 3);
    await evaluate('Array.from(document.querySelectorAll("button")).find(button => button.textContent === "Bestätigen").focus()');
    await keyPress('Enter', 'Enter', 13);
    if (!await evaluate('Boolean(document.querySelector(".leaflet-container")) && !document.querySelector(".leaflet-marker-draggable")')) {
      const state = await evaluate('JSON.stringify({map:Boolean(document.querySelector(".leaflet-container")),editing:Boolean(document.querySelector(".leaflet-marker-draggable")),active:document.activeElement.outerHTML})');
      throw new Error('Keyboard confirmation must lock the position and stay in step two: ' + state);
    }
    if (!await evaluate('document.activeElement.textContent === "Position ändern"')) throw new Error('Keyboard confirmation must restore focus');
    if (!await evaluate('!Array.from(document.querySelectorAll("button")).find(button => button.textContent === "Adresse aus Position übernehmen").disabled')) throw new Error('Keyboard confirmation must enable reverse lookup');
    console.log(JSON.stringify({ passed: 3, checks: 'Native keyboard position confirmation and reverse lookup availability' }));
    if (process.argv.includes('--screenshots')) {
      for (const [width, height] of [[390, 844], [1280, 900]]) {
        for (let step = 0; step < 4; step++) {
          await navigate(width, height, step);
          const screenshot = await cdp.call('Page.captureScreenshot', { format: 'png' });
          const name = step === 3 ? 'position-edit-' + width + '.png' : 'step-' + (step + 1) + '-' + width + '.png';
          fs.writeFileSync(path.join(output, name), Buffer.from(screenshot.data, 'base64'));
          console.log('Screenshot: build/shop-editing-browser/' + name);
        }
      }
    }
  } finally {
    cdp?.close();
    browser.kill();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
