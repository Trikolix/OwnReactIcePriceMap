import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function readGit(root, args) {
  return execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

export function getGitInfo(root) {
  let gitCommit = null;
  let gitBranch = null;
  let gitDirty = null;

  try {
    gitCommit = readGit(root, ['rev-parse', '--verify', 'HEAD']);
    gitDirty = Boolean(readGit(root, ['status', '--porcelain=v1', '--untracked-files=normal', '--ignore-submodules=none']));
  } catch {
    // Source archives and machines without Git cannot provide verified provenance.
  }

  if (gitCommit) {
    try {
      gitBranch = readGit(root, ['symbolic-ref', '--quiet', '--short', 'HEAD']);
    } catch {
      // A detached HEAD still identifies the exact commit, but has no branch name.
    }
  }

  return { gitCommit, gitBranch, gitDirty };
}

export function generateBuildInfo(root, { requireClean = false } = {}) {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const gitInfo = getGitInfo(root);
  if (requireClean && (!gitInfo.gitCommit || gitInfo.gitDirty !== false)) {
    throw new Error('Release-Build abgebrochen: Git-Commit und sauberer Arbeitsstand erforderlich. Änderungen und neue Dateien zuerst committen oder bewusst außerhalb des Arbeitsstands ablegen.');
  }

  const appVersion = String(pkg.version || '0.0.0');
  const timestamp = new Date();
  const revision = gitInfo.gitCommit?.slice(0, 12) || 'unknown';
  const state = gitInfo.gitDirty === true ? '-dirty' : gitInfo.gitDirty === null ? '-unverified' : '';
  const buildId = `${appVersion}-${revision}${state}-${timestamp.getTime()}`;
  const versionJson = {
    appVersion,
    buildId,
    buildTime: timestamp.toISOString(),
    ...gitInfo,
  };

  const generatedDir = path.join(root, 'src', 'generated');
  const publicDir = path.join(root, 'public');
  fs.mkdirSync(generatedDir, { recursive: true });
  fs.mkdirSync(publicDir, { recursive: true });

  const exports = {
    APP_VERSION: appVersion,
    APP_BUILD_ID: buildId,
    APP_BUILD_TIME: versionJson.buildTime,
    APP_GIT_COMMIT: gitInfo.gitCommit,
    APP_GIT_BRANCH: gitInfo.gitBranch,
    APP_GIT_DIRTY: gitInfo.gitDirty,
  };
  const buildInfoJs = Object.entries(exports)
    .map(([name, value]) => `export const ${name} = ${JSON.stringify(value)};`)
    .join('\n');
  fs.writeFileSync(path.join(generatedDir, 'buildInfo.js'), `${buildInfoJs}\n`, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'version.json'), `${JSON.stringify(versionJson, null, 2)}\n`, 'utf8');
  return versionJson;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  try {
    const info = generateBuildInfo(rootDir, { requireClean: process.argv.includes('--require-clean') });
    console.log(`[build-info] buildId=${info.buildId} branch=${info.gitBranch || 'unknown/detached'} gitDirty=${info.gitDirty}`);
    if (info.gitDirty !== false) {
      console.warn('[build-info] Dieser Build ist keinem unveränderten Git-Commit eindeutig zuzuordnen. Für Releases npm run build:release verwenden.');
    }
  } catch (error) {
    console.error(`[build-info] ${error.message}`);
    process.exitCode = 1;
  }
}
