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
    const navigate = async (width, height, preview = false) => {
      await cdp.call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 768 });
      const query = '?run=' + Date.now() + (preview ? '&preview=1' : '');
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
    for (const [width, height] of [[320,740],[390,844],[768,900],[1280,900]]) {
      const report = JSON.parse((await navigate(width,height)).text);
      console.log(JSON.stringify({ viewport: width, passed: report.passed }));
      fs.writeFileSync(path.join(output, `report-${width}.json`), JSON.stringify(report, null, 2));
      await navigate(width,height,true);
      await evaluate('window.prepareInviteKeyboard()');
      const key = async value => { for (const type of ['keyDown','keyUp']) await cdp.call('Input.dispatchKeyEvent', { type, key: value, code: value, windowsVirtualKeyCode: value === 'Tab' ? 9 : value === 'Escape' ? 27 : 13, ...(value === 'Enter' && type === 'keyDown' ? { text: '\r' } : {}) }); await delay(80); };
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
    }
  } finally { cdp?.close(); browser.kill(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
