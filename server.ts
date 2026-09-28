import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import fs from 'fs-extra'
import path from 'path'
import crypto from 'crypto'

const app = express()
const PORT = Number(process.env.PORT) || 3004
const TMDB_API_KEY = process.env.TMDB_API_KEY || ''
const DATA_DIR = path.join(__dirname, '..', 'src', 'data')
const DVDS_FILE = path.join(DATA_DIR, 'dvds.json')
const TMDB_BASE = 'https://api.themoviedb.org/3'

app.use(cors())
app.use(express.json())

const DIST_DIR = path.join(__dirname, '..', 'dist')
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR))
}

interface Dvd {
  id: string
  tmdbId: number
  title: string
  originalTitle?: string
  year?: string
  posterPath?: string | null
  overview?: string
  rating: number
  createdAt: string
}

function ensureDataDir() {
  fs.ensureDirSync(DATA_DIR)
  if (!fs.existsSync(DVDS_FILE)) {
    fs.writeJsonSync(DVDS_FILE, [], { spaces: 2 })
  }
}

function getDvds(): Dvd[] {
  ensureDataDir()
  try {
    return fs.readJsonSync(DVDS_FILE)
  } catch {
    return []
  }
}

function saveDvds(dvds: Dvd[]) {
  ensureDataDir()
  fs.writeJsonSync(DVDS_FILE, dvds, { spaces: 2 })
}

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/api/dvds', (_req, res) => {
  res.json(getDvds())
})

app.post('/api/dvds', (req, res) => {
  const { tmdbId, title, originalTitle, year, posterPath, overview } = req.body || {}
  if (!title || tmdbId == null) {
    res.status(400).json({ error: 'title und tmdbId sind erforderlich' })
    return
  }
  const dvds = getDvds()
  if (dvds.some((d) => d.tmdbId === tmdbId)) {
    res.status(409).json({ error: 'Film ist bereits in der Sammlung' })
    return
  }
  const dvd: Dvd = {
    id: crypto.randomUUID(),
    tmdbId,
    title,
    originalTitle,
    year,
    posterPath: posterPath ?? null,
    overview: overview ?? '',
    rating: 0,
    createdAt: new Date().toISOString(),
  }
  dvds.push(dvd)
  saveDvds(dvds)
  res.status(201).json(dvd)
})

app.put('/api/dvds/:id', (req, res) => {
  const dvds = getDvds()
  const idx = dvds.findIndex((d) => d.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ error: 'Eintrag nicht gefunden' })
    return
  }
  const { rating } = req.body || {}
  if (typeof rating !== 'number' || rating < 0 || rating > 5) {
    res.status(400).json({ error: 'rating muss eine Zahl zwischen 0 und 5 sein' })
    return
  }
  dvds[idx] = { ...dvds[idx], rating }
  saveDvds(dvds)
  res.json(dvds[idx])
})

app.delete('/api/dvds/:id', (req, res) => {
  const dvds = getDvds()
  const next = dvds.filter((d) => d.id !== req.params.id)
  if (next.length === dvds.length) {
    res.status(404).json({ error: 'Eintrag nicht gefunden' })
    return
  }
  saveDvds(next)
  res.json({ ok: true })
})

app.get('/api/tmdb/search', async (req, res) => {
  const query = String(req.query.q || '').trim()
  if (!query) {
    res.json({ results: [] })
    return
  }
  if (!TMDB_API_KEY) {
    res.status(500).json({ error: 'TMDB_API_KEY ist auf dem Server nicht konfiguriert' })
    return
  }
  try {
    const isBearerToken = TMDB_API_KEY.startsWith('eyJ')
    const url = `${TMDB_BASE}/search/movie?language=de-DE&query=${encodeURIComponent(query)}&include_adult=false${isBearerToken ? '' : `&api_key=${TMDB_API_KEY}`}`
    const response = await fetch(url, {
      headers: isBearerToken ? { Authorization: `Bearer ${TMDB_API_KEY}` } : {},
    })
    if (!response.ok) {
      res.status(502).json({ error: `TMDB-Antwort fehlgeschlagen (${response.status})` })
      return
    }
    const data = await response.json()
    interface TmdbMovie {
      id: number
      title: string
      original_title: string
      release_date?: string
      poster_path?: string | null
      overview?: string
    }
    const results = ((data.results || []) as TmdbMovie[]).slice(0, 20).map((m) => ({
      tmdbId: m.id,
      title: m.title,
      originalTitle: m.original_title,
      year: m.release_date ? String(m.release_date).slice(0, 4) : '',
      posterPath: m.poster_path,
      overview: m.overview || '',
    }))
    res.json({ results })
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unbekannter Fehler bei der TMDB-Suche' })
  }
})

app.listen(PORT, () => {
  console.log(`[emis-dvds] Server läuft auf Port ${PORT}`)
})
