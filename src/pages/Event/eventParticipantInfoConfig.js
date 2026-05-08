export const EVENT_ROUTE_RELEASE_NOTICE = "GPX-Datei und Komoot-Link werden noch freigeschaltet.";

export const EVENT_PARKING = {
  name: "Parkplatz Heinrich-Zille-Straße",
  coordinates: "50.842370, 12.926894",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=50.842370%2C%2012.926894",
};

export const EVENT_PARKING_DIRECTIONS_URL =
  "https://www.google.com/maps/dir/?api=1&origin=50.842370%2C%2012.926894&destination=Untere%20Aktienstra%C3%9Fe%2012%2C%2009111%20Chemnitz&travelmode=walking";

export const EVENT_PARKING_DIRECTIONS_EMBED_URL =
  "https://www.google.com/maps?f=d&source=s_d&saddr=50.842370%2C%2012.926894&daddr=Untere%20Aktienstra%C3%9Fe%2012%2C%2009111%20Chemnitz&hl=de&output=embed";

const baseScheduleItems = [
  {
    time: "folgt",
    title: "Am Start sammeln",
    text: "Genaue Zeit wird noch bekannt gegeben. Vor Ort gibt es ggf. noch ein kleines Frühstück und eine kurze Einweisung.",
  },
  {
    time: "folgt",
    title: "Start in deiner Gruppe",
    text: "Genaue Zeit wird noch bekannt gegeben.",
  },
  {
    time: "nachmittags",
    title: "Rückkehr & gemeinsamer Abschluss",
    text: "Wenn du fertig bist, gibt es im Ziel nochmal ein Eis, aber auch andere herzhafte Leckereien. Danach ist gemütlicher Ausklang bei Essen, Trinken und Gesprächen.",
  },
];

const generalRouteHints = [
  "Die Strecke verläuft teilweise auf Radwegen sowie kombinierten Rad- und Fußwegen. Bei schönem Wetter kann dort viel los sein: Nehmt besonders Rücksicht auf Fußgänger und andere Radfahrer.",
];

const sportRouteHints = [
  "In der Abfahrt nach Geyer kommt in einer Rechtskurve eine Abzweigung nach links in den Wald, die ihr nehmen sollt. Fahrt dort vorsichtig.",
  "Zwischen Zwönitz und Geyer über die Geyrische Platte kann teilweise viel Verkehr sein. Fahrt dort besonders rücksichtsvoll, bildet bei Bedarf kleinere Grüppchen und lasst Autos aktiv vorbei.",
];

export const packingItems = [
  "Straßentaugliches Rad",
  "Gefüllte Trinkflaschen",
  "GPS Radcomputer oder Handy",
  "Helm",
  "Notfallwerkzeug / Flickzeug",
  "Sonnencreme",
  "etwas Bargeld für Zusatz-Eis und Notfälle",
  "Riegel / Gel nach Bedarf",
  "Ice-App auf dem Handy",
];

export const groupRules = [
  "Wir fahren freundlich und rücksichtsvoll miteinander.",
  "Die Ice-Tour ist kein Rennen.",
  "Es gibt keine abgesperrten Straßen.",
  "Die StVO gilt jederzeit.",
  "In der Gruppe wird berechenbar gefahren: keine hektischen Manöver, klare Handzeichen, sauber einordnen.",
  "Jeder fährt auf eigenes Risiko, wir übernehmen keine Haftung für Unfälle oder Schäden.",
];

export function parseEventDateTime(value) {
  if (!value) return null;
  const parsed = new Date(String(value).replace(" ", "T"));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatEventTime(value) {
  const parsed = value instanceof Date ? value : parseEventDateTime(value);
  if (!parsed) return "folgt";
  return parsed.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) + " Uhr";
}

export function buildScheduleItems(startTime) {
  const parsedStart = parseEventDateTime(startTime);
  if (!parsedStart) return baseScheduleItems;

  const gatherTime = new Date(parsedStart.getTime() - 20 * 60 * 1000);
  return [
    {
      time: formatEventTime(gatherTime),
      title: "Am Start sammeln",
      text: "Bitte abfahrbereit mit Rad und Ausrüstung am Startbereich einfinden. Vor Ort gibt es ggf. noch ein kleines Frühstück und eine kurze Einweisung.",
    },
    {
      time: formatEventTime(parsedStart),
      title: "Start in deiner Gruppe",
      text: "Startzeit deiner zugewiesenen Gruppe.",
    },
    baseScheduleItems[2],
  ];
}

export function getRouteHints(routeKey) {
  if (routeKey === "classic_3" || routeKey === "epic_4") {
    return [...sportRouteHints, ...generalRouteHints];
  }

  return generalRouteHints;
}
