import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  hasShopNumber,
  shopDate,
  shopNumber,
  shopPriceHistory,
} from "../../utils/shopDetail";

function Distribution({ title, entries, nameKey }) {
  const total = entries.reduce(
    (sum, entry) => sum + Number(entry.anzahl || 0),
    0,
  );
  return (
    <section className="shopdetail-panel">
      <h2>{title}</h2>
      {!total ? (
        <p className="shopdetail-muted">Noch keine Daten vorhanden.</p>
      ) : (
        <ul className="shopdetail-distribution">
          {entries.map((entry, index) => (
            <li key={`${entry[nameKey]}-${index}`}>
              <div>
                <span>{entry[nameKey] || "Unbekannt"}</span>
                <strong>
                  {Number(entry.anzahl).toLocaleString("de-DE")}{" "}
                  <small>
                    ({Math.round((Number(entry.anzahl) / total) * 100)} %)
                  </small>
                </strong>
              </div>
              <div className="shopdetail-bar" aria-hidden="true">
                <span
                  style={{ width: `${(Number(entry.anzahl) / total) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
function Flavors({ title, entries }) {
  return (
    <section className="shopdetail-panel">
      <h2>{title}</h2>
      {!entries.length ? (
        <p className="shopdetail-muted">
          Noch nicht genügend Sortenbewertungen vorhanden.
        </p>
      ) : (
        <ol className="shopdetail-ranking">
          {entries.slice(0, 5).map((entry, index) => (
            <li key={`${entry.sortenname}-${index}`}>
              <span>{entry.sortenname}</span>
              <span>
                <strong>{shopNumber(entry.durchschnittsbewertung)} / 5</strong>
                <small>
                  {entry.anzahl}{" "}
                  {Number(entry.anzahl) === 1 ? "Eintrag" : "Einträge"}
                </small>
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
export default function ShopStatistics({ data }) {
  const isIceShop = (data.eisdiele?.place_type || "ice_shop") === "ice_shop";
  const statistics = data.statistiken || {},
    flavors = data.beliebte_sorten || {};
  const history = useMemo(
    () => shopPriceHistory(data.preis_historie || []),
    [data.preis_historie],
  );
  const currencies = [
    ...new Set(
      history
        .flatMap((entry) => [entry.kugelCurrency, entry.softeisCurrency])
        .filter(Boolean),
    ),
  ];
  const singleCurrency = currencies.length === 1 ? currencies[0] : null;
  const priceLabel = (value, currency) =>
    hasShopNumber(value) ? shopNumber(value, 2) + " " + (currency || "€") : "–";
  const visitors = useMemo(() => {
    const entries = new Map();
    (data.checkins || []).forEach((checkin) => {
      const key = checkin.nutzer_id || checkin.nutzer_name;
      const old = entries.get(key) || {
        id: checkin.nutzer_id,
        name: checkin.nutzer_name || "Unbekannt",
        count: 0,
      };
      old.count++;
      entries.set(key, old);
    });
    return [...entries.values()].sort((a, b) => b.count - a.count).slice(0, 5);
  }, [data.checkins]);
  return (
    <div className="shopdetail-stack">
      <section className="shopdetail-panel">
        <h2>{isIceShop ? "Die Eisdiele" : "Der Eis-Ort"} in Zahlen</h2>
        <div className="shopdetail-stat-facts">
          {[
            [statistics.gesamt_checkins || 0, "Check-ins"],
            [statistics.verschiedene_besucher || 0, "Besucher"],
            ...(isIceShop
              ? [[(data.reviews || []).length, "Bewertungen"]]
              : []),
          ].map(([value, label]) => (
            <div key={label}>
              <strong>{Number(value).toLocaleString("de-DE")}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
        {statistics.letzter_checkin && (
          <p className="shopdetail-muted">
            Letzter Check-in: {shopDate(statistics.letzter_checkin)}
          </p>
        )}
      </section>
      {isIceShop && (
        <section className="shopdetail-panel">
          <h2>Preisverlauf</h2>
          <p className="shopdetail-muted">
            Zuletzt gemeldeter Preis je Monat. Zwischen Meldungen wird der
            letzte bekannte Preis angezeigt.
          </p>
          {history.length ? (
            <>
              {singleCurrency ? (
                <>
                  <p className="shopdetail-muted">Preise in {singleCurrency}</p>
                  <div className="shopdetail-chart" aria-hidden="true">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={history}
                        margin={{ top: 12, right: 8, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis
                          dataKey="datum"
                          minTickGap={35}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis
                          width={42}
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => shopNumber(value)}
                        />
                        <Tooltip
                          formatter={(value, name) => [
                            priceLabel(value, singleCurrency),
                            name,
                          ]}
                        />
                        <Legend />
                        <Line
                          dataKey="kugel"
                          name="Kugel"
                          stroke="#bc7b0a"
                          strokeWidth={2.5}
                          dot={false}
                          type="stepAfter"
                          isAnimationActive={false}
                        />
                        <Line
                          dataKey="softeis"
                          name="Softeis"
                          stroke="#36718a"
                          strokeWidth={2.5}
                          dot={false}
                          type="stepAfter"
                          isAnimationActive={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </>
              ) : (
                <p className="shopdetail-note">
                  Die Meldungen enthalten unterschiedliche Währungen. Die
                  Tabelle zeigt jeden Betrag mit seiner Währung.
                </p>
              )}
              <details
                className="shopdetail-disclosure"
                open={!singleCurrency || undefined}
              >
                <summary>Preisverlauf als Tabelle</summary>
                <div className="shopdetail-table-scroll">
                  <table className="shopdetail-data-table">
                    <thead>
                      <tr>
                        <th scope="col">Monat</th>
                        <th scope="col">Kugel</th>
                        <th scope="col">Softeis</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((entry) => (
                        <tr key={entry.datum}>
                          <th scope="row">{entry.datum}</th>
                          <td>
                            {priceLabel(entry.kugel, entry.kugelCurrency)}
                          </td>
                          <td>
                            {priceLabel(entry.softeis, entry.softeisCurrency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </>
          ) : (
            <p className="shopdetail-muted">
              Noch keine Preishistorie vorhanden.
            </p>
          )}
        </section>
      )}
      <div className="shopdetail-grid">
        <Distribution
          title="Anreise"
          entries={statistics.anreise_verteilung || []}
          nameKey="anreise"
        />
        <Distribution
          title="Eisarten bei Check-ins"
          entries={data.checkin_details_by_type || []}
          nameKey="typ"
        />
        <Flavors
          title="Beliebteste Sorten"
          entries={flavors.meistgegessen || []}
        />
        <Flavors
          title="Bestbewertete Sorten"
          entries={flavors.bestbewertet || []}
        />
        <section className="shopdetail-panel">
          <h2>Häufige Besucher</h2>
          {visitors.length ? (
            <ol className="shopdetail-ranking">
              {visitors.map((visitor, index) => (
                <li key={visitor.id || index}>
                  <span>
                    {visitor.id ? (
                      <Link to={`/user/${visitor.id}`}>{visitor.name}</Link>
                    ) : (
                      visitor.name
                    )}
                  </span>
                  <strong>
                    {visitor.count} {visitor.count === 1 ? "Besuch" : "Besuche"}
                  </strong>
                </li>
              ))}
            </ol>
          ) : (
            <p className="shopdetail-muted">Noch keine Besuche eingetragen.</p>
          )}
        </section>
      </div>
    </div>
  );
}
