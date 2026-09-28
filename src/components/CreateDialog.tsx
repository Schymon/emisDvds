import { useState } from 'react'
import { Film, Loader2 } from 'lucide-react'
import { DrawablyButton, DrawablyInput } from 'drawably/react'
import type { ReactElement } from 'react'
import type { TmdbSearchResult } from '@/types'
import { searchTmdb, posterUrl } from '@/lib/api'
import { Modal } from './Modal'

interface CreateDialogProps {
  existingTmdbIds: Set<number>
  onClose: () => void
  onCreate: (result: TmdbSearchResult) => Promise<void>
}

export function CreateDialog({ existingTmdbIds, onClose, onCreate }: CreateDialogProps): ReactElement {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<TmdbSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<number | null>(null)

  const runSearch = async (value: string) => {
    setQuery(value)
    setError(null)
    if (value.trim().length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    try {
      const found = await searchTmdb(value.trim())
      setResults(found)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Suche fehlgeschlagen')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = async (result: TmdbSearchResult) => {
    setSavingId(result.tmdbId)
    try {
      await onCreate(result)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erstellen fehlgeschlagen')
      setSavingId(null)
    }
  }

  return (
    <Modal title="Neue DVD hinzufügen" onClose={onClose}>
      <div className="mb-4 flex flex-col gap-2">
        <label htmlFor="movie-search" className="text-sm font-medium">
          Filmtitel suchen
        </label>
        <DrawablyInput
          id="movie-search"
          autoFocus
          type="text"
          placeholder="z. B. Der Herr der Ringe"
          value={query}
          onChange={(e) => runSearch(e.target.value)}
        />
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-6 text-neutral-500">
          <Loader2 size={18} className="animate-spin" />
          Suche in The Movie Database&hellip;
        </div>
      )}

      {error && <p className="py-4 text-sm text-red-600">{error}</p>}

      {!loading && !error && query.trim().length >= 2 && results.length === 0 && (
        <p className="py-6 text-center text-sm text-neutral-500">Keine Treffer gefunden.</p>
      )}

      {!loading && results.length > 0 && (
        <ul className="scrollbar-hide max-h-80 space-y-2 overflow-y-auto pr-1">
          {results.map((result) => {
            const poster = posterUrl(result.posterPath, 'w92')
            const alreadyIn = existingTmdbIds.has(result.tmdbId)
            return (
              <li key={result.tmdbId}>
                <button
                  type="button"
                  disabled={alreadyIn || savingId !== null}
                  onClick={() => handleSelect(result)}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-md border border-neutral-300 bg-white/70 p-2 text-left transition hover:border-neutral-800 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className="flex h-20 w-14 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-neutral-100">
                    {poster ? (
                      <img src={poster} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Film size={20} className="text-neutral-300" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{result.title}</span>
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

      <div className="mt-4 flex justify-end">
        <DrawablyButton variant="outline" tone="neutral" onClick={onClose}>
          Abbrechen
        </DrawablyButton>
      </div>
    </Modal>
  )
}
