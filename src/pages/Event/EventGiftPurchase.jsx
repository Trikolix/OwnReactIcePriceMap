import React, { useMemo, useState } from "react";
import styled from "styled-components";
import { Gift, HeartHandshake } from "lucide-react";
import Header from "./Header";
import Footer from "./Footer";
import { getApiBaseUrl } from "../../shared/api/client";
import { EVENT_ENTRY_FEE, EVENT_PAYMENT_CONTACT_EMAIL, EVENT_PAYMENT_PAYPAL_ADDRESS, EVENT_PAYMENT_PAYPAL_URL } from "./eventConfig";

const Page = styled.div`
  min-height: 100vh;
  background: var(--event-bg);
`;
const Container = styled.div`
  width: min(96%, 980px);
  margin: 0 auto;
  padding: 1rem;
`;
const Card = styled.div`
  background: #fffdfa;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(255, 181, 34, 0.08);
  padding: 1.2rem;
  margin-bottom: 1rem;
`;
const Label = styled.label`
  display: block;
  font-weight: 600;
  margin-bottom: 0.35rem;
`;
const Input = styled.input`
  width: 100%;
  padding: 0.65rem 0.8rem;
  border: 1px solid #ffd77a;
  border-radius: 6px;
  margin-bottom: 0.75rem;
  box-sizing: border-box;
`;
const Textarea = styled.textarea`
  width: 100%;
  min-height: 90px;
  padding: 0.65rem 0.8rem;
  border: 1px solid #ffd77a;
  border-radius: 6px;
  margin-bottom: 0.75rem;
  box-sizing: border-box;
`;
const Button = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--event-accent);
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.7rem 1.15rem;
  cursor: pointer;
`;
const LinkButton = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #0070ba;
  color: #fff;
  border-radius: 6px;
  padding: 0.7rem 1.15rem;
  text-decoration: none;
  font-weight: 600;
  margin-top: 0.75rem;
`;
const Banner = styled.div`
  border-radius: 8px;
  padding: 0.85rem 1rem;
  margin-bottom: 1rem;
  background: ${({ tone }) => (tone === "danger" ? "#fee2e2" : "#fff7e5")};
  border: 1px solid ${({ tone }) => (tone === "danger" ? "#fecaca" : "#ffd77a")};
  color: ${({ tone }) => (tone === "danger" ? "#9f1239" : "#8a5700")};
`;

function formatEuro(value) {
  return `${Number(value || 0).toFixed(2)} EUR`;
}

export default function EventGiftPurchase() {
  const apiUrl = getApiBaseUrl();
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [giftVoucherQuantity, setGiftVoucherQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const total = useMemo(() => giftVoucherQuantity * EVENT_ENTRY_FEE, [giftVoucherQuantity]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!apiUrl) return;
    setSubmitting(true);
    setError("");
    setSuccess(null);
    try {
      const response = await fetch(`${apiUrl}/event2026/gift_purchase.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyerName, buyerEmail, giftVoucherQuantity, notes }),
      });
      const result = await response.json();
      if (!response.ok || result.status !== "success") {
        throw new Error(result.message || "Gutschein-Bestellung konnte nicht gespeichert werden.");
      }
      setSuccess(result);
    } catch (err) {
      setError(err.message || "Gutschein-Bestellung konnte nicht gespeichert werden.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Page>
      <Header />
      <Container>
        <Card>
          <h1 style={{ marginTop: 0 }}>Gutschein-Codes verschenken</h1>
          <p style={{ margin: 0, color: "#7c4f00" }}>
            Hier kaufst du nur Geschenk-Codes für Startplätze der Ice-Tour. Du meldest dich damit nicht selbst als Teilnehmer an.
          </p>
        </Card>

        {error && <Banner tone="danger">{error}</Banner>}
        {success && (
          <Card>
            <h2 style={{ marginTop: 0 }}>Bestellung gespeichert</h2>
            <p>Referenzcode: <strong>{success.gift_purchase.payment_reference_code}</strong></p>
            <p>Gutschein-Codes: <strong>{success.gift_purchase.gift_voucher_quantity}</strong></p>
            <p>Gesamtbetrag: <strong>{formatEuro(success.gift_purchase.expected_amount)}</strong></p>
            <p style={{ marginBottom: 0, color: "#7c4f00" }}>
              Die Codes werden erst nach bestätigter Zahlung per E-Mail freigeschaltet.
            </p>
            <LinkButton href={EVENT_PAYMENT_PAYPAL_URL} target="_blank" rel="noreferrer">Direkt per PayPal zahlen</LinkButton>
          </Card>
        )}

        <form onSubmit={handleSubmit}>
          <Card>
            <h2 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}><Gift size={20} /> Bestellung</h2>
            <Label>Name</Label>
            <Input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} required />
            <Label>E-Mail</Label>
            <Input type="email" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} required />
            <Label>Anzahl Gutschein-Codes</Label>
            <Input type="number" min="1" max="20" value={giftVoucherQuantity} onChange={(e) => setGiftVoucherQuantity(Math.max(1, Number(e.target.value) || 1))} required />
            <Label>Notiz (optional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
            <Button type="submit" disabled={submitting}>{submitting ? "Speichern..." : "Gutschein-Bestellung anlegen"}</Button>
          </Card>

          <Card>
            <h2 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}><HeartHandshake size={20} /> Übersicht</h2>
            <p>Preis pro Gutschein-Code: <strong>{formatEuro(EVENT_ENTRY_FEE)}</strong></p>
            <p>Gesamt: <strong>{formatEuro(total)}</strong></p>
            <p style={{ marginBottom: 0, color: "#7c4f00" }}>
              Zahlung bitte wenn möglich per PayPal Freunde an <strong>{EVENT_PAYMENT_PAYPAL_ADDRESS}</strong>. Wenn kein PayPal vorhanden ist, bitte an <strong>{EVENT_PAYMENT_CONTACT_EMAIL}</strong> schreiben.
            </p>
          </Card>
        </form>
      </Container>
      <Footer />
    </Page>
  );
}
