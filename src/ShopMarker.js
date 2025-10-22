import { Marker } from "react-leaflet";
import L from "leaflet";

const ShopMarker = ({ shop, fetchShopDetails, fetchAndCenterShop, minPrice, maxPrice, selectedOption }) => {
  const getColorBasedOnPrice = (price, minPrice, maxPrice, status) => {
    let r, g, b;
    if (price === null || isNaN(price) || status === 'permanent_closed') {
      r = g = b = 128;
    } else {
      const ratio = (price - minPrice) / (maxPrice - minPrice);
      r = Math.floor(200 * ratio);
      g = Math.floor(200 * (1 - ratio));
      b = 0;
    }

    const iconOpacity = status === 'permanent_closed' ? 0.4
      : status === 'seasonal_closed' ? 0.6
        : 1.0;
    return `rgba(${r}, ${g}, ${b}, ${iconOpacity})`;
  };

  let displayPrice;
  switch (true) {
    case selectedOption === "Softeis: Preis" && shop.softeis_preis_eur !== null:
      displayPrice = `${Number(shop.softeis_preis_eur).toFixed(2)}`;
      break;
    case selectedOption === "Kugel: Preis" && shop.kugel_preis !== null:
      displayPrice = `${Number(shop.kugel_preis_eur).toFixed(2)}`;
      break;
    case (selectedOption === "Alle" || selectedOption === "Favoriten" || selectedOption === "Besucht" || selectedOption === "Nicht besucht") && shop.kugel_preis_eur != null:
      displayPrice = `${Number(shop.kugel_preis_eur).toFixed(2)}`;
      break;
    case (selectedOption === "Alle" || selectedOption === "Favoriten" || selectedOption === "Besucht" || selectedOption === "Nicht besucht") && shop.softeis_preis_eur != null:
      displayPrice = `${Number(shop.softeis_preis_eur).toFixed(2)}`;
      break;
    case selectedOption === "Kugel: Rating":
      displayPrice = `${Number(shop.finaler_kugel_score).toFixed(2)}`;
      break;
    case selectedOption === "Softeis: Rating":
      displayPrice = `${Number(shop.finaler_softeis_score).toFixed(2)}`;
      break;
    case selectedOption === "Eisbecher: Rating":
      displayPrice = `${Number(shop.finaler_eisbecher_score).toFixed(2)}`;
      break;
    default:
      displayPrice = '?';
  }
  let backgroundColor;
  if (selectedOption === "Kugel: Rating" || selectedOption === "Softeis: Rating" || selectedOption === "Eisbecher: Rating") {
    backgroundColor = getColorBasedOnPrice(displayPrice, maxPrice, minPrice, shop.status);
  } else {
    backgroundColor = getColorBasedOnPrice(displayPrice, minPrice, maxPrice, shop.status);
  }


  if (displayPrice !== '?' && (selectedOption === "Softeis: Preis" || selectedOption === "Kugel: Preis" || selectedOption === "Alle" || selectedOption === "Favoriten" || selectedOption === "Besucht" || selectedOption === "Nicht besucht")) {
    displayPrice = `${Number(displayPrice).toFixed(2)} €`;
  }

  return (
    <Marker
      position={[shop.latitude, shop.longitude]}
      icon={L.divIcon({
        className: "price-icon",
        html: `<div style="background-color:${backgroundColor}; color: white; text-align: center; border-radius: 50%; width: 40px; height: 40px; line-height: 40px;">${displayPrice}</div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -19]
      })}
      eventHandlers={{
        click: () => {
          console.log("Marker clicked:", shop);
          fetchShopDetails(shop);
          fetchAndCenterShop(shop.eisdielen_id);
        },
      }}
    >
    </Marker>
  );
};

export default ShopMarker;
