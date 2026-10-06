// Actual profile, series and photo challenge pages; every API call is mocked.
// Usage: node tests/manual/photo-challenge-browser.cjs --all --screenshots
// Series only: add --series-only; keyboard only: add --keyboard-only.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const { spawn } = require('node:child_process');
const { buildSync } = require('esbuild');
const root = path.resolve(__dirname, '../..');
const output = path.join(root, 'build/photo-challenge-browser');
fs.mkdirSync(output, { recursive: true });
buildSync({
  entryPoints: [path.join(__dirname, 'fixtures/photo-challenge-browser.jsx')],
  bundle: true, outfile: path.join(output, 'test.js'), jsx: 'automatic',
  define: { 'import.meta.env': JSON.stringify({ VITE_API_BASE_URL: 'https://test.invalid', VITE_ASSET_BASE_URL: '/' }), 'process.env.NODE_ENV': '"production"' },
  loader: { '.png': 'dataurl', '.jpg': 'dataurl', '.webp': 'dataurl', '.svg': 'dataurl' },
});
fs.writeFileSync(path.join(output, 'index.html'), `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="img-src 'self' data: blob:"><link rel="stylesheet" href="test.css"><style>body{margin:0;color:#2f2100}#results{display:none}</style></head><body><pre id="results" data-status="running"></pre><div id="app"></div><script src="test.js"></script></body></html>`);
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
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'ice-photo-'));
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
      const query = '?run=' + Date.now() + (preview === null ? '' : '&preview=' + preview) + extra + (process.argv.includes('--series-only') ? '&seriesOnly=1' : '');
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
    const viewports = process.argv.includes('--all')
      ? [[320, 740], [360, 780], [390, 844], [768, 900], [1024, 768], [1200, 900], [1280, 900], [2560, 1440], [844, 390], [390, 440]]
      : [[390, 844]];
    for (const [width, height] of process.argv.includes('--keyboard-only') ? [] : viewports) {
      const result = JSON.parse((await navigate(width, height)).text);

      fs.writeFileSync(path.join(output, 'report-' + width + 'x' + height + '.json'), JSON.stringify(result, null, 2));
      console.log(JSON.stringify({ passed: result.length, viewport: [width,height] }));
    }
    const keyPress = async (key,code,keyCode,modifiers=0) => {
      await cdp.call('Input.dispatchKeyEvent',{type:'keyDown',key,code,windowsVirtualKeyCode:keyCode,modifiers,...(key === 'Enter' ? {text:String.fromCharCode(13),unmodifiedText:String.fromCharCode(13)} : {})});
      await cdp.call('Input.dispatchKeyEvent',{type:'keyUp',key,code,windowsVirtualKeyCode:keyCode,modifiers});
      await delay(100);
    };
    const assert = async (expression,message) => { if (!await evaluate(expression)) throw new Error(message); };
    for (const [width,height] of [[390,844],[1280,900]]) {
      await navigate(width,height,'series');
      await evaluate('document.querySelector("#serien button[aria-label*=Tages]").focus()');
      await keyPress('Enter','Enter',13);
      await assert('document.querySelector("[role=dialog]")?.textContent.includes("1 von 2 verfügbar")','Keyboard opens daily series details');
      await keyPress('Tab','Tab',9,8);
      await assert('Boolean(document.activeElement.closest("[role=dialog]"))','Series dialog traps keyboard focus');
      await keyPress('Escape','Escape',27);
      await assert('!document.querySelector("[role=dialog]") && document.activeElement.getAttribute("aria-label")?.startsWith("Tages-Serie")','Series Escape restores flame focus');
      await evaluate('document.querySelector("#serien button[aria-label*=Wochen]").focus()');
      await keyPress(' ','Space',32);
      await assert('document.querySelector("[role=dialog]")?.textContent.includes("Vorrat voll")','Space opens weekly series details');
      await keyPress('Escape','Escape',27);
      await assert('!document.querySelector("[role=dialog]") && document.activeElement.getAttribute("aria-label")?.startsWith("Wochen-Serie")','Weekly Escape restores flame focus');
      if (width < 768) {
        const point = JSON.parse(await evaluate('JSON.stringify((()=>{const r=document.querySelector("#serien button[aria-label*=Tages]").getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}})())'));
        await cdp.call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});
        await cdp.call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]}); await delay(150);
        await assert('Boolean(document.querySelector("[role=dialog]")) && !document.querySelector("[role=region]")','Native touch opens details without hover preview');
        await keyPress('Escape','Escape',27);
      }
      console.log(JSON.stringify({passed:width<768?6:5,viewport:[width,height],checks:'Series flames, native keyboard and touch'}));
      if (process.argv.includes('--series-only')) continue;
      await navigate(width,height,'submit');
      await assert('document.activeElement.getAttribute("aria-label") === "Dialog schließen"','Submission focuses close button');
      await keyPress('Tab','Tab',9,8);
      await assert('Boolean(document.activeElement.closest("[role=dialog]"))','Shift Tab stays inside submission');
      await keyPress('Escape','Escape',27);
      await assert('!document.querySelector("[role=dialog]") && document.activeElement.textContent === "Foto einreichen"','Escape restores submission trigger');
      await navigate(width,height,'vote');
      await evaluate('document.querySelector("[role=dialog] button[aria-label*=vergrößern]").focus()');
      await keyPress('Enter','Enter',13);
      await assert('document.querySelectorAll("[role=dialog]").length===2','Keyboard opens image above voting');
      await keyPress('Escape','Escape',27);
      await assert('document.querySelectorAll("[role=dialog]").length===1 && document.activeElement.getAttribute("aria-label").includes("vergrößern")','Closing image returns focus to preview: '+await evaluate('document.activeElement.outerHTML.slice(0,600)'));
      await keyPress('Escape','Escape',27);
      await assert('!document.querySelector("[role=dialog]") && document.activeElement.textContent === "Jetzt abstimmen"','Escape restores voting trigger');
      console.log(JSON.stringify({passed:7,viewport:[width,height],checks:'Native focus trap and Escape'}));
    }
    await navigate(1280,900,'series');
    await evaluate('window.focusBeforeSeriesHover=document.activeElement');
    const flamePoint = JSON.parse(await evaluate('JSON.stringify((()=>{const r=document.querySelector("#serien button[aria-label*=Tages]").getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}})())'));
    await cdp.call('Input.dispatchMouseEvent',{type:'mouseMoved',...flamePoint}); await delay(100);
    await assert('Boolean(document.querySelector("[role=region]")) && !document.querySelector("[role=dialog]")','Native mouse hover opens details');
    await assert('document.activeElement===window.focusBeforeSeriesHover','Native hover preserves keyboard focus');
    const detailsPoint = JSON.parse(await evaluate('JSON.stringify((()=>{const r=document.querySelector("[role=region]").getBoundingClientRect();return{x:r.left+30,y:r.top+25}})())'));
    await cdp.call('Input.dispatchMouseEvent',{type:'mouseMoved',...detailsPoint}); await delay(350);
    await assert('Boolean(document.querySelector("[role=region]"))','Native pointer can move from flame into details');
    if (process.argv.includes('--screenshots')) {
      const shot = await cdp.call('Page.captureScreenshot',{format:'png'});
      fs.writeFileSync(path.join(output,'series-hover-1280x900.png'),Buffer.from(shot.data,'base64'));
    }
    await keyPress('Escape','Escape',27);
    await assert('!document.querySelector("[role=region]")','Escape dismisses native hover');
    await cdp.call('Input.dispatchMouseEvent',{type:'mouseMoved',x:10,y:10});
    await cdp.call('Input.dispatchMouseEvent',{type:'mouseMoved',...flamePoint}); await delay(100);
    await cdp.call('Input.dispatchMouseEvent',{type:'mouseMoved',x:10,y:10}); await delay(350);
    await assert('!document.querySelector("[role=region]")','Leaving flame and details closes mouse preview');
    await cdp.call('Input.dispatchMouseEvent',{type:'mouseMoved',...flamePoint}); await delay(100);
    await cdp.call('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...flamePoint});
    await cdp.call('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...flamePoint}); await delay(150);
    await assert('Boolean(document.querySelector("[role=dialog]")) && !document.querySelector("[role=region]")','Clicking hovered flame opens persistent details');
    await keyPress('Escape','Escape',27);
    console.log(JSON.stringify({passed:6,viewport:[1280,900],checks:'Native series hover and click'}));
    await cdp.call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
    await navigate(390,440,'series');
    await assert('matchMedia("(prefers-reduced-motion: reduce)").matches','Reduced motion enabled');
    if (process.argv.includes('--screenshots')) {
      for (const [width,height] of viewports) for (const preview of process.argv.includes('--series-only') ? ['series','series-details'] : ['list','submit','vote','series','series-details','admin','create','images']) {
        await navigate(width,height,preview);
        const screenshot = await cdp.call('Page.captureScreenshot',{format:'png'});
        fs.writeFileSync(path.join(output,preview+'-'+width+'x'+height+'.png'),Buffer.from(screenshot.data,'base64'));
      }
    }
  } finally { cdp?.close(); browser.kill(); server.close(); }
})().catch(error => { console.error(error); process.exitCode=1; server.close(); });
