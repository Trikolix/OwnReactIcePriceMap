import { Marker } from "react-leaflet";
import L from "leaflet";

const ShopMarker = ({
  shop,
  fetchShopDetails,
  fetchAndCenterShop,
  minValue,
  maxValue,
  displayValue,
  formatValue,
  invertScale,
}) => {
  const getColorForValue = (value, status) => {
    const iconOpacity =
      status === "permanent_closed" ? 0.4 : status === "seasonal_closed" ? 0.6 : 1.0;
    if (
      value === null ||
      value === undefined ||
      minValue === null ||
      maxValue === null ||
      Number.isNaN(value)
    ) {
      return `rgba(128, 128, 128, ${iconOpacity})`;
    }
    let ratio = maxValue === minValue ? 0.5 : (value - minValue) / (maxValue - minValue);
    ratio = Math.min(Math.max(ratio, 0), 1);
    if (invertScale) {
      ratio = 1 - ratio;
    }
    const r = Math.floor(200 * ratio);
    const g = Math.floor(200 * (1 - ratio));
    return `rgba(${r}, ${g}, 0, ${iconOpacity})`;
  };

  const formattedValue =
    displayValue === null || displayValue === undefined
      ? "?"
      : formatValue
      ? formatValue(Number(displayValue))
      : `${Number(displayValue).toFixed(2)}`;

  const backgroundColor = getColorForValue(displayValue, shop.status);

  return (
    <Marker
      position={[shop.latitude, shop.longitude]}
      icon={L.divIcon({
        className: "price-icon",
        html: `<div style="background-color:${backgroundColor}; color: white; text-align: center; border-radius: 50%; width: 40px; height: 40px; line-height: 40px;">${formattedValue}</div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -19],
      })}
      eventHandlers={{
        click: () => {
          fetchShopDetails(shop);
          fetchAndCenterShop(shop.eisdielen_id);
        },
      }}
    ></Marker>
  );
};

export default ShopMarker;
