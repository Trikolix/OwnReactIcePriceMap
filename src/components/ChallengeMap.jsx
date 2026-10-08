import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { MapPinned } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { Action, Muted, Panel, PanelHead } from './ChallengePageUI';
import { DIFFICULTIES } from '../utils/challengePlanning.mjs';
const Wrap = styled.aside`min-width:0;#challenge-map:focus-visible{outline:3px solid #986b0e;outline-offset:3px;}
  @media(min-width:1080px){position:sticky;top:96px;}`;
const MapArea = styled.div`height:280px;border-radius:12px;overflow:hidden;margin-top:12px;background:#f3eee0;
  @media(min-width:1080px){height:360px;}
  .leaflet-container{height:100%;width:100%;}.leaflet-control-zoom a{width:44px;height:44px;line-height:44px;}
  .challenge-marker{background:transparent;border:0;display:flex;justify-content:center;align-items:center;}
  .challenge-marker span{width:24px;height:24px;border:3px solid #fff;border-radius:50%;box-shadow:0 1px 5px #342d2180;}
  .challenge-marker-selected span{outline:3px solid #92620f;outline-offset:3px;}
  .leaflet-popup-content{overflow-wrap:anywhere;max-width:230px;}.leaflet-popup-close-button{width:44px!important;height:44px!important;display:grid;place-items:center;}
`;
function Frame({
  points,
  selectedId,
  location,
  center,
  radius,
  open
}) {
  const map = useMap(),
    markerKey = JSON.stringify(points.map(point => [point.id, point.lat, point.lon]));
  useEffect(() => {
    if (!open) return;
    map.invalidateSize();
    const selected = points.find(point => String(point.id) === String(selectedId));
    if (selected) {
      map.setView([selected.lat, selected.lon], 13);
      return;
    }
    const positions = points.map(point => [point.lat, point.lon]);
    if (location) positions.push([location.lat, location.lon]);
    if (center) positions.push([center.lat, center.lon]);
    if (positions.length > 1) map.fitBounds(positions, {
      padding: [30, 30],
      maxZoom: 13
    });else if (center && radius) map.fitBounds(L.latLng(center.lat, center.lon).toBounds(radius * 2), {
      padding: [20, 20]
    });else if (positions.length) map.setView(positions[0], 13);
  }, [markerKey, selectedId, location?.lat, location?.lon, center?.lat, center?.lon, radius, open, map]);
  return null;
}
export default function ChallengeMap({
  points = [],
  selectedId,
  onSelect,
  location,
  center,
  radius,
  innerRadius,
  forceOpen = 0
}) {
  const [wide, setWide] = useState(() => window.matchMedia('(min-width:1080px)').matches),
    [expanded, setExpanded] = useState(false);
  const region = useRef(null),
    open = wide || expanded;
  const validPoints = useMemo(() => points.filter(point => Number.isFinite(point.lat) && Number.isFinite(point.lon)), [points]);
  useEffect(() => {
    const media = window.matchMedia('(min-width:1080px)'),
      change = () => setWide(media.matches);
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);
  useEffect(() => {
    if (forceOpen) {
      setExpanded(true);
      requestAnimationFrame(() => {
        region.current?.scrollIntoView({
          block: 'nearest'
        });
        region.current?.focus({
          preventScroll: true
        });
      });
    }
  }, [forceOpen]);
  const initial = validPoints[0] || center || location || {
    lat: 51.1,
    lon: 10.4
  };
  return <Wrap><Panel>
    <PanelHead><h2><MapPinned size={19} aria-hidden="true" />Challenge-Karte</h2>{!wide && <Action aria-expanded={open} aria-controls="challenge-map" onClick={() => setExpanded(!expanded)}>{open ? 'Karte ausblenden' : 'Karte anzeigen'}</Action>}</PanelHead>
    {!validPoints.length && !center && <Muted>Noch keine Ziele auf der Karte.</Muted>}
    <div id="challenge-map" hidden={!open} ref={region} tabIndex={-1} aria-label="Karte mit Challenge-Zielen">{open && <MapArea>
      <MapContainer center={[initial.lat, initial.lon]} zoom={validPoints.length ? 12 : 6} scrollWheelZoom={false}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />
        <Frame points={validPoints} selectedId={selectedId} location={location} center={center} radius={radius} open={open} />
        {center && radius > 0 && <Circle center={[center.lat, center.lon]} radius={radius} pathOptions={{
              color: '#b78709',
              fillOpacity: .08
            }} />}
        {center && innerRadius > 0 && <Circle center={[center.lat, center.lon]} radius={innerRadius} pathOptions={{
              color: '#b78709',
              fillOpacity: 0,
              dashArray: '5 5'
            }} />}
        {validPoints.map(point => <Marker key={point.id} position={[point.lat, point.lon]} title={point.name} zIndexOffset={String(selectedId) === String(point.id) ? 1000 : 0} icon={L.divIcon({
              className: `challenge-marker ${String(selectedId) === String(point.id) ? 'challenge-marker-selected' : ''}`,
              html: `<span style="background:${DIFFICULTIES[point.difficulty]?.color || '#b78709'}"></span>`,
              iconSize: [44, 44],
              iconAnchor: [22, 22]
            })} eventHandlers={{
              click: () => onSelect?.(point.id)
            }}>
          <Popup><strong>{point.name}</strong><p>{point.address}</p><Action as={Link} to={`/shop/${point.shopId}`}>Eisdiele ansehen</Action></Popup>
        </Marker>)}
      </MapContainer>
    </MapArea>}</div>
  </Panel></Wrap>;
}
