const ASSET_BASE = (process.env.REACT_APP_ASSET_BASE_URL || "https://ice-app.de/").replace(/\/+$/, "");

export const buildAssetUrl = (path) => {
  if (!path) return null;
  const normalized = path.replace(/^\/+/, "");
  return `${ASSET_BASE}/${normalized}`;
};

export const getInitials = (name) => {
  if (!name) return "?";
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return trimmed.charAt(0).toUpperCase();
};
