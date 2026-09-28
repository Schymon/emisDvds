# Emis DVDs

Verwalte deine heimische DVD-Sammlung im Hand-Drawn-Look – mit Abgleich gegen The Movie Database (TMDB).

## Features

- 📀 DVD-Sammlung als Cards (3 pro Reihe, beliebig viele)
- ➕ „Erstellen“-Button unten rechts → Pop-Up mit Titelsuche
- 🎬 Abgleich mit der Movie Database (TMDB) inkl. Postern
- ⭐ Bewertung von 0–5 Sternen direkt auf der Card
- 🗑️ Löschen mit Bestätigungsdialog
- 💾 Alle Einträge in einer JSON-Datei (`src/data/dvds.json`)

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **UI-Library:** [drawably](https://www.npmjs.com/package/drawably) (Hand-drawn UI Controls)
- **Layout:** Tailwind CSS
- **Backend:** Express.js (Node.js), TMDB-Proxy (API-Key bleibt serverseitig)
- **Container:** Docker

## Setup

```bash
npm install
cp .env.example .env   # TMDB_API_KEY eintragen
npm run dev            # Vite auf :5173, API-Server auf :3004
```

Production:

```bash
npm run build && npm start
```

## Docker

Daten liegen auf dem Host in `/opt/emisDvds` (Bind-Mount nach `/app/src/data`), Container erreichbar über Port **3020**.

```bash
mkdir -p /opt/emisDvds
TMDB_API_KEY=dein_key docker compose up -d --build
```

App: http://localhost:3020

## API Endpoints

| Method | Endpoint | Beschreibung |
|--------|----------|---------------|
| GET | `/api/dvds` | Alle DVDs laden |
| POST | `/api/dvds` | DVD aus TMDB-Ergebnis anlegen |
| PUT | `/api/dvds/:id` | Rating (0–5) ändern |
| DELETE | `/api/dvds/:id` | DVD löschen |
| GET | `/api/tmdb/search?q=...` | TMDB-Suche (Proxy) |
| GET | `/health` | Health Check |

## Ordnerstruktur

```
├── src/
│   ├── components/   # DvdGrid, DvdCard, StarRating, Dialoge, FabButton
│   ├── data/         # dvds.json (Sammlungsdaten)
│   ├── types/        # TypeScript Typen
│   └── lib/          # API-Wrapper
├── server.ts         # Express Backend + TMDB-Proxy
├── docker-compose.yml
└── Dockerfile
```
