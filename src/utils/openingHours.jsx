export const WEEKDAYS = [
  { weekday: 1, label: "Montag", abbr: "Mo" },
  { weekday: 2, label: "Dienstag", abbr: "Di" },
  { weekday: 3, label: "Mittwoch", abbr: "Mi" },
  { weekday: 4, label: "Donnerstag", abbr: "Do" },
  { weekday: 5, label: "Freitag", abbr: "Fr" },
  { weekday: 6, label: "Samstag", abbr: "Sa" },
  { weekday: 7, label: "Sonntag", abbr: "So" },
];

const clampNumber = (value, min, max) => Math.min(Math.max(value, min), max);

const normalizeTimeValue = (value) => {
  if (!value && value !== 0) return "";
  const raw = String(value).trim();
  if (!raw) return "";
  const cleaned = raw.replace(/[^0-9:.]/g, "");
  if (cleaned.includes(":")) {
    const [h = "0", m = "0"] = cleaned.split(":");
    const hours = clampNumber(parseInt(h, 10) || 0, 0, 23);
    const minutes = clampNumber(parseInt(m, 10) || 0, 0, 59);
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }
  if (cleaned.includes(".")) {
    const [h = "0", m = "0"] = cleaned.split(".");
    const hours = clampNumber(parseInt(h, 10) || 0, 0, 23);
    const minutes = clampNumber(parseInt(m, 10) || 0, 0, 59);
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }
  const digits = cleaned.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length > 2) {
    const minutes = clampNumber(parseInt(digits.slice(-2), 10) || 0, 0, 59);
    const hours = clampNumber(parseInt(digits.slice(0, -2), 10) || 0, 0, 23);
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }
  const hours = clampNumber(parseInt(digits, 10) || 0, 0, 23);
  return `${String(hours).padStart(2, "0")}:00`;
};

export const createEmptyOpeningHours = () => ({
  timezone: "Europe/Berlin",
  note: "",
  days: WEEKDAYS.map((day) => ({
    ...day,
    ranges: [],
  })),
});

export const hydrateOpeningHours = (raw, fallbackNote = "") => {
  const template = createEmptyOpeningHours();
  if (!raw || typeof raw !== "object") {
    if (fallbackNote) {
      template.note = fallbackNote;
    }
    return template;
  }

  const dayMap = {};
  template.days.forEach((day) => {
    dayMap[day.weekday] = { ...day, ranges: [] };
  });

  const inputDays = Array.isArray(raw.days) ? raw.days : [];
  inputDays.forEach((day) => {
    const weekday = Number(day?.weekday);
    if (!dayMap[weekday]) return;
    const ranges = Array.isArray(day.ranges) ? day.ranges : [];
    ranges.forEach((range) => {
      const open = normalizeTimeValue(range?.open);
      const close = normalizeTimeValue(range?.close);
      if (!open || !close) return;
      dayMap[weekday].ranges.push({
        open,
        close,
        overnight: Boolean(range?.overnight),
      });
    });
  });

  return {
    timezone: raw.timezone || template.timezone,
    note: raw.note ?? fallbackNote ?? "",
    days: Object.values(dayMap),
  };
};

const formatDayRange = (days) => {
  if (!days.length) return "";
  const sorted = [...days].sort((a, b) => a - b);
  const sequences = [];
  let start = sorted[0];
  let prev = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    if (current === prev + 1) {
      prev = current;
      continue;
    }
    sequences.push([start, prev]);
    start = current;
    prev = current;
  }
  sequences.push([start, prev]);

  return sequences
    .map(([seqStart, seqEnd]) => {
      const startLabel = WEEKDAYS.find((d) => d.weekday === seqStart)?.abbr ?? seqStart;
      if (seqStart === seqEnd) {
        return startLabel;
      }
      const endLabel = WEEKDAYS.find((d) => d.weekday === seqEnd)?.abbr ?? seqEnd;
      return `${startLabel}-${endLabel}`;
    })
    .join(", ");
};

export const formatOpeningHoursLines = (structured) => {
  if (!structured || !Array.isArray(structured.days)) {
    return [];
  }
  const entries = new Map();

  structured.days.forEach((day) => {
    if (!Array.isArray(day.ranges) || day.ranges.length === 0) {
      return;
    }
    const signature = day.ranges
      .map((range) => `${range.open}-${range.close}${range.overnight ? " (↦)" : ""}`)
      .join(" | ");
    if (!entries.has(signature)) {
      entries.set(signature, {
        text: signature.replace(/\|/g, ",").replace(/\(↦\)/g, "⤷"),
        days: [],
      });
    }
    entries.get(signature).days.push(day.weekday);
  });

  const lines = Array.from(entries.values()).map(({ text, days }) => {
    const dayLabel = formatDayRange(days);
    return dayLabel ? `${dayLabel}: ${text}` : text;
  });

  if (structured.note) {
    lines.push(`Hinweis: ${structured.note}`);
  }

  return lines;
};

export const mergeOpeningHoursChanges = (state, weekday, updater) => {
  if (!state) return createEmptyOpeningHours();
  const days = state.days.map((day) =>
    day.weekday === weekday ? updater(day) : day
  );
  return { ...state, days };
};
