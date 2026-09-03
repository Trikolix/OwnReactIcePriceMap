// @vitest-environment jsdom
import '../setup.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  isNativePlatform: vi.fn(() => false),
  mkdir: vi.fn(),
  rmdir: vi.fn(),
  writeFile: vi.fn(),
  share: vi.fn(),
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: mocks.isNativePlatform },
}));

vi.mock('@capacitor/filesystem', () => ({
  Directory: { Cache: 'CACHE' },
  Filesystem: {
    mkdir: mocks.mkdir,
    rmdir: mocks.rmdir,
    writeFile: mocks.writeFile,
  },
}));

vi.mock('@capacitor/share', () => ({
  Share: { share: mocks.share },
}));

import {
  buildCheckinShareText,
  cleanupCheckinShareCache,
  copyShareText,
  shareCheckinStory,
} from '../../src/features/socialMedia/shareStory';

describe('check-in story sharing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isNativePlatform.mockReturnValue(false);
    mocks.writeFile.mockResolvedValue({ uri: 'file:///cache/ice-story.png' });
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: undefined });
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
  });

  it('keeps the Instagram handle and profile URL in the share text', () => {
    expect(buildCheckinShareText('Eiscafé Test')).toContain('Eiscafé Test');
    expect(buildCheckinShareText('Eiscafé Test')).toContain('@ice_app.de');
    expect(buildCheckinShareText('Eiscafé Test')).toContain('https://www.instagram.com/ice_app.de');
  });

  it('shares a PNG through Web Share when file sharing is available', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: vi.fn(() => true) });
    Object.defineProperty(navigator, 'share', { configurable: true, value: share });

    const result = await shareCheckinStory({
      blob: new Blob(['png'], { type: 'image/png' }),
      filename: 'story.png',
      shopName: 'Gelateria',
    });

    expect(result).toEqual({ shared: true, channel: 'web' });
    expect(share).toHaveBeenCalledWith(expect.objectContaining({
      files: [expect.any(File)],
      text: expect.stringContaining('@ice_app.de'),
    }));
  });

  it('returns the download fallback when browsers cannot share files', async () => {
    const result = await shareCheckinStory({
      blob: new Blob(['png'], { type: 'image/png' }),
      filename: 'story.png',
      shopName: 'Gelateria',
    });

    expect(result).toEqual({ shared: false, channel: 'download' });
  });

  it('cleans the cache and shares a local file on native platforms', async () => {
    mocks.isNativePlatform.mockReturnValue(true);
    mocks.rmdir.mockRejectedValueOnce(new Error('missing'));

    const result = await shareCheckinStory({
      blob: new Blob(['png'], { type: 'image/png' }),
      filename: 'story.png',
      shopName: 'Gelateria',
    });

    expect(result).toEqual({ shared: true, channel: 'native' });
    expect(mocks.rmdir).toHaveBeenCalledWith(expect.objectContaining({ recursive: true }));
    expect(mocks.writeFile).toHaveBeenCalledWith(expect.objectContaining({
      directory: 'CACHE',
      path: 'ice-share/story.png',
    }));
    expect(mocks.share).toHaveBeenCalledWith(expect.objectContaining({
      files: ['file:///cache/ice-story.png'],
      dialogTitle: 'Auf Instagram & mehr teilen',
    }));
  });

  it('cleans stale native share files when the composer opens', async () => {
    mocks.isNativePlatform.mockReturnValue(true);

    await cleanupCheckinShareCache();

    expect(mocks.rmdir).toHaveBeenCalledWith({
      path: 'ice-share',
      directory: 'CACHE',
      recursive: true,
    });
  });

  it('uses the legacy copy fallback when Clipboard API is unavailable', async () => {
    document.execCommand = vi.fn(() => true);

    await copyShareText('Story text');

    expect(document.execCommand).toHaveBeenCalledWith('copy');
    expect(document.querySelector('textarea')).toBeNull();
  });
});
