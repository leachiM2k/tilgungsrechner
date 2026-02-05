# Baukredit Tilgungsrechner

Ein interaktiver Tilgungsrechner für Baukredite mit Unterstützung für Sondertilgungen und verschiedene Berechnungsmethoden.

## Live Demo

Die Anwendung ist als statische Webseite verfügbar und kann direkt im Browser verwendet werden.

## Features

- 📊 Detaillierte Tilgungspläne mit monatlicher Aufschlüsselung
- 💰 Zwei Berechnungsmethoden:
  - Feste monatliche Rate
  - Anfänglicher Tilgungssatz
- 🎯 Sondertilgungen zu beliebigen Zeitpunkten
- 📈 Übersichtliche Zusammenfassung mit Gesamtkosten
- 🎨 Moderne, responsive Benutzeroberfläche
- 📱 Optimiert für Desktop und Mobile

## Verwendung

### Online

Öffnen Sie einfach die `index.html` in Ihrem Browser oder besuchen Sie die GitHub Pages URL.

### Lokal

```bash
# Repository klonen
git clone https://github.com/[IHR-USERNAME]/kredit_rechner.git
cd kredit_rechner

# index.html im Browser öffnen
open index.html
```

## Python-Version

Zusätzlich zur Web-Anwendung gibt es eine Python-basierte CLI-Version:

```bash
# Abhängigkeiten installieren
pip install pandas python-dateutil

# Rechner ausführen
python3 kredit_rechner.py
```

Die Konfiguration erfolgt direkt im Python-Script durch Anpassung der Konstanten am Ende der Datei.

## Projektstruktur

```
.
├── index.html           # Haupt-HTML-Datei
├── styles.css          # Stylesheet
├── script.js           # JavaScript-Logik
├── kredit_rechner.py   # Python CLI-Version
└── README.md           # Diese Datei
```

## Technologie

- Vanilla JavaScript (keine Frameworks)
- CSS3 mit Flexbox & Grid
- Responsive Design
- Python 3 mit pandas (für CLI-Version)

## Lizenz

Dieses Projekt ist als Open Source verfügbar.
