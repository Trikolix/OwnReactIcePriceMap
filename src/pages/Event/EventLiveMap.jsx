import React, { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { MapContainer, Marker, Polyline, Popup, TileLayer, Tooltip, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Header from "./Header";
import { getApiBaseUrl } from "../../shared/api/client";
import { EVENT_START_FINISH, ROUTE_OPTIONS, getRouteByLabel, getRouteLabel, getRouteThemeByLabel } from "./eventConfig";
import route175Gpx from "./Ice-Tour_175km.gpx?raw";
import route140Gpx from "./Ice-Tour_140km.gpx?raw";
import route70Gpx from "./Ice-Tour_70km.gpx?raw";

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

const RouteLegend = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 900;
  min-width: 180px;
  background: rgba(255, 253, 250, 0.95);
  border: 1px solid rgba(138, 87, 0, 0.2);
  border-radius: 12px;
  padding: 0.75rem 0.9rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.55rem;
  color: #5b3a00;
  font-size: 0.92rem;

  & + & {
    margin-top: 0.45rem;
  }
`;

const LegendSwatch = styled.span`
  width: 20px;
  height: 0;
  border-top: 4px solid ${({ $color }) => $color};
  border-radius: 999px;
  flex: 0 0 auto;
`;

const ROUTE_OVERLAYS = [
  {
    id: "route-175",
    label: "175 km",
    color: "#dc2626",
    offsetPx: -7,
    gpx: route175Gpx,
  },
  {
    id: "route-140",
    label: "140 km",
    color: "#facc15",
    offsetPx: 0,
    gpx: route140Gpx,
  },
  {
    id: "route-70",
    label: "70 km",
    color: "#16a34a",
    offsetPx: 7,
    gpx: route70Gpx,
  },
];

const OFFSET_ZOOM_THRESHOLD = 12;

const parseGpxTrack = (gpxContent) => {
  if (!gpxContent) return [];

  const xml = new DOMParser().parseFromString(gpxContent, "application/xml");
  const parserError = xml.querySelector("parsererror");
  if (parserError) {
    throw new Error("GPX-Datei konnte nicht gelesen werden.");
  }

  return Array.from(xml.getElementsByTagName("trkpt"))
    .map((point) => {
      const lat = Number.parseFloat(point.getAttribute("lat"));
      const lng = Number.parseFloat(point.getAttribute("lon"));
      return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null;
    })
    .filter(Boolean);
};

const offsetLatLngs = (map, positions, offsetPx) => {
  if (!map || !offsetPx || positions.length < 2) {
    return positions;
  }

  const zoom = map.getZoom();
  const projected = positions.map(([lat, lng]) => map.project(L.latLng(lat, lng), zoom));

  return projected.map((point, index) => {
    const prev = projected[index - 1] || point;
    const next = projected[index + 1] || point;
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const length = Math.hypot(dx, dy);

    if (!length) {
      return positions[index];
    }

    const offsetX = (-dy / length) * offsetPx;
    const offsetY = (dx / length) * offsetPx;
    const shifted = L.point(point.x + offsetX, point.y + offsetY);
    const latLng = map.unproject(shifted, zoom);

    return [latLng.lat, latLng.lng];
  });
};

const smoothLatLngs = (positions, iterations = 1) => {
  if (positions.length < 3 || iterations < 1) {
    return positions;
  }

  let smoothed = positions;

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    if (smoothed.length < 3) {
      break;
    }

    const next = [smoothed[0]];

    for (let index = 0; index < smoothed.length - 1; index += 1) {
      const [lat1, lng1] = smoothed[index];
      const [lat2, lng2] = smoothed[index + 1];

      const q = [lat1 * 0.75 + lat2 * 0.25, lng1 * 0.75 + lng2 * 0.25];
      const r = [lat1 * 0.25 + lat2 * 0.75, lng1 * 0.25 + lng2 * 0.75];

      next.push(q, r);
    }

    next.push(smoothed[smoothed.length - 1]);
    smoothed = next;
  }

  return smoothed;
};

function RouteOverlay({ route, isActive, onHoverChange }) {
  const [zoom, setZoom] = useState(null);
  const map = useMapEvents({
    zoomend: () => {
      const currentZoom = map.getZoom();
      setZoom(currentZoom);
      const shouldOffset = currentZoom >= OFFSET_ZOOM_THRESHOLD;
      const offsetPositions = offsetLatLngs(map, route.positions, shouldOffset ? route.offsetPx : 0);
      setRenderedPositions(smoothLatLngs(offsetPositions, shouldOffset ? 1 : 0));
    },
  });
  const polylineRef = useRef(null);
  const [renderedPositions, setRenderedPositions] = useState(() => route.positions);

  useEffect(() => {
    const currentZoom = map.getZoom();
    setZoom(currentZoom);
    const shouldOffset = currentZoom >= OFFSET_ZOOM_THRESHOLD;
    const offsetPositions = offsetLatLngs(map, route.positions, shouldOffset ? route.offsetPx : 0);
    setRenderedPositions(smoothLatLngs(offsetPositions, shouldOffset ? 1 : 0));
  }, [map, route.offsetPx, route.positions]);

  const isOffsetActive = (zoom ?? map.getZoom()) >= OFFSET_ZOOM_THRESHOLD;
  const baseOpacity = isOffsetActive ? 0.78 : 0.42;
  const lineOpacity = isOffsetActive ? 0.96 : 0.58;

  const handleMouseOver = () => {
    onHoverChange(route.id);
    polylineRef.current?.bringToFront();
  };

  const handleMouseOut = () => {
    onHoverChange(null);
  };

  return (
    <>
      <Polyline
        positions={renderedPositions}
        pathOptions={{
          color: isActive ? "#fffdf7" : route.color,
          weight: isActive ? 12 : 8,
          opacity: isActive ? 0.95 : baseOpacity,
          lineCap: "round",
          lineJoin: "round",
        }}
        smoothFactor={1.5}
        interactive={false}
      />
      <Polyline
        ref={polylineRef}
        positions={renderedPositions}
        pathOptions={{
          color: route.color,
          weight: isActive ? 7 : 4,
          opacity: isActive ? 1 : lineOpacity,
          lineCap: "round",
          lineJoin: "round",
        }}
        smoothFactor={1.5}
        eventHandlers={{
          mouseover: handleMouseOver,
          mouseout: handleMouseOut,
        }}
      >
        <Tooltip sticky direction="top" opacity={0.98}>
          {route.label} Route
        </Tooltip>
      </Polyline>
    </>
  );
}

export default function EventLiveMap() {
  const API_BASE = getApiBaseUrl();

  const [items, setItems] = useState([]);
  const [routeOverlays, setRouteOverlays] = useState([]);
  const [activeRouteId, setActiveRouteId] = useState(null);
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
    try {
      setRouteOverlays(
        ROUTE_OVERLAYS.map((route) => ({
          ...route,
          positions: parseGpxTrack(route.gpx),
        })).filter((route) => route.positions.length > 0)
      );
    } catch (err) {
      setError(err.message || "Routendaten konnten nicht geladen werden.");
    }
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
        <RouteLegend>
          <div style={{ fontWeight: 700, color: "#5b3a00", marginBottom: "0.45rem" }}>Routen</div>
          {routeOverlays.map((route) => (
            <LegendItem key={route.id} style={{ fontWeight: activeRouteId === route.id ? 700 : 500 }}>
              <LegendSwatch $color={route.color} />
              <span>{route.label}</span>
            </LegendItem>
          ))}
        </RouteLegend>

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
            {routeOverlays.map((route) => (
              <RouteOverlay
                key={route.id}
                route={route}
                isActive={activeRouteId === route.id}
                onHoverChange={setActiveRouteId}
              />
            ))}
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
