# Detaillierte Eisdiele-Seite - Architekturplan

## Übersicht

Erstellung einer dedizierten Detailseite für jede Eisdiele als erweiterte Ansicht des bestehenden `ShopDetailsView`. Die neue Seite bietet umfassendere Informationen und Analysen.

## Architektur

### 1. Neue Route
```
/shop/:shopId - Detaillierte Eisdiele-Seite
```

### 2. Neue Dateien

#### Frontend
- `src/pages/EisdielePage.jsx` - Hauptkomponente für die Detailseite
- `src/components/PriceHistoryChart.jsx` - Preisverlauf-Diagramm
- `src/components/ShopMiniMap.jsx` - Kleiner Kartenausschnitt

#### Backend
- `backend/get_eisdiele_details.php` - Erweiterte API für alle Shop-Details

---

## Seitenstruktur

### Block 1: Allgemeine Informationen
```
┌─────────────────────────────────────────────────────────────┐
│  [Name der Eisdiele]                    [Favorit] [Teilen]  │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  │  Adresse: Musterstraße 1, 12345   │
│  │                  │  │  Status: ● Geöffnet / Saisonal    │
│  │   Mini-Karte     │  │  Website: www.example.com         │
│  │   (Leaflet)      │  │                                   │
│  │                  │  │  Öffnungszeiten:                  │
│  └──────────────────┘  │  Mo-Fr: 12-18 Uhr                 │
│                        │  Sa-So: 11-19 Uhr                 │
│                        │  Hinweis: Bei schönem Wetter...   │
└─────────────────────────────────────────────────────────────┘
```

**Datenquellen:**
- `eisdielen` Tabelle: name, adresse, website, latitude, longitude, status, reopening_date
- `eisdiele_opening_hours` Tabelle: Strukturierte Öffnungszeiten
- `laender`, `bundeslaender`, `landkreise`: Regionale Zuordnung

### Block 2: Aktuelle Preise
```
┌─────────────────────────────────────────────────────────────┐
│  Aktuelle Preise                                            │
├─────────────────────────────────────────────────────────────┤
│  🍦 Kugeleis:    1,70 € (Premium: 2,00 €)                   │
│                  Zuletzt aktualisiert: vor 3 Tagen          │
│                                                             │
│  🍦 Softeis:     2,00 € (Klein) / 3,50 € (Groß)            │
│                  Zuletzt aktualisiert: vor 1 Woche          │
│                                                             │
│  [Preis melden / bestätigen]                                │
└─────────────────────────────────────────────────────────────┘
```

**Datenquellen:**
- `preise` Tabelle: typ, preis, beschreibung, gemeldet_am, waehrung_id

### Block 3: Bewertungsübersicht
```
┌─────────────────────────────────────────────────────────────┐
│  Bewertungen                                                │
├─────────────────────────────────────────────────────────────┤
│  Kugeleis:   ★★★★☆ 4.2  (basierend auf 45 Check-ins)       │
│  Softeis:    ★★★★★ 4.8  (basierend auf 12 Check-ins)       │
│  Eisbecher:  ★★★☆☆ 3.5  (basierend auf 8 Check-ins)        │
│                                                             │
│  Durchschnittliche Auswahl: ~25 Sorten                      │
│                                                             │
│  Attribute:                                                 │
│  [Vegane Optionen: 15x] [Hausgemacht: 12x] [Sitzplätze: 8x] │
│                                                             │
│  [Eisdiele bewerten]                                        │
└─────────────────────────────────────────────────────────────┘
```

**Datenquellen:**
- `kugel_scores`, `softeis_scores`, `eisbecher_scores` Views
- `checkins` Tabelle: Anzahl pro Typ
- `bewertungen` Tabelle: auswahl
- `bewertung_attribute` + `attribute` Tabellen

### Block 4: Preisverlauf (Chart)
```
┌─────────────────────────────────────────────────────────────┐
│  Preisverlauf                          [Kugeleis ▼]         │
├─────────────────────────────────────────────────────────────┤
│  2.00€ ┤                                    ╭───            │
│  1.80€ ┤                        ╭───────────╯               │
│  1.60€ ┤        ╭───────────────╯                           │
│  1.40€ ┤────────╯                                           │
│        └────────────────────────────────────────────────    │
│         2023      2024       2025       2026                │
└─────────────────────────────────────────────────────────────┘
```

**Datenquellen:**
- `preise` Tabelle: Historische Preisdaten mit `gemeldet_am` und `first_time_reported`

**SQL-Query für Preisverlauf:**
```sql
SELECT 
    typ,
    preis,
    COALESCE(first_time_reported, gemeldet_am) AS datum,
    waehrung_id
FROM preise
WHERE eisdiele_id = ?
ORDER BY datum ASC
```

### Block 5: Beliebte Eissorten
```
┌─────────────────────────────────────────────────────────────┐
│  Beliebte Eissorten bei dieser Eisdiele                     │
├─────────────────────────────────────────────────────────────┤
│  Meistgegessen:                  Bestbewertet:              │
│  1. Schokolade (45x) ★4.5       1. Pistazie ★4.9 (12x)     │
│  2. Vanille (38x) ★4.3          2. Stracciatella ★4.8 (25x)│
│  3. Erdbeere (32x) ★4.2         3. Mango ★4.7 (18x)        │
│  4. Stracciatella (25x) ★4.8    4. Schokolade ★4.5 (45x)   │
│  5. Pistazie (12x) ★4.9         5. Vanille ★4.3 (38x)      │
│  [Alle anzeigen]                [Alle anzeigen]             │
└─────────────────────────────────────────────────────────────┘
```

**Datenquellen:**
- `checkin_sorten` + `checkins` Tabellen

**SQL-Query für beliebte Sorten:**
```sql
-- Meistgegessen
SELECT 
    cs.sortenname,
    COUNT(*) AS anzahl,
    AVG(cs.bewertung) AS durchschnittsbewertung
FROM checkin_sorten cs
JOIN checkins c ON cs.checkin_id = c.id
WHERE c.eisdiele_id = ?
GROUP BY cs.sortenname
ORDER BY anzahl DESC, durchschnittsbewertung DESC
LIMIT 10

-- Bestbewertet (min. 3 Bewertungen)
SELECT 
    cs.sortenname,
    COUNT(*) AS anzahl,
    AVG(cs.bewertung) AS durchschnittsbewertung
FROM checkin_sorten cs
JOIN checkins c ON cs.checkin_id = c.id
WHERE c.eisdiele_id = ?
GROUP BY cs.sortenname
HAVING COUNT(*) >= 3
ORDER BY durchschnittsbewertung DESC, anzahl DESC
LIMIT 10
```

### Block 6: Statistiken
```
┌─────────────────────────────────────────────────────────────┐
│  Statistiken                                                │
├─────────────────────────────────────────────────────────────┤
│  Gesamt Check-ins: 127        Verschiedene Besucher: 45     │
│  Kugeleis: 89 | Softeis: 28 | Eisbecher: 10                │
│                                                             │
│  Anreise-Verteilung:                                        │
│  [PIE CHART: Auto 45%, Fahrrad 30%, Zu Fuß 20%, ÖPNV 5%]   │
│                                                             │
│  Erster Check-in: 14.03.2025                               │
│  Letzter Check-in: 15.01.2026                              │
└─────────────────────────────────────────────────────────────┘
```

**Datenquellen:**
- `checkins` Tabelle: typ, anreise, datum, nutzer_id

### Block 7: Check-ins (Tab)
```
┌─────────────────────────────────────────────────────────────┐
│  [Info] [Check-ins (127)] [Bewertungen (23)] [Routen (5)]   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  │ [Avatar] Username · vor 2 Stunden                   │    │
│  │ 🍦 Kugeleis: Schokolade ★★★★★, Vanille ★★★★☆       │    │
│  │ "Super leckeres Eis, große Kugeln!"                 │    │
│  │ [Bild] [Bild]                                       │    │
│  │ ❤️ 5  💬 2                                          │    │
│  └─────────────────────────────────────────────────────┘    │
│  [Mehr laden...]                                            │
│                                                             │
│  [Eis-Besuch einchecken]                                    │
└─────────────────────────────────────────────────────────────┘
```

### Block 8: Bewertungen (Tab)
```
┌─────────────────────────────────────────────────────────────┐
│  [Info] [Check-ins (127)] [Bewertungen (23)] [Routen (5)]   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  │ [Avatar] Username · 15.01.2026                      │    │
│  │ Kugeleis: ★★★★☆  Softeis: ★★★★★  Auswahl: ~30      │    │
│  │ "Tolle Eisdiele mit großer Auswahl..."              │    │
│  │ Attribute: [Vegane Optionen] [Hausgemacht]          │    │
│  │ ❤️ 3  💬 1                                          │    │
│  └─────────────────────────────────────────────────────┘    │
│  [Mehr laden...]                                            │
└─────────────────────────────────────────────────────────────┘
```

### Block 9: Routen (Tab)
```
┌─────────────────────────────────────────────────────────────┐
│  [Info] [Check-ins (127)] [Bewertungen (23)] [Routen (5)]   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 🚴 Radtour zur Eisdiele                             │    │
│  │ 25 km · Mittelschwer · Komoot                       │    │
│  │ Von: Username                                        │    │
│  │ [Route öffnen]                                       │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  [Neue Route einreichen]                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## API-Design

### Neuer Endpoint: `get_eisdiele_details.php`

**Request:**
```
GET /api/get_eisdiele_details.php?eisdiele_id=123
```

**Response:**
```json
{
  "eisdiele": {
    "id": 123,
    "name": "Eiscafé Eis-Zapfen",
    "adresse": "Uhlichstraße 18, 09112 Chemnitz",
    "website": "https://...",
    "latitude": 50.837021,
    "longitude": 12.904737,
    "status": "open",
    "reopening_date": null,
    "land": "Deutschland",
    "bundesland": "Sachsen",
    "landkreis": "Chemnitz",
    "waehrung_symbol": "€",
    "openingHoursStructured": {...},
    "opening_hours_note": "Bei schönem Wetter...",
    "is_open_now": true
  },
  "preise": {
    "kugel": {
      "preis": 1.70,
      "beschreibung": "Premiumsorten 2.00€",
      "letztes_update": "2025-10-19",
      "waehrung_symbol": "€"
    },
    "softeis": {...}
  },
  "preis_historie": [
    {"typ": "kugel", "preis": 1.50, "datum": "2024-03-14"},
    {"typ": "kugel", "preis": 1.60, "datum": "2024-10-01"},
    {"typ": "kugel", "preis": 1.70, "datum": "2025-10-19"}
  ],
  "scores": {
    "kugel": 4.2,
    "softeis": 4.8,
    "eisbecher": 3.5
  },
  "statistiken": {
    "gesamt_checkins": 127,
    "verschiedene_besucher": 45,
    "checkins_nach_typ": {
      "Kugel": 89,
      "Softeis": 28,
      "Eisbecher": 10
    },
    "anreise_verteilung": [
      {"anreise": "Auto", "anzahl": 57},
      {"anreise": "Fahrrad", "anzahl": 38},
      {"anreise": "Zu Fuß", "anzahl": 25},
      {"anreise": "ÖPNV", "anzahl": 7}
    ],
    "erster_checkin": "2025-03-14",
    "letzter_checkin": "2026-01-15"
  },
  "beliebte_sorten": {
    "meistgegessen": [
      {"sortenname": "Schokolade", "anzahl": 45, "bewertung": 4.5},
      {"sortenname": "Vanille", "anzahl": 38, "bewertung": 4.3}
    ],
    "bestbewertet": [
      {"sortenname": "Pistazie", "anzahl": 12, "bewertung": 4.9},
      {"sortenname": "Stracciatella", "anzahl": 25, "bewertung": 4.8}
    ]
  },
  "bewertungen": {
    "auswahl": 25
  },
  "attribute": [
    {"name": "Vegane Optionen", "anzahl": 15},
    {"name": "Hausgemacht", "anzahl": 12}
  ],
  "reviews": [...],
  "checkins": [...],
  "routen": [...]
}
```

---

## Zusätzliche Features (Vorschläge)

### 1. Fotogalerie
- Sammlung aller Bilder aus Check-ins
- Lightbox-Ansicht
- Filter nach Eissorte

### 2. Ähnliche Eisdielen
- Basierend auf Region
- Basierend auf Preisniveau
- Basierend auf Bewertung

### 3. Persönliche Statistiken (für eingeloggte User)
- "Deine Besuche bei dieser Eisdiele"
- Deine Lieblingssorten hier
- Letzter Besuch

### 4. Saisonale Informationen
- Wiedereröffnungsdatum bei saisonaler Schließung
- Countdown bis Wiedereröffnung

### 5. Navigation
- "Route hierher" Button (Google Maps / Apple Maps)
- Entfernung vom aktuellen Standort

### 6. Social Features
- Teilen-Button (WhatsApp, Twitter, etc.)
- "Freunde einladen" für Gruppenbesuche

### 7. Benachrichtigungen
- "Benachrichtigen wenn wieder geöffnet"
- "Benachrichtigen bei Preisänderung"

### 8. Vergleichsfunktion
- "Mit anderen Eisdielen vergleichen"
- Preis-Leistungs-Vergleich in der Region

---

## Technische Implementierung

### Frontend-Komponenten

```jsx
// src/pages/EisdielePage.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../Header';
import ShopMiniMap from '../components/ShopMiniMap';
import PriceHistoryChart from '../components/PriceHistoryChart';
import CheckinCard from '../components/CheckinCard';
import ReviewCard from '../components/ReviewCard';
import RouteCard from '../components/RouteCard';
import FavoritenButton from '../components/FavoritButton';
import ShareIcon from '../components/ShareButton';
import CheckinForm from '../CheckinForm';
import SubmitPriceModal from '../SubmitPriceModal';
import SubmitReviewModal from '../SubmitReviewModal';
// ... weitere Imports

const EisdielePage = () => {
  const { shopId } = useParams();
  const [shopData, setShopData] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  // ... State für Modals
  
  // Fetch shop details
  useEffect(() => {
    fetchShopDetails(shopId);
  }, [shopId]);
  
  return (
    <FullPage>
      <Header />
      <PageContent>
        {/* General Info Block */}
        <InfoSection>
          <ShopMiniMap lat={shopData.eisdiele.latitude} lng={shopData.eisdiele.longitude} />
          <ShopInfo>...</ShopInfo>
        </InfoSection>
        
        {/* Prices Block */}
        <PricesSection>...</PricesSection>
        
        {/* Ratings Block */}
        <RatingsSection>...</RatingsSection>
        
        {/* Price History Chart */}
        <PriceHistoryChart data={shopData.preis_historie} />
        
        {/* Popular Flavors */}
        <FlavorsSection>...</FlavorsSection>
        
        {/* Statistics */}
        <StatisticsSection>...</StatisticsSection>
        
        {/* Tabs: Check-ins, Reviews, Routes */}
        <TabsSection>...</TabsSection>
      </PageContent>
    </FullPage>
  );
};
```

### Verwendete Libraries
- **Recharts**: Für Preisverlauf-Chart (bereits im Projekt verwendet)
- **Leaflet/React-Leaflet**: Für Mini-Karte (bereits im Projekt verwendet)
- **styled-components**: Für Styling (bereits im Projekt verwendet)

---

## Routing-Änderungen

```jsx
// src/App.jsx
import EisdielePage from './pages/EisdielePage';

// In Routes:
<Route path="/shop/:shopId" element={<EisdielePage />} />
```

---

## Verlinkung

### Von ShopDetailsView zur Detailseite
```jsx
// In ShopDetailsView.jsx
<Link to={`/shop/${shopData.eisdiele.id}`}>
  Zur Detailseite →
</Link>
```

### Von Karte zur Detailseite
- Klick auf Marker öffnet weiterhin ShopDetailsView
- Button in ShopDetailsView führt zur Detailseite

---

## Zusammenfassung der Aufgaben

1. **Backend**: `get_eisdiele_details.php` erstellen
   - Erweiterte Datenabfrage
   - Preisverlauf-Historie
   - Sortenstatistiken
   - Anreise-Verteilung

2. **Frontend**: `EisdielePage.jsx` erstellen
   - Responsive Layout
   - Alle Informationsblöcke
   - Tab-Navigation
   - Action-Buttons

3. **Komponenten**: 
   - `PriceHistoryChart.jsx` (Recharts LineChart)
   - `ShopMiniMap.jsx` (Leaflet Mini-Karte)

4. **Routing**: Route in `App.jsx` hinzufügen

5. **Verlinkung**: Von ShopDetailsView zur neuen Seite
