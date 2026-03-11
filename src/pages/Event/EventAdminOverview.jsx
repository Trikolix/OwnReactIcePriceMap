import React, { useEffect, useState } from "react";
import styled from "styled-components";
import Header from "./Header";
import Footer from "./Footer";
import { getApiBaseUrl } from "../../shared/api/client";
import { useUser } from "../../context/UserContext";

const Page = styled.div`
  min-height: 100vh;
  background: var(--event-bg);
`;
const Container = styled.div`
  width: min(96%, 1200px);
  margin: 0 auto;
  padding: 1rem;
`;
const Card = styled.div`
  background: #fffdfa;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(255, 181, 34, 0.08);
  padding: 1.1rem;
  margin-bottom: 1rem;
`;
const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
`;
const Badge = styled.span`
  display: inline-block;
  border-radius: 999px;
  padding: 0.2rem 0.6rem;
  background: #fff3c2;
  color: #8a5700;
  font-weight: 700;
  font-size: 0.85rem;
`;
const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  th, td {
    padding: 0.5rem;
    border-bottom: 1px solid #f3e5bd;
    text-align: left;
    vertical-align: top;
  }
`;

function formatEuro(value) {
  return `${Number(value || 0).toFixed(2)} EUR`;
}

export default function EventAdminOverview() {
  const apiUrl = getApiBaseUrl();
  const { authToken } = useUser();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!apiUrl) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/event2026/admin_registrations.php`, {
        headers: {
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
      });
      const json = await res.json();
      if (!res.ok || json.status !== "success") {
        throw new Error(json.message || "Admin-Daten konnten nicht geladen werden.");
      }
      setData(json);
      setError("");
    } catch (err) {
      setError(err.message || "Admin-Daten konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [apiUrl, authToken]);

  const confirmRegistrationPayment = async (registration) => {
    if (!apiUrl) return;
    try {
      const res = await fetch(`${apiUrl}/event2026/payments_manual_confirm.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          registration_id: registration.id,
          paid_amount: registration.payment.expected_amount,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.status !== "success") {
        throw new Error(json.message || "Zahlung konnte nicht bestätigt werden.");
      }
      await load();
    } catch (err) {
      setError(err.message || "Zahlung konnte nicht bestätigt werden.");
    }
  };

  const confirmAddonPayment = async (purchase) => {
    if (!apiUrl) return;
    try {
      const res = await fetch(`${apiUrl}/event2026/payments_manual_confirm.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          addon_purchase_id: purchase.id,
          paid_amount: purchase.expected_amount,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.status !== "success") {
        throw new Error(json.message || "Zusatzbestellung konnte nicht bestätigt werden.");
      }
      await load();
    } catch (err) {
      setError(err.message || "Zusatzbestellung konnte nicht bestätigt werden.");
    }
  };

  return (
    <Page>
      <Header />
      <Container>
        <Card>
          <h1 style={{ marginTop: 0 }}>Admin-Übersicht</h1>
          <p style={{ marginBottom: 0, color: "#7c4f00" }}>
            Registrierungen, Zahlungsstände und Gutschein-Codes für die Ice-Tour.
          </p>
        </Card>

        {loading && <Card>Daten werden geladen…</Card>}
        {error && <Card style={{ color: "#9f1239" }}>{error}</Card>}

        {data && (
          <>
            <Card>
              <Grid>
                <div><strong>Registrierungen</strong><div>{data.summary.registration_count}</div></div>
                <div><strong>Starter</strong><div>{data.summary.participant_count}</div></div>
                <div><strong>Gutscheine</strong><div>{data.summary.voucher_count}</div></div>
                <div><strong>Zusatzbestellungen</strong><div>{data.summary.addon_purchase_count || 0}</div></div>
                <div><strong>Offene Zusatzbestellungen</strong><div>{data.summary.open_addon_purchase_count || 0}</div></div>
                <div><strong>Offene Gutscheine</strong><div>{data.summary.open_voucher_count}</div></div>
                <div><strong>Eingelöste Gutscheine</strong><div>{data.summary.redeemed_voucher_count}</div></div>
                <div><strong>Soll gesamt</strong><div>{formatEuro(data.summary.expected_amount_total)}</div></div>
                <div><strong>Startgebühren</strong><div>{formatEuro(data.summary.entry_fee_amount_total)}</div></div>
                <div><strong>Gutschein-Verkäufe</strong><div>{formatEuro(data.summary.gift_voucher_purchase_amount_total)}</div></div>
                <div><strong>Gutschein-Abzüge</strong><div>{formatEuro(data.summary.voucher_discount_amount_total)}</div></div>
                <div><strong>Zusatzbetrag</strong><div>{formatEuro(data.summary.donation_amount_total)}</div></div>
              </Grid>
            </Card>

            {data.registrations.map((registration) => (
              <Card key={registration.id}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <h2 style={{ margin: "0 0 0.35rem" }}>Registrierung #{registration.id}</h2>
                    <div>Account: <strong>{registration.registered_by.username || "-"}</strong></div>
                    <div>Referenz: <strong>{registration.payment.reference_code}</strong></div>
                    <div>Status: <Badge>{registration.payment.status}</Badge></div>
                  </div>
                  {registration.payment.status !== "paid" && (
                    <button onClick={() => confirmRegistrationPayment(registration)}>Zahlung als bezahlt markieren</button>
                  )}
                </div>

                <Table>
                  <tbody>
                    <tr><th>Eigene Startgebühr</th><td>{formatEuro(registration.payment.entry_fee_amount)}</td></tr>
                    <tr><th>Gutschein-Käufe</th><td>{formatEuro(registration.payment.gift_voucher_purchase_amount)} ({registration.payment.gift_voucher_quantity} Codes)</td></tr>
                    <tr><th>Gutschein-Abzug</th><td>-{formatEuro(registration.payment.voucher_discount_amount)}</td></tr>
                    <tr><th>Zusatzbetrag</th><td>{formatEuro(registration.payment.donation_amount)}</td></tr>
                    <tr><th>Soll / Ist / Offen</th><td>{formatEuro(registration.payment.expected_amount)} / {formatEuro(registration.payment.paid_amount)} / {formatEuro(registration.payment.outstanding_amount)}</td></tr>
                  </tbody>
                </Table>

                <h3>Starter</h3>
                <Table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Route</th>
                      <th>Linked Account</th>
                      <th>Status</th>
                      <th>Bekleidung</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registration.slots.map((slot) => (
                      <tr key={slot.id}>
                        <td>{slot.full_name}<div>{slot.email}</div></td>
                        <td>{slot.route_name} ({slot.distance_km} km)</td>
                        <td>{slot.linked_username || "-"}</td>
                        <td>{slot.license_status}</td>
                        <td>{slot.clothing_interest_label}{slot.jersey_size ? `, Trikot ${slot.jersey_size}` : ""}{slot.bib_size ? `, Hose ${slot.bib_size}` : ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>

                {registration.gift_vouchers.length > 0 && (
                  <>
                    <h3>Gutschein-Codes</h3>
                    <Table>
                      <thead>
                        <tr>
                          <th>Code</th>
                          <th>Status</th>
                          <th>Eingelöst durch</th>
                          <th>Zeitpunkt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {registration.gift_vouchers.map((voucher) => (
                          <tr key={voucher.id}>
                            <td>{voucher.code || `#${voucher.id}`}</td>
                            <td>{voucher.status}</td>
                            <td>{voucher.redeemed_by_registration_id || "-"}</td>
                            <td>{voucher.redeemed_at || voucher.created_at}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </>
                )}
              </Card>
            ))}

            {data.addon_purchases?.map((purchase) => (
              <Card key={`addon-${purchase.id}`}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <h2 style={{ margin: "0 0 0.35rem" }}>Zusatzbestellung #{purchase.id}</h2>
                    <div>Käufer: <strong>{purchase.buyer.username || purchase.buyer.name || "-"}</strong></div>
                    {purchase.buyer.email && <div>E-Mail: <strong>{purchase.buyer.email}</strong></div>}
                    <div>Registrierung: <strong>{purchase.registration_id ? `#${purchase.registration_id}` : "ohne eigene Teilnahme"}</strong></div>
                    <div>Referenz: <strong>{purchase.payment_reference_code}</strong></div>
                    <div>Status: <Badge>{purchase.status}</Badge></div>
                  </div>
                  {purchase.status !== "paid" && (
                    <button onClick={() => confirmAddonPayment(purchase)}>Zusatzbestellung als bezahlt markieren</button>
                  )}
                </div>
                <Table>
                  <tbody>
                    <tr><th>Gutschein-Codes</th><td>{purchase.gift_voucher_quantity}</td></tr>
                    <tr><th>Soll / Ist</th><td>{formatEuro(purchase.expected_amount)} / {formatEuro(purchase.paid_amount)}</td></tr>
                  </tbody>
                </Table>
                {purchase.gift_vouchers?.length > 0 && (
                  <>
                    <h3>Freigeschaltete Codes aus dieser Bestellung</h3>
                    <Table>
                      <thead>
                        <tr>
                          <th>Code</th>
                          <th>Status</th>
                          <th>Zeitpunkt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchase.gift_vouchers.map((voucher) => (
                          <tr key={`addon-voucher-${voucher.id}`}>
                            <td>{voucher.code || `#${voucher.id}`}</td>
                            <td>{voucher.status}</td>
                            <td>{voucher.redeemed_at || voucher.created_at}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </>
                )}
              </Card>
            ))}
          </>
        )}
      </Container>
      <Footer />
    </Page>
  );
}
