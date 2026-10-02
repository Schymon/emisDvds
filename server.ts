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
  mediaType?: 'movie' | 'tv'
  ean?: string | null
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
  const { tmdbId, title, originalTitle, year, posterPath, overview, ean } = req.body || {}
  const mediaType: 'movie' | 'tv' = req.body?.mediaType === 'tv' ? 'tv' : 'movie'
  if (!title || tmdbId == null) {
    res.status(400).json({ error: 'title und tmdbId sind erforderlich' })
    return
  }
  const dvds = getDvds()
  if (dvds.some((d) => d.tmdbId === tmdbId && (d.mediaType || 'movie') === mediaType)) {
    res.status(409).json({ error: 'Eintrag ist bereits in der Sammlung' })
    return
  }
  if (ean && dvds.some((d) => d.ean === ean)) {
    res.status(409).json({ error: 'Diese EAN ist bereits in der Sammlung' })
    return
  }
  const dvd: Dvd = {
    id: crypto.randomUUID(),
    tmdbId,
    mediaType,
    ean: ean ? String(ean) : null,
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

function cleanUpcTitle(title: string): string {
  return title
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

app.get('/api/upc/lookup', async (req, res) => {
  const code = String(req.query.code || '').trim()
  if (!/^\d{8,14}$/.test(code)) {
    res.status(400).json({ error: 'Ungültiger Barcode' })
    return
  }
  try {
    const response = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${code}`)
    if (response.status === 404) {
      res.json({ title: null })
      return
    }
    if (!response.ok && response.status !== 400) {
      res.status(502).json({ error: `UPCitemdb-Antwort fehlgeschlagen (${response.status})` })
      return
    }
    const data = await response.json()
    const item = (data.items || [])[0]
    if (data.code !== 'OK' || !item?.title) {
      res.json({ title: null })
      return
    }
    res.json({ title: cleanUpcTitle(item.title) })
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'UPCitemdb-Suche fehlgeschlagen' })
  }
})

app.get('/api/tmdb/search', async (req, res) => {
  const query = String(req.query.q || '').trim()
  const typeParam = String(req.query.type || 'movie')
  const type: 'movie' | 'tv' | 'all' =
    typeParam === 'tv' ? 'tv' : typeParam === 'all' ? 'all' : 'movie'
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
    interface TmdbEntry {
      id: number
      title?: string
      name?: string
      original_title?: string
      original_name?: string
      release_date?: string
      first_air_date?: string
      poster_path?: string | null
      overview?: string
      popularity?: number
    }
    const fetchTmdb = async (endpoint: 'search/movie' | 'search/tv'): Promise<TmdbEntry[]> => {
      const url = `${TMDB_BASE}/${endpoint}?language=de-DE&query=${encodeURIComponent(query)}&include_adult=false${isBearerToken ? '' : `&api_key=${TMDB_API_KEY}`}`
      const response = await fetch(url, {
        headers: isBearerToken ? { Authorization: `Bearer ${TMDB_API_KEY}` } : {},
      })
      if (!response.ok) {
        throw new Error(`TMDB-Antwort fehlgeschlagen (${response.status})`)
      }
      const data = await response.json()
      return (data.results || []) as TmdbEntry[]
    }
    const endpoints: Array<'search/movie' | 'search/tv'> =
      type === 'all' ? ['search/movie', 'search/tv'] : type === 'tv' ? ['search/tv'] : ['search/movie']
    const lists = await Promise.all(endpoints.map(fetchTmdb))
    const raw: Array<TmdbEntry & { kind: 'movie' | 'tv' }> = lists
      .map((list, i) => list.map((m) => ({ ...m, kind: endpoints[i] === 'search/tv' ? 'tv' as const : 'movie' as const })))
      .flat()
    if (type === 'all') {
      raw.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
    }
    const results = raw.slice(0, 20).map((m) => ({
      tmdbId: m.id,
      mediaType: m.kind,
      title: m.title || m.name || '',
      originalTitle: m.original_title || m.original_name || '',
      year: String(m.release_date || m.first_air_date || '').slice(0, 4),
      posterPath: m.poster_path ?? null,
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
