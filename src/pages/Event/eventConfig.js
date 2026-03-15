export const EVENT_DATE = "Samstag, 16. Mai 2026";
export const EVENT_ENTRY_FEE = 15;
export const JERSEY_DISPLAY_PRICE = 75;
export const KIT_DISPLAY_PRICE = 175;
export const EVENT_START_FINISH = {
  shopId: 293,
  name: "Karl mag's süß",
  address: "Untere Aktienstraße 12",
  postalCode: "09111",
  city: "Chemnitz",
  fullAddress: "Untere Aktienstraße 12, 09111 Chemnitz",
  logoUrl: "https://karlmagssuess.de/wp-content/uploads/2024/12/Logo1.png",
  lat: 50.841892,
  lng: 12.923957,
  routeKeys: ["family_2", "classic_3", "epic_4"],
};
export const EVENT_PAYMENT_PAYPAL_ADDRESS = "ch_helbig@mail.de";
export const EVENT_PAYMENT_PAYPAL_URL = "https://paypal.me/ChristianHelbig451";
export const EVENT_PAYMENT_CONTACT_EMAIL = "admin@ice-app.de";
export const EVENT_PAYMENT_PROVIDER_NAME = "Stripe";
export const EVENT_PAYMENT_METHOD_PREFERENCE = "stripe_checkout";
export const EVENT_PAYMENT_CHECKOUT_URL = import.meta.env.VITE_EVENT_STRIPE_CHECKOUT_URL || "";
export const EVENT_ORGANIZER_NAME = "Christian Helbig";
export const EVENT_ORGANIZER_STREET = "Henriettenstraße 45";
export const EVENT_ORGANIZER_POSTAL_CITY = "09112 Chemnitz";
export const EVENT_ORGANIZER_COUNTRY = "Deutschland";
export const EVENT_ORGANIZER_FULL_ADDRESS = `${EVENT_ORGANIZER_STREET}, ${EVENT_ORGANIZER_POSTAL_CITY}`;
export const EVENT_WITHDRAWAL_NOTICE = "Kein Widerrufsrecht bei dieser Anmeldung, da es sich um eine Freizeitveranstaltung mit festem Termin handelt.";
export const EVENT_COMMUNITY_RIDE_CLAIM = "Die Ice-Tour ist eine privat organisierte, nicht-kommerzielle Community-Ausfahrt und ausdrücklich kein Rennen.";
export const EVENT_ENTRY_FEE_NOTICE = "Der Teilnahmebeitrag dient ausschließlich zur Deckung der Organisationskosten. Überschüsse werden gespendet.";

export const ROUTE_OPTIONS = [
  {
    key: "epic_4",
    label: "4 Eis-Stopps",
    shortLabel: "4 Stopps",
    badgeTone: {
      background: "#ffe4e6",
      border: "#fda4af",
      text: "#9f1239",
      glow: "rgba(244, 63, 94, 0.18)",
    },
    teaser: "175 km / 1.950 hm",
    distanceKm: 175,
    elevationM: 1950,
    stops: 4,
    routeType: "sport",
    paceEnabled: true,
    startMode: "grouped",
    description: "Die volle Runde mit vier Eis-Stopps für alle, die viele Kilometer, viel Eis und einen langen Community-Ride wollen.",
  },
  {
    key: "classic_3",
    label: "3 Eis-Stopps",
    shortLabel: "3 Stopps",
    badgeTone: {
      background: "#fff3c4",
      border: "#f7c948",
      text: "#8a5700",
      glow: "rgba(247, 201, 72, 0.2)",
    },
    teaser: "140 km / 1.600 hm",
    distanceKm: 140,
    elevationM: 1600,
    stops: 3,
    routeType: "sport",
    paceEnabled: true,
    startMode: "grouped",
    description: "Die klassische Ice-Tour mit drei Eisdielen-Checkpoints und gemeinsamer Ausfahrt in kleinen Gruppen.",
  },
  {
    key: "family_2",
    label: "Einsteiger-/Familientour",
    shortLabel: "Familie",
    badgeTone: {
      background: "#dcfce7",
      border: "#86efac",
      text: "#166534",
      glow: "rgba(34, 197, 94, 0.18)",
    },
    teaser: "ca. 75 km / 550 hm",
    distanceKm: 75,
    elevationM: 550,
    stops: 2,
    routeType: "family",
    paceEnabled: false,
    startMode: "open_window",
    description: "Die kurze, flachere Runde mit zwei Eisdielen-Checkpoints und entspanntem Startfenster ohne Leistungsdruck.",
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

export function getRouteByLabel(routeLabel) {
  return ROUTE_OPTIONS.find((route) => route.label === routeLabel) || ROUTE_MAP.classic_3;
}

export function getRouteLabel(routeKey) {
  return getRouteByKey(routeKey).label;
}

export function getRouteTheme(routeKey) {
  return getRouteByKey(routeKey).badgeTone;
}

export function getRouteThemeByLabel(routeLabel) {
  return getRouteByLabel(routeLabel).badgeTone;
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
