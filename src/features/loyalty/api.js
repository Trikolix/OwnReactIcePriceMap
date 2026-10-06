export async function loyaltyApi(token, action, data, query = {}) {
  const params = new URLSearchParams({ action, ...query });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    let response;
    try {
      response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/loyalty.php?${params}`,
        {
          method: data === undefined ? "GET" : "POST",
          signal: controller.signal,
          credentials: "include",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(data === undefined
              ? {}
              : { "Content-Type": "application/json" }),
          },
          ...(data === undefined ? {} : { body: JSON.stringify(data) }),
        },
      );
    } catch {
      const error = new Error(
        "Verbindung unterbrochen oder Zeitlimit erreicht. Bitte erneut versuchen.",
      );
      error.uncertain = true;
      throw error;
    }
    let result;
    try {
      result = await response.json();
      if (
        !result ||
        typeof result !== "object" ||
        !["success", "error"].includes(result.status)
      )
        throw new Error("Invalid response");
    } catch {
      const error = new Error(
        "Die Serverantwort konnte nicht gelesen werden. Bitte erneut versuchen.",
      );
      error.uncertain = true;
      throw error;
    }
    if (!response.ok || result.status !== "success") {
      const error = new Error(
        result.message || "Die Aktion konnte nicht abgeschlossen werden.",
      );
      error.uncertain = response.status >= 500;
      error.status = response.status;
      throw error;
    }
    return result;
  } finally {
    clearTimeout(timeout);
  }
}

export function newLoyaltyRequestKey() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : Array.from(crypto.getRandomValues(new Uint8Array(24)), (byte) =>
        byte.toString(16).padStart(2, "0"),
      ).join("");
}
export const unitLabel = (unit) =>
  unit === "purchase" ? "Käufe" : "bezahlte Kugeln";
export const loyaltyDate = (value) =>
  new Date(
    String(value).replace(" ", "T") + (String(value).endsWith("Z") ? "" : "Z"),
  ).toLocaleString("de-DE");
