import { useMap } from 'react-leaflet';
import { useEffect } from 'react';
import L from 'leaflet';

const MapCenterOnShop = ({ shop }) => {

    const map = useMap();

  useEffect(() => {

    const isMobile = window.innerWidth < 768;

    const offset = isMobile
      ? [0, -(window.innerHeight / 4)]   // nach oben für mobile View
      : [(window.innerWidth * 0.15), 0];  // nach rechts für Sidebar links auf Desktop

    const targetPoint = map.latLngToContainerPoint([shop.eisdiele.latitude, shop.eisdiele.longitude]);
    const adjustedPoint = L.point(
      targetPoint.x - offset[0],
      targetPoint.y - offset[1]
    );
    const adjustedLatLng = map.containerPointToLatLng(adjustedPoint);

    map.flyTo(adjustedLatLng, map.getZoom(), {
      duration: 0.5,
    });
  }, [shop.eisdiele.latitude, shop.eisdiele.longitude, map]);

  return null;
};

export default MapCenterOnShop;
