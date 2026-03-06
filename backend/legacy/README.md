# Legacy Endpoints

Dieser Ordner enthält alte Endpunkt-Implementierungen, die nur noch über Wrapper
unter `backend/*.php` erreichbar sind.

Zweck:
- externe Kompatibilität in der Übergangsphase
- saubere Trennung zwischen neuer Modulstruktur und Altlogik

Geplante Ablösung:
1. Monitoring auf Aufrufe der Wrapper
2. Umstellung auf `/api/v2/*`
3. Entfernen der Wrapper und Legacy-Dateien
