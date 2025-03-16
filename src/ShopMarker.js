import { useState } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";

const ShopMarker = ({ shop }) => {
  const [shopDetails, setShopDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchShopDetails = async () => {
    if (shopDetails || loading) return; // Verhindert mehrfaches Laden

    setLoading(true);
    try {
      const response = await fetch(`https://ice-app.4lima.de/backend/get_eisdiele.php?eisdiele_id=${shop.id}`); // URL anpassen
      const data = await response.json();
      setShopDetails(data);
    } catch (error) {
      console.error("Fehler beim Laden der Daten", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Marker
      key={shop.id}
      position={[shop.latitude, shop.longitude]}
      icon={L.divIcon({
        className: "price-icon",
        html: `<div style="background-color:#ffcc00">${shop.price}€</div>`,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
        popupAnchor: [0, -19],
      })}
      eventHandlers={{
        click: fetchShopDetails, // API-Call erst beim Klick auslösen
      }}
    >
      <Popup>
        <div>
          <h2>{shop.name}</h2>
          {loading ? (
            <p>Lädt...</p>
          ) : shopDetails ? (
            <>
              <p>Preis: {shopDetails.price}€ / Kugel</p>
              <p>Adresse: {shopDetails.address}</p>
              <p>Öffnungszeiten: {shopDetails.openingHours}</p>
            </>
          ) : (
            <p>Klicke auf den Marker, um Details zu laden.</p>
          )}
        </div>
      </Popup>
    </Marker>
  );
};

export default ShopMarker;
