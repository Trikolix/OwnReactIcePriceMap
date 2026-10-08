import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import LoyaltyLayout, { Feedback } from "./LoyaltyLayout";
import LoyaltyCodeDialog from "./LoyaltyCodeDialog";
import { loyaltyApi, loyaltyDate, unitLabel } from "./api";

export function CardSummary({ card, children }) {
  return (
    <section className="loyalty-panel">
      <span className="loyalty-badge">
        {card.program_state === "active" ? "Kundenkarte" : "Programm beendet"}
      </span>
      <h2>{card.shop_name}</h2>
      <p>
        {card.stamp_target} {unitLabel(card.unit)} = {card.reward}
      </p>
      <strong className="loyalty-count">
        {card.stamps} / {card.stamp_target}
      </strong>
      <progress
        className="loyalty-progress"
        value={card.stamps}
        max={card.stamp_target}
        aria-label="Stempelfortschritt"
      />
      <p>
        {card.available_rewards > 0
          ? `${card.available_rewards} ${card.available_rewards === 1 ? "Prämie verfügbar" : "Prämien verfügbar"}`
          : "Noch keine Prämie verfügbar"}
      </p>
      {card.program_state !== "active" && (
        <p className="loyalty-muted">
          Weitere Stempel sind nicht mehr möglich. Deine vorhandenen Prämien
          bleiben einlösbar.
        </p>
      )}
      <div className="loyalty-actions">{children}</div>
    </section>
  );
}
export default function CustomerCardsPage() {
  const { authToken, isLoggedIn } = useUser(),
    { cardId } = useParams(),
    [search] = useSearchParams();
  const shopId = search.get("shop");
  const [cards, setCards] = useState([]),
    [card, setCard] = useState(null),
    [history, setHistory] = useState([]),
    [program, setProgram] = useState(null);
  const [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [loading, setLoading] = useState(true),
    [joining, setJoining] = useState(false),
    [accepted, setAccepted] = useState(false),
    [purpose, setPurpose] = useState(null);
  const [cursor, setCursor] = useState(null),
    [moreBusy, setMoreBusy] = useState(false);
  const loadVersion = useRef(0);
  const load = useCallback(async () => {
    if (!isLoggedIn) return;
    const version = ++loadVersion.current;
    setLoading(true);
    setError("");
    try {
      if (cardId) {
        const data = await loyaltyApi(authToken, "card", undefined, {
          card_id: cardId,
        });
        if (version !== loadVersion.current) return;
        setCard(data.card);
        setHistory(data.history);
        setCursor(data.next_cursor);
      } else {
        const data = await loyaltyApi(authToken, "cards");
        if (version !== loadVersion.current) return;
        setCards(data.cards);
        if (shopId) {
          const data = await loyaltyApi(authToken, "shop", undefined, {
            shop_id: shopId,
          });
          if (version !== loadVersion.current) return;
          setProgram(data.program);
        } else setProgram(null);
      }
    } catch (err) {
      if (version === loadVersion.current) setError(err.message);
    } finally {
      if (version === loadVersion.current) setLoading(false);
    }
  }, [authToken, isLoggedIn, cardId, shopId]);
  useEffect(() => {
    setCard(null);
    setCards([]);
    setProgram(null);
    setHistory([]);
    setPurpose(null);
    setAccepted(false);
    setCursor(null);
    load();
    return () => {
      loadVersion.current++;
    };
  }, [load]);
  const loadMore = async () => {
    if (moreBusy || !cursor) return;
    const version = loadVersion.current;
    setMoreBusy(true);
    setError("");
    try {
      const data = await loyaltyApi(authToken, "card", undefined, {
        card_id: cardId,
        before_id: cursor,
      });
      if (version === loadVersion.current) {
        setHistory((old) => [
          ...old,
          ...data.history.filter(
            (row) => !old.some((item) => item.id === row.id),
          ),
        ]);
        setCursor(data.next_cursor);
      }
    } catch (err) {
      if (version === loadVersion.current) setError(err.message);
    } finally {
      setMoreBusy(false);
    }
  };
  useEffect(() => {
    const visible = () => {
      if (!document.hidden && !purpose) load();
    };
    document.addEventListener("visibilitychange", visible);
    return () => document.removeEventListener("visibilitychange", visible);
  }, [load, purpose]);
  const booked = useCallback(() => {
    setPurpose(null);
    setMessage("Das Personal hat den Vorgang bestätigt.");
    load();
  }, [load]);
  const join = async () => {
    if (joining || !accepted) return;
    setJoining(true);
    setError("");
    try {
      const data = await loyaltyApi(authToken, "join", {
        program_id: Number(program.id),
      });
      setCards((old) => [
        ...old.filter((item) => item.id !== data.card.id),
        data.card,
      ]);
      setMessage("Du nimmst jetzt an der Kundenkarte teil.");
    } catch (err) {
      setError(err.message);
    } finally {
      setJoining(false);
    }
  };
  const existing =
    program &&
    cards.find((item) => Number(item.program_id) === Number(program.id));
  return (
    <LoyaltyLayout
      title={cardId ? "Deine Kundenkarte" : "Meine Kundenkarten"}
      intro="Sammle beim Kauf Stempel. Das Personal bestätigt deinen Einkauf und die Ausgabe deiner Prämien."
    >
      <Feedback error={error} message={message} />
      {error && (
        <button onClick={load} disabled={loading}>
          Erneut versuchen
        </button>
      )}
      {loading && <p role="status">Kundenkarten werden geladen …</p>}
      {program && !existing && (
        <section className="loyalty-panel">
          <h2>{program.shop_name}</h2>
          <p>
            {program.stamp_target} {unitLabel(program.unit)} ergeben:{" "}
            <strong>{program.reward}</strong>
          </p>
          <label>
            <input
              type="checkbox"
              checked={accepted}
              onChange={(event) => setAccepted(event.target.checked)}
            />
            Ich möchte an dieser Kundenkarte teilnehmen.
          </label>
          <button
            className="loyalty-primary"
            disabled={!accepted || joining}
            onClick={join}
          >
            {joining ? "Teilnahme wird gespeichert …" : "Kundenkarte starten"}
          </button>
        </section>
      )}
      {shopId && !program && !loading && !error && (
        <p>Diese Eisdiele bietet derzeit kein neues Kundenkartenprogramm an.</p>
      )}
      {!cardId && (
        <div className="loyalty-grid">
          {cards.map((item) => (
            <CardSummary key={item.id} card={item}>
              <Link className="loyalty-button" to={`/kundenkarten/${item.id}`}>
                Karte öffnen
              </Link>
            </CardSummary>
          ))}
        </div>
      )}
      {!cardId && !cards.length && !loading && !error && (
        <section className="loyalty-panel">
          <h2>Noch keine Kundenkarte</h2>
          <p>
            Teilnehmende Eisdielen bieten ihre Kundenkarte auf ihrer
            Eisdielenseite an.
          </p>
          <Link className="loyalty-button" to="/map">
            Eisdielen entdecken
          </Link>
        </section>
      )}
      {card && (
        <>
          <CardSummary card={card}>
            {card.program_state === "active" && (
              <button
                className="loyalty-primary"
                onClick={() => setPurpose("stamp")}
              >
                Stempel sammeln
              </button>
            )}
            {card.available_rewards > 0 && (
              <button
                className="loyalty-primary"
                onClick={() => setPurpose("redeem")}
              >
                Prämie einlösen
              </button>
            )}
            <Link className="loyalty-button" to={`/shop/${card.shop_id}`}>
              Zur Eisdiele
            </Link>
          </CardSummary>
          <section className="loyalty-panel">
            <h2>Dein Verlauf</h2>
            {!history.length ? (
              <p>Dein erster Kauf wartet noch auf Bestätigung.</p>
            ) : (
              <ul className="loyalty-history">
                {history.map((entry) => (
                  <li key={entry.id}>
                    <span>
                      {entry.kind === "stamp"
                        ? `+${entry.units} Stempel`
                        : entry.kind === "redeem"
                          ? "Prämie eingelöst"
                          : `${entry.units} Stempel · Storno`}
                      <time>{loyaltyDate(entry.created_at)}</time>
                    </span>
                    {Number(entry.reward_delta) > 0 && (
                      <span className="loyalty-badge">
                        +{entry.reward_delta} Prämie
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {cursor && (
              <button disabled={moreBusy} onClick={loadMore}>
                {moreBusy ? "Wird geladen …" : "Weitere Buchungen laden"}
              </button>
            )}
          </section>
        </>
      )}
      {purpose && card && (
        <LoyaltyCodeDialog
          card={card}
          purpose={purpose}
          token={authToken}
          onClose={() => setPurpose(null)}
          onBooked={booked}
        />
      )}
    </LoyaltyLayout>
  );
}
