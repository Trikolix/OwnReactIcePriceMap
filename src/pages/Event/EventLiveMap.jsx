import React, { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { MapContainer, Marker, Polyline, Popup, TileLayer, Tooltip, useMapEvents, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Link, useSearchParams } from "react-router-dom";
import Header from "./Header";
import CheckinCard from "../../components/CheckinCard";
import Seo from "../../components/Seo";
import { getApiBaseUrl } from "../../shared/api/client";
import {
  EVENT_START_FINISH,
  ROUTE_OPTIONS,
  formatRouteShortWithDistanceByLabel,
  getRouteLabel,
  getRouteShortLabel,
  getRouteThemeByLabel,
} from "./eventConfig";
import { useUser } from "../../context/UserContext";
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
    <path d="M11 7.5v18.5" stroke="#3b2f1a" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M12.5 9.5h10.5l-2.3 2.1 2.3 2.1h-10.5z" fill="#ffffff" stroke="#3b2f1a" stroke-width="1"/>
    <path d="M12.5 13.7h10.5l-2.3 2.1 2.3 2.1h-10.5z" fill="#1f2937" stroke="#3b2f1a" stroke-width="1"/>
    <path d="M12.5 17.9h10.5l-2.3 2.1 2.3 2.1h-10.5z" fill="#ffffff" stroke="#3b2f1a" stroke-width="1"/>
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

  .leaflet-top.leaflet-left .leaflet-control-zoom {
    display: none;
  }

  .leaflet-marker-pane {
    z-index: 650;
  }

  .leaflet-popup-pane {
    z-index: 1300;
  }

  .leaflet-tooltip-pane {
    z-index: 1250;
  }
`;

const OverlayLayout = styled.div`
  position: absolute;
  top: 12px;
  left: 12px;
  right: 12px;
  z-index: 600;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  pointer-events: none;

  & > * {
    pointer-events: auto;
  }

  @media (max-width: 720px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const MapInfo = styled.div`
  max-width: min(92vw, 540px);
  background: rgba(255, 253, 250, 0.95);
  border: 1px solid rgba(138, 87, 0, 0.2);
  border-radius: 12px;
  padding: 0.75rem 0.9rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  @media (max-width: 720px) {
    max-width: none;
    padding: 0.65rem 0.75rem;
    display: ${({ $isVisible }) => ($isVisible ? "block" : "none")};
  }
`;

const InfoToggleButton = styled.button`
  display: none;
  min-height: 38px;
  align-self: flex-start;
  padding: 0.5rem 0.85rem;
  border-radius: 999px;
  border: 1px solid rgba(138, 87, 0, 0.28);
  background: rgba(255, 253, 250, 0.96);
  color: #5a3900;
  font-weight: 800;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  cursor: pointer;

  @media (max-width: 720px) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
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
  border-radius: 20px;
  border: 1px solid rgba(138, 87, 0, 0.16);
  box-shadow: 0 18px 48px rgba(47, 33, 0, 0.2);
  padding: 1.1rem;
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

const PopupButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  margin-top: 0.45rem;
  padding: 0.45rem 0.9rem;
  border-radius: 10px;
  border: 1px solid rgba(255, 181, 34, 0.6);
  background: linear-gradient(180deg, #ffcf63 0%, #ffb522 100%);
  color: #2f2100;
  font-weight: 700;
  cursor: pointer;
  transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease;
  box-shadow: 0 4px 12px rgba(255, 181, 34, 0.2);

  &:hover {
    background: linear-gradient(180deg, #ffd879 0%, #ffbf3f 100%);
    transform: translateY(-1px);
  }
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
`;

const ModalHeading = styled.h2`
  margin: 0;
  color: #2f2100;
`;

const ModalSubline = styled.p`
  margin: 0.3rem 0 0;
  color: #7c4f00;
  line-height: 1.45;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.7rem;
  margin-top: 1rem;
`;

const AppButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 0.55rem 1rem;
  border-radius: 12px;
  border: 1px solid rgba(138, 87, 0, 0.28);
  background: linear-gradient(180deg, #fffdf7 0%, #fff3d6 100%);
  color: #5a3900;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(47, 33, 0, 0.08);
  transition: background 160ms ease, transform 160ms ease, box-shadow 160ms ease;

  &:hover {
    background: linear-gradient(180deg, #fff6e4 0%, #ffe9ba 100%);
    transform: translateY(-1px);
  }
`;

const DetailsTableWrap = styled.div`
  margin-top: 1rem;
  margin-left: -1.1rem;
  margin-right: -1.1rem;
  border: 1px solid rgba(138, 87, 0, 0.12);
  border-radius: 16px;
  overflow: auto;
  background: rgba(255, 255, 255, 0.96);
`;

const DetailsTable = styled.table`
  width: 100%;
  min-width: 680px;
  border-collapse: collapse;

  th,
  td {
    padding: 0.75rem;
    text-align: left;
    vertical-align: top;
    border-bottom: 1px solid rgba(138, 87, 0, 0.1);
  }

  thead th {
    position: sticky;
    top: 0;
    z-index: 1;
    background: rgba(255, 248, 232, 0.98);
    color: #7c4f00;
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  tbody tr:last-child td {
    border-bottom: none;
  }

  @media (max-width: 720px) {
    min-width: 480px;

    th,
    td {
      padding: 0.42rem 0.36rem;
      font-size: 0.82rem;
    }

    thead th {
      font-size: 0.66rem;
    }
  }
`;

const DetailRow = styled.tr`
  background: ${({ $expanded }) => ($expanded ? "rgba(255, 248, 232, 0.42)" : "transparent")};
`;

const ExpandedRow = styled.tr`
  background: rgba(255, 248, 232, 0.42);
`;

const ExpandedCell = styled.td`
  padding-top: 0.25rem;
`;

const DetailValue = styled.div`
  color: #2f2100;
  line-height: 1.45;
  overflow-wrap: anywhere;
  min-width: 0;

  @media (max-width: 720px) {
    line-height: 1.3;
  }
`;

const TimeValue = styled(DetailValue)`
  white-space: nowrap;
`;

const UserLink = styled(Link)`
  color: #8a5700;
  font-weight: 800;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const CheckinInlineButton = styled.button`
  padding: 0;
  border: none;
  background: none;
  color: #8a5700;
  font-weight: 700;
  font-size: 0.76rem;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 0.12em;
  white-space: nowrap;

  &:hover {
    color: #5a3900;
  }

  @media (max-width: 720px) {
    font-size: 0.72rem;
  }
`;

const CheckinActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;

  @media (max-width: 720px) {
    gap: 0.2rem;
  }
`;

const NameStack = styled.div`
  display: grid;
  gap: 0.12rem;
`;

const SecondaryLinkButton = styled(Link)`
  display: inline;
  color: #8a5700;
  font-weight: 700;
  font-size: 0.76rem;
  text-decoration: underline;
  text-underline-offset: 0.12em;
  white-space: nowrap;

  &:hover {
    color: #5a3900;
  }

  @media (max-width: 720px) {
    font-size: 0.72rem;
  }
`;

const CompactRouteBadge = styled(RouteBadge)`
  margin-right: 0;
  margin-bottom: 0;
  padding: 0.08rem 0.38rem;
  font-size: 0.7rem;
  min-width: 0;

  @media (max-width: 720px) {
    padding: 0.05rem 0.28rem;
    font-size: 0.66rem;
  }
`;

const LinkedCheckinBox = styled.div`
  padding: 0.15rem 0;
  position: sticky;
  left: 0;
  width: min(calc(100vw - 3rem), 720px);
  max-width: 100%;
  box-sizing: border-box;

  @media (max-width: 720px) {
    width: min(calc(100vw - 1.5rem), 100%);
  }
`;

const LinkedCheckinMeta = styled.div`
  display: grid;
  gap: 0.4rem 1rem;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
`;

const LinkedCheckinField = styled.div`
  min-width: 0;
`;

const LinkedCheckinLabel = styled.div`
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: rgba(124, 79, 0, 0.76);
  margin-bottom: 0.2rem;
`;

const LinkedCheckinValue = styled.div`
  color: #2f2100;
  line-height: 1.45;
  overflow-wrap: anywhere;
`;

const LinkedCheckinText = styled.p`
  margin: 0.7rem 0 0;
  color: #5b3a00;
  line-height: 1.5;
  white-space: pre-wrap;

  @media (max-width: 720px) {
    margin-top: 0.5rem;
    font-size: 0.88rem;
    line-height: 1.35;
  }
`;

const CheckinCardWrap = styled.div`
  .card {
    margin: 0;
  }
`;

const EmptyState = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 14px;
  background: rgba(255, 249, 235, 0.9);
  border: 1px solid rgba(138, 87, 0, 0.12);
  color: #7c4f00;
`;

const RouteLegend = styled.div`
  min-width: 180px;
  background: rgba(255, 253, 250, 0.95);
  border: 1px solid rgba(138, 87, 0, 0.2);
  border-radius: 12px;
  padding: 0.75rem 0.9rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  flex: 0 0 auto;

  @media (max-width: 720px) {
    min-width: 0;
    width: fit-content;
    max-width: 100%;
    padding: 0.6rem 0.75rem;
  }
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

const InfoHeading = styled.h1`
  margin: 0;
  font-size: 1.05rem;

  @media (max-width: 720px) {
    font-size: 0.98rem;
  }
`;

const InfoText = styled.p`
  margin: 0.35rem 0 0;
  color: #7c4f00;
  line-height: 1.35;

  @media (max-width: 720px) {
    font-size: 0.88rem;
    line-height: 1.3;
  }
`;

const StatsCard = styled.div`
  min-width: 260px;
  background: rgba(255, 253, 250, 0.96);
  border: 1px solid rgba(138, 87, 0, 0.2);
  border-radius: 12px;
  padding: 0.75rem 0.9rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  @media (max-width: 720px) {
    min-width: 0;
    width: 100%;
    padding: 0.65rem 0.75rem;
  }
`;

const StatsHeading = styled.div`
  font-weight: 800;
  color: #5b3a00;
  margin-bottom: 0.5rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.6rem;
`;

const StatItem = styled.div`
  min-width: 0;
`;

const StatValue = styled.div`
  font-size: 1.2rem;
  line-height: 1.05;
  font-weight: 900;
  color: #2f2100;
`;

const StatLabel = styled.div`
  margin-top: 0.22rem;
  color: #7c4f00;
  font-size: 0.78rem;
  line-height: 1.25;
`;

const RouteStatSummary = styled.div`
  margin-top: 0.7rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
`;

const RouteStatPill = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.22rem 0.48rem;
  border-radius: 999px;
  background: ${({ $bg }) => $bg || "#fff3c2"};
  color: ${({ $color }) => $color || "#8a5700"};
  border: 1px solid ${({ $border }) => $border || "#f0d79a"};
  font-size: 0.74rem;
  font-weight: 800;
`;

const CHECKPOINT_PROGRESS_BY_ROUTE = {
  epic_4: [
    { shopId: 314, distanceKm: 55 },
    { shopId: 145, distanceKm: 82 },
    { shopId: 111, distanceKm: 112 },
    { shopId: 22, distanceKm: 137 },
    { shopId: 293, distanceKm: 175 },
  ],
  classic_3: [
    { shopId: 314, distanceKm: 55 },
    { shopId: 145, distanceKm: 82 },
    { shopId: 111, distanceKm: 112 },
    { shopId: 293, distanceKm: 140 },
  ],
  family_2: [
    { shopId: 145, distanceKm: 17 },
    { shopId: 111, distanceKm: 40 },
    { shopId: 293, distanceKm: 73 },
  ],
};

const ROUTE_OVERLAYS = [
  { id: "route-175", label: "König (175 km)", color: "#dc2626", offsetPx: 4, gpx: route175Gpx },
  { id: "route-140", label: "Sport (140 km)", color: "#facc15", offsetPx: 0, gpx: route140Gpx },
  { id: "route-70", label: "Genuss (75 km)", color: "#16a34a", offsetPx: -4, gpx: route70Gpx },
];

const OFFSET_ZOOM_THRESHOLD = 12;

const formatCheckpointTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
};

const formatRouteDistanceOnly = (routeLabel) => {
  const fullLabel = formatRouteShortWithDistanceByLabel(routeLabel);
  const match = fullLabel.match(/\(([^)]+)\)/);
  return match ? match[1] : routeLabel;
};

const resolveUsername = (row) => row.username || "Kein Profil";

const resolveFullName = (row) => row.full_name || row.user_display_name || "-";

const formatCheckpointVisitsSummary = (count) => {
  if (count === 1) return "1 Teilnehmer hat diesen Checkpoint erreicht.";
  return `${count} Teilnehmer haben diesen Checkpoint erreicht.`;
};

const toCheckinCardData = (checkin, row) => {
  if (!checkin) return null;

  return {
    ...checkin,
    id: checkin.id,
    datum: checkin.datum || row?.checkin_time || new Date().toISOString(),
    nutzer_id: checkin.nutzer_id ?? row?.user_id ?? null,
    nutzer_name: checkin.nutzer_name || row?.username || row?.full_name || row?.user_display_name || "Unbekannt",
    eisdiele_id: checkin.eisdiele_id ?? row?.shop_id ?? null,
    eisdiele_name: checkin.eisdiele_name || "-",
    typ: checkin.typ || "-",
    kommentar: checkin.kommentar || "",
    eissorten: Array.isArray(checkin.eissorten) ? checkin.eissorten : [],
    bilder: Array.isArray(checkin.bilder) ? checkin.bilder : [],
    commentCount: Number(checkin.commentCount || 0),
    avatar_url: checkin.avatar_url || null,
    geschmackbewertung: checkin.geschmackbewertung ?? null,
    größenbewertung: checkin.größenbewertung ?? checkin.groessenbewertung ?? null,
    preisleistungsbewertung: checkin.preisleistungsbewertung ?? null,
    waffelbewertung: checkin.waffelbewertung ?? null,
    anreise: checkin.anreise || "",
    is_on_site: Number(checkin.is_on_site || 0),
  };
};

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
  const apiBase = getApiBaseUrl();
  const [searchParams, setSearchParams] = useSearchParams();
  const { authToken, userId } = useUser();
  const requestedMode = searchParams.get("mode") === "test" ? "test" : "live";
  const isAdmin = Number(userId) === 1;
  const mode = requestedMode === "test" && isAdmin ? "test" : "live";

  const [items, setItems] = useState([]);
  const [routeOverlays, setRouteOverlays] = useState([]);
  const [activeRouteId, setActiveRouteId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [expandedCheckins, setExpandedCheckins] = useState({});
  const [linkedCheckins, setLinkedCheckins] = useState({});
  const [startFinish, setStartFinish] = useState(EVENT_START_FINISH);
  const [checkedInPortions, setCheckedInPortions] = useState(0);
  const [showInfoPanel, setShowInfoPanel] = useState(false);

  useEffect(() => {
    if (requestedMode === "test" && !isAdmin) {
      setSearchParams({ mode: "live" }, { replace: true });
    }
  }, [isAdmin, requestedMode, setSearchParams]);

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
    if (!apiBase) return;

    let canceled = false;
    setLoading(true);
    setError("");

    fetch(`${apiBase}/event2026/live_checkpoints.php?mode=${mode}`, {
      headers: {
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
    })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok || json.status !== "success") {
          throw new Error(json.message || "Checkpointdaten konnten nicht geladen werden.");
        }
        if (!canceled) {
          setItems(json.items || []);
          setStartFinish(json.start_finish || EVENT_START_FINISH);
          setCheckedInPortions(Number(json.stats?.checked_in_portions || 0));
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
  }, [apiBase, authToken, mode]);

  const mapItems = useMemo(
    () => [
      {
        checkpoint_id: `start-finish-${startFinish.shop_id || startFinish.shopId}`,
        name: `${startFinish.name} (Start & Ziel)`,
        lat: startFinish.lat,
        lng: startFinish.lng,
        route_labels: ROUTE_OPTIONS.map((route) => route.label),
        checked_in_count: null,
        licensed_count: null,
        isStartFinishHub: true,
        shop_id: startFinish.shop_id || startFinish.shopId,
      },
      ...items,
    ],
    [items, startFinish]
  );

  const bounds = useMemo(() => mapItems.map((item) => [item.lat, item.lng]), [mapItems]);

  const liveStats = useMemo(() => {
    const itemsByShopId = new Map(
      items
        .filter((item) => Number.isFinite(Number(item.shop_id)))
        .map((item) => [Number(item.shop_id), item])
    );

    let totalKm = 0;
    const routeBreakdown = ROUTE_OPTIONS.map((route) => {
      const checkpoints = CHECKPOINT_PROGRESS_BY_ROUTE[route.key] || [];
      let routeKm = 0;
      let previousDistanceKm = 0;

      checkpoints.forEach((checkpoint) => {
        const item = itemsByShopId.get(checkpoint.shopId);
        const reachedCount = Number(item?.route_counts?.[route.key] || 0);
        const segmentDistanceKm = Math.max(0, checkpoint.distanceKm - previousDistanceKm);
        routeKm += reachedCount * segmentDistanceKm;
        previousDistanceKm = checkpoint.distanceKm;
      });

      totalKm += routeKm;

      return {
        routeKey: route.key,
        shortLabel: getRouteShortLabel(route.key),
        distanceKm: routeKm,
        theme: route.badgeTone,
      };
    });

    return {
      totalKm,
      checkedInPortions,
      routeBreakdown,
    };
  }, [checkedInPortions, items]);

  const openDetails = async (item) => {
    setSelected(item);
    setDetailsLoading(true);
    setDetails([]);
    setExpandedCheckins({});

    try {
      const res = await fetch(`${apiBase}/event2026/live_checkpoint_checkins.php?checkpoint_id=${item.checkpoint_id}&page=1&page_size=100&mode=${mode}`, {
        headers: {
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
      });
      const json = await res.json();
      if (!res.ok || json.status !== "success") {
        throw new Error(json.message || "Details konnten nicht geladen werden.");
      }
      const sortedItems = [...(json.items || [])].sort((a, b) => {
        const aTime = a.checkin_time ? new Date(a.checkin_time).getTime() : 0;
        const bTime = b.checkin_time ? new Date(b.checkin_time).getTime() : 0;
        return aTime - bTime;
      });
      setDetails(sortedItems);
    } catch (err) {
      setDetails([{ user_display_name: "Fehler", full_name: err.message, source: "-", distance: "-", route_key: "", route_label: "-", checkin_id: null }]);
    } finally {
      setDetailsLoading(false);
    }
  };

  const toggleLinkedCheckin = async (row) => {
    const checkinId = Number(row?.checkin_id);
    if (!checkinId) return;

    setExpandedCheckins((prev) => ({
      ...prev,
      [checkinId]: !prev[checkinId],
    }));

    if (linkedCheckins[checkinId]) {
      return;
    }

    setLinkedCheckins((prev) => ({
      ...prev,
      [checkinId]: { loading: true, error: "", data: null },
    }));

    try {
      const res = await fetch(`${apiBase}/checkin/get_checkin.php?checkin_id=${checkinId}`, {
        headers: {
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
      });
      const json = await res.json();
      if (!res.ok || json?.error) {
        throw new Error(json?.error || "Check-in konnte nicht geladen werden.");
      }
      setLinkedCheckins((prev) => ({
        ...prev,
        [checkinId]: { loading: false, error: "", data: json },
      }));
    } catch (err) {
      setLinkedCheckins((prev) => ({
        ...prev,
        [checkinId]: { loading: false, error: err.message || "Check-in konnte nicht geladen werden.", data: null },
      }));
    }
  };

  const startFinishAddress = startFinish.full_address || startFinish.fullAddress || "";

  return (
    <Page>
      <Seo
        title="Ice-Tour Live-Karte | Event-Karte der Ice-Tour 2026"
        description="Öffentliche Live-Karte zur Ice-Tour 2026 in Chemnitz. Hier lassen sich Event-Checkpoints, Routen und aktuelle Check-ins am Veranstaltungstag verfolgen."
        keywords={[
          "Ice-Tour Live",
          "Ice-Tour Live-Karte",
          "Event-Karte Chemnitz",
          "Eis-Tour Live",
          "Radtour Live Chemnitz",
        ]}
        canonical="/event-live"
      />
      <Header />
      <MapShell>
        <OverlayLayout>
          <InfoToggleButton type="button" onClick={() => setShowInfoPanel((prev) => !prev)}>
            {showInfoPanel ? "Info ausblenden" : "Info anzeigen"}
          </InfoToggleButton>
          <MapInfo $isVisible={showInfoPanel}>
            <InfoHeading>{mode === "test" ? "Test-Live-Map" : "Live-Checkpoint-Karte"}</InfoHeading>
            <InfoText>
              {mode === "test"
                ? "Admin-Testansicht für die Stempelkarte. Hier siehst du, wie Check-ins und Checkpoint-Anzeigen auf der Live-Map wirken."
                : "Sehe in Echtzeit, wie viele Teilnehmer bereits an den Checkpoints eingecheckt haben. Marker öffnen die checkpointbezogene Live-Liste."}
            </InfoText>
            {isAdmin && (
              <div style={{ display: "flex", gap: "0.45rem", marginTop: "0.7rem", flexWrap: "wrap" }}>
                <button type="button" onClick={() => setSearchParams({ mode: "live" })} style={{ borderRadius: 999, border: "1px solid #efcf84", background: mode === "live" ? "#ffddb0" : "#fff6de", color: "#6a4300", padding: "0.35rem 0.75rem", fontWeight: 700, cursor: "pointer" }}>Live</button>
                <button type="button" onClick={() => setSearchParams({ mode: "test" })} style={{ borderRadius: 999, border: "1px solid #efcf84", background: mode === "test" ? "#ffddb0" : "#fff6de", color: "#6a4300", padding: "0.35rem 0.75rem", fontWeight: 700, cursor: "pointer" }}>Test</button>
              </div>
            )}
          </MapInfo>

          <StatsCard>
            <StatsHeading>Live-Stand</StatsHeading>
            <StatsGrid>
              <StatItem>
                <StatValue>{liveStats.totalKm.toLocaleString("de-DE")} km</StatValue>
                <StatLabel>gemeinsam gefahren</StatLabel>
              </StatItem>
              <StatItem>
                <StatValue>{liveStats.checkedInPortions.toLocaleString("de-DE")}</StatValue>
                <StatLabel>Eisportionen eingecheckt</StatLabel>
              </StatItem>
            </StatsGrid>
            <RouteStatSummary>
              {liveStats.routeBreakdown.map((route) => (
                <RouteStatPill
                  key={route.routeKey}
                  $bg={route.theme.background}
                  $border={route.theme.border}
                  $color={route.theme.text}
                >
                  <span>{route.shortLabel}</span>
                  <span>{route.distanceKm.toLocaleString("de-DE")} km</span>
                </RouteStatPill>
              ))}
            </RouteStatSummary>
          </StatsCard>

          <RouteLegend>
            <div style={{ fontWeight: 700, color: "#5b3a00", marginBottom: "0.45rem" }}>Routen</div>
            {routeOverlays.map((route) => (
              <LegendItem key={route.id} style={{ fontWeight: activeRouteId === route.id ? 700 : 500 }}>
                <LegendSwatch $color={route.color} />
                <span>{route.label}</span>
              </LegendItem>
            ))}
          </RouteLegend>
        </OverlayLayout>

        {!error && (
          <MapContainer
            center={[startFinish.lat, startFinish.lng]}
            zoom={10}
            zoomControl={false}
            bounds={bounds}
            boundsOptions={{ padding: [50, 50] }}
            style={{ width: "100%", height: "100%" }}
          >
            <ZoomControl position="bottomright" />
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
                    <div>{mode === "test" ? "Test-Start- und Zielbereich" : "Start- und Zielbereich für alle Routen"}</div>
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
                        {formatRouteShortWithDistanceByLabel(label)}
                      </RouteBadge>
                    ))}
                  </div>
                  {item.isStartFinishHub ? (
                    <div style={{ marginTop: 6, color: "#7c4f00" }}>{startFinishAddress}</div>
                  ) : (
                    <PopupButton type="button" onClick={() => openDetails(item)}>Details</PopupButton>
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
            <ModalHeader>
              <div>
                <ModalHeading>{selected.name}</ModalHeading>
                <ModalSubline>
                  {detailsLoading
                    ? "Lade Checkpoint-Übersicht..."
                    : formatCheckpointVisitsSummary(details.length)}
                </ModalSubline>
              </div>
            </ModalHeader>
            <div style={{ marginTop: 10 }}>
              {(selected.route_labels || []).map((label) => (
                <RouteBadge
                  key={label}
                  $bg={getRouteThemeByLabel(label).background}
                  $border={getRouteThemeByLabel(label).border}
                  $color={getRouteThemeByLabel(label).text}
                >
                  {formatRouteShortWithDistanceByLabel(label)}
                </RouteBadge>
              ))}
            </div>
            {detailsLoading ? (
              <p>Lade Details...</p>
            ) : details.length === 0 ? (
              <EmptyState>Noch keine Check-ins an diesem Checkpoint.</EmptyState>
            ) : (
              <DetailsTableWrap>
                <DetailsTable>
                  <thead>
                    <tr>
                      <th>Zeit</th>
                      <th>Name</th>
                      <th>User</th>
                      <th>Route</th>
                      <th>Check-in</th>
                    </tr>
                  </thead>
                  <tbody>
                    {details.map((row, idx) => {
                  const checkinId = Number(row.checkin_id);
                  const linkedState = checkinId ? linkedCheckins[checkinId] : null;
                  const isExpanded = checkinId ? Boolean(expandedCheckins[checkinId]) : false;
                  const routeLabel = row.route_label || getRouteLabel(row.route_key);
                  const linkedCheckin = linkedState?.data;
                  const flavourText = linkedCheckin?.eissorten?.length
                    ? linkedCheckin.eissorten.map((item) => item.sortenname).filter(Boolean).join(", ")
                    : "";
                  const rowShopId = row.shop_id || selected.shop_id;
                  const checkinLink = rowShopId && checkinId
                    ? `/map/activeShop/${rowShopId}?tab=checkins&focusCheckin=${checkinId}`
                    : rowShopId
                      ? `/map/activeShop/${rowShopId}?tab=checkins`
                      : null;

                  return (
                    <React.Fragment key={`${row.slot_id || row.user_id || row.username || row.full_name || row.user_display_name}-${row.checkin_time}-${idx}`}>
                      <DetailRow $expanded={isExpanded}>
                        <td>
                          <TimeValue>{formatCheckpointTime(row.checkin_time)}</TimeValue>
                        </td>
                        <td>
                          <NameStack>
                            <DetailValue>{resolveFullName(row)}</DetailValue>
                          </NameStack>
                        </td>
                        <td>
                          <DetailValue>
                            {row.user_id ? <UserLink to={`/user/${row.user_id}`}>{resolveUsername(row)}</UserLink> : resolveUsername(row)}
                          </DetailValue>
                        </td>
                        <td>
                          <CompactRouteBadge
                            $bg={getRouteThemeByLabel(routeLabel).background}
                            $border={getRouteThemeByLabel(routeLabel).border}
                            $color={getRouteThemeByLabel(routeLabel).text}
                          >
                            {formatRouteDistanceOnly(routeLabel)}
                          </CompactRouteBadge>
                        </td>
                        <td>
                          {checkinId ? (
                            <CheckinActions>
                              <CheckinInlineButton type="button" onClick={() => toggleLinkedCheckin(row)}>
                            {isExpanded ? "Check-in ausblenden" : "Check-in anzeigen"}
                          </CheckinInlineButton>
                            
                          </CheckinActions>
                          ) : (
                            <DetailValue>-</DetailValue>
                          )}
                        </td>
                      </DetailRow>
                      {checkinId && isExpanded ? (
                        <ExpandedRow>
                          <ExpandedCell colSpan={5}>
                            <LinkedCheckinBox>
                              {linkedState?.loading ? (
                                <div>Lade Check-in...</div>
                              ) : linkedState?.error ? (
                                <div style={{ color: "#9f1239" }}>{linkedState.error}</div>
                              ) : linkedCheckin ? (
                                <CheckinCardWrap>
                                  <CheckinCard checkin={toCheckinCardData(linkedCheckin, row)} />
                                </CheckinCardWrap>
                              ) : (
                                <div>Kein Detail-Check-in vorhanden.</div>
                              )}
                            </LinkedCheckinBox>
                          </ExpandedCell>
                        </ExpandedRow>
                      ) : null}
                    </React.Fragment>
                  );
                    })}
                  </tbody>
                </DetailsTable>
              </DetailsTableWrap>
            )}
            <ModalActions>
              <AppButton type="button" onClick={() => setSelected(null)}>Schließen</AppButton>
            </ModalActions>
          </Modal>
        </ModalOverlay>
      )}
    </Page>
  );
}
