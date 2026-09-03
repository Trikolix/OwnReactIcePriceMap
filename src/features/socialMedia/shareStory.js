import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export const INSTAGRAM_PROFILE_URL = 'https://www.instagram.com/ice_app.de';

export const buildCheckinShareText = (shopName) => (
  `Mein Eis-Check-in bei ${shopName || 'einer Eisdiele'} – entdeckt mit @ice_app.de\n${INSTAGRAM_PROFILE_URL}`
);

const blobToBase64 = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(reader.error || new Error('Bild konnte nicht vorbereitet werden.'));
  reader.onload = () => resolve(String(reader.result || '').split(',')[1] || '');
  reader.readAsDataURL(blob);
});

const SHARE_CACHE_DIRECTORY = 'ice-share';

export const cleanupCheckinShareCache = async () => {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await Filesystem.rmdir({ path: SHARE_CACHE_DIRECTORY, directory: Directory.Cache, recursive: true });
  } catch {
    // The cache directory does not exist on the first share.
  }
};

const shareNative = async ({ blob, filename, shopName }) => {
  await cleanupCheckinShareCache();
  await Filesystem.mkdir({ path: SHARE_CACHE_DIRECTORY, directory: Directory.Cache, recursive: true });
  const safeFilename = String(filename || 'ice-story.png').replace(/[^a-zA-Z0-9_.-]/g, '_');
  const filePath = `${SHARE_CACHE_DIRECTORY}/${safeFilename}`;
  const result = await Filesystem.writeFile({
    path: filePath,
    directory: Directory.Cache,
    data: await blobToBase64(blob),
  });
  await Share.share({
    title: `Eis-Check-in bei ${shopName}`,
    text: buildCheckinShareText(shopName),
    url: INSTAGRAM_PROFILE_URL,
    files: [result.uri],
    dialogTitle: 'Auf Instagram & mehr teilen',
  });
  return { shared: true, channel: 'native' };
};

const shareWeb = async ({ blob, filename, shopName }) => {
  const file = new File([blob], filename || 'ice-story.png', { type: 'image/png' });
  const fileSupported = typeof navigator.canShare === 'function'
    && navigator.canShare({ files: [file] });
  if (typeof navigator.share !== 'function' || !fileSupported) {
    return { shared: false, channel: 'download' };
  }
  await navigator.share({
    title: `Eis-Check-in bei ${shopName}`,
    text: buildCheckinShareText(shopName),
    url: INSTAGRAM_PROFILE_URL,
    files: [file],
  });
  return { shared: true, channel: 'web' };
};

export const shareCheckinStory = async (options) => (
  Capacitor.isNativePlatform() ? shareNative(options) : shareWeb(options)
);

export const downloadStoryBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename || 'ice-story.png';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

export const copyShareText = async (text) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand?.('copy');
  textarea.remove();
  if (!copied) {
    throw new Error('Begleittext konnte nicht kopiert werden.');
  }
};
