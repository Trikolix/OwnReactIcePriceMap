export const photoStatusLabel = status => ({
  draft: 'Entwurf', active: 'In Vorbereitung', submission_open: 'Fotos einreichen', submission_closed: 'In Vorbereitung',
  group_running: 'Abstimmung in Gruppen', ko_running: 'KO-Abstimmung', finished: 'Abgeschlossen',
}[status] || 'Foto-Challenge');

// PHP DATETIME values are Berlin wall time, independently of the browser timezone.
export function photoDateValue(value) {
  if (!value) return null;
  if (/Z$|[+-]\d\d:\d\d$/.test(value)) { const date = new Date(value); return Number.isFinite(date.getTime()) ? date : null; }
  const wall = Date.parse(String(value).replace(' ', 'T') + 'Z');
  if (!Number.isFinite(wall)) return null;
  let result = wall;
  const seen = new Set();
  for (let i = 0; i < 3; i++) {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(result));
    const p = Object.fromEntries(parts.map(item => [item.type, item.value]));
    const represented = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
    if (represented === wall) return new Date(result);
    const next = result + wall - represented;
    // PHP moves nonexistent spring-transition wall times forward to the next valid hour.
    if (seen.has(next)) return new Date(Math.max(result, next));
    seen.add(result); result = next;
  }
  return new Date(result);
}
export function photoDate(value) {
  const date = photoDateValue(value);
  return date && Number.isFinite(date.getTime()) ? date.toLocaleString('de-DE', { timeZone: 'Europe/Berlin', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Termin folgt';
}
