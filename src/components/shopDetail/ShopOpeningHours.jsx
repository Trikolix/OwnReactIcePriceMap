import React from "react";
import { Clock3 } from "lucide-react";
import { hydrateOpeningHours, WEEKDAYS } from "../../utils/openingHours";

export default function ShopOpeningHours({ shop }) {
  const hours = hydrateOpeningHours(
    shop.openingHoursStructured,
    shop.opening_hours_note || "",
  );
  const hasStructured = hours.days.some((day) => day.ranges.length);
  let today;
  try {
    today = new Intl.DateTimeFormat("de-DE", {
      weekday: "long",
      timeZone: hours.timezone || "Europe/Berlin",
    }).format(new Date());
  } catch {
    today = new Intl.DateTimeFormat("de-DE", {
      weekday: "long",
      timeZone: "Europe/Berlin",
    }).format(new Date());
  }
  const ranges = (day) =>
    day.ranges
      .map(
        (range) =>
          `${range.open}–${range.close}${range.overnight ? " (Folgetag)" : ""}`,
      )
      .join(", ");
  const current = hours.days.find(
    (day) =>
      WEEKDAYS.find((item) => item.weekday === day.weekday)?.label === today,
  );
  const stopped =
    shop.status === "seasonal_closed" ||
    shop.status === "permanent_closed" ||
    shop.closed_early_at;
  return (
    <>
      <h2>
        <Clock3 size={20} aria-hidden="true" /> Öffnungszeiten
      </h2>
      {stopped && (
        <p className="shopdetail-note">
          {shop.status === "seasonal_closed"
            ? "Aktuell in Saisonpause. Die folgenden Zeiten gelten für den regulären Betrieb."
            : "Dieser Eis-Ort ist geschlossen."}
        </p>
      )}
      {hasStructured ? (
        <>
          {!stopped && (
            <p className="shopdetail-today">
              <strong>Heute, {today}:</strong>{" "}
              {current?.ranges.length
                ? `${ranges(current)} Uhr`
                : "geschlossen"}
            </p>
          )}
          <details className="shopdetail-disclosure">
            <summary>Alle Wochenzeiten</summary>
            <table className="shopdetail-hours">
              <caption className="shopdetail-sr">
                Reguläre Öffnungszeiten
              </caption>
              <tbody>
                {hours.days.map((day) => (
                  <tr
                    key={day.weekday}
                    data-today={
                      WEEKDAYS.find((item) => item.weekday === day.weekday)
                        ?.label === today
                    }
                  >
                    <th scope="row">
                      {
                        WEEKDAYS.find((item) => item.weekday === day.weekday)
                          ?.label
                      }
                    </th>
                    <td>
                      {day.ranges.length ? `${ranges(day)} Uhr` : "Geschlossen"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      ) : shop.openingHours ? (
        <p className="shopdetail-hours-text">
          {shop.openingHours
            .split(";")
            .map((part) => part.trim())
            .filter(Boolean)
            .join("\n")}
        </p>
      ) : (
        <p className="shopdetail-muted">
          Noch keine Öffnungszeiten hinterlegt.
        </p>
      )}
      {hours.note && <p className="shopdetail-muted">{hours.note}</p>}
    </>
  );
}
