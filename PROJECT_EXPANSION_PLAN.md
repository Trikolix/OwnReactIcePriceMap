# Projekt-Erweiterungsplan: Ice-App & Rad-App (Shared Codebase)

Dieser Plan beschreibt die Schritte zur Erweiterung der bestehenden Ice-App zu einer Multi-App-Plattform, die auch Radsport-Einkehrmöglichkeiten unterstützt.

## 1. Datenbank-Migration (SQL)

Erstelle eine Datei `backend/Database/rad_migration.sql` oder führe folgendes SQL in deiner Datenbank aus:

```sql
-- 1. Flag für Eisdielen, ob sie radfreundlich sind
ALTER TABLE `eisdielen` ADD COLUMN `is_bike_friendly` TINYINT(1) DEFAULT 0;

-- 2. Tabelle für andere Orte (Bäcker, Biergärten, etc.)
CREATE TABLE `rad_spots` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `adresse` varchar(255) DEFAULT NULL,
  `latitude` float(9,6) DEFAULT NULL,
  `longitude` float(9,6) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `description` text,
  `user_id` int NOT NULL,
  `erstellt_am` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_rad_spot_user` (`user_id`),
  CONSTRAINT `fk_rad_spot_user` FOREIGN KEY (`user_id`) REFERENCES `nutzer` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Typen für Rad-Stops
CREATE TABLE `rad_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `icon` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
);

INSERT INTO `rad_types` (`name`) VALUES ('Bäcker'), ('Café'), ('Biergarten'), ('Imbiss'), ('Supermarkt'), ('Trinkwasserstelle');

-- 4. Verknüpfung Rad-Spots zu Typen (n:m)
CREATE TABLE `rad_spot_has_types` (
  `rad_spot_id` int NOT NULL,
  `type_id` int NOT NULL,
  PRIMARY KEY (`rad_spot_id`, `type_id`),
  CONSTRAINT `fk_rsht_spot` FOREIGN KEY (`rad_spot_id`) REFERENCES `rad_spots` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rsht_type` FOREIGN KEY (`type_id`) REFERENCES `rad_types` (`id`) ON DELETE CASCADE
);

-- 5. Rad-Spezifische Attribute
CREATE TABLE `rad_attributes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
);

INSERT INTO `rad_attributes` (`name`) VALUES ('Fahrradständer'), ('E-Bike Ladestation'), ('Werkzeugstation'), ('Trinkflasche auffüllen erlaubt'), ('Sichtkontakt zum Rad');

-- 6. Polymorphe Verknüpfung von Attributen
CREATE TABLE `place_rad_attributes` (
  `place_id` int NOT NULL,
  `source_type` enum('eisdiele', 'rad_spot') NOT NULL,
  `attribute_id` int NOT NULL,
  PRIMARY KEY (`place_id`, `source_type`, `attribute_id`),
  CONSTRAINT `fk_pra_attr` FOREIGN KEY (`attribute_id`) REFERENCES `rad_attributes` (`id`) ON DELETE CASCADE
);
```

## 2. Frontend: Neuer AppContext

Erstelle `src/context/AppContext.jsx`:

```javascriptreact
import React, { createContext, useContext, useMemo } from 'react';

const AppContext = createContext();

export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const hostname = window.location.hostname;
  // Erkennung: Wenn 'rad' oder 'bike' in der Domain vorkommt -> Rad-App
  const isRadApp = hostname.includes('rad') || hostname.includes('bike');

  const config = useMemo(() => {
    if (isRadApp) {
      return {
        id: 'bike',
        name: 'Rad-Stop',
        themeColor: '#4CAF50',
        secondaryColor: '#81C784',
        apiEndpointMap: '/get_bike_map_data.php',
        logo: '/logo_bike.png',
        markerIconBase: 'bike-marker',
        showIceCreamSpecifics: false,
      };
    } else {
      return {
        id: 'ice',
        name: 'Ice-App',
        themeColor: '#ffb522',
        secondaryColor: '#ffe082',
        apiEndpointMap: '/get_all_eisdielen.php',
        logo: '/logo_ice.png',
        markerIconBase: 'ice-marker',
        showIceCreamSpecifics: true,
      };
    }
  }, [isRadApp]);

  return (
    <AppContext.Provider value={config}>
      {children}
    </AppContext.Provider>
  );
};
```

## 3. Frontend: Integration

1.  **`src/index.jsx`**: Wickle die App in den `AppProvider`.
2.  **`src/Header.jsx`**: Nutze `useApp()` um `themeColor` und `name` dynamisch zu setzen.

## 4. Backend: API Endpunkt

Erstelle `backend/get_bike_map_data.php` (Pseudocode):

```php
<?php
include 'db_connect.php';

// 1. Hole Eisdielen, die radfreundlich sind
$sqlIce = "SELECT id, name, latitude, longitude, 'eisdiele' as type, 'Eisdiele' as category_name FROM eisdielen WHERE is_bike_friendly = 1 AND status = 'open'";

// 2. Hole Rad-Spots
$sqlSpots = "SELECT s.id, s.name, s.latitude, s.longitude, 'rad_spot' as type, t.name as category_name FROM rad_spots s LEFT JOIN rad_spot_has_types rht ON s.id = rht.rad_spot_id LEFT JOIN rad_types t ON rht.type_id = t.id";
?>
```