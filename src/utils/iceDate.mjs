export const ICE_DATE_DRAFT_KEY = "ice-date:draft:v1";
export const RSVP_LABELS = { going: "Dabei", maybe: "Vielleicht", declined: "Nicht dabei", invited: "Eingeladen" };

export const toApiDate = value => value ? value.replace("T", " ") + (value.length === 16 ? ":00" : "") : "";
export const dateTimestamp = value => new Date(String(value || "").replace(" ", "T")).getTime();
export const formatDate = value => Number.isFinite(dateTimestamp(value)) ? new Date(dateTimestamp(value)).toLocaleString("de-DE", {
  weekday: "short", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
}) : "Termin fehlt";

export function localDateInput(date) {
  const pad = value => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function defaultStart(now = new Date()) {
  const date = new Date(now);
  date.setDate(date.getDate() + 2);
  date.setHours(18, 0, 0, 0);
  return localDateInput(date);
}

export function readDraft(storage) {
  try {
    const draft = JSON.parse(storage.getItem(ICE_DATE_DRAFT_KEY));
    if (!draft || typeof draft !== "object") return null;
    return {
      shopId: Number(draft.shopId) > 0 ? String(Number(draft.shopId)) : "",
      startsAt: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(draft.startsAt) ? draft.startsAt : defaultStart(),
      title: String(draft.title || "").slice(0, 120), note: String(draft.note || "").slice(0, 2000),
      selectedUsers: [...new Map((Array.isArray(draft.selectedUsers) ? draft.selectedUsers : [])
        .filter(user => Number(user?.id) > 0 && typeof user.username === "string")
        .map(user => [Number(user.id), { id: Number(user.id), username: user.username }])).values()].slice(0, 7),
    };
  } catch { return null; }
}

export function groupDates(dates, now = Date.now()) {
  const upcoming = [], past = [];
  for (const date of dates) {
    (date.status === "planned" && dateTimestamp(date.starts_at) >= now - 86400000 ? upcoming : past).push(date);
  }
  upcoming.sort((a, b) => dateTimestamp(a.starts_at) - dateTimestamp(b.starts_at));
  past.sort((a, b) => dateTimestamp(b.starts_at) - dateTimestamp(a.starts_at));
  return { upcoming, past };
}

export function reservationCounts(date) {
  const capacity = date.capacity ?? 8;
  const reserved = date.reserved_count ?? 1 + (date.participants || []).filter(p => p.role !== "organizer" && p.status !== "declined").length;
  return { capacity, reserved, free: date.free_places ?? Math.max(0, capacity - reserved) };
}
