import React, { useCallback, useEffect, useState } from "react";
import { useUser } from "../../context/UserContext";
import LoyaltyLayout, { Feedback } from "./LoyaltyLayout";
import { loyaltyApi } from "./api";

export default function OperatorAdminPage() {
  const { authToken, userId } = useUser(),
    [claims, setClaims] = useState([]),
    [operators, setOperators] = useState([]),
    [notes, setNotes] = useState({}),
    [verified, setVerified] = useState({}),
    [revoke, setRevoke] = useState(null);
  const [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    if (Number(userId) !== 1) return;
    setError("");
    try {
      const [c, o] = await Promise.all([
        loyaltyApi(authToken, "claims"),
        loyaltyApi(authToken, "operators"),
      ]);
      setClaims(c.claims);
      setOperators(o.operators);
    } catch (err) {
      setError(err.message);
    }
  }, [authToken, userId]);
  useEffect(() => {
    load();
  }, [load]);
  const perform = async (action, data) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await loyaltyApi(authToken, action, data);
      setMessage(result.message);
      setRevoke(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <LoyaltyLayout
      title="Betreiberanträge prüfen"
      intro="Nur nach persönlicher Prüfung freigeben. Der Eintragsersteller ist nicht automatisch der Betreiber."
    >
      {Number(userId) !== 1 ? (
        <p role="alert">Dieser Bereich ist für den Administrator vorgesehen.</p>
      ) : (
        <>
          <Feedback error={error} message={message} />
          {error && <button onClick={load}>Erneut versuchen</button>}
          {!claims.length && <p>Keine Betreiberanträge vorhanden.</p>}
          {claims.map((claim) => (
            <section className="loyalty-panel" key={claim.id}>
              <span className="loyalty-badge">
                {claim.state === "pending"
                  ? "Offen"
                  : claim.state === "approved"
                    ? "Freigegeben"
                    : "Abgelehnt"}
              </span>
              <h2>{claim.shop_name}</h2>
              <p>
                <strong>{claim.username}</strong> · {claim.contact}
              </p>
              <p style={{ whiteSpace: "pre-wrap" }}>{claim.reason}</p>
              {claim.state === "pending" ? (
                <>
                  <label htmlFor={`review-${claim.id}`}>
                    Prüfvermerk / Begründung
                  </label>
                  <textarea
                    id={`review-${claim.id}`}
                    maxLength={1000}
                    value={notes[claim.id] || ""}
                    disabled={busy}
                    onChange={(event) =>
                      setNotes((old) => ({
                        ...old,
                        [claim.id]: event.target.value,
                      }))
                    }
                    placeholder="Wie wurde die Betreiberberechtigung bestätigt?"
                  />
                  <label>
                    <input
                      type="checkbox"
                      checked={!!verified[claim.id]}
                      disabled={busy}
                      onChange={(event) =>
                        setVerified((old) => ({
                          ...old,
                          [claim.id]: event.target.checked,
                        }))
                      }
                    />
                    Ich habe die Betreiberberechtigung persönlich geprüft.
                  </label>
                  <div className="loyalty-actions">
                    <button
                      className="loyalty-primary"
                      disabled={
                        busy || !verified[claim.id] || !notes[claim.id]?.trim()
                      }
                      onClick={() =>
                        perform("review_claim", {
                          claim_id: Number(claim.id),
                          approve: true,
                          note: notes[claim.id],
                          verified: true,
                        })
                      }
                    >
                      Betreiber freigeben
                    </button>
                    <button
                      disabled={busy || !notes[claim.id]?.trim()}
                      onClick={() =>
                        perform("review_claim", {
                          claim_id: Number(claim.id),
                          approve: false,
                          note: notes[claim.id],
                          verified: false,
                        })
                      }
                    >
                      Ablehnen
                    </button>
                  </div>
                </>
              ) : (
                <p>{claim.review_note}</p>
              )}
            </section>
          ))}
          <section className="loyalty-panel">
            <h2>Freigeschaltete Betreiber</h2>
            <ul className="loyalty-members">
              {operators.map((operator) => (
                <li key={operator.shop_id}>
                  <span>
                    <strong>{operator.shop_name}</strong>
                    <br />
                    {operator.username}
                  </span>
                  <button
                    className="loyalty-danger"
                    disabled={busy}
                    onClick={() => setRevoke(operator)}
                  >
                    Zuordnung widerrufen
                  </button>
                </li>
              ))}
            </ul>
            {revoke && (
              <div role="group" aria-label="Widerruf bestätigen">
                <p>
                  Betreiber und alle Mitarbeiter von{" "}
                  <strong>{revoke.shop_name}</strong> verlieren sofort den
                  Zugriff. Aktive Programme werden beendet.
                </p>
                <div className="loyalty-actions">
                  <button
                    className="loyalty-danger"
                    disabled={busy}
                    onClick={() =>
                      perform("revoke_operator", {
                        shop_id: Number(revoke.shop_id),
                      })
                    }
                  >
                    Widerruf bestätigen
                  </button>
                  <button onClick={() => setRevoke(null)}>Abbrechen</button>
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </LoyaltyLayout>
  );
}
