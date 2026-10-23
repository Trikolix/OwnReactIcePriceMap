import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';
import { generateBuildInfo, getGitInfo } from '../../scripts/generate-build-info.mjs';

function fixture(t, { git = true } = {}) {
  const tempRoot = fs.realpathSync(os.tmpdir());
  const root = fs.mkdtempSync(path.join(tempRoot, 'ice-app-build-info-test-'));
  t.after(() => {
    assert.equal(path.dirname(root), tempRoot);
    assert(path.basename(root).startsWith('ice-app-build-info-test-'));
    fs.rmSync(root, { recursive: true, force: true });
  });
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ version: '3.0.0' }));
  fs.writeFileSync(path.join(root, '.gitignore'), 'src/generated/buildInfo.js\npublic/version.json\n');
  const runGit = (...args) => execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
  if (git) {
    runGit('init', '--initial-branch=feature/build-tracking');
    runGit('add', '.');
    runGit('-c', 'user.name=Build info test', '-c', 'user.email=build-test@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-m', 'Fixture');
  }
  return { root, runGit };
}

test('release metadata identifies the actual commit and stays consistent with the bundled exports', (t) => {
  const { root, runGit } = fixture(t);
  const info = generateBuildInfo(root, { requireClean: true });
  assert.equal(info.gitCommit, runGit('rev-parse', 'HEAD'));
  assert.equal(info.gitBranch, 'feature/build-tracking');
  assert.equal(info.gitDirty, false);
  assert(info.buildId.includes(info.gitCommit.slice(0, 12)));
  assert.equal(new Date(info.buildTime).toISOString(), info.buildTime);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, 'public/version.json'), 'utf8')), info);
  const bundled = fs.readFileSync(path.join(root, 'src/generated/buildInfo.js'), 'utf8');
  assert(bundled.includes(`export const APP_BUILD_ID = ${JSON.stringify(info.buildId)};`));
  assert(bundled.includes(`export const APP_GIT_COMMIT = ${JSON.stringify(info.gitCommit)};`));
  assert(bundled.includes('export const APP_GIT_DIRTY = false;'));
  assert.equal(getGitInfo(root).gitDirty, false, 'generated artifacts must not make the repository dirty');
});

for (const state of ['unstaged', 'staged', 'untracked']) {
  test(`${state} files are marked dirty and block a release before output is overwritten`, (t) => {
    const { root, runGit } = fixture(t);
    const before = generateBuildInfo(root, { requireClean: true });
    const filename = state === 'untracked' ? 'new-feature.js' : 'package.json';
    if (state === 'untracked') {
      fs.writeFileSync(path.join(root, filename), '// uncommitted feature');
    } else {
      fs.writeFileSync(path.join(root, filename), JSON.stringify({ version: '3.0.1' }));
    }
    if (state === 'staged') runGit('add', filename);
    assert.equal(getGitInfo(root).gitDirty, true);
    assert.throws(() => generateBuildInfo(root, { requireClean: true }), /sauberer Arbeitsstand/);
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, 'public/version.json'), 'utf8')), before);
    const development = generateBuildInfo(root);
    assert.equal(development.gitDirty, true);
    assert(development.buildId.includes('-dirty-'));
  });
}

test('a detached HEAD remains a valid release with a commit and no invented branch', (t) => {
  const { root, runGit } = fixture(t);
  runGit('checkout', '--detach');
  const info = generateBuildInfo(root, { requireClean: true });
  assert.equal(info.gitCommit, runGit('rev-parse', 'HEAD'));
  assert.equal(info.gitBranch, null);
  assert.equal(info.gitDirty, false);
});

test('source archives can build with unknown provenance but cannot produce a verified release', (t) => {
  const { root } = fixture(t, { git: false });
  const info = generateBuildInfo(root);
  assert.equal(info.gitCommit, null);
  assert.equal(info.gitBranch, null);
  assert.equal(info.gitDirty, null);
  assert(info.buildId.includes('-unknown-unverified-'));
  assert.throws(() => generateBuildInfo(root, { requireClean: true }), /Git-Commit/);
});
