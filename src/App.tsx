import { useEffect, useMemo, useState } from 'react'
import { Heart, LayoutGrid, List } from 'lucide-react'
import { DrawablyButton, DrawablyInput, DrawablySelect } from 'drawably/react'
import type { ReactElement } from 'react'
import type { Dvd, TmdbSearchResult } from '@/types'
import { fetchDvds, createDvd, updateRating, deleteDvd, fetchWishlist } from '@/lib/api'
import { DvdGrid } from '@/components/DvdGrid'
import { DvdList } from '@/components/DvdList'
import { CreateDialog } from '@/components/CreateDialog'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { FabButton } from '@/components/FabButton'
import { WishlistPage } from '@/components/WishlistPage'

type View = 'grid' | 'list'
type Sort = 'newest' | 'rating' | 'alpha'

function normalizePath(pathname: string): string {
  const clean = pathname.replace(/\/+$/, '')
  return clean === '' ? '/' : clean
}

export default function App(): ReactElement {
  const [route, setRoute] = useState(() => normalizePath(window.location.pathname))
  const [dvds, setDvds] = useState<Dvd[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [view, setView] = useState<View>(() =>
    localStorage.getItem('dvds-view') === 'list' ? 'list' : 'grid',
  )
  const [sort, setSort] = useState<Sort>(() => {
    const stored = localStorage.getItem('dvds-sort')
    return stored === 'rating' || stored === 'alpha' ? stored : 'newest'
  })
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Dvd | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [search, setSearch] = useState('')
  const [wishCount, setWishCount] = useState<number | null>(null)

  useEffect(() => {
    const onPop = () => setRoute(normalizePath(window.location.pathname))
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const navigate = (path: string) => {
    window.history.pushState({}, '', path)
    setRoute(normalizePath(path))
    window.scrollTo(0, 0)
  }

  useEffect(() => {
    fetchDvds()
      .then(setDvds)
      .catch((err) => setLoadError(err?.message || 'Sammlung konnte nicht geladen werden'))
    fetchWishlist()
      .then((w) => setWishCount(w.length))
      .catch(() => undefined)
  }, [route])

  useEffect(() => {
    localStorage.setItem('dvds-view', view)
  }, [view])

  useEffect(() => {
    localStorage.setItem('dvds-sort', sort)
  }, [sort])

  const sortedDvds = useMemo(() => {
    const copy = [...dvds]
    if (sort === 'newest') copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    if (sort === 'rating')
      copy.sort((a, b) => b.rating - a.rating || a.title.localeCompare(b.title, 'de'))
    if (sort === 'alpha') copy.sort((a, b) => a.title.localeCompare(b.title, 'de'))
    return copy
  }, [dvds, sort])

  const visibleDvds = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return sortedDvds
    return sortedDvds.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        (d.originalTitle || '').toLowerCase().includes(q),
    )
  }, [sortedDvds, search])

  const existingTmdbIds = useMemo(
    () => new Set(dvds.map((d) => `${d.mediaType || 'movie'}:${d.tmdbId}`)),
    [dvds],
  )

  const handleCreate = async (result: TmdbSearchResult, ean: string | null) => {
    const created = await createDvd({ ...result, ean })
    setDvds((prev) => [...prev, created])
  }

  const handleRate = async (id: string, rating: number) => {
    setDvds((prev) => prev.map((d) => (d.id === id ? { ...d, rating } : d)))
    try {
      await updateRating(id, rating)
    } catch {
      const fresh = await fetchDvds().catch(() => null)
      if (fresh) setDvds(fresh)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteDvd(deleteTarget.id)
      setDvds((prev) => prev.filter((d) => d.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Löschen fehlgeschlagen')
    } finally {
      setDeleting(false)
    }
  }

  if (route === '/wunschliste') {
    return (
      <div className="mx-auto max-w-6xl px-3 pb-28 pt-5 sm:px-4 sm:pt-8">
        <WishlistPage onCountChange={setWishCount} />
        <div className="fixed bottom-5 right-5 z-40 sm:bottom-6 sm:right-6">
          <DrawablyButton
            variant="solid"
            onClick={() => navigate('/')}
            className="btn-pastel-green flex cursor-pointer items-center gap-2 !rounded-full !px-4 !py-2.5 text-sm font-semibold sm:!px-5 sm:!py-3 sm:text-base"
            aria-label="Zurück zur Sammlung"
          >
            <LayoutGrid size={20} />
            Zur Sammlung
          </DrawablyButton>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-3 pb-28 pt-5 sm:px-4 sm:pt-8">
      <header className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Emi's DvD Sammlung</h1>
        <div className="mt-3 flex items-center gap-2">
          <DrawablyInput
            aria-label="Sammlung durchsuchen"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`${dvds.length} ${dvds.length === 1 ? 'Eintrag' : 'Einträge'} suchen`}
            className="min-w-0 flex-1 !text-xs sm:!text-sm"
          />
          <DrawablySelect
            aria-label="Sortierung"
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="!text-xs sm:!text-sm"
          >
            <option value="newest">Zuletzt hinzugefügt</option>
            <option value="rating">Bewertung</option>
            <option value="alpha">Alphabetisch</option>
          </DrawablySelect>
          <DrawablyButton
            key={`grid-${view}`}
            variant={view === 'grid' ? 'solid' : 'outline'}
            onClick={() => setView('grid')}
            aria-label="Kartenansicht"
            className="cursor-pointer !px-2.5 !py-1.5"
          >
            <LayoutGrid size={16} />
          </DrawablyButton>
          <DrawablyButton
            key={`list-${view}`}
            variant={view === 'list' ? 'solid' : 'outline'}
            onClick={() => setView('list')}
            aria-label="Listenansicht"
            className="cursor-pointer !px-2.5 !py-1.5"
          >
            <List size={16} />
          </DrawablyButton>
        </div>
      </header>

      {loadError && (
        <p className="mb-6 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {loadError}
        </p>
      )}

      {dvds.length === 0 ? (
        <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
          <p className="text-xl font-semibold sm:text-2xl">Noch keine DVDs in deiner Sammlung</p>
          <p className="mt-2 text-sm text-neutral-500 sm:text-base">
            Klicke auf den &bdquo;Erstellen&ldquo;-Button unten rechts, um deinen ersten Film hinzuzuf&uuml;gen.
          </p>
        </div>
      ) : visibleDvds.length === 0 ? (
        <p className="py-10 text-center text-sm text-neutral-500">
          Kein Treffer f&uuml;r &bdquo;{search.trim()}&ldquo;.
        </p>
      ) : view === 'grid' ? (
        <DvdGrid dvds={visibleDvds} onRate={handleRate} onDelete={setDeleteTarget} />
      ) : (
        <DvdList dvds={visibleDvds} onRate={handleRate} onDelete={setDeleteTarget} />
      )}

      <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2 sm:bottom-6 sm:right-6">
        <DrawablyButton
          variant="solid"
          onClick={() => navigate('/wunschliste')}
          className="btn-pastel-green flex cursor-pointer items-center gap-2 !rounded-full !px-4 !py-2.5 text-sm font-semibold sm:!px-5 sm:!py-3 sm:text-base"
          aria-label="Zur Wunschliste"
        >
          <Heart size={20} />
          Wunschliste
          {wishCount !== null && wishCount > 0 && (
            <span className="rounded-full bg-white/80 px-1.5 text-[10px] font-bold text-neutral-700">
              {wishCount}
            </span>
          )}
        </DrawablyButton>
        <FabButton onClick={() => setCreateOpen(true)} />
      </div>

      {createOpen && (
        <CreateDialog
          existingTmdbIds={existingTmdbIds}
          onClose={() => setCreateOpen(false)}
          onCreate={handleCreate}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title={deleteTarget.mediaType === 'tv' ? 'Serie löschen?' : 'Film löschen?'}
          description={`„${deleteTarget.title}“ wird aus deiner DVD-Sammlung entfernt. Diese Aktion kann nicht rückgängig gemacht werden.`}
          loading={deleting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
