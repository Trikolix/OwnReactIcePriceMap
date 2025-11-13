import React from 'react';
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { use, useState } from "react";
import styled from "styled-components";
import './Sidebar.css'; // Falls du CSS für die Seitenleiste nutzen möchtest
import { formatOpeningHoursLines, hydrateOpeningHours } from "./utils/openingHours";

const Sidebar = ({  shop, selectedOption, minPrice, maxPrice, isLoggedIn, userId, onSelect, onClose }) => {
  const [shopDetails, setShopDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPriceForm, setShowPriceForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const apiUrl = process.env.REACT_APP_API_BASE_URL;


  if (!shop) return null;
  console.log(shop);

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

  const shopPrice = selectedOption === "Softeis" ? shop.softeis_preis :
    selectedOption === "Alle" && shop.kugel_preis == null && shop.softeis_preis !== null ? shop.softeis_preis :
      shop.kugel_preis;
  const backgroundColor = getColorBasedOnPrice(shopPrice, minPrice, maxPrice);
  const displayPrice = selectedOption === "Softeis" ? `${Number(shop.softeis_preis).toFixed(2)} €` :
    shop.kugel_preis !== null ? `${Number(shop.kugel_preis).toFixed(2)} €` :
      selectedOption === "Alle" && shop.kugel_preis == null && shop.softeis_preis !== null ? `${Number(shop.softeis_preis).toFixed(2)} €` : '?';
  const hydratedOpeningHours = hydrateOpeningHours(
    shopDetails?.eisdiele?.openingHoursStructured,
    shopDetails?.eisdiele?.opening_hours_note || ""
  );
  let displayOpeningHours = formatOpeningHoursLines(hydratedOpeningHours);
  if (!displayOpeningHours.length && shopDetails?.eisdiele?.openingHours) {
    displayOpeningHours = shopDetails.eisdiele.openingHours.split(";").map((part) => part.trim());
  }

  const fetchShopDetails = async () => {
    if (shopDetails || loading) return;

    setLoading(true);
    try {
      console.log(`Fetching details for shop ID: ${shop.eisdielen_id}`);
      const response = await fetch(`${apiUrl}/get_eisdiele.php?eisdiele_id=${shop.eisdielen_id}`);

      // Checke, ob die Antwort wirklich JSON ist
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text(); // HTML-Fehlermeldung ausgeben
        throw new Error(`Invalid JSON response: ${text}`);
      }
      const data = await response.json();
      console.log(data);
      setShopDetails(data);
    } catch (error) {
      console.error("Fehler beim Laden der Daten:", error);
    } finally {
      setLoading(false);
    }
  };

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
    } else if (diffInDays == 0)
      return 'Vor < 24 Stunden';
    else {
      return `Vor ${diffInDays} Tag${diffInDays > 1 ? 'en' : ''}`;
    }
  };

  return (
    <>
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
          click: (e) => {
            fetchShopDetails();
            onSelect && onSelect(shop); // Falls onSelect existiert, rufe es auf
          },
        }}
      ></Marker>
      <div className="sidebar">
        <button className="close-btn" onClick={onClose}>×</button>
        <h2>{shop.eisdielen_name}</h2>
            {loading ? (
              <p>Lädt...</p>
            ) : shopDetails ? (
              <>
                <p><b>Adresse:</b> {shopDetails.eisdiele.adresse}</p>
                <div>
                  <h3>Öffnungszeiten:</h3>
                  {typeof shopDetails?.eisdiele?.is_open_now === 'boolean' && (
                    <OpenBadge $open={shopDetails.eisdiele.is_open_now}>
                      {shopDetails.eisdiele.is_open_now ? 'Jetzt geöffnet' : 'Geschlossen'}
                    </OpenBadge>
                  )}
                  {displayOpeningHours.length > 0 ? (
                    displayOpeningHours.map((part, index) => (
                      <div key={index}>{part}</div>
                    ))
                  ) : (
                    <div>Keine Öffnungszeiten hinterlegt</div>
                  )}
                </div>
                {(shopDetails.preise.kugel != null || shopDetails.preise.softeis != null) && (<h3>Preise:</h3>)}
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
                  <div><h3>Bewertungen:</h3>
                    <div><b>Geschmack:</b> {shopDetails.bewertungen.geschmack ? shopDetails.bewertungen.geschmack : '-'} / 5</div>
                    <div><b>Kugelgröße:</b> {shopDetails.bewertungen.kugelgroesse ? shopDetails.bewertungen.kugelgroesse : '-'} / 5</div>
                    <div><b>Waffel:</b> {shopDetails.bewertungen.waffel ? shopDetails.bewertungen.waffel : '-'} / 5</div>
                    <div><b>Auswahl:</b> ~ {shopDetails.bewertungen.auswahl ? shopDetails.bewertungen.auswahl : '?'} Sorten</div>
                    {shopDetails.attribute && <div><b>Nutzer loben besonders:</b> {shopDetails.attribute.map(attribute => `${attribute.name} x ${attribute.anzahl}`).join(', ')}</div>}
                  </div>
                )}
                {isLoggedIn && (<button onClick={() => setShowReviewForm(true)}>Eisdiele bewerten</button>)}
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
    </>
  );
};

export default Sidebar;

const OpenBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2rem 0.6rem;
  margin-bottom: 0.35rem;
  font-size: 0.8rem;
  font-weight: 600;
  border-radius: 999px;
  color: ${({ $open }) => ($open ? '#0f5132' : '#6c757d')};
  background: ${({ $open }) => ($open ? 'rgba(63, 177, 117, 0.2)' : 'rgba(108, 117, 125, 0.2)')};
`;
