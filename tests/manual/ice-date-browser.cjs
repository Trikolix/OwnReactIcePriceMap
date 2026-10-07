// Real components, isolated API fixtures, and Chrome keyboard input. No live writes.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), http = require('node:http');
const { spawn } = require('node:child_process'), { buildSync } = require('esbuild');
const root = path.resolve(__dirname, '../..'), output = path.join(root, 'build/ice-date-browser');
fs.mkdirSync(output, { recursive: true });
buildSync({ entryPoints: [path.join(__dirname, 'fixtures/ice-date-browser.jsx')], bundle: true, outfile: path.join(output, 'test.js'), jsx: 'automatic',
  define: { 'import.meta.env': JSON.stringify({ VITE_API_BASE_URL: 'https://test.invalid', VITE_ASSET_BASE_URL: '/' }), 'process.env.NODE_ENV': '"production"' },
  loader: { '.png': 'dataurl', '.jpg': 'dataurl', '.webp': 'dataurl', '.svg': 'dataurl' } });
fs.writeFileSync(path.join(output, 'fixture-avatar.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#b6dbce"/><circle cx="32" cy="22" r="12" fill="#785b39"/><circle cx="32" cy="60" r="25" fill="#6d9d81"/></svg>');
fs.writeFileSync(path.join(output, 'index.html'), '<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="test.css"></head><body><pre id="results" data-status="running" hidden></pre><div id="app"></div><script src="test.js"></script></body></html>');
const server = http.createServer((request, response) => {
  const name = request.url.split('?')[0], file = path.join(output, name === '/' ? 'index.html' : name);
  if (!file.startsWith(output) || !fs.existsSync(file)) { response.writeHead(404); response.end(); return; }
  response.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : file.endsWith('.svg') ? 'image/svg+xml' : 'text/html');
  response.end(fs.readFileSync(file));
});
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function connect(url) {
  const socket = new WebSocket(url), pending = new Map(); let sequence = 0;
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  socket.addEventListener('message', event => { const data = JSON.parse(event.data), item = pending.get(data.id); if (!item) return; pending.delete(data.id); clearTimeout(item.timer); data.error ? item.reject(new Error(JSON.stringify(data.error))) : item.resolve(data.result); });
  return { call(method, params = {}) { return new Promise((resolve, reject) => { const id = ++sequence, timer = setTimeout(() => { pending.delete(id); reject(new Error('CDP timeout ' + method)); }, 15000); pending.set(id, { resolve, reject, timer }); socket.send(JSON.stringify({ id, method, params })); }); }, close() { socket.close(); } };
}
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'ice-date-browser-'));
  const browser = spawn(process.env.CHROME_BIN || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless','--no-first-run','--disable-background-networking','--disable-extensions','--disable-gpu','--remote-debugging-port=0','--remote-allow-origins=*','--user-data-dir=' + profile,'about:blank'], { windowsHide: true });
  let stderr = '', cdp; browser.stderr.on('data', data => stderr += data);
  try {
    const start = Date.now(); while (!stderr.includes('DevTools listening on ') && Date.now() - start < 15000) await delay(50);
    const endpoint = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/)?.[1]; if (!endpoint) throw new Error(stderr);
    const pages = await (await fetch('http://' + new URL(endpoint).host + '/json/list')).json();
    cdp = await connect(pages.find(page => page.type === 'page').webSocketDebuggerUrl);
    await cdp.call('Page.enable'); await cdp.call('Network.enable'); await cdp.call('Network.setBlockedURLs', { urls: ['https://*'] });
    const evaluate = async expression => { const data = await cdp.call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (data.exceptionDetails) throw new Error(JSON.stringify(data.exceptionDetails)); return data.result.value; };
    const navigate = async (width, height, preview) => {
      await cdp.call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 768 });
      const query = '?width=' + width + '&run=' + Date.now() + (preview ? '&preview=' + preview : '');
      await cdp.call('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/${query}` });
      const deadline = Date.now() + 60000;
      while (Date.now() < deadline) {
        const data = await evaluate('({query:location.search,status:document.getElementById("results")?.dataset.status,text:document.getElementById("results")?.textContent})');
        if (data.query === query && ['passed','failed','preview'].includes(data.status)) { if (data.status === 'failed') throw new Error(width + ': ' + data.text); return data; }
        await delay(100);
      }
      throw new Error('Fixture timed out');
    };
    for (const [width, height] of [[320,740],[390,844],[768,900],[1280,900]]) {
      const report = JSON.parse((await navigate(width,height)).text);
      fs.writeFileSync(path.join(output, `report-${width}.json`), JSON.stringify(report, null, 2));
      console.log(JSON.stringify({ passed: report.passed, viewport: report.viewport }));
      if (process.argv.includes('--screenshots')) for (const preview of ['new','choose','detail','guest','completed','list']) {
        await navigate(width,height,preview);
        const metrics = await cdp.call('Page.getLayoutMetrics');
        const screenshot = await cdp.call('Page.captureScreenshot', { format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width,height:Math.ceil(metrics.cssContentSize.height),scale:1} });
        fs.writeFileSync(path.join(output, `${preview}-${width}.png`), Buffer.from(screenshot.data,'base64'));
      }
    }
    const press = async (key,code,keyCode) => { await cdp.call('Input.dispatchKeyEvent',{type:'keyDown',key,code,windowsVirtualKeyCode:keyCode,...(key==='Enter'?{text:'\r'}:{})}); await cdp.call('Input.dispatchKeyEvent',{type:'keyUp',key,code,windowsVirtualKeyCode:keyCode}); await delay(120); };
    await navigate(390,844,'choose');
    await evaluate('document.getElementById("ice-date-shop").focus()');
    await press('ArrowDown','ArrowDown',40); await press('Enter','Enter',13); await delay(350);
    if (!(await evaluate('window.iceDateLocation.search.includes("shopId=1")'))) throw new Error('Keyboard chooses a shop');
    await evaluate('(() => { const input=document.getElementById("ice-date-users"); input.focus(); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(input,"Jo"); input.dispatchEvent(new Event("input",{bubbles:true})); })()');
    await delay(400); await press('ArrowDown','ArrowDown',40); await press('Enter','Enter',13);
    if (!(await evaluate('!!document.querySelector("button[aria-label=\\"Jonas entfernen\\"]")'))) throw new Error('Keyboard chooses an invitee');
    if (!(await evaluate('getComputedStyle(document.getElementById("ice-date-users").parentElement).outlineWidth==="3px"'))) throw new Error('Search has visible keyboard focus');
    await evaluate('document.querySelector("button[aria-label=\\"Jonas entfernen\\"]").focus()'); await press('Enter','Enter',13);
    if (!(await evaluate('!document.querySelector("button[aria-label=\\"Jonas entfernen\\"]")'))) throw new Error('Keyboard removes an invitee');
    await evaluate('[...document.querySelectorAll("main summary")].find(element=>element.textContent.includes("Titel & Nachricht")).focus()'); await press('Enter','Enter',13);
    if (!(await evaluate('!!document.getElementById("ice-date-title").getClientRects().length'))) throw new Error('Keyboard opens optional fields');
    console.log(JSON.stringify({passed:5,checks:'Real keyboard shop choice, invitation choice/removal, focus and optional fields'}));
  } finally { cdp?.close(); browser.kill(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
