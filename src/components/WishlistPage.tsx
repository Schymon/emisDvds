import { useEffect, useState } from 'react'
import { Check, Film, Heart, Loader2, Trash2, Tv } from 'lucide-react'
import { DrawablyButton, DrawablyCard } from 'drawably/react'
import type { ReactElement } from 'react'
import type { WishItem } from '@/types'
import { createDvd, deleteWish, fetchWishlist, posterUrl } from '@/lib/api'

interface WishlistPageProps {
  onCountChange?: (count: number) => void
}

export function WishlistPage({ onCountChange }: WishlistPageProps): ReactElement {
  const [items, setItems] = useState<WishItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    fetchWishlist()
      .then((data) => {
        setItems(data)
        onCountChange?.(data.length)
      })
      .catch((err) => setError(err?.message || 'Wunschliste konnte nicht geladen werden'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleMove = async (item: WishItem) => {
    setBusyId(item.id)
    setError(null)
    try {
      try {
        await createDvd({
          tmdbId: item.tmdbId,
          mediaType: item.mediaType,
          ean: null,
          title: item.title,
          originalTitle: item.originalTitle,
          year: item.year,
          posterPath: item.posterPath,
          overview: item.overview,
        })
      } catch (err) {
        if (!(err instanceof Error && err.message.includes('bereits'))) throw err
      }
      await deleteWish(item.id)
      setItems((prev) => {
        const next = prev.filter((w) => w.id !== item.id)
        onCountChange?.(next.length)
        return next
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verschieben fehlgeschlagen')
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (item: WishItem) => {
    setBusyId(item.id)
    setError(null)
    try {
      await deleteWish(item.id)
      setItems((prev) => {
        const next = prev.filter((w) => w.id !== item.id)
        onCountChange?.(next.length)
        return next
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Löschen fehlgeschlagen')
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-10 text-neutral-500">
        <Loader2 size={18} className="animate-spin" />
        Wunschliste wird geladen&hellip;
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <Heart size={22} className="text-red-400" />
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Wunschliste</h1>
      </div>

      {error && (
        <p className="mt-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      {items.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center text-center">
          <p className="text-xl font-semibold sm:text-2xl">Deine Wunschliste ist leer</p>
          <p className="mt-2 max-w-md text-sm text-neutral-500 sm:text-base">
            Klicke beim Hinzuf&uuml;gen eines Titels auf das Herz rechts am Eintrag, um ihn hier zu merken.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-6">
          {items.map((item) => {
            const poster = posterUrl(item.posterPath)
            return (
              <DrawablyCard key={item.id} className="flex flex-col p-2 sm:p-3">
                <div className="relative flex aspect-[2/3] items-center justify-center overflow-hidden rounded-sm bg-neutral-100">
                  {poster ? (
                    <img src={poster} alt={item.title} className="h-full w-full object-cover" loading="lazy" />
                  ) : item.mediaType === 'tv' ? (
                    <Tv size={32} className="text-neutral-300" />
                  ) : (
                    <Film size={32} className="text-neutral-300" />
                  )}
                  {item.mediaType === 'tv' && (
                    <span className="absolute left-1 top-1 flex items-center gap-1 rounded-sm bg-neutral-900/75 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white sm:text-[10px]">
                      <Tv size={10} />
                      Serie
                    </span>
                  )}
                </div>
                <h3 className="mt-2 break-words text-[11px] font-semibold leading-snug sm:text-sm">
                  {item.title}
                </h3>
                {item.year ? (
                  <span className="mt-0.5 text-[10px] text-neutral-500 sm:text-xs">{item.year}</span>
                ) : null}
                <div className="mt-auto flex items-center justify-between gap-1 pt-2">
                  <DrawablyButton
                    key={`move-${item.id}-${busyId === item.id}`}
                    type="button"
                    variant="solid"
                    disabled={busyId !== null}
                    onClick={() => handleMove(item)}
                    aria-label={`${item.title} zur Sammlung hinzufügen`}
                    className="btn-pastel-green cursor-pointer !px-2 !py-1 !text-[10px] font-semibold sm:!px-3 sm:!text-xs"
                  >
                    {busyId === item.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Check size={12} />
                    )}
                    Zur Sammlung
                  </DrawablyButton>
                  <DrawablyButton
                    key={`del-${item.id}-${busyId === item.id}`}
                    type="button"
                    variant="solid"
                    disabled={busyId !== null}
                    onClick={() => handleDelete(item)}
                    aria-label={`${item.title} von der Wunschliste löschen`}
                    className="btn-pastel-red cursor-pointer !px-2 !py-1 sm:!px-2.5"
                  >
                    <Trash2 size={12} />
                  </DrawablyButton>
                </div>
              </DrawablyCard>
            )
          })}
        </div>
      )}
    </div>
  )
}
