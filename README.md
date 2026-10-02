# Emis DVDs

Verwalte deine heimische DVD-Sammlung im Hand-Drawn-Look – mit Abgleich gegen The Movie Database (TMDB).

## Features

- 📀 DVD-Sammlung als Cards (3 pro Reihe, beliebig viele)
- 📷 Barcode-Scan (EAN/UPC) per Kamera → Titel via UPCitemdb → TMDB-Trefferliste
- ➕ „Erstellen“-Button unten rechts → Pop-Up mit Titelsuche (manueller Fallback)
- 🎬 Abgleich mit der Movie Database (TMDB) inkl. Postern
- 🔖 EAN wird mit der TMDB-ID gespeichert – jeder Film muss nur einmal zugeordnet werden
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

### Lokal bauen und testen (Port 3020)

```bash
docker compose -f docker-compose.local.yml up -d --build
```

### Bauen und zu Docker Hub pushen

```bash
docker build -t schymon/emisdvds:latest . && docker push schymon/emisdvds:latest
```

### Homeserver (Coolify / docker compose)

Die `docker-compose.yml` nutzt das Image `schymon/emisdvds:latest`:

```bash
mkdir -p /opt/emisDvds
docker compose pull && docker compose up -d
```

Daten (Filme) liegen auf dem Host in `/opt/emisDvds`. `TMDB_API_KEY` in der Compose-Datei durch den echten Key ersetzen.

App: http://localhost:3020

## API Endpoints

| Method | Endpoint | Beschreibung |
|--------|----------|---------------|
| GET | `/api/dvds` | Alle DVDs laden |
| POST | `/api/dvds` | DVD aus TMDB-Ergebnis anlegen (optional mit `ean`) |
| PUT | `/api/dvds/:id` | Rating (0–5) ändern |
| DELETE | `/api/dvds/:id` | DVD löschen |
| GET | `/api/tmdb/search?q=...` | TMDB-Suche (Proxy) |
| GET | `/api/upc/lookup?code=...` | EAN → Titel (UPCitemdb-Proxy) |
| GET | `/health` | Health Check |

## Barcode-Scan

- Nutzt die native `BarcodeDetector`-API (Chrome/Android); auf iOS/Safari wird automatisch `@zxing/browser` als Fallback geladen (Lazy-Chunk, vergrößert das Hauptbundle nicht)
- **Kamera-Zugriff erfordert HTTPS** (oder `localhost`) – auf dem Homeserver also hinter einen Reverse-Proxy mit TLS
- Der UPCitemdb-**Trial-Endpoint** ist rate-limited (~100 Anfragen/Stunde/IP). Für mehr: eigenen API-Key holen und den Endpoint in `server.ts` auf `https://api.upcitemdb.com/prod/lookup` umstellen

## Ordnerstruktur

```
├── src/
│   ├── components/   # DvdGrid, DvdList, DvdCard, StarRating, Dialoge, BarcodeScanner, FabButton
│   ├── data/         # dvds.json (Sammlungsdaten)
│   ├── types/        # TypeScript Typen
│   └── lib/          # API-Wrapper
├── server.ts         # Express Backend + TMDB-Proxy
├── docker-compose.yml
└── Dockerfile
```
