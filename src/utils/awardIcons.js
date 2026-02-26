const ASSET_BASE = (import.meta.env.VITE_ASSET_BASE_URL || "https://ice-app.de/").replace(/\/+$/, "");

function normalizeRelativePath(path) {
  if (!path || typeof path !== "string") return null;
  return path.replace(/^\/+/, "");
}

export function toAwardVariantPath(path, maxDim = 512) {
  const normalized = normalizeRelativePath(path);
  if (!normalized) return null;

  const match = normalized.match(/^(.*)\.([a-zA-Z0-9]+)$/);
  if (!match) return null;

  const [, withoutExt, ext] = match;
  if (ext.toLowerCase() === "svg") return normalized;
  if (withoutExt.endsWith(`__w${maxDim}`) && ext.toLowerCase() === "webp") return normalized;

  return `${withoutExt}__w${maxDim}.webp`;
}

export function buildAwardIconUrl(path, { optimized = true, maxDim = 512 } = {}) {
  const relativePath = optimized ? toAwardVariantPath(path, maxDim) : normalizeRelativePath(path);
  if (!relativePath) return null;
  return `${ASSET_BASE}/${relativePath}`;
}

export function getAwardIconSources(path, maxDim = 512) {
  const fallbackSrc = buildAwardIconUrl(path, { optimized: false });
  const optimizedSrc = buildAwardIconUrl(path, { optimized: true, maxDim }) || fallbackSrc;

  return {
    src: optimizedSrc,
    fallbackSrc,
  };
}

export function handleAwardIconFallback(event) {
  const img = event.currentTarget;
  const fallbackSrc = img?.dataset?.fallbackSrc;
  if (!fallbackSrc) return;
  if (img.dataset.fallbackApplied === "1") return;

  img.dataset.fallbackApplied = "1";
  img.src = fallbackSrc;
}

