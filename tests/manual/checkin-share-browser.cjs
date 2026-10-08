// Real components, isolated API fixtures, and Chrome keyboard input. No live writes.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), http = require('node:http');
const { spawn } = require('node:child_process'), { buildSync } = require('esbuild');
const root = path.resolve(__dirname, '../..'), output = path.join(root, 'build/checkin-share-browser');
fs.mkdirSync(output, { recursive: true });
buildSync({ entryPoints: [path.join(__dirname, 'fixtures/checkin-share-browser.jsx')], bundle: true, outfile: path.join(output, 'test.js'), jsx: 'automatic',
  define: { 'import.meta.env': JSON.stringify({ VITE_API_BASE_URL: 'https://test.invalid', VITE_ASSET_BASE_URL: '/' }), 'process.env.NODE_ENV': '"production"' },
  loader: { '.png': 'dataurl', '.jpg': 'dataurl', '.webp': 'dataurl', '.svg': 'dataurl' } });
fs.writeFileSync(path.join(output, 'fixture-avatar.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#b6dbce"/><circle cx="32" cy="22" r="12" fill="#785b39"/><circle cx="32" cy="60" r="25" fill="#6d9d81"/></svg>');
fs.copyFileSync(path.join(root, 'tests/manual/fixtures/shop-detail-ice.svg'), path.join(output, 'fixture-ice.svg'));
fs.writeFileSync(path.join(output, 'fixture-award.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><circle cx="80" cy="80" r="68" fill="#ffe5a3" stroke="#e3a219" stroke-width="8"/><path d="M48 64h64L80 130z" fill="#b77935"/><circle cx="80" cy="56" r="30" fill="#fffaf2"/><path d="M80 22l7 14 16 2-12 11 3 16-14-8-14 8 3-16-12-11 16-2z" fill="#ffb522"/></svg>');
for(const file of ['story-photo','story-review','feed-photo','feed-review']) fs.copyFileSync(path.join(root, 'build/checkin-share',file+'.png'),path.join(output,file+'.png'));
fs.writeFileSync(path.join(output, 'fixture-map.html'), '<!doctype html><html><body style="background:#edf0df">Routenkarte</body></html>');
fs.writeFileSync(path.join(output, 'index.html'), '<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="test.css"></head><body><pre id="results" data-status="running" hidden></pre><div id="app"></div><script src="test.js"></script></body></html>');
const server = http.createServer((request, response) => {
  const name = request.url.split('?')[0], file = path.join(output, name === '/' ? 'index.html' : name);
  if (!file.startsWith(output) || !fs.existsSync(file)) { response.writeHead(404); response.end(); return; }
  response.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : file.endsWith('.svg') ? 'image/svg+xml' : file.endsWith('.png') ? 'image/png' : 'text/html');
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
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'checkin-share-browser-'));
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
        if (data.query === query && ['passed','failed','preview'].includes(data.status)) {
          if (data.status === 'failed') {
            const screenshot=await cdp.call('Page.captureScreenshot',{format:'png'});
            fs.writeFileSync(path.join(output,`failure-${width}.png`),Buffer.from(screenshot.data,'base64'));
            throw new Error(width + ': ' + data.text);
          }
          return data;
        }
        await delay(100);
      }
      throw new Error('Fixture timed out');
    };
    for (const [width, height] of [[320,740],[390,844],[768,900],[1280,900]]) {
      if (!process.argv.includes('--screenshots-only')) {
      const report = JSON.parse((await navigate(width,height)).text);
      fs.writeFileSync(path.join(output, `report-${width}.json`), JSON.stringify(report, null, 2));
      console.log(JSON.stringify({ viewport:width, passed:report.passed, pageHeight:report.pageHeight, overflow:report.overflow }));
      }

      await navigate(width,height,'card');
      await evaluate('window.prepareKeyboardAudit()');
      const key=async value=>{for(const type of ['keyDown','keyUp'])await cdp.call('Input.dispatchKeyEvent',{type,key:value,code:value,windowsVirtualKeyCode:value==='Tab'?9:value==='Escape'?27:13,...(value==='Enter'&&type==='keyDown'?{text:'\r'}:{})});};
      await key('Enter');
      await delay(500);
      if(!(await evaluate('Boolean(document.querySelector("[role=dialog]"))')))throw new Error('Keyboard cannot open sharing dialog');
      for(let step=0;step<16;step++){await key('Tab');if(!(await evaluate('Boolean(document.activeElement.closest("[role=dialog]"))')))throw new Error('Focus escaped dialog');}
      await key('Escape');
      if(!(await evaluate('!document.querySelector("[role=dialog]") && document.activeElement.getAttribute("aria-label")==="Check-in teilen"')))throw new Error('Escape did not close dialog and restore share button focus');
      console.log(JSON.stringify({viewport:width,keyboard:'passed'}));
      for(const preview of ['card','story','feed','private','guest','native']){
        await navigate(width,height,preview);
        const audit=await evaluate('window.shareMeasure()');
        if(audit.overflow || audit.dialogOverflow || audit.smallControls.length)throw new Error('Layout failed '+preview+' '+width+' '+JSON.stringify(audit));
        const screenshot=await cdp.call('Page.captureScreenshot',{format:'png'});
        fs.writeFileSync(path.join(output,preview+'-'+width+'.png'),Buffer.from(screenshot.data,'base64'));
      }
    }
  } finally { cdp?.close(); browser.kill(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
