import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Header from "./Header";
import Footer from "./Footer";
import { getApiBaseUrl } from "../../shared/api/client";
import { EVENT_START_FINISH, ROUTE_OPTIONS, getRouteLabel } from "./eventConfig";

const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const Page = styled.div`
  min-height: 100vh;
  background: var(--event-bg);
`;

const Container = styled.div`
  width: min(96%, 1100px);
  margin: 0 auto;
  padding: 1rem;
`;

const Card = styled.div`
  background: #fffdfa;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(255, 181, 34, 0.08);
  padding: 1rem;
  margin-bottom: 1rem;
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
`;

const Modal = styled.div`
  width: min(92vw, 800px);
  max-height: 80vh;
  overflow: auto;
  background: #fffdfa;
  border-radius: 12px;
  padding: 1rem;
`;

const RouteBadge = styled.span`
  display: inline-block;
  margin-right: 0.4rem;
  margin-bottom: 0.35rem;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  background: #fff3c2;
  color: #8a5700;
  font-weight: 700;
  font-size: 0.8rem;
`;

export default function EventLiveMap() {
  const API_BASE = getApiBaseUrl();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    if (!API_BASE) return;

    let canceled = false;
    setLoading(true);

    fetch(`${API_BASE}/event2026/live_checkpoints.php`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok || json.status !== "success") {
          throw new Error(json.message || "Checkpointdaten konnten nicht geladen werden.");
        }
        if (!canceled) {
          setItems(json.items || []);
        }
      })
      .catch((err) => {
        if (!canceled) {
          setError(err.message || "Unbekannter Fehler");
        }
      })
      .finally(() => {
        if (!canceled) {
          setLoading(false);
        }
      });

    return () => {
      canceled = true;
    };
  }, [API_BASE]);

  const center = useMemo(() => {
    const allItems = [
      ...items,
      {
        lat: EVENT_START_FINISH.lat,
        lng: EVENT_START_FINISH.lng,
      },
    ];
    if (!allItems.length) return [50.83, 12.92];
    const lat = allItems.reduce((acc, item) => acc + item.lat, 0) / allItems.length;
    const lng = allItems.reduce((acc, item) => acc + item.lng, 0) / allItems.length;
    return [lat, lng];
  }, [items]);

  const mapItems = useMemo(() => ([
    {
      checkpoint_id: `start-finish-${EVENT_START_FINISH.shopId}`,
      name: `${EVENT_START_FINISH.name} (Start & Ziel)`,
      lat: EVENT_START_FINISH.lat,
      lng: EVENT_START_FINISH.lng,
      route_labels: ROUTE_OPTIONS.map((route) => route.label),
      checked_in_count: null,
      licensed_count: null,
      isStartFinishHub: true,
      shop_id: EVENT_START_FINISH.shopId,
    },
    ...items,
  ]), [items]);

  const openDetails = async (item) => {
    setSelected(item);
    setDetailsLoading(true);
    setDetails([]);
    try {
      const res = await fetch(`${API_BASE}/event2026/live_checkpoint_checkins.php?checkpoint_id=${item.checkpoint_id}&page=1&page_size=100`);
      const json = await res.json();
      if (!res.ok || json.status !== "success") {
        throw new Error(json.message || "Details konnten nicht geladen werden.");
      }
      setDetails(json.items || []);
    } catch (err) {
      setDetails([{ user_display_name: "Fehler", checkin_time: err.message, source: "-", distance: "-" }]);
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <Page>
      <Header />
      <Container>
        <Card>
          <h1 style={{ marginTop: 0 }}>Live-Checkpoint-Karte</h1>
          <p style={{ margin: 0, color: "#7c4f00" }}>
            Öffentliche Übersicht der Checkpoints mit Teilnehmerzahlen und Check-in-Zeiten. Nicht jeder Checkpoint gehört zu jeder Route.
          </p>
          <p style={{ margin: "0.55rem 0 0", color: "#7c4f00" }}>
            Start und Ziel aller Routen liegen bei <strong>{EVENT_START_FINISH.name}</strong>, {EVENT_START_FINISH.fullAddress}.
          </p>
        </Card>

        {loading && <Card>Karte wird geladen…</Card>}
        {error && <Card style={{ color: "#9f1239" }}>{error}</Card>}

        {!loading && !error && (
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <MapContainer center={center} zoom={10} style={{ width: "100%", height: "70vh" }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
              {mapItems.map((item) => (
                <Marker key={item.checkpoint_id} position={[item.lat, item.lng]} icon={defaultIcon}>
                  <Popup>
                    <strong>{item.name}</strong>
                    {item.isStartFinishHub ? (
                      <div>Start- und Zielbereich fuer alle Routen</div>
                    ) : (
                      <div>{item.checked_in_count} / {item.licensed_count} eingecheckt</div>
                    )}
                    <div style={{ marginTop: 6 }}>
                      {(item.route_labels || []).map((label) => (
                        <RouteBadge key={label}>{label}</RouteBadge>
                      ))}
                    </div>
                    {item.isStartFinishHub ? (
                      <div style={{ marginTop: 6, color: "#7c4f00" }}>{EVENT_START_FINISH.fullAddress}</div>
                    ) : (
                      <button style={{ marginTop: 6 }} onClick={() => openDetails(item)}>Details</button>
                    )}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </Card>
        )}
      </Container>

      {selected && (
        <ModalOverlay onClick={() => setSelected(null)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>{selected.name}</h2>
            <div style={{ marginBottom: 10 }}>
              {(selected.route_labels || []).map((label) => (
                <RouteBadge key={label}>{label}</RouteBadge>
              ))}
            </div>
            {detailsLoading ? (
              <p>Lade Details…</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 6 }}>Name</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 6 }}>Route</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 6 }}>Zeit</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 6 }}>Quelle</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 6 }}>Distanz</th>
                    </tr>
                  </thead>
                  <tbody>
                    {details.map((row, idx) => (
                      <tr key={`${row.user_display_name}-${row.checkin_time}-${idx}`}>
                        <td style={{ padding: 6 }}>{row.user_display_name}</td>
                        <td style={{ padding: 6 }}>{row.route_label || getRouteLabel(row.route_key)}</td>
                        <td style={{ padding: 6 }}>{row.checkin_time ? new Date(row.checkin_time).toLocaleString("de-DE") : "-"}</td>
                        <td style={{ padding: 6 }}>{row.source}</td>
                        <td style={{ padding: 6 }}>{row.distance} km</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <button style={{ marginTop: 10 }} onClick={() => setSelected(null)}>Schließen</button>
          </Modal>
        </ModalOverlay>
      )}

      <Footer />
    </Page>
  );
}
