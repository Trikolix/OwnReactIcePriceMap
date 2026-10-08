// Real UI and browser keyboard input; every API response is isolated and mocked.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), http = require('node:http');
const { spawn } = require('node:child_process'), { buildSync } = require('esbuild');
const root = path.resolve(__dirname, '../..'), output = path.join(root, 'build/onboarding-browser');
fs.mkdirSync(output, { recursive: true });
buildSync({ entryPoints: [path.join(__dirname, 'fixtures/onboarding-browser.jsx')], bundle: true, outfile: path.join(output, 'test.js'), jsx: 'automatic',
  define: { 'import.meta.env': JSON.stringify({ VITE_API_BASE_URL: 'https://test.invalid', VITE_ASSET_BASE_URL: '/' }), 'process.env.NODE_ENV': '"production"' } });
fs.writeFileSync(path.join(output, 'index.html'), '<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="test.css"></head><body><pre id="results" data-status="running" hidden></pre><div id="app"></div><script src="test.js"></script></body></html>');
const server = http.createServer((request, response) => {
  const name = request.url.split('?')[0], file = path.join(output, name === '/' ? 'index.html' : name);
  if (!file.startsWith(output + path.sep) || !fs.existsSync(file)) { response.writeHead(404).end(); return; }
  response.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html');
  response.end(fs.readFileSync(file));
});
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function connect(url) {
  const socket = new WebSocket(url), pending = new Map(); let sequence = 0;
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  socket.addEventListener('message', event => { const data = JSON.parse(event.data), item = pending.get(data.id); if (!item) return; pending.delete(data.id); clearTimeout(item.timer); data.error ? item.reject(new Error(JSON.stringify(data.error))) : item.resolve(data.result); });
  return { call(method, params = {}) { return new Promise((resolve, reject) => { const id = ++sequence, timer = setTimeout(() => reject(new Error('CDP timeout ' + method)), 15000); pending.set(id, { resolve, reject, timer }); socket.send(JSON.stringify({ id, method, params })); }); }, close: () => socket.close() };
}
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'ice-onboarding-browser-'));
  const browser = spawn(process.env.CHROME_BIN || (process.platform === 'win32' ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : 'google-chrome'), ['--headless','--no-first-run','--disable-background-networking','--disable-extensions','--disable-gpu','--remote-debugging-port=0','--remote-allow-origins=*','--user-data-dir=' + profile,'about:blank']);
  let stderr = '', cdp; browser.stderr.on('data', data => stderr += data);
  try {
    const deadline = Date.now() + 15000;
    while (!stderr.includes('DevTools listening on ') && Date.now() < deadline) await delay(50);
    const endpoint = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/)?.[1]; if (!endpoint) throw new Error(stderr);
    const pages = await (await fetch('http://' + new URL(endpoint).host + '/json/list')).json();
    cdp = await connect(pages.find(page => page.type === 'page').webSocketDebuggerUrl);
    await cdp.call('Page.enable');
    const evaluate = async expression => { const data = await cdp.call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (data.exceptionDetails) throw new Error(JSON.stringify(data.exceptionDetails)); return data.result.value; };
    const navigate = async (width, height, preview = false, persist = false) => {
      await cdp.call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 768 });
      await cdp.call('Emulation.setTouchEmulationEnabled', { enabled: width < 768 });
      const query = '?run=' + Date.now() + (preview ? '&preview=1' : '') + (persist ? '&persist=1' : '');
      await cdp.call('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/${query}` });
      const deadline = Date.now() + 20000;
      while (Date.now() < deadline) {
        const result = await evaluate('({query:location.search,status:document.getElementById("results")?.dataset.status,text:document.getElementById("results")?.textContent})');
        if (result.query === query && ['passed', 'failed', 'preview'].includes(result.status)) {
          if (result.status === 'failed') throw new Error(width + ': ' + result.text);
          return result;
        }
        await delay(100);
      }
      throw new Error('Fixture timed out at ' + width);
    };
    const until = async (expression, message) => {
      const deadline = Date.now() + 6000;
      while (Date.now() < deadline) { if (await evaluate(expression)) return; await delay(50); }
      throw new Error(message + ' ' + JSON.stringify(await evaluate('({ button:document.querySelector("[data-testid=floating-quest]")?.outerHTML, dialog:document.querySelector("[role=dialog]")?.textContent, viewport:[innerWidth,innerHeight,visualViewport?.width,visualViewport?.height] })')));
    };
    const key = async (value, modifiers = 0) => {
      const codes = { Tab: 9, Escape: 27, Enter: 13, Home: 36, ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40 };
      for (const type of ['keyDown','keyUp']) await cdp.call('Input.dispatchKeyEvent', { type, key: value, code: value, modifiers, windowsVirtualKeyCode: codes[value], ...(value === 'Enter' && type === 'keyDown' ? { text: '\r' } : {}) });
      await delay(80);
    };
    const floatingRect = () => evaluate('(() => { const r = document.querySelector("[data-testid=floating-quest]").getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height}; })()');
    const drag = async (from, to, touch) => {
      if (touch) {
        await cdp.call('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: from.x, y: from.y }] });
        await cdp.call('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: to.x, y: to.y }] });
        await cdp.call('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      } else {
        await cdp.call('Input.dispatchMouseEvent', { type: 'mouseMoved', x: from.x, y: from.y });
        await cdp.call('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', buttons: 1, clickCount: 1, x: from.x, y: from.y });
        await delay(50);
        await cdp.call('Input.dispatchMouseEvent', { type: 'mouseMoved', button: 'left', buttons: 1, x: to.x, y: to.y });
        await delay(50);
        await cdp.call('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', buttons: 0, clickCount: 1, x: to.x, y: to.y });
      }
      await delay(100);
    };
    for (const [width, height] of [[320,740],[390,844],[768,900],[1280,900]]) {
      const selectedWidth = process.argv.find(argument => argument.startsWith('--width='))?.split('=')[1];
      if (selectedWidth && width !== Number(selectedWidth)) continue;
      const floatingChecks = [];
      const verify = async (expression, message) => { await until(expression, width + ': ' + message); floatingChecks.push(message); };
      const report = JSON.parse((await navigate(width,height)).text);
      console.log(JSON.stringify({ viewport: width, passed: report.passed }));
      fs.writeFileSync(path.join(output, `report-${width}.json`), JSON.stringify(report, null, 2));
      await navigate(width,height,true);
      await navigate(width,height,true,true);
      await verify('!document.querySelector("[data-testid=floating-quest]") && localStorage.getItem("iceapp:quest-pinned:42:onboarding") === "0"', 'Explicitly unpinning survives reloading and overrides the default');
      await evaluate('window.prepareInviteKeyboard()');
      await key('Enter');
      if (!await evaluate('Boolean(document.querySelector("[role=dialog]"))')) throw new Error('Invitation does not open via keyboard');
      for (let i=0; i<10; i++) { await key('Tab'); if (!await evaluate('Boolean(document.activeElement.closest("[role=dialog]"))')) throw new Error('Dialog focus escaped'); }
      if (await evaluate('window.onboardingMeasure().dialogOverflow')) throw new Error('Dialog overflows');
      const screenshot = await cdp.call('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(output, `invite-${width}.png`), Buffer.from(screenshot.data, 'base64'));
      await key('Escape');
      if (!await evaluate('!document.querySelector("[role=dialog]") && document.activeElement.textContent === "Einladen"')) throw new Error('Escape does not restore invitation focus');
      const page = await cdp.call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
      fs.writeFileSync(path.join(output, `checklist-${width}.png`), Buffer.from(page.data, 'base64'));
      console.log(JSON.stringify({ viewport: width, keyboard: 'passed' }));
      await evaluate('window.pinQuest()');
      await verify(`Boolean(document.querySelector('[data-testid=floating-quest]')) && !document.querySelector('[aria-label="Dein Ice-App Einstieg"]')`, 'Pinning replaces the inline checklist with the global button');
      const initial = await floatingRect();
      await drag({x: initial.x + 32, y: initial.y + 32}, {x: 55, y: 240}, width < 768);
      await verify('!document.querySelector("[role=dialog]") && Math.abs(document.querySelector("[data-testid=floating-quest]").getBoundingClientRect().x - 23) < 2', 'Dragging with native mouse/touch moves without opening the chapter');
      const beforeCancel = await evaluate('localStorage.getItem("iceapp:quest-position:42:onboarding")');
      if (width < 768) {
        await cdp.call('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 55, y: 240 }] });
        await cdp.call('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 85, y: 270 }] });
        await cdp.call('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
      } else {
        await cdp.call('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', buttons: 1, clickCount: 1, x: 55, y: 240 });
        await cdp.call('Input.dispatchMouseEvent', { type: 'mouseMoved', button: 'left', buttons: 1, x: 85, y: 270 });
        await evaluate('window.dispatchEvent(new Event("blur"))');
        await cdp.call('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', buttons: 0, clickCount: 1, x: 85, y: 270 });
      }
      await verify('!document.querySelector("[role=dialog]") && Math.abs(document.querySelector("[data-testid=floating-quest]").getBoundingClientRect().x - 23) < 2', 'Cancelling a drag restores its starting position without opening');
      if (await evaluate('localStorage.getItem("iceapp:quest-position:42:onboarding")') !== beforeCancel) throw new Error('Cancelled drag changed saved position');
      await evaluate('document.querySelector("[data-testid=floating-quest]").focus()');
      await key('ArrowRight', 8);
      await verify('Math.abs(document.querySelector("[data-testid=floating-quest]").getBoundingClientRect().x - 63) < 2', 'Shift plus arrow moves the button by 40 pixels');
      await key('Enter');
      await verify('document.querySelector("[role=dialog] [aria-pressed=true]")?.textContent === "Startklar"', 'Keyboard activation opens the current chapter');
      for (let i = 0; i < 12; i++) { await key('Tab'); if (!await evaluate('Boolean(document.activeElement.closest("[role=dialog]"))')) throw new Error('Chapter dialog focus escaped'); }
      await key('Escape');
      await verify('!document.querySelector("[role=dialog]") && document.activeElement.dataset.testid === "floating-quest"', 'Escape restores focus to the floating button');
      await evaluate('window.questNavigate("/another-page")');
      await verify('document.body.textContent.includes("Andere Seite") && Boolean(document.querySelector("[data-testid=floating-quest]"))', 'The pinned quest remains available after navigation');
      const saved = await evaluate('localStorage.getItem("iceapp:quest-position:42:onboarding")');
      await navigate(width,height,true,true);
      await verify('Boolean(document.querySelector("[data-testid=floating-quest]"))', 'Pinning survives reloading');
      const restored = await floatingRect(), expected = JSON.parse(saved);
      if (Math.abs(restored.x - expected.x) > 1 || Math.abs(restored.y - expected.y) > 1) throw new Error('Position did not survive reloading');
      floatingChecks.push('The saved button position survives reloading');
      await drag({x: restored.x + 32, y: restored.y + 32}, {x: restored.x + 32, y: restored.y + 32}, width < 768);
      await verify('Boolean(document.querySelector("[role=dialog]"))', 'A native mouse click or touch tap opens the chapter without dragging');
      await key('Escape');
      await verify('!document.querySelector("[data-testid=quest-progress-notice]")', 'Loading existing progress does not show a notification');
      await evaluate('window.questCompleteTask("avatar")');
      await verify('document.querySelector("[data-testid=quest-progress-notice]")?.textContent.includes("Profilbild erledigt!") && document.querySelector("[data-testid=floating-quest]").getAttribute("aria-label").includes("1 von 6 Aufgaben, neuer Fortschritt")', 'A successful activity mutation refreshes progress and announces the completed task');
      const notice = await cdp.call('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(output, `floating-${width}.png`), Buffer.from(notice.data, 'base64'));
      await evaluate(`document.querySelector('[aria-label="Fortschrittshinweis schließen"]').click(); window.questCompleteTask("avatar")`);
      await delay(300);
      await verify('!document.querySelector("[data-testid=quest-progress-notice]")', 'Refreshing an already completed task does not repeat its notification');
      await evaluate('window.questFinishChapter()');
      await verify('document.querySelector("[data-testid=quest-progress-notice]")?.textContent.includes("Startklar abgeschlossen · +50 EP") && document.querySelector("[data-testid=floating-quest]").getAttribute("aria-label").includes("Ice-App Experte, 0 von 6")', 'The chapter award advances the button to the next chapter and announces the reward');
      await evaluate('document.querySelector("[data-testid=floating-quest]").focus()');
      await key('Enter');
      await verify('document.querySelector("[role=dialog] [aria-pressed=true]")?.textContent === "Ice-App Experte" && !document.querySelector("[data-testid=floating-quest]").getAttribute("aria-label").includes("neuer Fortschritt")', 'Opening after progress selects the new chapter and clears the unread marker');
      if (await evaluate('window.onboardingMeasure().dialogOverflow || window.onboardingMeasure().overflow')) throw new Error('Floating quest or chapter overflows');
      const chapter = await cdp.call('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(output, `chapter-${width}.png`), Buffer.from(chapter.data, 'base64'));
      await evaluate('[...document.querySelectorAll("button")].find(button => button.textContent.includes("Vom Bildschirmrand lösen")).click()');
      await verify(`!document.querySelector('[role=dialog]') && !document.querySelector('[data-testid=floating-quest]') && Boolean(document.querySelector('[aria-label="Dein Ice-App Einstieg"]'))`, 'Unpinning closes the chapter and restores the inline checklist');
      await evaluate('window.pinQuest(); fetch("https://test.invalid/api/update_user_notification_settings.php", {method:"POST",body:JSON.stringify({show_onboarding_checklist:0})}).then(() => window.dispatchEvent(new CustomEvent("onboarding:visibility", {detail:false})))');
      await verify('!document.querySelector("[data-testid=floating-quest]") && !document.querySelector("[data-testid=quest-progress-notice]")', 'Hiding onboarding also removes the pinned button and its notification');
      await evaluate('fetch("https://test.invalid/api/update_user_notification_settings.php", {method:"POST",body:JSON.stringify({show_onboarding_checklist:1})}).then(() => window.dispatchEvent(new CustomEvent("onboarding:visibility", {detail:true})))');
      await verify('Boolean(document.querySelector("[data-testid=floating-quest]"))', 'Showing onboarding restores the saved pin');
      await evaluate('window.questSwitchAccount("43")');
      await verify('localStorage.getItem("iceapp:quest-progress:43:onboarding") === "[]" && localStorage.getItem("iceapp:quest-pinned:43:onboarding") === null && document.querySelector("[data-testid=floating-quest]")?.getAttribute("aria-label").includes("Startklar, 0 von 6 Aufgaben") && !document.querySelector("[data-testid=quest-progress-notice]")', 'Another account uses the default pin and its own progress');
      await evaluate(`document.querySelector('[aria-label="Ice-App Einstieg loslösen"]').click()`);
      await evaluate('window.questSwitchAccount("42")');
      await verify('document.querySelector("[data-testid=floating-quest]")?.getAttribute("aria-label").includes("Ice-App Experte") && !document.querySelector("[data-testid=quest-progress-notice]")', 'Returning to the original account restores its pin without repeating known progress');
      fs.writeFileSync(path.join(output, `floating-report-${width}.json`), JSON.stringify({ passed: floatingChecks.length, checks: floatingChecks }, null, 2));
      console.log(JSON.stringify({ viewport: width, floating: floatingChecks.length, input: width < 768 ? 'touch' : 'mouse' }));
    }
  } finally { cdp?.close(); browser.kill(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
