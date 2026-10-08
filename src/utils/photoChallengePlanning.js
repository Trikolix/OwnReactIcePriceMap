import { photoDateValue } from './photoChallengePresentation';

const groupSizes = count => [2, 3, 4, 5, 6, 7, 8].filter(size => count >= size * 2 && count % size === 0)
  .sort((a, b) => Math.abs(a - 4) - Math.abs(b - 4) || a - b);
export function suggestPhotoPlan(count) {
  const size = groupSizes(count)[0];
  if (!size) {
    let lower = count - 1; while (lower >= 4 && !groupSizes(lower).length) lower--;
    let upper = Math.max(4, count + 1); while (!groupSizes(upper).length) upper++;
    return { valid: false, lower: lower >= 4 ? lower : null, upper };
  }
  const groups = count / size;
  const advancers = size === 2 ? 1 : 2;
  const direct = groups * advancers;
  const power = 2 ** Math.ceil(Math.log2(direct));
  const ko = power <= count ? power : direct + direct % 2;
  return { valid: true, groupSize: size, plannedGroupCount: groups, groupAdvancers: advancers, luckyLoserSlots: ko - direct, koBracketSize: ko };
}
export function evaluatePhotoPlan(count, form) {
  const errors = [];
  const size = Number(form.groupSize); const advancers = Number(form.groupAdvancers); const lucky = Number(form.luckyLoserSlots);
  const groups = Number.isInteger(size) && size > 0 ? count / size : 0;
  if (!Number.isInteger(size) || size < 2 || size > 8) errors.push('Wähle zwei bis acht Bilder pro Gruppe.');
  if (!Number.isInteger(groups) || groups < 2) errors.push(`Die ${count} Bilder müssen sich vollständig auf mindestens zwei gleich große Gruppen verteilen lassen.`);
  if (!Number.isInteger(advancers) || advancers < 1 || advancers > size) errors.push('Die Weiterkommenden müssen zwischen eins und der Gruppengröße liegen.');
  if (!Number.isInteger(lucky) || lucky < 0) errors.push('Die Anzahl zusätzlicher Qualifikationsplätze muss eine ganze Zahl ab null sein.');
  const direct = Math.floor(groups) * advancers;
  const available = direct + Math.min(lucky, Math.max(0, count - direct));
  let ko = form.koBracketSize === '' || form.koBracketSize == null ? direct + direct % 2 : Number(form.koBracketSize);
  if (form.koBracketSize === '' || form.koBracketSize == null) {
    const power = 2 ** Math.ceil(Math.log2(Math.max(2, ko)));
    if (power <= available) ko = power;
  }
  if (!Number.isInteger(ko) || ko < 2 || ko % 2 || ko < direct || ko > available) errors.push('Für dieses KO-Feld fehlen passende Qualifikationsplätze. Übernimm einen Vorschlag oder passe die Details an.');
  const slots = form.groupSchedule || [];
  if (!slots.length && !photoDateValue(form.startAt)) errors.push('Lege einen Start für den Zeitplan fest.');
  slots.forEach((slot, index) => {
    if (!photoDateValue(slot.startAt || form.startAt) || !Number.isInteger(Number(slot.durationDays)) || Number(slot.durationDays) < 1 || !Number.isInteger(Number(slot.groups)) || Number(slot.groups) < 1)
      errors.push(`Zeitblock ${index + 1}: Start, Dauer und Gruppenanzahl müssen vollständig ausgefüllt sein.`);
  });
  return { errors, groups: Math.floor(groups), direct, ko, extra: Math.max(0, ko - direct) };
}
// Calendar arithmetic on Berlin wall times mirrors buildGroupTimings(), including its fallback.
const plusDays = (value, days, midnight = false) => {
  const date = new Date(String(value).replace(' ', 'T').slice(0, 19) + (String(value).length === 16 ? ':00Z' : 'Z'));
  date.setUTCDate(date.getUTCDate() + days);
  if (midnight) date.setUTCHours(0, 0, 0, 0);
  return date.toISOString().slice(0, 19).replace('T', ' ');
};
export function photoSchedulePreview(form, groupCount) {
  if (!Number.isInteger(groupCount) || groupCount < 1) return [];
  const slots = form.groupSchedule || [];
  const result = [];
  if (!slots.length) {
    if (!photoDateValue(form.startAt)) return [];
    return Array.from({ length: groupCount }, (_, index) => {
      const start = plusDays(form.startAt, Math.floor(index / 2) * 7, true);
      return { start, end: plusDays(start, 14) };
    });
  }
  let lastStart; let lastDuration = 14;
  for (const slot of slots) {
    const start = slot.startAt || form.startAt;
    if (!photoDateValue(start) || !Number.isInteger(Number(slot.durationDays)) || Number(slot.durationDays) < 1 || !Number.isInteger(Number(slot.groups)) || Number(slot.groups) < 1) return [];
    const end = plusDays(start, Number(slot.durationDays));
    for (let i = 0; i < Number(slot.groups) && result.length < groupCount; i++) result.push({ start, end });
    lastStart = start; lastDuration = Number(slot.durationDays);
  }
  let start = plusDays(lastStart, lastDuration, true);
  while (result.length < groupCount) { const end = plusDays(start, lastDuration); result.push({ start, end }); start = end; }
  return result;
}
