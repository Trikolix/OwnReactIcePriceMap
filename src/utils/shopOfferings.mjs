export const ICE_TYPES = ["kugel", "softeis", "eisbecher"];
export const ICE_LABELS = { kugel: "Kugeleis", softeis: "Softeis", eisbecher: "Eisbecher" };
export const OFFERING_STATES = { unknown: "Keine Angabe", offered: "Wird angeboten", not_offered: "Wird nicht angeboten" };
export function iceOfferings(data) {
  const raw = data?.eisdiele?.ice_offerings ?? data?.ice_offerings ?? {};
  return Object.fromEntries(ICE_TYPES.map(type => [type, { state: "unknown", source: "unknown", checkin_count: 0, ...raw[type] }]));
}
export function primaryIceType(data) {
  const offerings = iceOfferings(data);
  const available = ICE_TYPES.filter(type => offerings[type].state !== "not_offered");
  const count = type => Number(offerings[type].checkin_count || data?.statistiken?.checkins_nach_typ?.[type === "kugel" ? "Kugel" : ICE_LABELS[type]] || 0);
  return available.reduce((best, type) => best === null || count(type) > count(best) ? type : best, null);
}
export const flavorPath = (name, type) => `/statistics/flavours/${encodeURIComponent(String(name || "").trim())}${type ? `?type=${encodeURIComponent(type)}` : ""}`;
export const attributePath = id => Number.isInteger(Number(id)) && Number(id) > 0 ? `/map?attributes=${Number(id)}` : null;
export function offeringDescription(entry) {
  if (entry.source === "inferred") return "Vermutlich nicht angeboten · aus Check-ins abgeleitet";
  if (entry.source === "conflict") return "Angebot unklar · widersprüchliche Meldungen";
  const source = { operator: "Betreiberangabe", admin: "Admin bestätigt", community: "Community", observed: "Bei Besuchen gemeldet" }[entry.source];
  return source ? `${OFFERING_STATES[entry.state]} · ${source}` : "Angebot noch nicht bestätigt";
}
