import { useMap } from 'react-leaflet';
import { useEffect } from 'react';
import L from 'leaflet';

const MapCenterOnShop = ({ shop }) => {
  const map = useMap();
  const latitude = Number(shop?.eisdiele?.latitude ?? shop?.latitude);
  const longitude = Number(shop?.eisdiele?.longitude ?? shop?.longitude);

  useEffect(() => {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return;
    }

    const isMobile = window.innerWidth < 768;

    const offset = isMobile
      ? [0, -(window.innerHeight / 4)]   // nach oben für mobile View
      : [(window.innerWidth * 0.15), 0];  // nach rechts für Sidebar links auf Desktop

    const targetPoint = map.latLngToContainerPoint([latitude, longitude]);
    const adjustedPoint = L.point(
      targetPoint.x - offset[0],
      targetPoint.y - offset[1]
    );
    const adjustedLatLng = map.containerPointToLatLng(adjustedPoint);

    map.flyTo(adjustedLatLng, map.getZoom(), {
      duration: 0.5,
    });
  }, [latitude, longitude, map]);

  return null;
};

export default MapCenterOnShop;
