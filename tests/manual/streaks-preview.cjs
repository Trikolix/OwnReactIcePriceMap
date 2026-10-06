// Optional isolated visual smoke test of the actual shared React components.
// Run with Node on a machine with Chrome; artifacts are written under build/.
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const { spawnSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { ServerStyleSheet } = require('styled-components');
const { buildSync } = require('esbuild');
const root = path.resolve(__dirname, '../..');
const filename = path.join(root, 'src/components/ProfileProgress.jsx');
const compiled = buildSync({ stdin: { contents: 'export * from \"./src/components/ProfileProgress\"; export { default as StreakOverview } from \"./src/components/StreakOverview\";', resolveDir: root }, bundle: true, platform: 'node', packages: 'external', format: 'cjs', write: false }).outputFiles[0].text;
const componentModule = new Module(filename, module);
componentModule.filename = filename;
componentModule.paths = Module._nodeModulePaths(path.dirname(filename));
componentModule._compile(compiled, filename);
const { AvatarBadgeFrame, LevelBadge, StreakFlames, StreakOverview, StreakCelebration } = componentModule.exports;
const h = React.createElement;
const streaks = { day: { state: 'frozen', value: 12, seconds_left: 43200 }, week: { state: 'active', value: 8 }, freezes: { day: 1, week: 2 }, last_freeze: { type: 'day', period: '2026-09-15' } };
const avatar = size => h(AvatarBadgeFrame, null, h('div', { className: 'avatar', style: { width: size, height: size } }, 'CH'), h(LevelBadge, { level: 27, large: size > 40 }));
const sheet = new ServerStyleSheet();
const app = h('main', null,
  h('header', null, h('b', null, '☰'), h('b', null, 'Ice-App'), h('div', { className: 'account' }, '♧', avatar(32), h(StreakFlames, { streaks, compact: true }))),
  h('section', null, h('div', { className: 'identity' }, avatar(88), h('div', null, h('h1', null, 'Christoph'))), h(StreakOverview, { streaks, own: true })),
  h('section', null, h('h2', null, 'Check-in gespeichert'), h(StreakCelebration, { events: [{ id: 1, kind: 'continue', type: 'day', value: 12 }, { id: 2, kind: 'grant', type: 'week', amount: 1 }] })),
  h('section', null, h('h2', null, 'Zustände'), ...['active', 'at_risk', 'frozen', 'none'].map(state => h('p', { key: state }, h(StreakFlames, { streaks: { day: { state, value: state === 'none' ? 0 : 7, seconds_left: 3600 }, week: { state, value: state === 'none' ? 0 : 4, seconds_left: 3600 } } })))));
const body = renderToStaticMarkup(sheet.collectStyles(app));
if (!body.includes('Deine Serien') || !body.includes('Vorrat voll') || body.includes('Freeze')) throw new Error('Series copy regression');
const output = path.join(root, 'build'); fs.mkdirSync(output, { recursive: true });
const html = path.join(output, 'streak-preview.html');
fs.writeFileSync(html, `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${sheet.getStyleTags()}<style>*{box-sizing:border-box}body{margin:0;background:#fff8ed;font-family:Arial,sans-serif;color:#362411}header{display:flex;align-items:center;justify-content:space-between;background:#ffb522;padding:12px;gap:10px}.account,.identity{display:flex;align-items:center;gap:14px}.account{gap:10px}.avatar{display:grid;place-items:center;background:#75491e;color:white;border-radius:50%;overflow:hidden;font-weight:bold}section{max-width:700px;margin:20px auto;padding:18px;background:white;border-radius:16px}.identity{margin-bottom:20px}h1{margin:0 0 10px}h2{font-size:18px}</style></head><body>${body}</body></html>`);
sheet.seal();
const chrome = process.env.CHROME_BIN || (process.platform === 'win32' ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : 'google-chrome');
const os = require('node:os');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'ice-streak-browser-'));
for (const [name,width,height] of [['mobile',375,1000],['desktop',1200,1000]]) {
  const source = fs.readFileSync(html, 'utf8').replace(/<style id="viewport-fix">.*?<\/style>/, '');
  fs.writeFileSync(html, source.replace('</head>', `<style id="viewport-fix">html,body{width:${width}px!important;min-width:0}</style></head>`));
  const screenshot = path.join(output, `streak-${name}.png`);
  const result = spawnSync(chrome, ['--headless', '--no-first-run', '--disable-background-networking', '--disable-extensions', `--user-data-dir=${profile}`, '--hide-scrollbars', `--window-size=${width},${height}`, `--screenshot=${screenshot}`, pathToFileURL(html).href], { timeout: 30000, encoding: 'utf8' });
  if (result.status !== 0 || !fs.existsSync(screenshot)) throw new Error(result.error?.message || result.stderr);
  console.log(screenshot);
}
