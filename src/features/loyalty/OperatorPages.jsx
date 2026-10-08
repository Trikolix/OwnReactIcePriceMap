import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import OpeningHoursEditor from "../../components/OpeningHoursEditor";
import { hydrateOpeningHours } from "../../utils/openingHours";
import LoyaltyLayout, { Feedback } from "./LoyaltyLayout";
import CounterPanel from "./CounterPanel";
import { ICE_TYPES, ICE_LABELS, OFFERING_STATES } from "../../utils/shopOfferings.mjs";
import {
  loyaltyApi,
  loyaltyDate,
  newLoyaltyRequestKey,
  unitLabel,
} from "./api";

export function OperatorOverviewPage() {
  const { authToken, isLoggedIn } = useUser(),
    [data, setData] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    if (!isLoggedIn) return;
    setError("");
    try {
      setData(await loyaltyApi(authToken, "overview"));
    } catch (err) {
      setError(err.message);
    }
  }, [authToken, isLoggedIn]);
  useEffect(() => {
    load();
  }, [load]);
  const accept = async (shop) => {
    if (busy) return;
    setBusy(true);
    try {
      await loyaltyApi(authToken, "accept_invite", {
        shop_id: Number(shop.id),
      });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <LoyaltyLayout
      title="Meine Eisdielen"
      intro="Verwalte deine Eisdiele oder öffne den Thekenmodus für Kundenkarten."
    >
      <Feedback error={error} />
      {error && <button onClick={load}>Erneut versuchen</button>}
      {!data && !error && <p role="status">Eisdielen werden geladen …</p>}
      {data && (
        <>
          <div className="loyalty-grid">
            {data.shops.map((shop) => (
              <section className="loyalty-panel" key={shop.id}>
                <span className="loyalty-badge">
                  {shop.state === "invited"
                    ? "Einladung"
                    : shop.role === "operator"
                      ? "Betreiber"
                      : "Mitarbeiter"}
                </span>
                <h2>{shop.name}</h2>
                {shop.state === "invited" ? (
                  <>
                    <p>
                      Du wurdest als Mitarbeiter eingeladen. Nach Annahme kannst
                      du Stempel vergeben und Prämien bestätigen.
                    </p>
                    <button
                      className="loyalty-primary"
                      disabled={busy}
                      onClick={() => accept(shop)}
                    >
                      Einladung annehmen
                    </button>
                  </>
                ) : (
                  <Link className="loyalty-button" to={`/betreiber/${shop.id}`}>
                    Thekenmodus öffnen
                  </Link>
                )}
              </section>
            ))}
          </div>
          {!data.shops.length && (
            <section className="loyalty-panel">
              <h2>Deine Eisdiele fehlt noch?</h2>
              <p>
                Öffne ihre Eisdielenseite und wähle „Eisdiele übernehmen“. Wir
                prüfen deine Zuordnung persönlich.
              </p>
              <Link className="loyalty-button" to="/map">
                Eisdiele finden
              </Link>
            </section>
          )}
          {!!data.claims.length && (
            <section className="loyalty-panel">
              <h2>Deine Anträge</h2>
              <ul className="loyalty-history">
                {data.claims.map((claim) => (
                  <li key={claim.id}>
                    <span>
                      <strong>{claim.shop_name}</strong>
                      <br />
                      {claim.state === "pending"
                        ? "Wartet auf Prüfung"
                        : claim.state === "approved"
                          ? "Freigegeben"
                          : "Abgelehnt"}
                      {claim.review_note && <p>{claim.review_note}</p>}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </LoyaltyLayout>
  );
}
export function OperatorClaimPage() {
  const { shopId } = useParams(),
    { authToken } = useUser(),
    [contact, setContact] = useState(""),
    [reason, setReason] = useState(""),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await loyaltyApi(authToken, "claim", {
        shop_id: Number(shopId),
        contact,
        reason,
      });
      setMessage(result.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <LoyaltyLayout
      title="Eisdiele übernehmen"
      intro="Wir prüfen persönlich, ob du für diese Eisdiele handeln darfst."
    >
      <section className="loyalty-panel">
        <Link to={`/shop/${shopId}`}>Zur Eisdiele</Link>
        <Feedback error={error} message={message} />
        {!message && (
          <form onSubmit={submit}>
            <fieldset disabled={busy}>
              <label htmlFor="claim-contact">Kontakt für die Prüfung</label>
              <input
                id="claim-contact"
                required
                maxLength={300}
                value={contact}
                onChange={(event) => setContact(event.target.value)}
                placeholder="Geschäftliche E-Mail oder Telefonnummer"
              />
              <label htmlFor="claim-reason">
                Deine Verbindung zur Eisdiele
              </label>
              <textarea
                id="claim-reason"
                required
                maxLength={2000}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Welche Rolle hast du und wie können wir deine Berechtigung prüfen?"
              />
              <p className="loyalty-muted">
                Diese Angaben sind nur für dich und die Administration sichtbar.
              </p>
              <button className="loyalty-primary">
                {busy ? "Wird gespeichert …" : "Antrag zur Prüfung senden"}
              </button>
            </fieldset>
          </form>
        )}
        {message && (
          <Link className="loyalty-button" to="/betreiber">
            Zu meinen Eisdielen
          </Link>
        )}
      </section>
    </LoyaltyLayout>
  );
}
function OperatorManagement({ data, token, onChanged }) {
  const shopId = Number(data.shop.id),
    active = data.programs.find((program) => program.state === "active");
  const [website, setWebsite] = useState(data.shop.website || ""),
    [status, setStatus] = useState(data.shop.status || "open"),
    [hours, setHours] = useState(() =>
      hydrateOpeningHours(data.shop.opening_hours),
    );
  const [unit, setUnit] = useState("scoop"),
    [target, setTarget] = useState(14),
    [reward, setReward] = useState("Eine Kugel Eis gratis"),
    [username, setUsername] = useState("");
  const [iceOfferings, setIceOfferings] = useState(() => Object.fromEntries(ICE_TYPES.map(type => [type, data.shop.ice_offerings?.[type]?.operator_state || "unknown"])));
  const [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [confirmProgram, setConfirmProgram] = useState(false),
    [confirmEnd, setConfirmEnd] = useState(false);
  const perform = async (action, payload, after) => {
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await loyaltyApi(token, action, {
        shop_id: shopId,
        ...payload,
      });
      setMessage(result.message);
      after?.();
      await onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Feedback error={error} message={message} />
      <section className="loyalty-panel">
        <h2>Kundenkarten im Überblick</h2>
        <div className="loyalty-stats">
          {[
            ["customers", "Teilnehmende Kunden"],
            ["stamp_transactions", "Bestätigte Käufe"],
            ["units", "Bestätigte Einheiten"],
            ["redeemed", "Eingelöste Prämien"],
            ["available", "Offene Prämien"],
          ].map(([key, label]) => (
            <div key={key}>
              <strong>
                {Number(data.stats?.[key] || 0).toLocaleString("de-DE")}
              </strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
        <p className="loyalty-muted">
          Alle Programme dieser Eisdiele zusammen. Stornierte Stempel sind
          abgezogen.
        </p>
      </section>
      <section className="loyalty-panel">
        <h2>Eisdielendaten</h2>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            perform("update_business", {
              website,
              status,
              opening_hours: hours,
              ice_offerings: iceOfferings,
            });
          }}
        >
          <fieldset disabled={busy}>
            <label htmlFor="business-website">Website</label>
            <input
              id="business-website"
              type="url"
              maxLength={255}
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              placeholder="https://…"
            />
            <label htmlFor="business-status">Betriebsstatus</label>
            <select
              id="business-status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="open">Geöffnet</option>
              <option value="seasonal_closed">Saisonal geschlossen</option>
              <option value="permanent_closed">Dauerhaft geschlossen</option>
            </select>
            <h3>Öffnungszeiten</h3>
            <OpeningHoursEditor
              touchFriendly
              value={hours}
              onChange={setHours}
            />
            <h3>Unser Eisangebot</h3>
            {ICE_TYPES.map(type => <label key={type} htmlFor={`business-ice-${type}`}>{ICE_LABELS[type]}
              <select id={`business-ice-${type}`} value={iceOfferings[type]} onChange={event => setIceOfferings(old => ({ ...old, [type]: event.target.value }))}>
                {Object.entries(OFFERING_STATES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>)}
            <p className="loyalty-muted">Deine Angaben haben Vorrang vor Community-Meldungen. „Keine Angabe“ gibt die Ermittlung wieder an die Community zurück.</p>
            <p className="loyalty-muted">
              Name, Adresse und Kartenposition kannst du auf der Eisdielenseite
              zur Prüfung vorschlagen.
            </p>
            <button className="loyalty-primary">
              {busy ? "Wird gespeichert …" : "Eisdielendaten speichern"}
            </button>
          </fieldset>
        </form>
      </section>
      <section className="loyalty-panel">
        <h2>Kundenkartenprogramm</h2>
        {active ? (
          <>
            <p>
              <strong>Aktiv:</strong> {active.stamp_target}{" "}
              {unitLabel(active.unit)} = {active.reward}
            </p>
            <button
              className="loyalty-danger"
              disabled={busy}
              onClick={() => setConfirmEnd(true)}
            >
              Programm beenden
            </button>
            {confirmEnd && (
              <div role="group" aria-label="Programmende bestätigen">
                <p>
                  Neue Stempel und Teilnahmen enden. Vorhandene Prämien bleiben
                  einlösbar; unvollständige Karten können nicht weiter gefüllt
                  werden.
                </p>
                <div className="loyalty-actions">
                  <button
                    className="loyalty-danger"
                    disabled={busy}
                    onClick={() =>
                      perform(
                        "end_program",
                        { program_id: Number(active.id) },
                        () => setConfirmEnd(false),
                      )
                    }
                  >
                    Ende bestätigen
                  </button>
                  <button onClick={() => setConfirmEnd(false)}>
                    Abbrechen
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <p>Noch kein aktives Programm.</p>
        )}
        <h3>Neues Programm veröffentlichen</h3>
        <p className="loyalty-muted">
          Die Bedingungen sind nach Veröffentlichung fest. Ein neues Programm
          ersetzt das aktive; alte Karten behalten ihre Bedingungen und
          vorhandenen Prämien. Reststempel werden nicht übertragen.
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setConfirmProgram(true);
          }}
        >
          <fieldset disabled={busy || confirmProgram}>
            <label htmlFor="program-unit">Stempel zählen für</label>
            <select
              id="program-unit"
              value={unit}
              onChange={(event) => setUnit(event.target.value)}
            >
              <option value="scoop">Bezahlte Kugeln</option>
              <option value="purchase">Käufe</option>
            </select>
            <label htmlFor="program-target">Stempel bis zur Prämie</label>
            <input
              id="program-target"
              type="number"
              min={2}
              max={100}
              required
              value={target}
              onChange={(event) => setTarget(event.target.value)}
            />
            <label htmlFor="program-reward">Prämie</label>
            <input
              id="program-reward"
              required
              maxLength={300}
              value={reward}
              onChange={(event) => setReward(event.target.value)}
            />
            <button>Veröffentlichung prüfen</button>
          </fieldset>
        </form>
        {confirmProgram && (
          <div role="group" aria-label="Veröffentlichung bestätigen">
            <p>
              <strong>
                {target} {unitLabel(unit)} = {reward}
              </strong>
            </p>
            {active && <p>Das bisherige Programm wird beendet.</p>}
            <div className="loyalty-actions">
              <button
                className="loyalty-primary"
                disabled={busy}
                onClick={() =>
                  perform(
                    "publish_program",
                    {
                      unit,
                      stamp_target: Number(target),
                      reward,
                      current_program_id: Number(active?.id || 0),
                    },
                    () => setConfirmProgram(false),
                  )
                }
              >
                Verbindlich veröffentlichen
              </button>
              <button disabled={busy} onClick={() => setConfirmProgram(false)}>
                Zurück
              </button>
            </div>
          </div>
        )}
      </section>
      <section className="loyalty-panel">
        <h2>Mitarbeiter</h2>
        <ul className="loyalty-members">
          {data.members
            .filter((member) => member.state !== "revoked")
            .map((member) => (
              <li key={member.user_id}>
                <span>
                  <strong>{member.username}</strong>
                  <br />
                  {member.role === "operator"
                    ? "Betreiber"
                    : member.state === "invited"
                      ? "Einladung offen"
                      : "Mitarbeiter"}
                </span>
                {member.role === "staff" && (
                  <button
                    className="loyalty-danger"
                    disabled={busy}
                    onClick={() =>
                      perform("revoke_staff", {
                        user_id: Number(member.user_id),
                      })
                    }
                  >
                    Zugriff entziehen
                  </button>
                )}
              </li>
            ))}
        </ul>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            perform("invite_staff", { username }, () => setUsername(""));
          }}
        >
          <label htmlFor="staff-username">Bestehenden Nutzer einladen</label>
          <input
            id="staff-username"
            required
            maxLength={100}
            value={username}
            disabled={busy}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Genauer Nutzername"
          />
          <p className="loyalty-muted">
            Mitarbeiter müssen die Einladung unter „Meine Eisdielen“ annehmen.
          </p>
          <button disabled={busy}>Als Mitarbeiter einladen</button>
        </form>
      </section>
    </>
  );
}
function OperatorHistory({ shopId, token }) {
  const [rows, setRows] = useState([]),
    [cursor, setCursor] = useState(null),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [selected, setSelected] = useState(null);
  const request = useRef(null);
  const load = useCallback(
    async (before) => {
      setBusy(true);
      setError("");
      try {
        const data = await loyaltyApi(token, "history", undefined, {
          shop_id: shopId,
          ...(before ? { before_id: before } : {}),
        });
        setRows((old) => (before ? [...old, ...data.history] : data.history));
        setCursor(data.next_cursor);
      } catch (err) {
        setError(err.message);
      } finally {
        setBusy(false);
      }
    },
    [shopId, token],
  );
  useEffect(() => {
    load();
  }, [load]);
  const reverse = async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    if (!request.current)
      request.current = {
        shop_id: Number(shopId),
        entry_id: Number(selected.id),
        request_key: newLoyaltyRequestKey(),
      };
    try {
      await loyaltyApi(token, "reverse", request.current);
      request.current = null;
      setSelected(null);
      setMessage("Stempelbuchung storniert. Die Historie bleibt erhalten.");
      await load();
    } catch (err) {
      setError(err.message);
      if (!err.uncertain) request.current = null;
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="loyalty-panel">
      <h2>Buchungsverlauf</h2>
      <Feedback error={error} message={message} />
      {error && !selected && (
        <button disabled={busy} onClick={() => load()}>
          Erneut versuchen
        </button>
      )}
      {!rows.length && !busy && !error && (
        <p>Noch keine Buchungen vorhanden.</p>
      )}
      <ul className="loyalty-history">
        {rows.map((entry) => (
          <li key={entry.id}>
            <span>
              <strong>
                {entry.kind === "stamp"
                  ? `+${entry.units} Stempel`
                  : entry.kind === "redeem"
                    ? "Prämie eingelöst"
                    : `${entry.units} Stempel · Storno`}
              </strong>{" "}
              · {entry.actor}
              <time>
                {loyaltyDate(entry.created_at)} · Buchung #{entry.id}
              </time>
              {!!Number(entry.reversed) && <small>Storniert</small>}
            </span>
            {entry.kind === "stamp" && !Number(entry.reversed) && (
              <button
                disabled={busy || !!selected}
                onClick={() => setSelected(entry)}
              >
                Stornieren
              </button>
            )}
          </li>
        ))}
      </ul>
      {selected && (
        <div role="group" aria-label="Storno bestätigen">
          <p>
            Buchung #{selected.id} vollständig stornieren ({selected.units}{" "}
            Stempel)? Nach einer späteren Prämieneinlösung ist das nicht mehr
            möglich.
          </p>
          <div className="loyalty-actions">
            <button
              className="loyalty-danger"
              disabled={busy}
              onClick={reverse}
            >
              {busy ? "Wird geprüft …" : "Storno bestätigen"}
            </button>
            <button
              disabled={busy || !!request.current}
              onClick={() => setSelected(null)}
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}
      {cursor && (
        <button disabled={busy || !!selected} onClick={() => load(cursor)}>
          Weitere Buchungen laden
        </button>
      )}
    </section>
  );
}
export function OperatorShopPage() {
  const { shopId } = useParams(),
    { authToken, isLoggedIn } = useUser(),
    [data, setData] = useState(null),
    [error, setError] = useState(""),
    [tab, setTab] = useState("counter");
  const load = useCallback(async () => {
    if (!isLoggedIn) return;
    setError("");
    try {
      setData(
        await loyaltyApi(authToken, "operator_shop", undefined, {
          shop_id: shopId,
        }),
      );
    } catch (err) {
      if (err.status === 403 || err.status === 404) setData(null);
      setError(err.message);
    }
  }, [shopId, authToken, isLoggedIn]);
  useEffect(() => {
    setData(null);
    setTab("counter");
    load();
  }, [load]);
  return (
    <LoyaltyLayout title={data?.shop.name || "Eisdiele verwalten"}>
      <Feedback error={error} />
      {error && <button onClick={load}>Erneut versuchen</button>}
      {!data && !error && <p role="status">Eisdiele wird geladen …</p>}
      {data && (
        <>
          <div className="loyalty-tabs" aria-label="Betreiberbereich">
            <button
              aria-current={tab === "counter" ? "page" : undefined}
              onClick={() => setTab("counter")}
            >
              Theke
            </button>
            {data.role === "operator" && (
              <>
                <button
                  aria-current={tab === "manage" ? "page" : undefined}
                  onClick={() => {
                    setTab("manage");
                    load();
                  }}
                >
                  Verwaltung &amp; Statistik
                </button>
                <button
                  aria-current={tab === "history" ? "page" : undefined}
                  onClick={() => setTab("history")}
                >
                  Verlauf
                </button>
              </>
            )}
          </div>
          {tab === "counter" && (
            <CounterPanel key={shopId} shopId={shopId} token={authToken} />
          )}
          {tab === "manage" && data.role === "operator" && (
            <OperatorManagement
              data={data}
              token={authToken}
              onChanged={load}
            />
          )}
          {tab === "history" && data.role === "operator" && (
            <OperatorHistory shopId={shopId} token={authToken} />
          )}
        </>
      )}
    </LoyaltyLayout>
  );
}
