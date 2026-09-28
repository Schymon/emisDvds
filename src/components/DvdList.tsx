import { Film, Trash2 } from 'lucide-react'
import { DrawablyCard } from 'drawably/react'
import type { ReactElement } from 'react'
import type { Dvd } from '@/types'
import { posterUrl } from '@/lib/api'
import { StarRating } from './StarRating'

interface DvdListProps {
  dvds: Dvd[]
  onRate: (id: string, rating: number) => void
  onDelete: (dvd: Dvd) => void
}

export function DvdList({ dvds, onRate, onDelete }: DvdListProps): ReactElement {
  return (
    <div className="flex flex-col gap-2">
      {dvds.map((dvd) => {
        const poster = posterUrl(dvd.posterPath, 'w92')
        return (
          <DrawablyCard key={dvd.id} className="flex items-center gap-3 p-2 sm:p-3">
            <span className="flex h-16 w-11 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-neutral-100">
              {poster ? (
                <img src={poster} alt={dvd.title} className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <Film size={16} className="text-neutral-300" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{dvd.title}</span>
              {dvd.year ? (
                <span className="block text-xs text-neutral-500">{dvd.year}</span>
              ) : null}
              <span className="mt-1 block">
                <StarRating rating={dvd.rating} onChange={(rating) => onRate(dvd.id, rating)} size={14} />
              </span>
            </span>
            <button
              type="button"
              aria-label={`${dvd.title} löschen`}
              onClick={() => onDelete(dvd)}
              className="shrink-0 cursor-pointer border-0 bg-transparent p-1 text-neutral-500 hover:text-red-600"
            >
              <Trash2 size={14} />
            </button>
          </DrawablyCard>
        )
      })}
    </div>
  )
}
