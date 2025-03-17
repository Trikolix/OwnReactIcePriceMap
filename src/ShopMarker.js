import { useState } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";

const ShopMarker = ({ shop, selectedOption, minPrice, maxPrice }) => {
  const [shopDetails, setShopDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  // Funktion zur Berechnung der Farbe basierend auf dem Preis
  const getColorBasedOnPrice = (price, minPrice, maxPrice) => {
    if (price === null) {
      return 'grey'; // Grau, wenn der Preis null ist
    }
    const ratio = (price - minPrice) / (maxPrice - minPrice);
    const r = Math.floor(200 * ratio);
    const g = Math.floor(200 * (1 - ratio));
    const b = 0; // Blau bleibt 0, da wir nur zwischen Rot und Grün interpolieren
    return `rgb(${r}, ${g}, ${b})`;
  };

  const backgroundColor = getColorBasedOnPrice(shop.kugel_preis, minPrice, maxPrice);
  const displayPrice = selectedOption === "Softeis" ? `${Number(shop.softeis_preis).toFixed(2)} €` : shop.kugel_preis !== null ? `${Number(shop.kugel_preis).toFixed(2)} €` : '?';
  const displayOpeningHours = shop.openingHours !== null ? shop.openingHours : '???';
  const displayLastPriceUpdate = shop.lastPriceUpdate !== null ? `(zuletzt aktualisiert: ${shop.lastPriceUpdate})` : '';

  const fetchShopDetails = async () => {
    if (shopDetails || loading) return;

    setLoading(true);
    try {
      console.log(`Fetching details for shop ID: ${shop.id}`);
      const response = await fetch(`https://ice-app.4lima.de/backend/get_eisdiele.php?eisdiele_id=${shop.id}`);

      // Checke, ob die Antwort wirklich JSON ist
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text(); // HTML-Fehlermeldung ausgeben
        throw new Error(`Invalid JSON response: ${text}`);
      }
      const data = await response.json();
      setShopDetails(data);
      console.log(data);
    } catch (error) {
      console.error("Fehler beim Laden der Daten:", error);
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
        html: `<div style="background-color:${backgroundColor}">${displayPrice}</div>`,
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
              <h3>Preise:</h3>
                {shopDetails.preise.kugel != null && (<div><b>Kugelpreis:</b> {shopDetails.preise.kugel.preis.toFixed(2)} € <span style={{ fontSize: 'smaller', color: 'grey' }}>(zuletzt aktualisiert: {shopDetails.preise.kugel.letztes_update})</span></div>)}
                {shopDetails.preise.softeis != null && (<div><b>Softeis:</b> {shopDetails.preise.softeis.preis.toFixed(2)} € <span style={{ fontSize: 'smaller', color: 'grey' }}>(zuletzt aktualisiert: {shopDetails.preise.softeis.letztes_update})</span></div>)}
              <p><b>Adresse:</b> {shopDetails.eisdiele.adresse}</p>
              {shopDetails.bewertungen && (shopDetails.bewertungen.geschmack || shopDetails.bewertungen.auswahl || shopDetails.bewertungen.kugelgroesse) && (
                <p><h3>Bewertungen:</h3>
                  <div><b>Geschmack:</b> {shopDetails.bewertungen.geschmack ? shopDetails.bewertungen.geschmack : '-'} / 5</div>
                  <div><b>Kugelgröße:</b> {shopDetails.bewertungen.kugelgroesse ? shopDetails.bewertungen.kugelgroesse : '-'} / 5</div>
                  <div><b>Auswahl:</b> ~ {shopDetails.bewertungen.auswahl? shopDetails.bewertungen.auswahl : '?'} Sorten</div>
                  {shopDetails.attribute && <div><b>Nutzern loben besonders:</b> {shopDetails.attribute.map(attribute => `${attribute.name} x ${attribute.anzahl}`).join(', ')}</div>}
                </p>
              )  }
              {shopDetails.eisdiele.openingHours && (<p>Öffnungszeiten: {shopDetails.openingHours}</p>)}

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
