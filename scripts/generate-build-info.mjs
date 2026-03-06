import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const packageJsonPath = path.join(rootDir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const appVersion = String(pkg.version || '0.0.0');
const timestamp = new Date();
const buildTimeIso = timestamp.toISOString();
const buildTimeUnix = Math.floor(timestamp.getTime() / 1000);
const buildId = `${appVersion}-${buildTimeUnix}`;

const generatedDir = path.join(rootDir, 'src', 'generated');
const publicDir = path.join(rootDir, 'public');

fs.mkdirSync(generatedDir, { recursive: true });
fs.mkdirSync(publicDir, { recursive: true });

const buildInfoJs = `export const APP_VERSION = ${JSON.stringify(appVersion)};\nexport const APP_BUILD_ID = ${JSON.stringify(buildId)};\nexport const APP_BUILD_TIME = ${JSON.stringify(buildTimeIso)};\n`;
fs.writeFileSync(path.join(generatedDir, 'buildInfo.js'), buildInfoJs, 'utf8');

const versionJson = {
  appVersion,
  buildId,
  buildTime: buildTimeIso,
};
fs.writeFileSync(path.join(publicDir, 'version.json'), `${JSON.stringify(versionJson, null, 2)}\n`, 'utf8');

console.log(`[build-info] buildId=${buildId}`);
