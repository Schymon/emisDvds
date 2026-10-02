import { useState } from 'react'
import { Film, Loader2, Tv } from 'lucide-react'
import { DrawablyButton, DrawablyDivider, DrawablyInput } from 'drawably/react'
import type { ReactElement } from 'react'
import type { MediaType, TmdbSearchResult } from '@/types'
import { searchTmdb, lookupUpc, posterUrl } from '@/lib/api'
import { Modal } from './Modal'
import { BarcodeScanner } from './BarcodeScanner'

interface CreateDialogProps {
  existingTmdbIds: Set<string>
  onClose: () => void
  onCreate: (result: TmdbSearchResult, ean: string | null) => Promise<void>
}

export function CreateDialog({ existingTmdbIds, onClose, onCreate }: CreateDialogProps): ReactElement {
  const [mediaType, setMediaType] = useState<MediaType | 'all'>('all')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<TmdbSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [ean, setEan] = useState<string | null>(null)
  const [scanMsg, setScanMsg] = useState<string | null>(null)

  const runSearch = async (value: string, type: MediaType | 'all' = mediaType) => {
    setQuery(value)
    setError(null)
    if (value.trim().length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    try {
      const found = await searchTmdb(value.trim(), type)
      setResults(found)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Suche fehlgeschlagen')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const switchType = (next: MediaType) => {
    const target: MediaType | 'all' = mediaType === next ? 'all' : next
    setMediaType(target)
    if (query.trim().length >= 2) {
      void runSearch(query, target)
    } else {
      setResults([])
    }
  }

  const progressiveTmdbSearch = async (rawTitle: string, type: MediaType | 'all') => {
    const words = rawTitle.trim().split(/\s+/).slice(0, 6)
    if (words.length === 0) return
    setLoading(true)
    setError(null)
    try {
      for (let len = words.length; len >= 1; len--) {
        const q = words.slice(0, len).join(' ')
        setQuery(q)
        setScanMsg(`Suche TMDB mit „${q}“…`)
        const found = await searchTmdb(q, type)
        if (found.length > 0) {
          setResults(found)
          setScanMsg(`${found.length} Treffer für „${q}“`)
          return
        }
      }
      setResults([])
      setScanMsg('Kein TMDB-Treffer – bitte Titel manuell anpassen.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Suche fehlgeschlagen')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleDetected = async (code: string) => {
    setEan(code)
    setScanMsg(`EAN ${code} erkannt – Titel wird bei UPCitemdb gesucht…`)
    setError(null)
    try {
      const title = await lookupUpc(code)
      if (title) {
        await progressiveTmdbSearch(title, mediaType)
      } else {
        setScanMsg('Kein Titel über EAN gefunden – bitte Titel manuell eingeben.')
      }
    } catch (err) {
      setScanMsg(
        err instanceof Error
          ? `UPCitemdb nicht erreichbar (${err.message}) – bitte Titel manuell eingeben.`
          : 'UPCitemdb nicht erreichbar – bitte Titel manuell eingeben.',
      )
    }
  }

  const handleSelect = async (result: TmdbSearchResult) => {
    setSavingId(result.tmdbId)
    try {
      await onCreate(result, ean)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erstellen fehlgeschlagen')
      setSavingId(null)
    }
  }

  return (
    <Modal title="Neue DVD oder Serie hinzufügen" onClose={onClose}>
      <BarcodeScanner onDetected={handleDetected} onError={(msg) => setError(msg)} />

      <p className="mb-3 h-5 truncate text-sm text-neutral-600">{scanMsg}</p>

      <DrawablyDivider className="my-4" />

      <div className="mb-4 flex gap-2">
        <DrawablyButton
          key={`type-movie-${mediaType === 'movie' ? 'on' : 'off'}`}
          type="button"
          variant={mediaType === 'movie' ? 'solid' : 'outline'}
          onClick={() => switchType('movie')}
          aria-pressed={mediaType === 'movie'}
          className={`flex-1 cursor-pointer !text-xs sm:!text-sm ${mediaType === 'movie' ? 'type-movie-active' : ''}`}
        >
          <Film size={14} />
          Filme
        </DrawablyButton>
        <DrawablyButton
          key={`type-tv-${mediaType === 'tv' ? 'on' : 'off'}`}
          type="button"
          variant={mediaType === 'tv' ? 'solid' : 'outline'}
          onClick={() => switchType('tv')}
          aria-pressed={mediaType === 'tv'}
          className={`flex-1 cursor-pointer !text-xs sm:!text-sm ${mediaType === 'tv' ? 'type-tv-active' : ''}`}
        >
          <Tv size={14} />
          Serien
        </DrawablyButton>
      </div>

      <div className="mb-4 flex flex-col gap-2">
        <label htmlFor="movie-search" className="text-sm font-medium">
          {mediaType === 'tv' ? 'Serientitel' : mediaType === 'movie' ? 'Filmtitel' : 'Titel'}
          {ean ? ' (ggf. manuell korrigieren)' : ' suchen'}
        </label>
        <DrawablyInput
          id="movie-search"
          autoFocus
          type="text"
          placeholder={
            mediaType === 'tv'
              ? 'z. B. Breaking Bad'
              : mediaType === 'movie'
                ? 'z. B. Der Herr der Ringe'
                : 'z. B. Der Herr der Ringe oder Breaking Bad'
          }
          value={query}
          onChange={(e) => runSearch(e.target.value)}
        />
      </div>

      <div className="h-80 overflow-hidden">
        {loading && (
          <div className="flex items-center gap-2 py-6 text-neutral-500">
            <Loader2 size={18} className="animate-spin" />
            Suche in The Movie Database&hellip;
          </div>
        )}

        {!loading && error && <p className="py-4 text-sm text-red-600">{error}</p>}

        {!loading && !error && query.trim().length >= 2 && results.length === 0 && (
          <p className="py-6 text-center text-sm text-neutral-500">Keine Treffer gefunden.</p>
        )}

        {!loading && !error && results.length > 0 && (
          <ul className="scrollbar-hide h-full space-y-2 overflow-y-auto pr-1">
            {results.map((result) => {
              const poster = posterUrl(result.posterPath, 'w92')
              const alreadyIn = existingTmdbIds.has(`${result.mediaType}:${result.tmdbId}`)
              return (
                <li key={`${result.mediaType}:${result.tmdbId}`}>
                  <button
                    type="button"
                    disabled={alreadyIn || savingId !== null}
                    onClick={() => handleSelect(result)}
                    className="flex w-full cursor-pointer items-center gap-3 rounded-md border border-neutral-300 bg-white/70 p-2 text-left transition hover:border-neutral-800 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <span className="flex h-20 w-14 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-neutral-100">
                      {poster ? (
                        <img src={poster} alt="" className="h-full w-full object-cover" />
                      ) : result.mediaType === 'tv' ? (
                        <Tv size={20} className="text-neutral-300" />
                      ) : (
                        <Film size={20} className="text-neutral-300" />
                      )}
                    </span>
                      <span className="min-w-0">
                        <span className="block break-words text-sm font-semibold">{result.title}</span>
                      <span className="block text-xs text-neutral-500">
                        {result.year} &middot; {result.originalTitle}
                      </span>
                      {alreadyIn && (
                        <span className="mt-1 block text-xs text-amber-600">Bereits in der Sammlung</span>
                      )}
                    </span>
                    {savingId === result.tmdbId && (
                      <Loader2 size={16} className="ml-auto animate-spin" />
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="mt-4 flex justify-end">
        <DrawablyButton variant="outline" tone="neutral" onClick={onClose}>
          Abbrechen
        </DrawablyButton>
      </div>
    </Modal>
  )
}
