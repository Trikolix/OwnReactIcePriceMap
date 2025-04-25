import { useState } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import styled from 'styled-components';
import FavoritenButton from "./components/FavoritButton"
import Rating from "./components/Rating";

const ShopMarker = ({ shop, selectedOption, minPrice, maxPrice, isLoggedIn, userId, plv, setIceCreamShops, setActiveShop, setShowPriceForm, setShowReviewForm, setShowCheckinForm }) => {
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

  let backgroundColor;
  const shopPrice = selectedOption === "Softeis" ? shop.softeis_preis :
    (selectedOption === "Alle" || selectedOption === "Favoriten") && shop.kugel_preis == null && shop.softeis_preis !== null ? shop.softeis_preis :
      shop.kugel_preis;
  if (selectedOption === "Rating") {
    backgroundColor = getColorBasedOnPrice(plv, maxPrice, minPrice - 1);
  } else {
    backgroundColor = getColorBasedOnPrice(shopPrice, minPrice, maxPrice);
  }
  if (selectedOption === "Geschmack") {
    backgroundColor = getColorBasedOnPrice(shop.avg_geschmack, maxPrice, minPrice);
  }

  let displayPrice;
  switch (true) {
    case selectedOption === "Softeis" && shop.softeis_preis !== null:
      displayPrice = `${Number(shop.softeis_preis).toFixed(2)} €`;
      break;
    case selectedOption === "Kugeleis" && shop.kugel_preis !== null:
      displayPrice = `${Number(shop.kugel_preis).toFixed(2)} €`;
      break;
    case (selectedOption === "Alle" || selectedOption === "Favoriten") && shop.kugel_preis != null:
      displayPrice = `${Number(shop.kugel_preis).toFixed(2)} €`;
      break;
    case (selectedOption === "Alle" || selectedOption === "Favoriten") && shop.softeis_preis != null:
      displayPrice = `${Number(shop.softeis_preis).toFixed(2)} €`;
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
  const displayOpeningHours = shopDetails?.eisdiele?.openingHours ? shopDetails.eisdiele.openingHours.split(";") : ["???"];

  const calculateTimeDifference = (dateString) => {
    const currentDate = new Date();
    const pastDate = new Date(dateString);

    // Berechnen der Differenz in Millisekunden
    const diffInMilliseconds = currentDate - pastDate;

    // Umrechnen in Tage
    const diffInDays = Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24));

    if (diffInDays > 365) {
      const diffInYears = Math.floor(diffInDays / 365);
      return `Vor ${diffInYears} Jahr${diffInYears > 1 ? 'en' : ''}`;
    } else if (diffInDays > 30) {
      const diffInMonths = Math.floor(diffInDays / 30);
      return `Vor ${diffInMonths} Monat${diffInMonths > 1 ? 'en' : ''}`;
    } else if (diffInDays === 0)
      return 'Vor < 24 Stunden';
    else {
      return `Vor ${diffInDays} Tag${diffInDays > 1 ? 'en' : ''}`;
    }
  };

  const fetchShopDetails = async () => {
    if (shopDetails || loading) return;

    setLoading(true);
    try {
      console.log(`Fetching details for shop ID: ${shop.eisdielen_id}`);
      const response = await fetch(`https://ice-app.4lima.de/backend/get_eisdiele.php?eisdiele_id=${shop.eisdielen_id}`);

      // Checke, ob die Antwort wirklich JSON ist
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text(); // HTML-Fehlermeldung ausgeben
        throw new Error(`Invalid JSON response: ${text}`);
      }
      const data = await response.json();
      console.log(data);
      setShopDetails(data);
      setActiveShop(data);
    } catch (error) {
      console.error("Fehler beim Laden der Daten:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <style>
        {`
          .star-container {
            margin-top: -30px;
          }
        `}
      </style>
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
            <FavoritenButton
              eisdieleId={shop.eisdielen_id}
              isLoggedIn={isLoggedIn}
              userId={userId}
              setIceCreamShops={setIceCreamShops}
            />
            <Header>{shop.eisdielen_name}</Header>
            {loading ? (
              <p>Lädt...</p>
            ) : shopDetails ? (
              <>
                <b>Adresse:</b> {shopDetails.eisdiele.adresse}
                {shopDetails?.eisdiele?.openingHours && (
                  <div>
                    <SubHeading>Öffnungszeiten:</SubHeading>
                    {displayOpeningHours.map((part, index) => (
                      <div key={index}>{part.trim()}</div>
                    ))}
                  </div>
                )}
                {(shopDetails.preise.kugel != null || shopDetails.preise.softeis != null) && (<SubHeading>Preise:</SubHeading>)}
                {shopDetails.preise.kugel != null && (<div>
                  <b>Kugelpreis:</b> {shopDetails.preise.kugel.preis.toFixed(2)} € {shopDetails.preise.kugel.beschreibung != null && (<>({shopDetails.preise.kugel.beschreibung}) </>)}
                  <span style={{ fontSize: 'smaller', color: 'grey' }}>({calculateTimeDifference(shopDetails.preise.kugel.letztes_update)} aktualisiert)</span>
                </div>)}

                {shopDetails.preise.softeis != null && (<div>
                  <b>Softeis:</b> {shopDetails.preise.softeis.preis.toFixed(2)} € {shopDetails.preise.softeis.beschreibung != null && (<>({shopDetails.preise.softeis.beschreibung}) </>)}
                  <span style={{ fontSize: 'smaller', color: 'grey' }}>({calculateTimeDifference(shopDetails.preise.softeis.letztes_update)} aktualisiert)</span>
                </div>)}
                {isLoggedIn && (<button onClick={() => setShowPriceForm(true)}>Preis melden / bestätigen</button>)}
                {shopDetails.bewertungen && (shopDetails.bewertungen.geschmack || shopDetails.bewertungen.auswahl || shopDetails.bewertungen.kugelgroesse) && (
                  <div><SubHeading>Bewertungen:</SubHeading>
                  {shopDetails.bewertungen.geschmack !== null && (<div><b>Geschmack:</b><Rating stars={shopDetails.bewertungen.geschmack} />{shopDetails.bewertungen.geschmack}</div>)}
                  {shopDetails.bewertungen.kugelgroesse !== null && (<div><b>Kugelgröße:</b><Rating stars={shopDetails.bewertungen.kugelgroesse} />{shopDetails.bewertungen.kugelgroesse}</div>)}
                  {shopDetails.bewertungen.waffel !== null && (<div><b>Waffel:</b><Rating stars={shopDetails.bewertungen.waffel} />{shopDetails.bewertungen.waffel}</div>)}
                    <div><b>Auswahl:</b> ~ {shopDetails.bewertungen.auswahl ? shopDetails.bewertungen.auswahl : '?'} Sorten</div>
                    {shopDetails.attribute?.length > 0 && <div><b>Nutzer loben besonders:</b> {shopDetails.attribute.map(attribute => `${attribute.name} x ${attribute.anzahl}`).join(', ')}</div>}
                  </div>
                )}
                {isLoggedIn && (<>
                  <button onClick={() => setShowReviewForm(true)}>Eisdiele bewerten</button>
                  <button onClick={() => setShowCheckinForm(true)}>Eis geschleckert</button>
                  </>
                )}
                {shopDetails?.eisdiele?.komoot && isLoggedIn && (
                  <>
                    <h3>Komoot</h3>
                    <div dangerouslySetInnerHTML={{ __html: shopDetails.eisdiele.komoot }} />
                  </>
                )}

              </>
            ) : (
              <p>Klicke auf den Marker, um Details zu laden.</p>
            )}
          </div>
        </Popup>
      </Marker>
    </>
  );
};

export default ShopMarker;

const Header = styled.h2`
  margin-block-end: 12px;
  text-align:center
  `;

const SubHeading = styled.h3`
  margin-block-start: 5px;
  margin-block-end: 0px;
  text-decoration: underline;
`;
