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
  const participantsByRound = useMemo(() => {
    const map = new Map();
    (overview?.ko_matches || []).forEach((match) => {
      const round = Number(match.round) || 0;
      if (round <= 0) return;
      map.set(round, (map.get(round) || 0) + 2);
    });
    return map;
  }, [overview?.ko_matches]);

  return useCallback(
    (roundNumber) => {
      const participants = participantsByRound.get(roundNumber);
      if (!participants) return `KO-Runde ${roundNumber}`;
      return describeRoundByParticipants(participants) || `KO-Runde ${roundNumber}`;
    },
    [participantsByRound]
  );
};

const ASSET_BASE = (import.meta.env.VITE_ASSET_BASE_URL || 'https://ice-app.de/').replace(/\/+$/, '');
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
