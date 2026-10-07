import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { Modal } from "../Modal";
import { useUser } from "../../context/UserContext";
import { ShopButton, ShopPanel } from "../../styles/ShopUi";
import { ICE_TYPES, ICE_LABELS, OFFERING_STATES, iceOfferings } from "../../utils/shopOfferings.mjs";

const Panel = styled(ShopPanel)`
  width: min(520px, calc(100vw - 24px)); max-height: calc(100dvh - 40px); overflow-y: auto;
  label { display: block; margin-top: 16px; font-weight: 600; }
  select { width: 100%; min-height: 44px; margin-top: 7px; padding: 8px; border: 1px solid #ddd4c2; border-radius: 10px; background: #fff; color: #342d21; font: inherit; }
  .dialog-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px; }
`;
export default function ShopOfferingDialog({ data, onClose, onChanged }) {
  const { authToken, userId } = useUser();
  const isAdmin = Number(userId) === 1;
  const offerings = iceOfferings(data);
  const [initialStates] = useState(() => Object.fromEntries(ICE_TYPES.map(type => [type, offerings[type].my_state || "unknown"])));
  const [states, setStates] = useState(initialStates);
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const panelRef = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    panelRef.current?.querySelector("select")?.focus();
    return () => previous?.focus?.();
  }, []);
  const trapFocus = event => {
    if (event.key !== "Tab") return;
    const targets = [...panelRef.current.querySelectorAll("select, button:not(:disabled)")];
    const first = targets[0], last = targets.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  };
  const submit = async event => {
    event.preventDefault();
    if (busy) return;
    const changes = Object.fromEntries(Object.entries(states).filter(([type, state]) => state !== initialStates[type]));
    if (Object.keys(changes).length === 0) { onClose(); return; }
    setBusy(true); setError("");
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/shop_ice_offerings.php?action=report`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json", ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
        body: JSON.stringify({ shop_id: Number(data.eisdiele.id), states: changes }),
      });
      const result = await response.json();
      if (!response.ok || result.status !== "success") throw new Error(result.message || "Die Angabe konnte nicht gespeichert werden.");
      window.dispatchEvent(new Event("shop-change-requests-updated"));
      await onChanged?.(); onClose();
    } catch (failure) { setError(failure.message); } finally { setBusy(false); }
  };
  return <Modal onClose={busy ? undefined : onClose}><Panel ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="offering-dialog-title" onKeyDown={trapFocus}>
    <h2 id="offering-dialog-title">Welches Eis gibt es hier?</h2>
    <p>{data.eisdiele.name}: {isAdmin
      ? "Deine Angaben werden als Admin direkt übernommen. Aktive Betreiberangaben haben weiterhin Vorrang."
      : "Melde nur, was du weißt. Zwei übereinstimmende Angaben oder eine Adminfreigabe bestätigen das Angebot. Betreiberangaben haben Vorrang."}</p>
    <form onSubmit={submit}><fieldset disabled={busy} style={{ border: 0, padding: 0, margin: 0 }}>
      {ICE_TYPES.map(type => <label key={type} htmlFor={`offering-${type}`}>{ICE_LABELS[type]}<select id={`offering-${type}`} value={states[type]} onChange={event => setStates(old => ({ ...old, [type]: event.target.value }))}>{Object.entries(OFFERING_STATES).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>)}
      <p>„Keine Angabe“ nimmt deine bisherige Meldung für diese Eisart zurück.</p>
      {error && <p role="alert">{error}</p>}
      <div className="dialog-actions"><ShopButton as="button" type="submit" $primary>{busy ? "Wird gespeichert …" : "Angaben speichern"}</ShopButton><ShopButton onClick={onClose}>Abbrechen</ShopButton></div>
    </fieldset></form>
  </Panel></Modal>;
}
