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
  isFocused = false,
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
  const isFavorite = Number(shop.is_favorit) === 1;
  const hasActiveChallenge = Number(shop.has_active_challenge) === 1;
  const size = isFocused ? 48 : 40;
  const borderColor = isFavorite ? "#ffd54a" : "#ffffff";
  const textColor = isFavorite ? "#ffd54a" : "#ffffff";
  const focusGlow = isFocused ? "0 0 0 4px rgba(255, 111, 0, 0.35), 0 6px 18px rgba(0,0,0,0.35)" : "0 3px 10px rgba(0,0,0,0.25)";
  const challengeBadge = hasActiveChallenge
    ? `<div title="Aktive Challenge" style="position:absolute; top:-4px; right:-4px; width:18px; height:18px; border-radius:50%; background:#ff6f00; color:#fff; border:2px solid #fff; font-size:10px; line-height:14px; text-align:center; font-weight:700;">C</div>`
    : "";

  return (
    <Marker
      position={[shop.latitude, shop.longitude]}
      icon={L.divIcon({
        className: "price-icon",
        html: `
          <div class="price-icon-wrapper" style="position:relative; width:${size}px; height:${size}px;">
            <div class="price-icon-circle" style="background-color:${backgroundColor}; color:${textColor}; text-align:center; border-radius:50%; width:${size}px; height:${size}px; border:3px solid ${borderColor}; box-shadow:${focusGlow}; font-weight:400; font-size:${isFocused ? 12 : 11}px; font-family:'Segoe UI', Tahoma, Arial, sans-serif; line-height:1; white-space:nowrap; display:flex; align-items:center; justify-content:center; padding:0 4px; transform:${isFocused ? "scale(1.05)" : "scale(1)"}; box-sizing:border-box;">
              ${formattedValue}
            </div>
            ${challengeBadge}
          </div>
        `,
        iconSize: [size, size],
        iconAnchor: [Math.round(size / 2), Math.round(size / 2)],
        popupAnchor: [0, -Math.round(size / 2)],
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
