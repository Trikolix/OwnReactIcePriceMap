# Codex Changes (2026-02-26)

Kurzüberblick über alle Änderungen, die in diesem Chat umgesetzt wurden.

## 1. E-Mail-Benachrichtigungen in `backend_dev` umleiten

Datei: `backend/lib/email_notification.php`

- Erkennung eingebaut, ob der Backend-Kontext unter `backend_dev` läuft
- In `backend_dev` werden E-Mails nur normal an `user_id = 1` gesendet
- Für andere Nutzer werden E-Mails an `ch_helbig@mail` umgeleitet
- Betreff wird mit `[DEV-Weiterleitung]` markiert
- E-Mail-Text enthält einen Hinweis auf die ursprünglich geplante Zieladresse

## 2. Cron-Script: Develop-Datenbank nachts aus Prod zurücksetzen

Datei: `backend/Skripte/cron_sync_dev_from_prod.php`

- CLI-Script erstellt für `prod -> dev` Datensync
- Liest DB-Zugangsdaten aus:
  - `backend/db_connect.php`
  - `backend_dev/db_connect.php`
- Löscht Daten in gemeinsamen Tabellen der Dev-DB und kopiert anschließend Daten aus Prod
- Sicherheitscheck: Abbruch, falls beide Konfigurationen auf dieselbe DB zeigen
- `--dry-run` und `--help` verfügbar

Hinweis:
- Daten-Sync, kein Schema-Sync (kein `DROP/CREATE`)

## 3. Awards-Adminseite beschleunigt (`backend/awards`)

### Backend: `get_awards.php` optimiert

Datei: `backend/awards/get_awards.php`

- N+1-Queries entfernt (früher pro Award ein zusätzlicher Query auf `award_levels`)
- Unnötige Dev-DB-Reads in `get_awards.php` entfernt
- Jetzt eine einzelne `LEFT JOIN`-Abfrage (`awards` + `award_levels`)
- JSON-Ausgabe serverseitig gecacht (Dateicache, TTL 5 Minuten)

### Cache-Helfer + Invalidation

Dateien:
- `backend/awards/awards_cache.php`
- `backend/awards/cache/.gitignore`

Änderungen:
- Lese-/Schreib-/Invalidierungsfunktionen für Awards-JSON-Cache
- Cache wird invalidiert bei Änderungen durch:
  - `backend/awards/add_award.php`
  - `backend/awards/add_award_level.php`
  - `backend/awards/save_award_level.php`

### Admin-Frontend Rendering optimiert

Datei: `backend/awards/index.php`

- Reduziert DOM-Operationen (ein Render-String statt viele `appendChild`)
- Event-Delegation statt `onclick='...JSON.stringify(...)'`
- `loading="lazy"` / `decoding="async"` für Icons
- `content-visibility: auto` für Award-Listenelemente

## 4. Award-Bilder optimiert (Bestandsbilder + neue Uploads)

Ziel:
- Große Award-Bilder (z. B. 1024x1024) nicht mehr direkt überall laden
- Stattdessen optimierte Variante mit max. 512px nutzen

### Backend: Variant-Generierung (WebP, max. 512px)

Datei: `backend/awards/award_icon_variants.php`

- Erzeugt aus einem bestehenden Award-Icon eine WebP-Variante
- Standard:
  - max. `512px`
  - WebP Qualität `82`
- Namensschema:
  - `uploads/.../icon.png` -> `uploads/.../icon__w512.webp`
- Unterstützt JPEG/PNG/WebP
- JPEG-EXIF-Orientierung wird berücksichtigt

### Neue/aktualisierte Uploads erzeugen Varianten automatisch

Dateien:
- `backend/awards/add_award_level.php`
- `backend/awards/save_award_level.php`

Änderungen:
- Nach Upload wird automatisch die `__w512.webp`-Variante erzeugt
- Beim Ersetzen eines vorhandenen Icons wird die alte 512er-Variante entfernt

### Migration bestehender Award-Bilder (aus Datenbank)

Datei: `backend/Skripte/migrate_award_icon_variants.php`

- CLI-Migrationsscript für bestehende Einträge in `award_levels.icon_path`
- Liest Icon-Pfade aus Prod und/oder Dev DB
- Erzeugt für alle vorhandenen Dateien die 512er-WebP-Variante

Optionen:
- `--db=prod|dev|both` (Standard: `both`)
- `--dry-run`
- `--force`
- `--limit=N`

Beispiele:

```bash
php backend/Skripte/migrate_award_icon_variants.php --dry-run
php backend/Skripte/migrate_award_icon_variants.php
php backend/Skripte/migrate_award_icon_variants.php --db=prod --force
```

Server-Voraussetzungen (CLI):
- `pdo_mysql`
- `gd` mit WebP-Unterstützung (`imagewebp`)

### Frontend: Bevorzugt 512er-Variante laden (mit Fallback)

Neue Datei:
- `src/utils/awardIcons.js`

Verwendet in:
- `src/components/AwardCard.jsx`
- `src/components/NewAwards.jsx`
- `src/pages/UserSite.jsx`

Verhalten:
- Frontend versucht zuerst `__w512.webp`
- Falls Datei (noch) nicht existiert: automatischer Fallback auf Originalbild
- `loading="lazy"` / `decoding="async"` aktiviert

## Test- / Prüfhinweise

Durchgeführt:
- `php -l` für geänderte PHP-Dateien (Syntaxprüfung)
- `--help` für neue CLI-Skripte

Nicht vollständig durchgeführt:
- Echter DB-Lauf der Migrations-/Sync-Skripte in dieser lokalen CLI-Umgebung (fehlendes `pdo_mysql`)
- Frontend-Build/Testlauf (wegen großem, bereits verändertem Worktree)

