export const hasShopNumber = (value) =>
  value !== null &&
  value !== undefined &&
  String(value).trim() !== "" &&
  Number.isFinite(Number(value));
export const shopNumber = (value, digits = 1) =>
  hasShopNumber(value)
    ? Number(value).toLocaleString("de-DE", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      })
    : "–";
export const shopPrice = (entry) =>
  hasShopNumber(entry?.preis)
    ? `${shopNumber(entry.preis, 2)} ${entry.waehrung_symbol || "€"}`
    : "Noch nicht gemeldet";
export const shopDate = (value, full = false) => {
  const date = value ? new Date(String(value).replace(" ", "T")) : null;
  if (!date || Number.isNaN(date.getTime())) return "Datum unbekannt";
  return date.toLocaleDateString(
    "de-DE",
    full
      ? {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      : { day: "numeric", month: "short", year: "numeric" },
  );
};
export const shopAssetUrl = (value) => {
  if (typeof value !== "string" || !value.trim()) return null;
  value = value.trim();
  if (/^https?:\/\//i.test(value)) return value;
  if (
    /^[a-z][a-z0-9+.-]*:/i.test(value) ||
    value.startsWith("//") ||
    value.includes("\\")
  )
    return null;
  const base = (
    import.meta.env.VITE_ASSET_BASE_URL || "https://ice-app.de"
  ).replace(/\/+$/, "");
  return `${base}/${value.replace(/^\/+/, "")}`;
};
export function shopStatus(shop) {
  if (shop?.closed_early_at)
    return { label: "Stand geschlossen", tone: "closed" };
  if (shop?.status === "permanent_closed")
    return { label: "Dauerhaft geschlossen", tone: "closed" };
  if (shop?.status === "seasonal_closed")
    return {
      label: shop.reopening_date
        ? `Saisonpause bis ${shopDate(shop.reopening_date)}`
        : "Saisonpause",
      tone: "seasonal",
    };
  if (
    shop?.place_type === "temporary_stand" &&
    shop.active_until &&
    new Date(String(shop.active_until).replace(" ", "T")).getTime() < Date.now()
  )
    return { label: "Stand beendet", tone: "closed" };
  if (shop?.is_open_now === true)
    return { label: "Jetzt geöffnet", tone: "open" };
  const hasHours = shop?.openingHoursStructured?.days?.some(
    (day) => day.ranges?.length,
  );
  if (shop?.is_open_now === false && hasHours)
    return { label: "Zurzeit geschlossen", tone: "closed" };
  return { label: "Öffnungszeiten unbekannt", tone: "neutral" };
}
export function shopDetailTab(params, isIceShop = true) {
  const valid = isIceShop
    ? ["overview", "checkins", "reviews", "photos", "routes", "stats"]
    : ["overview", "checkins", "photos", "stats"];
  const requested = params.get("tab");
  if (valid.includes(requested)) return requested;
  if (params.get("focusCheckin")) return "checkins";
  if (isIceShop && params.get("focusReview")) return "reviews";
  if (isIceShop && params.get("focusRoute")) return "routes";
  return "overview";
}
export function shopPriceHistory(history = []) {
  const points = history
    .map((entry) => ({
      ...entry,
      date: new Date(String(entry.datum).replace(" ", "T")),
    }))
    .filter(
      (entry) =>
        !Number.isNaN(entry.date.getTime()) && hasShopNumber(entry.preis),
    )
    .sort((a, b) => a.date - b.date);
  if (!points.length) return [];
  const key = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  const months = new Map();
  points.forEach((entry) => {
    const record = months.get(key(entry.date)) || {};
    if (entry.typ !== "kugel" && entry.typ !== "softeis") return;
    record[entry.typ] = Number(entry.preis);
    record[entry.typ + "Currency"] = entry.waehrung_symbol || "€";
    months.set(key(entry.date), record);
  });
  const result = [],
    cursor = new Date(
      points[0].date.getFullYear(),
      points[0].date.getMonth(),
      1,
    ),
    now = new Date();
  let kugel = null,
    softeis = null,
    kugelCurrency = null,
    softeisCurrency = null;
  while (cursor <= now && result.length < 1200) {
    const entry = months.get(key(cursor));
    if (entry?.kugel !== undefined) {
      kugel = entry.kugel;
      kugelCurrency = entry.kugelCurrency;
    }
    if (entry?.softeis !== undefined) {
      softeis = entry.softeis;
      softeisCurrency = entry.softeisCurrency;
    }
    result.push({
      datum: cursor.toLocaleDateString("de-DE", {
        month: "short",
        year: "2-digit",
      }),
      kugel,
      softeis,
      kugelCurrency,
      softeisCurrency,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return result;
}
