import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { useUser } from "../../context/UserContext";
import { ShopPanel, ShopButton } from "../../styles/ShopUi";
import { ICE_LABELS, OFFERING_STATES } from "../../utils/shopOfferings.mjs";

const Grid = styled.div`display: grid; gap: 12px; margin: 16px 0;`;
const Actions = styled.div`display: flex; flex-wrap: wrap; gap: 8px;`;
export default function ShopOfferingModeration() {
  const { authToken, userId } = useUser();
  const [reports, setReports] = useState([]), [status, setStatus] = useState("pending");
  const [error, setError] = useState(""), [loading, setLoading] = useState(false), [busy, setBusy] = useState(null);
  const request = useCallback(async (action, payload) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/shop_ice_offerings.php?action=${action}${payload ? "" : `&status=${status}`}`, {
      method: payload ? "POST" : "GET", credentials: "include",
      headers: { ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}), ...(payload ? { "Content-Type": "application/json" } : {}) },
      ...(payload ? { body: JSON.stringify(payload) } : {}),
    });
    const data = await response.json();
    if (!response.ok || data.status !== "success") throw new Error(data.message || "Angebotsmeldungen konnten nicht geladen werden.");
    return data;
  }, [authToken, status]);
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setReports((await request("list")).reports); } catch (failure) { setError(failure.message); } finally { setLoading(false); }
  }, [request]);
  useEffect(() => { if (Number(userId) === 1) load(); }, [load, userId]);
  const review = async (report, decision) => {
    if (busy) return;
    setBusy(report.id); setError("");
    try {
      await request("review", { report_id: Number(report.id), updated_at: report.updated_at, decision });
      window.dispatchEvent(new Event("shop-change-requests-updated"));
      await load();
    }
    catch (failure) { setError(failure.message); } finally { setBusy(null); }
  };
  if (Number(userId) !== 1) return null;
  return <ShopPanel>
    <h2>Eisangebot aus der Community</h2>
    <p>Zwei übereinstimmende Meldungen bestätigen das Angebot. Du kannst eine einzelne Meldung freigeben. Aktive Betreiberangaben haben Vorrang.</p>
    <label htmlFor="offering-moderation-status">Meldungsstatus </label>
    <select id="offering-moderation-status" value={status} onChange={event => setStatus(event.target.value)} style={{ minHeight: 44 }}>
      <option value="pending">Offen</option><option value="approved">Freigegeben</option><option value="rejected">Abgelehnt</option><option value="withdrawn">Zurückgenommen</option><option value="all">Alle</option>
    </select>{" "}<ShopButton onClick={load} disabled={loading}>Aktualisieren</ShopButton>
    {error && <p role="alert">{error}</p>}
    {loading ? <p role="status">Lade Angebotsmeldungen …</p> : <Grid>{reports.length === 0 && <p>Keine Angebotsmeldungen für diesen Status.</p>}{reports.map(report => <ShopPanel key={report.id}>
      <h3><Link to={`/shop/${report.shop_id}`}>{report.shop_name}</Link> · {ICE_LABELS[report.ice_type]}</h3>
      <p><strong>{OFFERING_STATES[report.state]}</strong> · von {report.requester_name}</p>
      <small>{new Date(report.updated_at.replace(" ", "T")).toLocaleString("de-DE")}</small>
      {report.status === "pending" && <Actions><ShopButton $primary disabled={busy !== null} onClick={() => review(report, "approve")}>Freigeben</ShopButton><ShopButton disabled={busy !== null} onClick={() => review(report, "reject")}>Ablehnen</ShopButton></Actions>}
    </ShopPanel>)}</Grid>}
  </ShopPanel>;
}
