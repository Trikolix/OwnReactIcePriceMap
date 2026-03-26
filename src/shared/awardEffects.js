export const AWARD_SHIMMER_ENABLED = false;

export const getAwardEpicTier = (ep) => {
  const safeEp = Number(ep) || 0;
  if (safeEp >= 1000) return "mythic";
  if (safeEp >= 500) return "legendary";
  if (safeEp >= 250) return "epic";
  return "base";
};

export const getActiveAwardEffectTier = (ep) =>
  AWARD_SHIMMER_ENABLED ? getAwardEpicTier(ep) : "base";
