export const EVENT_ROUTE_RELEASE_NOTICE = "GPX-Datei und Komoot-Link werden noch freigeschaltet.";
export const EVENT_LIVE_MAP_RELEASE_NOTICE = "Die Live-Karte wird am 13. Mai 2026 öffentlich freigeschaltet.";

export const EVENT_PARKING = {
  name: "Parkplatz Heinrich-Zille-Straße",
  coordinates: "50.842370, 12.926894",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=50.842370%2C%2012.926894",
};

export const EVENT_PARKING_DIRECTIONS_URL =
  "https://www.google.com/maps/dir/?api=1&origin=50.842370%2C%2012.926894&destination=Untere%20Aktienstra%C3%9Fe%2012%2C%2009111%20Chemnitz&travelmode=walking";

export const EVENT_PARKING_DIRECTIONS_EMBED_URL =
  "https://www.google.com/maps?f=d&source=s_d&saddr=50.842370%2C%2012.926894&daddr=Untere%20Aktienstra%C3%9Fe%2012%2C%2009111%20Chemnitz&hl=de&output=embed";

export const EVENT_ROUTE_RESOURCES = {
  family_2: {
    gpxUrl: "",
    komootUrl: "",
  },
  classic_3: {
    gpxUrl: "",
    komootUrl: "",
  },
  epic_4: {
    gpxUrl: "",
    komootUrl: "",
  },
};


const generalRouteHints = [
  "Die Strecke verläuft teilweise auf Radwegen sowie kombinierten Rad- und Fußwegen. Bei schönem Wetter kann dort viel los sein: Nehmt besonders Rücksicht auf Fußgänger und andere Radfahrer.",
];

const sportRouteHints = [
  "Zwischen Zwönitz und Geyer über die Geyrische Platte kann teilweise viel Verkehr sein. Fahrt dort besonders rücksichtsvoll, bildet bei Bedarf kleinere Grüppchen und lasst Autos aktiv vorbei.",
  "In der Abfahrt nach dem Ortsausgang von Geyer kommt in einer Rechtskurve eine Abzweigung nach Am Wochenende sollte es eigentlich gehen, aber gebt trotzdem besonders Acht.",
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
  "Falls du deine Runde aus irgendeinem Grund nicht zu Ende fahren kannst, gib dem Orga-Team bitte kurz Bescheid. Schreib mir über Instagram, per Mail, WhatsApp oder lass die Info über andere Teilnehmer weitergeben. So wissen wir im Ziel, dass alles okay ist, und müssen uns keine Sorgen machen, wo du bleibst.",
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

export function buildScheduleItems(startTime, routeKey) {
  const parsedStart = parseEventDateTime(startTime);

  const baseItems = [
    {
      time: "ab 07:00 Uhr",
      title: "Treff bei Karl mag's süß",
      text: "Wir sind ab 7 Uhr vor Ort und du kannst etwas zu essen und trinken bekommen.",
    },
    {
      time: "unterwegs",
      title: "Tour entlang deiner Strecke",
      text: "Fahre die Checkpoints selbstständig per Navigation an und nutze an den Eisdielen deine digitale Stempelkarte.",
    },
    {
      time: "nachmittags",
      title: "Ziel & gemeinsamer Abschluss",
      text: "Die Strecke endet wieder bei Karl mag's süß. Dort gibt es Wasser, die übliche Kugel Eis und reduzierte Getränke sowie herzhafte Sandwiches für Teilnehmer.",
    },
  ];

  if (!parsedStart) {
    if (routeKey === "family_2") {
      return [
        baseItems[0],
        {
          time: "11:00 - 12:30 Uhr",
          title: "Start Genussrunde",
          text: "Du kannst in diesem Zeitraum flexibel starten.",
        },
        baseItems[1],
        baseItems[2],
      ];
    }
    return [
      baseItems[0],
      {
        time: "folgt",
        title: "Start in deiner Gruppe",
        text: "Genaue Zeit wird noch bekannt gegeben.",
      },
      baseItems[1],
      baseItems[2],
    ];
  }

  if (routeKey === "family_2") {
    return [
      baseItems[0],
      {
        time: "11:00 - 12:30 Uhr",
        title: "Start Genussrunde",
        text: "Du kannst in diesem Zeitraum flexibel starten.",
      },
      baseItems[1],
      baseItems[2],
    ];
  }

  const gatherTime = new Date(parsedStart.getTime() - 10 * 60 * 1000);
  return [
    baseItems[0],
    {
      time: formatEventTime(gatherTime),
      title: "Startbereit einfinden",
      text: "Bitte finde dich 10 Minuten vor deinem Start abfahrbereit am Startbereich ein.",
    },
    {
      time: formatEventTime(parsedStart),
      title: "Start in deiner Gruppe",
      text: "Startzeit deiner zugewiesenen Gruppe.",
    },
    baseItems[1],
    baseItems[2],
  ];
}

export function getRouteHints(routeKey) {
  if (routeKey === "classic_3" || routeKey === "epic_4") {
    return [...sportRouteHints, ...generalRouteHints];
  }

  return generalRouteHints;
}
