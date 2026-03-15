import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Header from "./Header";
import { getApiBaseUrl } from "../../shared/api/client";
import { EVENT_START_FINISH, ROUTE_OPTIONS, getRouteByLabel, getRouteLabel, getRouteThemeByLabel } from "./eventConfig";

const makeSvgIcon = (svgMarkup) =>
  L.divIcon({
    className: "",
    html: `<div style="filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.3));">${svgMarkup}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -32],
  });

const startFinishIcon = makeSvgIcon(`
  <svg width="34" height="34" viewBox="0 0 34 34" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Start Ziel">
    <circle cx="17" cy="17" r="16" fill="#fff3c2" stroke="#8a5700" stroke-width="2"/>
    <path d="M11 8v18" stroke="#3b2f1a" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M12.5 9.5h11v7h-11z" fill="#ffffff" stroke="#3b2f1a" stroke-width="1"/>
    <rect x="12.5" y="9.5" width="5.5" height="3.5" fill="#1f2937"/>
    <rect x="18" y="13" width="5.5" height="3.5" fill="#1f2937"/>
  </svg>
`);
const checkpointIcon = makeSvgIcon(`
  <svg width="34" height="34" viewBox="0 0 34 34" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Checkpoint">
    <circle cx="17" cy="17" r="16" fill="#e8f7ff" stroke="#0f5f9c" stroke-width="2"/>
    <circle cx="17" cy="12.5" r="4.2" fill="#fffdf7" stroke="#0f5f9c" stroke-width="1"/>
    <path d="M12.7 15.8h8.6l-3.4 9.2c-.2.5-.9.5-1.1 0l-4.1-9.2z" fill="#d0822f" stroke="#8f4f13" stroke-width="1"/>
  </svg>
`);

const Page = styled.div`
  height: 100dvh;
  overflow: hidden;
  background: var(--event-bg);
  display: flex;
  flex-direction: column;
`;

const MapShell = styled.div`
  position: relative;
  flex: 1;
  min-height: 0;
`;

const MapInfo = styled.div`
  position: absolute;
  top: 12px;
  left: 50px;
  z-index: 900;
  max-width: min(92vw, 540px);
  background: rgba(255, 253, 250, 0.95);
  border: 1px solid rgba(138, 87, 0, 0.2);
  border-radius: 12px;
  padding: 0.75rem 0.9rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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

const Message = styled.div`
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 900;
  background: rgba(255, 253, 250, 0.96);
  border: 1px solid rgba(138, 87, 0, 0.22);
  border-radius: 12px;
  padding: 0.8rem 1rem;
  color: ${({ $error }) => ($error ? "#9f1239" : "#7c4f00")};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

const RouteBadge = styled.span`
  display: inline-flex;
  align-items: center;
  margin-right: 0.4rem;
  margin-bottom: 0.35rem;
  padding: 0.22rem 0.6rem;
  border-radius: 999px;
  background: ${({ $bg }) => $bg || "#fff3c2"};
  color: ${({ $color }) => $color || "#8a5700"};
  border: 1px solid ${({ $border }) => $border || "#f0d79a"};
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
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, []);

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

  const mapItems = useMemo(
    () => [
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
    ],
    [items]
  );

  const bounds = useMemo(() => mapItems.map((item) => [item.lat, item.lng]), [mapItems]);

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
      <MapShell>
        <MapInfo>
          <h1 style={{ margin: 0, fontSize: "1.05rem" }}>Live-Checkpoint-Karte</h1>
          <p style={{ margin: "0.35rem 0 0", color: "#7c4f00", lineHeight: 1.35 }}>
            Sehe in Echtzeit, wie viele Teilnehmer bereits an den Checkpoints eingecheckt haben. Klicke auf die Marker, um weitere Informationen zu erhalten oder die Check-in-Details einzusehen.
          </p>
        </MapInfo>

        {!error && (
          <MapContainer
            center={[EVENT_START_FINISH.lat, EVENT_START_FINISH.lng]}
            zoom={10}
            bounds={bounds}
            boundsOptions={{ padding: [50, 50] }}
            style={{ width: "100%", height: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {mapItems.map((item) => (
              <Marker
                key={item.checkpoint_id}
                position={[item.lat, item.lng]}
                icon={item.isStartFinishHub ? startFinishIcon : checkpointIcon}
              >
                <Popup>
                  <strong>{item.name}</strong>
                  {item.isStartFinishHub ? (
                    <div>Start- und Zielbereich für alle Routen</div>
                  ) : (
                    <div>{item.checked_in_count} / {item.licensed_count} eingecheckt</div>
                  )}
                  <div style={{ marginTop: 6 }}>
                    {(item.route_labels || []).map((label) => (
                      <RouteBadge
                        key={label}
                        $bg={getRouteThemeByLabel(label).background}
                        $border={getRouteThemeByLabel(label).border}
                        $color={getRouteThemeByLabel(label).text}
                      >
                        {getRouteByLabel(label).shortLabel}
                      </RouteBadge>
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
        )}

        {loading && <Message>Karte wird geladen...</Message>}
        {error && <Message $error>{error}</Message>}
      </MapShell>

      {selected && (
        <ModalOverlay onClick={() => setSelected(null)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>{selected.name}</h2>
            <div style={{ marginBottom: 10 }}>
              {(selected.route_labels || []).map((label) => (
                <RouteBadge
                  key={label}
                  $bg={getRouteThemeByLabel(label).background}
                  $border={getRouteThemeByLabel(label).border}
                  $color={getRouteThemeByLabel(label).text}
                >
                  {getRouteByLabel(label).shortLabel}
                </RouteBadge>
              ))}
            </div>
            {detailsLoading ? (
              <p>Lade Details...</p>
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
            <button style={{ marginTop: 10 }} onClick={() => setSelected(null)}>Schliessen</button>
          </Modal>
        </ModalOverlay>
      )}
    </Page>
  );
}
