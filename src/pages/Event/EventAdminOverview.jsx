import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import QRCode from "qrcode";
import Header from "./Header";
import Footer from "./Footer";
import { getApiBaseUrl } from "../../shared/api/client";
import { useUser } from "../../context/UserContext";
import Seo from "../../components/Seo";
import { formatRouteShortWithDistance, getPaceLabel, routeSupportsPace } from "./eventConfig";

const Page = styled.div`
  min-height: 100vh;
  background: var(--event-bg);
`;

const Container = styled.div`
  width: min(96%, 1240px);
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

const SummaryBox = styled.div`
  border: 1px solid #f3e5bd;
  border-radius: 12px;
  padding: 0.8rem 0.9rem;
  background: #fffaf0;
`;

const Badge = styled.span`
  display: inline-block;
  border-radius: 999px;
  padding: 0.2rem 0.6rem;
  background: ${({ $tone }) => ($tone === "success" ? "#dcfce7" : "#fff3c2")};
  color: ${({ $tone }) => ($tone === "success" ? "#166534" : "#8a5700")};
  font-weight: 700;
  font-size: 0.85rem;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  flex-wrap: wrap;
  margin-bottom: 0.9rem;
`;

const SectionText = styled.p`
  margin: 0.35rem 0 0;
  color: #7c4f00;
  line-height: 1.45;
`;

const TableWrap = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;

  th, td {
    padding: 0.65rem 0.55rem;
    border-bottom: 1px solid #f3e5bd;
    text-align: left;
    vertical-align: top;
    white-space: nowrap;
  }

  th {
    color: #7c4f00;
    font-size: 0.82rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
`;

const ClickableRow = styled.tr`
  cursor: pointer;
  background: ${({ $selected }) => ($selected ? "#fff3c4" : "transparent")};

  &:hover {
    background: ${({ $selected }) => ($selected ? "#fff0b4" : "#fffaf0")};
  }
`;

const DetailGrid = styled.div`
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;

  @media (min-width: 980px) {
    grid-template-columns: 1.2fr 1fr;
  }
`;

const DetailSection = styled.div`
  border: 1px solid #f3e5bd;
  border-radius: 12px;
  background: #fffaf0;
  padding: 0.9rem;
`;

const DetailTitle = styled.h3`
  margin: 0 0 0.7rem;
  color: #3a2600;
  font-size: 1rem;
`;

const InfoList = styled.div`
  display: grid;
  gap: 0.55rem;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px dashed rgba(138, 87, 0, 0.18);
  padding-bottom: 0.45rem;
  flex-wrap: wrap;

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
`;

const InfoLabel = styled.span`
  color: #7c4f00;
`;

const InfoValue = styled.span`
  color: #2d1d00;
  font-weight: 700;
  text-align: right;

  @media (max-width: 720px) {
    width: 100%;
    text-align: left;
  }
`;

const ActionRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 0.9rem;
`;

const ActionButton = styled.button`
  border: none;
  border-radius: 8px;
  padding: 0.65rem 0.95rem;
  background: #ffb522;
  color: white;
  font-weight: 700;
  cursor: pointer;
`;

const AccountLink = styled(Link)`
  color: #d97706;
  font-weight: 700;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const QrGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 0.9rem;
`;

const QrCard = styled.div`
  border: 1px solid #f3e5bd;
  border-radius: 14px;
  background: #fffaf0;
  padding: 0.9rem;
  display: grid;
  gap: 0.75rem;
`;

const QrImage = styled.img`
  width: min(100%, 220px);
  aspect-ratio: 1 / 1;
  justify-self: center;
  background: #fff;
  border-radius: 12px;
  border: 1px solid rgba(124, 79, 0, 0.12);
  padding: 0.55rem;
  box-sizing: border-box;
`;

const MonoField = styled.input`
  width: 100%;
  border: 1px solid #ead7ab;
  border-radius: 10px;
  padding: 0.62rem 0.75rem;
  font: inherit;
  color: #2d1d00;
  background: #fffef9;
  box-sizing: border-box;
`;

const CopyButton = styled.button`
  border: 1px solid #ecd49b;
  border-radius: 10px;
  padding: 0.6rem 0.85rem;
  background: #fff5df;
  color: #7c4f00;
  font-weight: 700;
  cursor: pointer;
`;

const SectionToggle = styled.button`
  border: 1px solid #ecd49b;
  border-radius: 10px;
  padding: 0.6rem 0.85rem;
  background: #fff5df;
  color: #7c4f00;
  font-weight: 700;
  cursor: pointer;
`;

function formatEuro(value) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(Number(value || 0));
}

function formatDateTime(value) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("de-DE");
}

function statusTone(status) {
  return status === "paid" ? "success" : undefined;
}

function formatWomenWavePreference(slot) {
  if (!slot) return "-";
  if (!routeSupportsPace(slot.route_key)) return "nicht relevant";
  return slot.women_wave_opt_in ? "gewünscht" : "nein";
}

export default function EventAdminOverview() {
  const apiUrl = getApiBaseUrl();
  const { authToken } = useUser();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedRegistrationId, setSelectedRegistrationId] = useState(null);
  const [selectedAddonId, setSelectedAddonId] = useState(null);
  const [checkpointQrs, setCheckpointQrs] = useState([]);
  const [qrImageMap, setQrImageMap] = useState({});
  const [showCheckpointQrs, setShowCheckpointQrs] = useState(false);

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
      setSelectedRegistrationId((prev) => prev ?? json.registrations?.[0]?.id ?? null);
      setSelectedAddonId((prev) => prev ?? json.addon_purchases?.[0]?.id ?? null);
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

  useEffect(() => {
    if (!apiUrl) return;

    let cancelled = false;
    fetch(`${apiUrl}/event2026/admin_checkpoint_qrs.php`, {
      headers: {
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
    })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok || json.status !== "success") {
          throw new Error(json.message || "Checkpoint-QR-Codes konnten nicht geladen werden.");
        }
        if (!cancelled) {
          setCheckpointQrs(json.checkpoints || []);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError((current) => current || err.message || "Checkpoint-QR-Codes konnten nicht geladen werden.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [apiUrl, authToken]);

  useEffect(() => {
    if (!checkpointQrs.length) {
      setQrImageMap({});
      return;
    }

    let cancelled = false;
    const origin = typeof window === "undefined" ? "https://ice-app.de" : window.location.origin;

    Promise.all(
      checkpointQrs.map(async (checkpoint) => {
        const imageUrl = await QRCode.toDataURL(`${origin}${checkpoint.scan_path}`, {
          errorCorrectionLevel: "M",
          margin: 1,
          width: 512,
          color: {
            dark: "#2f2100",
            light: "#ffffff",
          },
        });
        return [checkpoint.checkpoint_id, imageUrl];
      })
    )
      .then((entries) => {
        if (!cancelled) {
          setQrImageMap(Object.fromEntries(entries));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError((current) => current || err.message || "QR-Bilder konnten nicht erzeugt werden.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [checkpointQrs]);

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

  const selectedRegistration = useMemo(
    () => data?.registrations?.find((registration) => registration.id === selectedRegistrationId) || null,
    [data, selectedRegistrationId]
  );

  const selectedAddon = useMemo(
    () => data?.addon_purchases?.find((purchase) => purchase.id === selectedAddonId) || null,
    [data, selectedAddonId]
  );

  const selectedPrimarySlot = useMemo(
    () => selectedRegistration?.slots?.[0] || null,
    [selectedRegistration]
  );
  const liveCheckpointQrs = useMemo(
    () => checkpointQrs.filter((checkpoint) => checkpoint.mode === "live"),
    [checkpointQrs]
  );
  const testCheckpointQrs = useMemo(
    () => checkpointQrs.filter((checkpoint) => checkpoint.mode === "test"),
    [checkpointQrs]
  );

  const copyToClipboard = async (value, label) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
    } catch (err) {
      setError(`${label} konnte nicht kopiert werden.`);
    }
  };

  return (
    <Page>
      <Seo
        title="Ice-Tour Admin"
        description="Administrationsbereich der Ice-Tour 2026."
        robots="noindex,nofollow"
      />
      <Header />
      <Container>
        <Card>
          <h1 style={{ marginTop: 0, marginBottom: "0.35rem" }}>Admin-Übersicht</h1>
          <p style={{ margin: 0, color: "#7c4f00" }}>
            Kompakte Listen mit Auswahlansicht für Registrierungen, Zahlungen und Gutschein-Codes.
          </p>
        </Card>

        <Card>
          <SectionHeader>
            <div>
              <h2 style={{ margin: 0 }}>Checkpoint-QR-Codes</h2>
              <SectionText>
                Hier bekommst du die Live-QR-Codes für die fünf Ice-Tour Checkpoints. Sie öffnen die Ice-App-Startseite mit dem passenden Scan-Link. Teilnehmer werden von dort automatisch in die Event-Stempelkarte weitergeleitet, alle anderen bleiben auf der Startseite.
              </SectionText>
            </div>
            <div style={{ display: "flex", gap: "0.65rem", alignItems: "center", flexWrap: "wrap" }}>
              <Badge>{liveCheckpointQrs.length} Live-Codes</Badge>
              <SectionToggle type="button" onClick={() => setShowCheckpointQrs((current) => !current)}>
                {showCheckpointQrs ? "QR-Codes einklappen" : "QR-Codes anzeigen"}
              </SectionToggle>
            </div>
          </SectionHeader>

          {showCheckpointQrs && (
            <>
              <QrGrid>
                {liveCheckpointQrs.map((checkpoint) => {
                  const origin = typeof window === "undefined" ? "https://ice-app.de" : window.location.origin;
                  const targetUrl = `${origin}${checkpoint.scan_path}`;
                  return (
                    <QrCard key={`live-${checkpoint.checkpoint_id}`}>
                      <div>
                        <strong>{checkpoint.shop_name}</strong>
                        <SectionText style={{ marginTop: "0.25rem" }}>
                          Checkpoint {checkpoint.order_index} · {checkpoint.route_labels.join(", ")}
                        </SectionText>
                      </div>
                      {qrImageMap[checkpoint.checkpoint_id] && (
                        <QrImage src={qrImageMap[checkpoint.checkpoint_id]} alt={`QR-Code für ${checkpoint.shop_name}`} />
                      )}
                      <div>
                        <InfoLabel>Scan-Link</InfoLabel>
                        <MonoField value={targetUrl} readOnly />
                      </div>
                      <div>
                        <InfoLabel>Interner QR-Code</InfoLabel>
                        <MonoField value={checkpoint.qr_code} readOnly />
                      </div>
                      <ActionRow style={{ marginBottom: 0 }}>
                        <CopyButton type="button" onClick={() => copyToClipboard(targetUrl, "Scan-Link")}>Link kopieren</CopyButton>
                        <CopyButton type="button" onClick={() => copyToClipboard(checkpoint.qr_code, "QR-Code")}>Code kopieren</CopyButton>
                      </ActionRow>
                    </QrCard>
                  );
                })}
              </QrGrid>

              {testCheckpointQrs.length > 0 && (
                <>
                  <SectionHeader style={{ marginTop: "1rem" }}>
                    <div>
                      <h2 style={{ margin: 0 }}>Test-QR-Codes</h2>
                      <SectionText>Zusätzliche Test-Checkpoints für Admin und lokale Prüfung.</SectionText>
                    </div>
                    <Badge>{testCheckpointQrs.length} Test-Codes</Badge>
                  </SectionHeader>
                  <QrGrid>
                    {testCheckpointQrs.map((checkpoint) => {
                      const origin = typeof window === "undefined" ? "https://ice-app.de" : window.location.origin;
                      const targetUrl = `${origin}${checkpoint.scan_path}`;
                      return (
                        <QrCard key={`test-${checkpoint.checkpoint_id}`}>
                          <div>
                            <strong>{checkpoint.shop_name}</strong>
                            <SectionText style={{ marginTop: "0.25rem" }}>
                              Checkpoint {checkpoint.order_index} · Testmodus
                            </SectionText>
                          </div>
                          {qrImageMap[checkpoint.checkpoint_id] && (
                            <QrImage src={qrImageMap[checkpoint.checkpoint_id]} alt={`Test-QR-Code für ${checkpoint.shop_name}`} />
                          )}
                          <MonoField value={targetUrl} readOnly />
                        </QrCard>
                      );
                    })}
                  </QrGrid>
                </>
              )}
            </>
          )}
        </Card>

        {loading && <Card>Daten werden geladen…</Card>}
        {error && <Card style={{ color: "#9f1239" }}>{error}</Card>}

        {data && (
          <>
            <Card>
              <Grid>
                <SummaryBox><strong>Registrierungen</strong><div>{data.summary.registration_count}</div></SummaryBox>
                <SummaryBox><strong>Starter</strong><div>{data.summary.participant_count}</div></SummaryBox>
                <SummaryBox><strong>Gutscheine</strong><div>{data.summary.voucher_count}</div></SummaryBox>
                <SummaryBox><strong>Zusatzbestellungen</strong><div>{data.summary.addon_purchase_count || 0}</div></SummaryBox>
                <SummaryBox><strong>Offene Zusatzbestellungen</strong><div>{data.summary.open_addon_purchase_count || 0}</div></SummaryBox>
                <SummaryBox><strong>Offene Gutscheine</strong><div>{data.summary.open_voucher_count}</div></SummaryBox>
                <SummaryBox><strong>Eingelöste Gutscheine</strong><div>{data.summary.redeemed_voucher_count}</div></SummaryBox>
                <SummaryBox><strong>Soll gesamt</strong><div>{formatEuro(data.summary.expected_amount_total)}</div></SummaryBox>
                <SummaryBox><strong>Teilnahmebeiträge</strong><div>{formatEuro(data.summary.entry_fee_amount_total)}</div></SummaryBox>
                <SummaryBox><strong>Gutschein-Verkäufe</strong><div>{formatEuro(data.summary.gift_voucher_purchase_amount_total)}</div></SummaryBox>
                <SummaryBox><strong>Gutschein-Abzüge</strong><div>{formatEuro(data.summary.voucher_discount_amount_total)}</div></SummaryBox>
                <SummaryBox><strong>Zusätzliche Spenden</strong><div>{formatEuro(data.summary.donation_amount_total)}</div></SummaryBox>
              </Grid>
            </Card>

            <Card>
              <SectionHeader>
                <div>
                  <h2 style={{ margin: 0 }}>Registrierungen</h2>
                  <SectionText>
                    Standardansicht als Tabelle. Klicke auf eine Zeile, um rechts darunter die vollständigen Details zu sehen.
                  </SectionText>
                </div>
                <Badge>{data.registrations.length} Einträge</Badge>
              </SectionHeader>

              <TableWrap>
                <Table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Account</th>
                      <th>Teilnehmer</th>
                      <th>Referenz</th>
                      <th>Status</th>
                      <th>Soll</th>
                      <th>Offen</th>
                      <th>Route</th>
                      <th>Tempo</th>
                      <th>Frauenwelle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.registrations.map((registration) => {
                      const primarySlot = registration.slots?.[0];
                      return (
                        <ClickableRow
                          key={registration.id}
                          $selected={registration.id === selectedRegistrationId}
                          onClick={() => setSelectedRegistrationId(registration.id)}
                        >
                          <td>#{registration.id}</td>
                          <td>{registration.registered_by.username || "-"}</td>
                          <td>{primarySlot?.full_name || "-"}</td>
                          <td>{registration.payment.reference_code}</td>
                          <td><Badge $tone={statusTone(registration.payment.status)}>{registration.payment.status}</Badge></td>
                          <td>{formatEuro(registration.payment.expected_amount)}</td>
                          <td>{formatEuro(registration.payment.outstanding_amount)}</td>
                          <td>{primarySlot ? formatRouteShortWithDistance(primarySlot.route_key, primarySlot.distance_km) : "-"}</td>
                          <td>{primarySlot ? getPaceLabel(primarySlot.pace_group) : "-"}</td>
                          <td>{formatWomenWavePreference(primarySlot)}</td>
                        </ClickableRow>
                      );
                    })}
                  </tbody>
                </Table>
              </TableWrap>
            </Card>

            {selectedRegistration && (
              <Card>
                <ActionRow>
                  <div>
                    <h2 style={{ margin: 0 }}>Details Registrierung #{selectedRegistration.id}</h2>
                    <SectionText>
                      Account: <strong>{selectedRegistration.registered_by.username || "-"}</strong> · Referenz: <strong>{selectedRegistration.payment.reference_code}</strong>
                    </SectionText>
                  </div>
                  {selectedRegistration.payment.status !== "paid" && (
                    <ActionButton onClick={() => confirmRegistrationPayment(selectedRegistration)}>
                      Zahlung als bezahlt markieren
                    </ActionButton>
                  )}
                </ActionRow>

                <DetailGrid>
                  <DetailSection>
                    <DetailTitle>Zahlung</DetailTitle>
                    <InfoList>
                      <InfoRow><InfoLabel>Status</InfoLabel><InfoValue>{selectedRegistration.payment.status}</InfoValue></InfoRow>
                      <InfoRow><InfoLabel>Eigener Teilnahmebeitrag</InfoLabel><InfoValue>{formatEuro(selectedRegistration.payment.entry_fee_amount)}</InfoValue></InfoRow>
                      <InfoRow><InfoLabel>Gutschein-Käufe</InfoLabel><InfoValue>{formatEuro(selectedRegistration.payment.gift_voucher_purchase_amount)} ({selectedRegistration.payment.gift_voucher_quantity} Codes)</InfoValue></InfoRow>
                      <InfoRow><InfoLabel>Gutschein-Abzug</InfoLabel><InfoValue>-{formatEuro(selectedRegistration.payment.voucher_discount_amount)}</InfoValue></InfoRow>
                      <InfoRow><InfoLabel>Zusätzliche Spende</InfoLabel><InfoValue>{formatEuro(selectedRegistration.payment.donation_amount)}</InfoValue></InfoRow>
                      <InfoRow><InfoLabel>Soll / Ist / Offen</InfoLabel><InfoValue>{formatEuro(selectedRegistration.payment.expected_amount)} / {formatEuro(selectedRegistration.payment.paid_amount)} / {formatEuro(selectedRegistration.payment.outstanding_amount)}</InfoValue></InfoRow>
                    </InfoList>
                  </DetailSection>

                  <DetailSection style={{ gridColumn: "1 / -1" }}>
                    <DetailTitle>Registrierung & Starter</DetailTitle>
                    <InfoList>
                      <InfoRow><InfoLabel>Team / Verein</InfoLabel><InfoValue>{selectedRegistration.team_name || "-"}</InfoValue></InfoRow>
                      <InfoRow><InfoLabel>Bemerkung</InfoLabel><InfoValue>{selectedRegistration.notes || "-"}</InfoValue></InfoRow>
                      <InfoRow><InfoLabel>Name / E-Mail</InfoLabel><InfoValue>{selectedPrimarySlot ? <>{selectedPrimarySlot.full_name}<br />{selectedPrimarySlot.email}</> : "-"}</InfoValue></InfoRow>
                      <InfoRow><InfoLabel>Route</InfoLabel><InfoValue>{selectedPrimarySlot ? `${selectedPrimarySlot.route_name} (${selectedPrimarySlot.distance_km} km)` : "-"}</InfoValue></InfoRow>
                      <InfoRow><InfoLabel>Tempo</InfoLabel><InfoValue>{selectedPrimarySlot ? getPaceLabel(selectedPrimarySlot.pace_group) : "-"}</InfoValue></InfoRow>
                      <InfoRow><InfoLabel>Frauenwelle</InfoLabel><InfoValue>{formatWomenWavePreference(selectedPrimarySlot)}</InfoValue></InfoRow>
                      <InfoRow><InfoLabel>Linked Account</InfoLabel><InfoValue>{selectedPrimarySlot?.linked_user_id ? <AccountLink to={`/user/${selectedPrimarySlot.linked_user_id}`}>{selectedPrimarySlot.linked_username || `User #${selectedPrimarySlot.linked_user_id}`}</AccountLink> : "-"}</InfoValue></InfoRow>
                      <InfoRow><InfoLabel>Bekleidung</InfoLabel><InfoValue>{selectedPrimarySlot ? `${selectedPrimarySlot.clothing_interest_label}${selectedPrimarySlot.jersey_size ? `, Trikot ${selectedPrimarySlot.jersey_size}` : ""}${selectedPrimarySlot.bib_size ? `, Hose ${selectedPrimarySlot.bib_size}` : ""}` : "-"}</InfoValue></InfoRow>
                      <InfoRow><InfoLabel>Live-Karte</InfoLabel><InfoValue>{selectedPrimarySlot ? (selectedPrimarySlot.public_name_consent ? "Name sichtbar" : "Name verborgen") : "-"}</InfoValue></InfoRow>
                      <InfoRow><InfoLabel>Starter-Status</InfoLabel><InfoValue>{selectedPrimarySlot?.license_status || "-"}</InfoValue></InfoRow>
                    </InfoList>
                  </DetailSection>

                  {selectedRegistration.gift_vouchers.length > 0 && (
                    <DetailSection style={{ gridColumn: "1 / -1" }}>
                      <DetailTitle>Gutschein-Codes</DetailTitle>
                      <TableWrap>
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
                            {selectedRegistration.gift_vouchers.map((voucher) => (
                              <tr key={voucher.id}>
                                <td>{voucher.code || `#${voucher.id}`}</td>
                                <td>{voucher.status}</td>
                                <td>{voucher.redeemed_by_registration_id || "-"}</td>
                                <td>{formatDateTime(voucher.redeemed_at || voucher.created_at)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </TableWrap>
                    </DetailSection>
                  )}
                </DetailGrid>
              </Card>
            )}

            <Card>
              <SectionHeader>
                <div>
                  <h2 style={{ margin: 0 }}>Zusatzbestellungen</h2>
                  <SectionText>
                    Ebenfalls kompakt als Tabelle. Die Detailansicht erscheint erst nach Auswahl einer Bestellung.
                  </SectionText>
                </div>
                <Badge>{data.addon_purchases?.length || 0} Einträge</Badge>
              </SectionHeader>

              <TableWrap>
                <Table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Käufer</th>
                      <th>Registrierung</th>
                      <th>Referenz</th>
                      <th>Status</th>
                      <th>Codes</th>
                      <th>Soll</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.addon_purchases || []).map((purchase) => (
                      <ClickableRow
                        key={purchase.id}
                        $selected={purchase.id === selectedAddonId}
                        onClick={() => setSelectedAddonId(purchase.id)}
                      >
                        <td>#{purchase.id}</td>
                        <td>{purchase.buyer.username || purchase.buyer.name || "-"}</td>
                        <td>{purchase.registration_id ? `#${purchase.registration_id}` : "ohne eigene Teilnahme"}</td>
                        <td>{purchase.payment_reference_code}</td>
                        <td><Badge $tone={statusTone(purchase.status)}>{purchase.status}</Badge></td>
                        <td>{purchase.gift_voucher_quantity}</td>
                        <td>{formatEuro(purchase.expected_amount)}</td>
                      </ClickableRow>
                    ))}
                  </tbody>
                </Table>
              </TableWrap>
            </Card>

            {selectedAddon && (
              <Card>
                <ActionRow>
                  <div>
                    <h2 style={{ margin: 0 }}>Details Zusatzbestellung #{selectedAddon.id}</h2>
                    <SectionText>
                      Käufer: <strong>{selectedAddon.buyer.username || selectedAddon.buyer.name || "-"}</strong> · Referenz: <strong>{selectedAddon.payment_reference_code}</strong>
                    </SectionText>
                  </div>
                  {selectedAddon.status !== "paid" && (
                    <ActionButton onClick={() => confirmAddonPayment(selectedAddon)}>
                      Zusatzbestellung als bezahlt markieren
                    </ActionButton>
                  )}
                </ActionRow>

                <DetailGrid>
                  <DetailSection>
                    <DetailTitle>Bestellinfos</DetailTitle>
                    <InfoList>
                      <InfoRow><InfoLabel>Status</InfoLabel><InfoValue>{selectedAddon.status}</InfoValue></InfoRow>
                      <InfoRow><InfoLabel>E-Mail</InfoLabel><InfoValue>{selectedAddon.buyer.email || "-"}</InfoValue></InfoRow>
                      <InfoRow><InfoLabel>Registrierung</InfoLabel><InfoValue>{selectedAddon.registration_id ? `#${selectedAddon.registration_id}` : "ohne eigene Teilnahme"}</InfoValue></InfoRow>
                      <InfoRow><InfoLabel>Gutschein-Codes</InfoLabel><InfoValue>{selectedAddon.gift_voucher_quantity}</InfoValue></InfoRow>
                      <InfoRow><InfoLabel>Soll / Ist</InfoLabel><InfoValue>{formatEuro(selectedAddon.expected_amount)} / {formatEuro(selectedAddon.paid_amount)}</InfoValue></InfoRow>
                    </InfoList>
                  </DetailSection>

                  {selectedAddon.gift_vouchers?.length > 0 && (
                    <DetailSection>
                      <DetailTitle>Freigeschaltete Codes</DetailTitle>
                      <TableWrap>
                        <Table>
                          <thead>
                            <tr>
                              <th>Code</th>
                              <th>Status</th>
                              <th>Zeitpunkt</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedAddon.gift_vouchers.map((voucher) => (
                              <tr key={`addon-voucher-${voucher.id}`}>
                                <td>{voucher.code || `#${voucher.id}`}</td>
                                <td>{voucher.status}</td>
                                <td>{formatDateTime(voucher.redeemed_at || voucher.created_at)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </TableWrap>
                    </DetailSection>
                  )}
                </DetailGrid>
              </Card>
            )}
          </>
        )}
      </Container>
      <Footer />
    </Page>
  );
}
