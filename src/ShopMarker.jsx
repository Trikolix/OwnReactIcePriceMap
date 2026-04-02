import { Marker } from "react-leaflet";
import L from "leaflet";

const EASTER_BUNNY_ASSET = "/assets/easter-marker-bunny.png";
const EASTER_BUNNY_FALLBACK_ASSET = "/assets/easter-bunny.png";
const EASTER_EGG_PALETTES = [
  { shell: "linear-gradient(180deg, #ffb7c8 0%, #ff8ba7 100%)", stripeA: "#fff7b8", stripeB: "#f35b8c", dot: "#ffffff", text: "#5f1833" },
  { shell: "linear-gradient(180deg, #b9f3ff 0%, #72d6ff 100%)", stripeA: "#ffffff", stripeB: "#2aa9d9", dot: "#fff3a3", text: "#15435b" },
  { shell: "linear-gradient(180deg, #ffe08a 0%, #ffc44d 100%)", stripeA: "#ffffff", stripeB: "#ff7a59", dot: "#fff0c2", text: "#6a3d00" },
  { shell: "linear-gradient(180deg, #d8c6ff 0%, #b48cff 100%)", stripeA: "#fff6a8", stripeB: "#7b5ed8", dot: "#ffffff", text: "#3f2a6c" },
  { shell: "linear-gradient(180deg, #c8f7bf 0%, #91dc7b 100%)", stripeA: "#fff7cc", stripeB: "#3c9c68", dot: "#ffffff", text: "#1e4b35" },
];

const getMarkerOpacity = (status) => {
  if (status === "permanent_closed") {
    return 0.4;
  }
  if (status === "seasonal_closed") {
    return 0.6;
  }
  return 1;
};

const getStableHash = (value) => {
  const input = String(value ?? "");
  let hash = 0;

  for (let index = 0; index < input.length; index += 1) {
    hash = ((hash << 5) - hash + input.charCodeAt(index)) | 0;
  }

  return Math.abs(hash);
};

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

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
  seasonalVariant = null,
  encounterBunny = false,
}) => {
  const getColorForValue = (value, status) => {
    const iconOpacity = getMarkerOpacity(status);
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
  const markerOpacity = getMarkerOpacity(shop.status);
  const stableHash = getStableHash(`${shop.eisdielen_id}:${shop.name}:${shop.latitude}:${shop.longitude}`);
  const showEasterStyle = seasonalVariant === "easter";
  const easterPalette = EASTER_EGG_PALETTES[stableHash % EASTER_EGG_PALETTES.length];
  const bunnyOnLeft = stableHash % 2 === 0;
  const size = isFocused ? 48 : 40;
  const borderColor = isFavorite ? "#ffd54a" : "#ffffff";
  const textColor = isFavorite ? "#ffd54a" : "#ffffff";
  const focusGlow = isFocused ? "0 0 0 4px rgba(255, 111, 0, 0.35), 0 6px 18px rgba(0,0,0,0.35)" : "0 3px 10px rgba(0,0,0,0.25)";
  const challengeBadge = hasActiveChallenge
    ? `<div title="Aktive Challenge" style="position:absolute; top:-4px; right:-4px; width:18px; height:18px; border-radius:50%; background:#ff6f00; color:#fff; border:2px solid #fff; font-size:10px; line-height:14px; text-align:center; font-weight:700; opacity:${markerOpacity};">C</div>`
    : "";
  const markerWidth = showEasterStyle ? (isFocused ? 64 : 56) : size;
  const markerHeight = showEasterStyle ? (isFocused ? 66 : 58) : size;
  const eggWidth = showEasterStyle ? (isFocused ? 46 : 40) : size;
  const eggHeight = showEasterStyle ? (isFocused ? 58 : 50) : size;
  const eggLeft = Math.round((markerWidth - eggWidth) / 2);
  const eggTop = Math.round((markerHeight - eggHeight) / 2);
  const escapedValue = escapeHtml(formattedValue);
  const bunnyStyle = encounterBunny
    ? `position:absolute; top:-24px; ${bunnyOnLeft ? "left:-4px; transform:rotate(-4deg);" : "right:-4px; transform:scaleX(-1) rotate(4deg);"} width:${isFocused ? 58 : 54}px; height:auto; z-index:0; pointer-events:auto; cursor:pointer; filter:drop-shadow(0 7px 14px rgba(0,0,0,0.32));`
    : `position:absolute; top:-12px; ${bunnyOnLeft ? "left:1px; transform:rotate(-5deg);" : "right:1px; transform:scaleX(-1) rotate(5deg);"} width:${isFocused ? 40 : 36}px; height:auto; z-index:0; pointer-events:none; filter:drop-shadow(0 5px 10px rgba(0,0,0,0.24));`;
  const bunnyHtml = encounterBunny ? `
    <img
      src="${EASTER_BUNNY_ASSET}"
      alt=""
      aria-hidden="true"
      title="${encounterBunny ? "Osterhase" : ""}"
      class="shop-marker-bunny shop-marker-bunny--encounter"
      onerror="if(this.dataset.fallbackApplied==='1'){this.style.display='none';}else{this.dataset.fallbackApplied='1';this.src='${EASTER_BUNNY_FALLBACK_ASSET}';}"
      style="${bunnyStyle}"
    />
  ` : "";
  const defaultMarkerHtml = `
    <div class="price-icon-wrapper" style="position:relative; width:${size}px; height:${size}px;">
      <div class="price-icon-circle" style="background-color:${backgroundColor}; color:${textColor}; text-align:center; border-radius:50%; width:${size}px; height:${size}px; border:3px solid ${borderColor}; box-shadow:${focusGlow}; font-weight:400; font-size:${isFocused ? 12 : 11}px; font-family:'Segoe UI', Tahoma, Arial, sans-serif; line-height:1; white-space:nowrap; display:flex; align-items:center; justify-content:center; padding:0 4px; transform:${isFocused ? "scale(1.05)" : "scale(1)"}; box-sizing:border-box;">
        ${escapedValue}
      </div>
      ${challengeBadge}
    </div>
  `;
  const easterMarkerHtml = `
    <div class="price-icon-wrapper" style="position:relative; width:${markerWidth}px; height:${markerHeight}px; overflow:visible;">
      ${bunnyHtml}
      <div style="position:absolute; left:${eggLeft}px; top:${eggTop}px; width:${eggWidth}px; height:${eggHeight}px; z-index:1; opacity:${markerOpacity};">
        <div style="position:absolute; inset:0; border-radius:54% 54% 48% 48% / 63% 63% 38% 38%; background:${easterPalette.shell}; border:3px solid ${borderColor}; box-shadow:${focusGlow}; transform:${isFocused ? "scale(1.04)" : "scale(1)"}; box-sizing:border-box;"></div>
        <div style="position:absolute; left:8%; top:31%; width:84%; height:12%; border-radius:999px; background:${easterPalette.stripeA}; transform:rotate(-7deg); opacity:0.95;"></div>
        <div style="position:absolute; left:15%; top:49%; width:70%; height:11%; border-radius:999px; background:${easterPalette.stripeB}; transform:rotate(6deg); opacity:0.95;"></div>
        <div style="position:absolute; left:19%; top:20%; width:10px; height:10px; border-radius:50%; background:${easterPalette.dot}; opacity:0.95;"></div>
        <div style="position:absolute; right:18%; top:24%; width:8px; height:8px; border-radius:50%; background:${easterPalette.dot}; opacity:0.9;"></div>
        <div style="position:absolute; left:50%; top:53%; transform:translate(-50%, -50%); max-width:78%; color:${easterPalette.text}; background:rgba(255,255,255,0.82); border:1px solid rgba(255,255,255,0.96); border-radius:999px; box-shadow:0 2px 6px rgba(0,0,0,0.18); padding:${isFocused ? "3px 6px" : "2px 5px"}; text-align:center; font-weight:800; font-size:${isFocused ? 12 : 11}px; font-family:'Segoe UI', Tahoma, Arial, sans-serif; line-height:1.05; white-space:nowrap; text-shadow:none; backdrop-filter:blur(1px); z-index:2;">
          ${escapedValue}
        </div>
      </div>
      ${challengeBadge}
    </div>
  `;

  return (
    <Marker
      position={[shop.latitude, shop.longitude]}
      shopId={Number(shop.eisdielen_id)}
      icon={L.divIcon({
        className: "price-icon",
        html: showEasterStyle ? easterMarkerHtml : defaultMarkerHtml,
        iconSize: [markerWidth, markerHeight],
        iconAnchor: [Math.round(markerWidth / 2), Math.round(markerHeight / 2)],
        popupAnchor: [0, -Math.round(markerHeight / 2)],
      })}
      eventHandlers={{
        click: (event) => {
          const clickedBunny = event?.originalEvent?.target?.closest?.('.shop-marker-bunny--encounter');
          if (clickedBunny) {
            window.dispatchEvent(new CustomEvent('seasonal:easter-bunny-click', {
              detail: { shopId: Number(shop.eisdielen_id) },
            }));
            return;
          }
          fetchShopDetails(shop);
        },
      }}
    ></Marker>
  );
};

export default ShopMarker;
