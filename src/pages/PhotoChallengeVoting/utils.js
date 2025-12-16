import { useMemo, useCallback } from 'react';

export const describeRoundByParticipants = (count) => {
  if (!count || count <= 0) return null;
  if (count <= 2) return 'Finale';
  if (count === 4) return 'Halbfinale';
  if (count === 8) return 'Viertelfinale';
  if (count === 16) return 'Achtelfinale';
  if (count === 32) return 'Sechzehntelfinale';
  if (count === 64) return 'Zweiunddreißigstelfinale';
  return `${count}-er Runde`;
};

export const useKoRoundLabel = (overview) => {
  const firstRoundParticipants = useMemo(() => {
    const firstRoundMatches = (overview?.ko_matches || []).filter((match) => (Number(match.round) || 0) === 1);
    return firstRoundMatches.length * 2;
  }, [overview?.ko_matches]);

  return useCallback(
    (roundNumber) => {
      if (!firstRoundParticipants) return `KO-Runde ${roundNumber}`;
      const divisor = Math.max(0, roundNumber - 1);
      const participants = Math.max(1, Math.floor(firstRoundParticipants / 2 ** divisor));
      return describeRoundByParticipants(participants) || `KO-Runde ${roundNumber}`;
    },
    [firstRoundParticipants]
  );
};

const ASSET_BASE = (process.env.REACT_APP_ASSET_BASE_URL || 'https://ice-app.de/').replace(/\/+$/, '');
export const buildAssetUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//.test(path)) return path;
  return `${ASSET_BASE}/${path.replace(/^\/+/, '')}`;
};

export const shuffleArray = (items = []) => {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};
