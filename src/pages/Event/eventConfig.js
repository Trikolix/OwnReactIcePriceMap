export const EVENT_ENTRY_FEE = 15;
export const JERSEY_DISPLAY_PRICE = 75;
export const KIT_DISPLAY_PRICE = 175;

export const ROUTE_OPTIONS = [
  {
    key: "epic_4",
    label: "4 Eis-Stopps",
    teaser: "175 km / 1.950 hm",
    distanceKm: 175,
    elevationM: 1950,
    stops: 4,
    routeType: "sport",
    paceEnabled: true,
    startMode: "grouped",
    description: "Die volle Runde mit vier Pflicht-Stopps für alle, die einen langen Eventtag wollen.",
  },
  {
    key: "classic_3",
    label: "3 Eis-Stopps",
    teaser: "140 km / 1.600 hm",
    distanceKm: 140,
    elevationM: 1600,
    stops: 3,
    routeType: "sport",
    paceEnabled: true,
    startMode: "grouped",
    description: "Die klassische Ice-Tour mit drei Eisdielen-Checkpoints und sportlichem Gruppenstart.",
  },
  {
    key: "family_2",
    label: "Einsteiger-/Familientour",
    teaser: "ca. 75 km / 550 hm",
    distanceKm: 75,
    elevationM: 550,
    stops: 2,
    routeType: "family",
    paceEnabled: false,
    startMode: "open_window",
    description: "Die entspannte Variante mit Schöne und Klatt Eis, ohne sportliche Tempogruppe.",
  },
];

export const ROUTE_MAP = Object.fromEntries(ROUTE_OPTIONS.map((route) => [route.key, route]));

export const PACE_OPTIONS = [
  { value: "unter_24", label: "unter 24 km/h" },
  { value: "24_27", label: "24-27 km/h" },
  { value: "27_30", label: "27-30 km/h" },
  { value: "ueber_30", label: "über 30 km/h" },
];

export const PACE_LABELS = Object.fromEntries(PACE_OPTIONS.map((pace) => [pace.value, pace.label]));
PACE_LABELS.family = "Freies Startfenster";

export const TSHIRT_SIZES = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "14"];
export const BIB_SIZES = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

export const CLOTHING_OPTIONS = [
  { value: "none", label: "Kein Interesse", displayPrice: null },
  { value: "jersey_interest", label: "Trikot-Interesse", displayPrice: JERSEY_DISPLAY_PRICE },
  { value: "kit_interest", label: "Set-Interesse", displayPrice: KIT_DISPLAY_PRICE },
];

export const CLOTHING_LABELS = Object.fromEntries(CLOTHING_OPTIONS.map((option) => [option.value, option.label]));

export function getRouteByKey(routeKey) {
  return ROUTE_MAP[routeKey] || ROUTE_MAP.classic_3;
}

export function getRouteLabel(routeKey) {
  return getRouteByKey(routeKey).label;
}

export function routeSupportsPace(routeKey) {
  return Boolean(getRouteByKey(routeKey).paceEnabled);
}

export function getPaceLabel(paceGroup) {
  return PACE_LABELS[paceGroup] || paceGroup || "-";
}

export function getClothingLabel(clothingInterest) {
  return CLOTHING_LABELS[clothingInterest] || CLOTHING_LABELS.none;
}
