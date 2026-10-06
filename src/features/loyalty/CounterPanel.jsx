import React, { useCallback, useRef, useState } from "react";
import LoyaltyScanner from "./LoyaltyScanner";
import { Feedback } from "./LoyaltyLayout";
import { loyaltyApi, newLoyaltyRequestKey, unitLabel } from "./api";
import { useUser } from "../../context/UserContext";

export default function CounterPanel({ shopId, token }) {
  const { userId } = useUser();
  const storageKey = `loyalty-pending:${userId}:${shopId}`;
  const [saved] = useState(() => {
    try {
      const value = JSON.parse(sessionStorage.getItem(storageKey));
      return value?.payload?.shop_id === Number(shopId) &&
        value?.preview?.card &&
        typeof value.payload.request_key === "string"
        ? value
        : null;
    } catch {
      return null;
    }
  });
  const [code, setCode] = useState(saved?.payload.code || ""),
    [preview, setPreview] = useState(saved?.preview || null),
    [quantity, setQuantity] = useState(saved?.payload.quantity || 1),
    [camera, setCamera] = useState(false);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [uncertain, setUncertain] = useState(!!saved);
  const pending = useRef(saved?.payload || null),
    lock = useRef(false);
  const clearPending = () => {
    pending.current = null;
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      /* Continue if storage is unavailable. */
    }
  };
  const inspect = useCallback(
    async (raw) => {
      if (lock.current || pending.current) return;
      setCamera(false);
      setCode(raw);
      setPreview(null);
      setError("");
      setMessage("");
      setBusy(true);
      lock.current = true;
      try {
        const result = await loyaltyApi(token, "inspect_code", {
          shop_id: Number(shopId),
          code: raw,
        });
        setPreview(result);
        setQuantity(1);
      } catch (err) {
        setError(err.message);
      } finally {
        setBusy(false);
        lock.current = false;
      }
    },
    [shopId, token],
  );
  const book = async () => {
    if (lock.current || !preview) return;
    lock.current = true;
    setBusy(true);
    setError("");
    if (!pending.current)
      pending.current = {
        shop_id: Number(shopId),
        code,
        purpose: preview.purpose,
        quantity:
          preview.purpose === "redeem" || preview.card.unit === "purchase"
            ? 1
            : Number(quantity),
        request_key: newLoyaltyRequestKey(),
      };
    try {
      sessionStorage.setItem(
        storageKey,
        JSON.stringify({ payload: pending.current, preview }),
      );
    } catch {
      /* The in-memory request key still protects retries. */
    }
    try {
      const result = await loyaltyApi(token, "book", pending.current);
      setMessage(
        result.kind === "redeem"
          ? `Prämie bestätigt: ${result.card.reward}`
          : `${result.quantity} Stempel bestätigt.${result.reward_delta > 0 ? ` ${result.reward_delta} neue Prämie verfügbar – zum Einlösen den Prämiencode scannen.` : ""}`,
      );
      clearPending();
      setUncertain(false);
      setCode("");
      setPreview(null);
      setQuantity(1);
    } catch (err) {
      setError(err.message);
      setUncertain(!!err.uncertain);
      if (!err.uncertain) {
        clearPending();
        if (err.status === 409 || err.status === 403) setPreview(null);
      }
    } finally {
      setBusy(false);
      lock.current = false;
    }
  };
  return (
    <section className="loyalty-panel">
      <h2>Thekenmodus</h2>
      <p>
        Nach dem bezahlten Kauf Kundenkarte scannen, Menge prüfen und
        bestätigen.
      </p>
      <Feedback error={error} message={message} />
      {uncertain && (
        <p className="loyalty-muted">
          Das Ergebnis ist noch unklar. „Bestätigung erneut prüfen“ wiederholt
          denselben Vorgang und vergibt keine zusätzlichen Stempel.
        </p>
      )}
      <fieldset disabled={busy || uncertain}>
        <div className="loyalty-actions">
          <button className="loyalty-primary" onClick={() => setCamera(true)}>
            Kundenkarte scannen
          </button>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            inspect(code);
          }}
        >
          <label htmlFor="loyalty-code-input">Eingabecode</label>
          <input
            id="loyalty-code-input"
            autoComplete="off"
            inputMode="numeric"
            maxLength={100}
            value={code}
            onChange={(event) => {
              setCode(event.target.value);
              setPreview(null);
            }}
            placeholder="10-stelligen Code eingeben"
          />
          <button style={{ marginTop: 10 }} disabled={!code.trim()}>
            {busy ? "Code wird geprüft …" : "Code prüfen"}
          </button>
        </form>
      </fieldset>
      {preview && (
        <section className="loyalty-panel">
          <span className="loyalty-badge">
            {preview.purpose === "redeem"
              ? "Prämie ausgeben"
              : "Bezahlten Kauf bestätigen"}
          </span>
          <h3>
            {preview.card.username} · Karte #{preview.card.id}
          </h3>
          <p>{preview.card.shop_name}</p>
          <p>
            {preview.card.stamp_target} {unitLabel(preview.card.unit)} ={" "}
            {preview.card.reward}
          </p>
          {preview.purpose === "redeem" ? (
            <p>
              <strong>Jetzt eine Prämie ausgeben: {preview.card.reward}</strong>
            </p>
          ) : preview.card.unit === "purchase" ? (
            <p>Ein bezahlter Kauf = ein Stempel.</p>
          ) : (
            <>
              <label htmlFor="loyalty-quantity">Anzahl bezahlter Kugeln</label>
              <input
                id="loyalty-quantity"
                type="number"
                min="1"
                max="50"
                step="1"
                value={quantity}
                disabled={busy || uncertain}
                onChange={(event) => setQuantity(event.target.value)}
              />
              <p className="loyalty-muted">Gratis-Kugeln nicht mitzählen.</p>
            </>
          )}
          <button
            className="loyalty-primary"
            disabled={
              busy ||
              !Number.isInteger(Number(quantity)) ||
              Number(quantity) < 1 ||
              Number(quantity) > 50
            }
            onClick={book}
          >
            {busy
              ? "Wird bestätigt …"
              : uncertain
                ? "Bestätigung erneut prüfen"
                : preview.purpose === "redeem"
                  ? "Prämie wurde ausgegeben"
                  : "Bezahlten Kauf bestätigen"}
          </button>
        </section>
      )}
      {camera && (
        <LoyaltyScanner onCode={inspect} onClose={() => setCamera(false)} />
      )}
    </section>
  );
}
