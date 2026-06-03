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

const COUNTRY_BY_LABEL = [
  ['Deutschland', 'DE'],
  ['Italien', 'IT'],
  ['Frankreich', 'FR'],
  ['Zypern', 'CY'],
  ['Schweiz', 'CH'],
  ['Tschechien', 'CZ'],
  ['Portugal', 'PT'],
  ['Malta', 'MT'],
  ['Österreich', 'AT'],
  ['Kroatien', 'HR'],
  ['Vereinigtes Königreich', 'GB'],
  ['Spanien', 'ES'],
  ['Niederlande', 'NL'],
  ['China', 'CN'],
  ['Vereinigte Staaten von Amerika', 'US'],
  ['Polen', 'PL'],
  ['Japan', 'JP'],
  ['Ungarn', 'HU'],
  ['Britische Jungferninseln', 'VG'],
  ['Belgien', 'BE'],
  ['Südkorea', 'KR'],
  ['Griechenland', 'GR'],
  ['St. Kitts und Nevis', 'KN'],
  ['Island', 'IS'],
  ['Kasachstan', 'KZ'],
  ['Türkei', 'TR'],
  ['Usbekistan', 'UZ'],
];

const COUNTRY_ALIASES = {
  gb: 'Vereinigtes Königreich',
  uk: 'Vereinigtes Königreich',
  grossbritannien: 'Vereinigtes Königreich',
  großbritannien: 'Vereinigtes Königreich',
  'vereinigte staaten': 'Vereinigte Staaten von Amerika',
  usa: 'Vereinigte Staaten von Amerika',
  us: 'Vereinigte Staaten von Amerika',
  amerika: 'Vereinigte Staaten von Amerika',
  bvi: 'Britische Jungferninseln',
  'british virgin islands': 'Britische Jungferninseln',
  korea: 'Südkorea',
  suedkorea: 'Südkorea',
  'süd korea': 'Südkorea',
  'st kitts nevis': 'St. Kitts und Nevis',
  'saint kitts und nevis': 'St. Kitts und Nevis',
  'saint kitts and nevis': 'St. Kitts und Nevis',
};

const normalizeCountryLabel = (value = '') =>
  String(value)
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’'`´]/g, '')
    .replace(/&/g, ' und ')
    .replace(/\bst[.]/gi, 'st')
    .replace(/[^a-z0-9]+/gi, ' ')
    .trim()
    .toLowerCase();

const countryByNormalizedLabel = new Map(
  COUNTRY_BY_LABEL.map(([name, code]) => [normalizeCountryLabel(name), { name, code }])
);

Object.entries(COUNTRY_ALIASES).forEach(([alias, name]) => {
  const target = COUNTRY_BY_LABEL.find(([countryName]) => countryName === name);
  if (target) {
    countryByNormalizedLabel.set(normalizeCountryLabel(alias), { name: target[0], code: target[1] });
  }
});

export const getPhotoChallengeCountry = (title) => {
  const normalizedTitle = normalizeCountryLabel(title);
  if (!normalizedTitle) return null;
  const country = countryByNormalizedLabel.get(normalizedTitle);
  if (!country) return null;
  const flagCode = country.code.toLowerCase();
  return {
    ...country,
    flagUrl: `https://flagcdn.com/w80/${flagCode}.png`,
    flagSrcSet: `https://flagcdn.com/w80/${flagCode}.png 1x, https://flagcdn.com/w160/${flagCode}.png 2x`,
  };
};

export const isWorldCupPhotoChallenge = (challenge) => {
  const normalizedText = normalizeCountryLabel(`${challenge?.title || ''} ${challenge?.description || ''}`);
  if (!normalizedText) return false;
  const tokens = normalizedText.split(/\s+/);
  return (
    tokens.includes('wm') ||
    normalizedText.includes('weltmeisterschaft') ||
    normalizedText.includes('world cup') ||
    normalizedText.includes('worldcup')
  );
};
