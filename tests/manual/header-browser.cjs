// Real header, menu, notifications, map controls and login; every API call is mocked.
// Usage: node tests/manual/header-browser.cjs --all --screenshots
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const { spawn } = require('node:child_process');
const { buildSync } = require('esbuild');
const root = path.resolve(__dirname, '../..');
const systemSuite = process.argv.includes('--systemmeldungen');
const output = path.join(root, systemSuite ? 'build/systemmeldungen-browser' : 'build/header-browser');
fs.mkdirSync(output, { recursive: true });
buildSync({
  entryPoints: [path.join(__dirname, systemSuite ? 'fixtures/systemmeldungen-browser.jsx' : 'fixtures/header-browser.jsx')],
  bundle: true, outfile: path.join(output, 'test.js'), jsx: 'automatic',
  define: { 'import.meta.env': JSON.stringify({ VITE_API_BASE_URL: 'https://test.invalid', VITE_ASSET_BASE_URL: '/' }), 'process.env.NODE_ENV': '"production"' },
  loader: { '.png': 'dataurl', '.jpg': 'dataurl', '.webp': 'dataurl', '.svg': 'dataurl' },
});
fs.writeFileSync(path.join(output, 'index.html'), `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="img-src 'self' data:"><link rel="stylesheet" href="test.css"><style>body{margin:0;color:#2f2100}#results{display:none}.demo-shell{position:fixed;inset:0;display:flex;flex-direction:column}.demo-map{flex:1;background:#e7ecd7}</style></head><body><pre id="results" data-status="running"></pre><div id="app"></div><script src="test.js"></script></body></html>`);
const server = http.createServer((request, response) => {
  const url = new URL(request.url, 'http://localhost');
  const name = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
  const file = name === 'fixture-avatar.png' ? path.join(root, 'src/user_of_the_month.png')
    : name.startsWith('assets/') ? path.join(root, 'public', name) : path.join(output, name);
  if (!file.startsWith(root) || !fs.existsSync(file)) { response.writeHead(404); response.end(); return; }
  response.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : file.endsWith('.png') ? 'image/png' : 'text/html');
  response.end(fs.readFileSync(file));
});
let serverUrl;
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
    if (systemSuite && message.method === 'Page.javascriptDialogOpening') {
      socket.send(JSON.stringify({id:++sequence,method:'Page.handleJavaScriptDialog',params:{accept:true}}));
      return;
    }
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
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  serverUrl = 'http://127.0.0.1:' + server.address().port + '/';
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'ice-header-'));
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
    const navigate = async (width, height, preview = null, extra = '') => {
      await cdp.call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 768 });
      await cdp.call('Emulation.setTouchEmulationEnabled', { enabled: width < 768 });
      const query = '?run=' + Date.now() + (preview === null ? '' : '&preview=' + preview) + extra;
      await cdp.call('Page.navigate', { url: serverUrl + query });
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
    const viewports = systemSuite ? [[320,740],[390,844],[768,900],[1280,900]] : process.argv.includes('--all')
      ? [[320, 740], [360, 780], [390, 844], [768, 900], [1024, 768], [1200, 900], [1280, 900], [2560, 1440], [844, 390], [390, 440]]
      : [[390, 844]];
    for (const [width, height] of viewports) {
      const result = JSON.parse((await navigate(width, height)).text);
      if (result.viewport[0] !== width || result.viewport[1] !== height) throw new Error('Viewport mismatch');
      fs.writeFileSync(path.join(output, 'report-' + width + 'x' + height + '.json'), JSON.stringify(result, null, 2));
      console.log(JSON.stringify({ passed: result.passed, viewport: result.viewport }));
    }
    const keyPress = async (key, code, keyCode, modifiers = 0) => {
      const text = key === 'Enter' ? { text: String.fromCharCode(13), unmodifiedText: String.fromCharCode(13) } : {};
      await cdp.call('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: keyCode, modifiers, ...text });
      await cdp.call('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: keyCode, modifiers });
      await delay(100);
    };
    const assert = async (expression, message) => { if (!await evaluate(expression)) throw new Error(message); };
    if (systemSuite) {
      for (const [width,height] of viewports) {
        await navigate(width,height,'editor');
        if (process.argv.includes('--screenshots')) {
          const screenshot = await cdp.call('Page.captureScreenshot',{format:'png'});
          fs.writeFileSync(path.join(output,`editor-${width}x${height}.png`),Buffer.from(screenshot.data,'base64'));
        }
        await evaluate('window.openTestConfirmation()'); await delay(500);
        await assert('Boolean(document.querySelector("[role=dialog]"))','Confirmation opens');
        const focusInside = 'document.querySelector("[role=dialog]").contains(document.activeElement)';
        await assert(focusInside,'Confirmation receives focus');
        for(let i=0;i<12;i++) { await keyPress('Tab','Tab',9); await assert(focusInside,'Focus stays in confirmation'); }
        await keyPress('Escape','Escape',27);
        await assert('!document.querySelector("[role=dialog]")','Escape closes confirmation');
        await assert('document.activeElement.textContent.includes("Veröffentlichen")','Focus returns to publish button');
        if (process.argv.includes('--screenshots')) {
          await evaluate('window.showTestDeliveryHistory()'); await delay(200);
          await assert('document.documentElement.scrollWidth<=innerWidth','Delivery statistics fit viewport');
          const screenshot = await cdp.call('Page.captureScreenshot',{format:'png'});
          fs.writeFileSync(path.join(output,`history-${width}x${height}.png`),Buffer.from(screenshot.data,'base64'));
        }
      }
      console.log(JSON.stringify({passed:64,checks:'Confirmation keyboard and focus at four widths'}));
      return;
    }
    for (const [width, height] of [[390, 844], [1280, 900]]) {
      await navigate(width, height, 'header');
      await evaluate(`document.querySelector('button[aria-label="Menü öffnen"]').focus()`);
      await keyPress('Enter', 'Enter', 13);
      await assert('Boolean(document.querySelector("[data-testid=header-menu]")) && document.activeElement.getAttribute("aria-label") === "Menü schließen"', 'Keyboard opens menu and focuses visible close button');
      await keyPress('Tab', 'Tab', 9, 8);
      await assert('document.activeElement.textContent === "Instagram"', 'Shift+Tab wraps inside the menu');
      await keyPress('Tab', 'Tab', 9);
      await assert('document.activeElement.getAttribute("aria-label") === "Menü schließen"', 'Tab wraps to the close button');
      await keyPress('Escape', 'Escape', 27);
      await assert('!document.querySelector("[data-testid=header-menu]") && document.activeElement.getAttribute("aria-label") === "Menü öffnen"', 'Escape closes menu and restores focus');
      await evaluate(`document.querySelector('button[aria-label="Benachrichtigungen"]').focus()`);
      await keyPress('Enter', 'Enter', 13);
      await assert('Boolean(document.querySelector("[role=region][aria-label=Benachrichtigungen]"))', 'Keyboard opens notifications');
      await keyPress('Escape', 'Escape', 27);
      await assert('!document.querySelector("[role=region][aria-label=Benachrichtigungen]") && document.activeElement.getAttribute("aria-label") === "Benachrichtigungen"', 'Escape closes notifications and restores focus');
      await evaluate(`document.querySelector('button[aria-label^="Kartenanzeige:"]').focus()`);
      await keyPress('ArrowDown', 'ArrowDown', 40);
      await assert('Boolean(document.querySelector("[role=listbox]"))', 'Keyboard opens the display listbox');
      await keyPress('Home', 'Home', 36);
      await keyPress('ArrowDown', 'ArrowDown', 40);
      await keyPress('Enter', 'Enter', 13);
      await assert('window.testDisplay === "kugelPrice" && !document.querySelector("[role=listbox]")', 'Keyboard selects display mode and closes listbox: ' + await evaluate('JSON.stringify({display:window.testDisplay,active:document.activeElement.outerHTML.slice(0,500),list:document.querySelector("[role=listbox]")?.outerHTML.slice(0,700)})'));
      await assert('document.activeElement.getAttribute("aria-label") === "Kartenanzeige: Kugelpreis"', 'Listbox restores focus to display button');
      await evaluate(`document.querySelector('button[aria-label="Menü öffnen"]').click()`);
      await delay(100);
      // Native pointer click outside must dismiss the Headless UI dialog.
      await cdp.call('Input.dispatchMouseEvent', { type: 'mousePressed', x: 4, y: height - 4, button: 'left', clickCount: 1 });
      await cdp.call('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 4, y: height - 4, button: 'left', clickCount: 1 });
      await delay(100);
      await assert('!document.querySelector("[data-testid=header-menu]")', 'Clicking the background closes menu');
      console.log(JSON.stringify({ passed: 10, viewport: [width, height], checks: 'Native keyboard, focus trap, Escape, outside click and Listbox' }));
    }
    await navigate(1280, 900, 'menu', '&role=admin&route=/awards-admin');
    await assert('document.querySelector("#menu-awards a[href=\\"/awards-admin\\"]")?.getAttribute("aria-current") === "page"', 'Active award administration route is expanded and highlighted');
    console.log(JSON.stringify({ passed: 1, checks: 'Active administration navigation' }));
    if (process.argv.includes('--screenshots')) {
      for (const [width, height] of [[320, 740], [390, 844], [768, 900], [1280, 900], [2560, 1440], [844, 390]]) {
        for (const preview of ['header', 'menu', 'notifications', 'map', 'filters']) {
          await navigate(width, height, preview);
          const screenshot = await cdp.call('Page.captureScreenshot', { format: 'png' });
          fs.writeFileSync(path.join(output, preview + '-' + width + 'x' + height + '.png'), Buffer.from(screenshot.data, 'base64'));
        }
        console.log('Screenshots: ' + width + 'x' + height);
      }
      for (const role of ['guest', 'admin', 'long']) {
        await navigate(390, 844, 'menu', '&role=' + role);
        const screenshot = await cdp.call('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(output, 'menu-' + role + '.png'), Buffer.from(screenshot.data, 'base64'));
      }
    }
  } finally {
    cdp?.close();
    browser.kill();
    server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; server.close(); });
