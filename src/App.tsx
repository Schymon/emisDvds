import { useEffect, useMemo, useState } from 'react'
import { Disc, LayoutGrid, List } from 'lucide-react'
import { DrawablyButton } from 'drawably/react'
import type { ReactElement } from 'react'
import type { Dvd, TmdbSearchResult } from '@/types'
import { fetchDvds, createDvd, updateRating, deleteDvd } from '@/lib/api'
import { DvdGrid } from '@/components/DvdGrid'
import { DvdList } from '@/components/DvdList'
import { CreateDialog } from '@/components/CreateDialog'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { FabButton } from '@/components/FabButton'

type View = 'grid' | 'list'

export default function App(): ReactElement {
  const [dvds, setDvds] = useState<Dvd[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [view, setView] = useState<View>(() =>
    localStorage.getItem('dvds-view') === 'list' ? 'list' : 'grid',
  )
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Dvd | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchDvds()
      .then(setDvds)
      .catch((err) => setLoadError(err?.message || 'Sammlung konnte nicht geladen werden'))
  }, [])

  useEffect(() => {
    localStorage.setItem('dvds-view', view)
  }, [view])

  const existingTmdbIds = useMemo(() => new Set(dvds.map((d) => d.tmdbId)), [dvds])

  const handleCreate = async (result: TmdbSearchResult) => {
    const created = await createDvd(result)
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

  return (
    <div className="mx-auto max-w-6xl px-3 pb-28 pt-5 sm:px-4 sm:pt-8">
      <header className="mb-6 flex items-center justify-between gap-3 sm:mb-8">
        <div className="flex min-w-0 items-center gap-3">
          <Disc size={28} className="shrink-0 text-neutral-800 sm:size-8" />
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">Emis DVDs</h1>
            <p className="text-xs text-neutral-500 sm:text-sm">Meine DVD-Sammlung zu Hause</p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <DrawablyButton
            variant={view === 'grid' ? 'solid' : 'outline'}
            onClick={() => setView('grid')}
            aria-label="Kartenansicht"
            className="cursor-pointer !px-2.5 !py-1.5"
          >
            <LayoutGrid size={16} />
          </DrawablyButton>
          <DrawablyButton
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

      {view === 'grid' ? (
        <DvdGrid dvds={dvds} onRate={handleRate} onDelete={setDeleteTarget} />
      ) : dvds.length === 0 ? (
        <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
          <p className="text-xl font-semibold sm:text-2xl">Noch keine DVDs in deiner Sammlung</p>
          <p className="mt-2 text-sm text-neutral-500 sm:text-base">
            Klicke auf den &bdquo;Erstellen&ldquo;-Button unten rechts, um deinen ersten Film hinzuzuf&uuml;gen.
          </p>
        </div>
      ) : (
        <DvdList dvds={dvds} onRate={handleRate} onDelete={setDeleteTarget} />
      )}

      <FabButton onClick={() => setCreateOpen(true)} />

      {createOpen && (
        <CreateDialog
          existingTmdbIds={existingTmdbIds}
          onClose={() => setCreateOpen(false)}
          onCreate={handleCreate}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Film löschen?"
          description={`„${deleteTarget.title}“ wird aus deiner DVD-Sammlung entfernt. Diese Aktion kann nicht rückgängig gemacht werden.`}
          loading={deleting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
