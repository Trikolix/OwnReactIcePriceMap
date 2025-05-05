import { Marker, Popup } from "react-leaflet";
import L from "leaflet";

const ShopMarker = ({ shop, fetchShopDetails, fetchAndCenterShop, minPrice, maxPrice, plv, selectedOption }) => {
  const getColorBasedOnPrice = (price, minPrice, maxPrice) => {
    if (price === null || isNaN(price)) {
      return 'grey';
    }
    const ratio = (price - minPrice) / (maxPrice - minPrice);
    const r = Math.floor(200 * ratio);
    const g = Math.floor(200 * (1 - ratio));
    return `rgb(${r}, ${g}, 0)`;
  };

  let displayPrice;
  switch (true) {
    case selectedOption === "Softeis" && shop.softeis_preis !== null:
      displayPrice = `${Number(shop.softeis_preis).toFixed(2)}`;
      break;
    case selectedOption === "Kugeleis" && shop.kugel_preis !== null:
      displayPrice = `${Number(shop.kugel_preis).toFixed(2)}`;
      break;
    case (selectedOption === "Alle" || selectedOption === "Favoriten") && shop.kugel_preis != null:
      displayPrice = `${Number(shop.kugel_preis).toFixed(2)}`;
      break;
    case (selectedOption === "Alle" || selectedOption === "Favoriten") && shop.softeis_preis != null:
      displayPrice = `${Number(shop.softeis_preis).toFixed(2)}`;
      break;
    case selectedOption === "Rating" && plv !== null:
      displayPrice = `${Number(plv).toFixed(2)}`;
      break;
    case selectedOption === "Geschmack" && shop.avg_geschmack !== null:
      displayPrice = `${Number(shop.avg_geschmack).toFixed(2)}`;
      break;
    default:
      displayPrice = '?';
  }
  let backgroundColor;
  if (selectedOption === "Rating" || selectedOption === "Geschmack") {
    backgroundColor = getColorBasedOnPrice(displayPrice, maxPrice, minPrice);
  } else {
    backgroundColor = getColorBasedOnPrice(displayPrice, minPrice, maxPrice);
  }
  
  
  if (displayPrice !== '?' && (selectedOption === "Softeis" || selectedOption === "Kugeleis" || selectedOption === "Alle" || selectedOption === "Favoriten")) {
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
        popupAnchor: [0, -19],
      })}
      eventHandlers={{
        click: () => {
          console.log("Marker clicked:", shop);
          fetchShopDetails(shop);
           fetchAndCenterShop(shop.eisdielen_id);
          },
      }}
    >
      <Popup>
          <h3>{shop.eisdielen_name}</h3>
      </Popup>
      </Marker>
  );
};

export default ShopMarker;
