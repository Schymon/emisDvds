import { Trash2, Film, Tv } from 'lucide-react'
import { DrawablyCard } from 'drawably/react'
import type { ReactElement } from 'react'
import type { Dvd } from '@/types'
import { posterUrl } from '@/lib/api'
import { StarRating } from './StarRating'

interface DvdCardProps {
  dvd: Dvd
  onRate: (id: string, rating: number) => void
  onDelete: (dvd: Dvd) => void
}

export function DvdCard({ dvd, onRate, onDelete }: DvdCardProps): ReactElement {
  const poster = posterUrl(dvd.posterPath)
  const isSeries = dvd.mediaType === 'tv'
  return (
    <DrawablyCard className="flex flex-col p-2 sm:p-3">
      <div className="relative flex aspect-[2/3] items-center justify-center overflow-hidden rounded-sm bg-neutral-100">
        {poster ? (
          <img src={poster} alt={dvd.title} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <Film size={32} className="text-neutral-300" />
        )}
        {isSeries && (
          <span className="absolute left-1 top-1 flex items-center gap-1 rounded-sm bg-neutral-900/75 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white sm:text-[10px]">
            <Tv size={10} />
            Serie
          </span>
        )}
      </div>
      <h3 className="mt-2 break-words text-[11px] font-semibold leading-snug sm:text-sm">
        {dvd.title}
      </h3>
      {dvd.year ? (
        <span className="mt-0.5 text-[10px] text-neutral-500 sm:text-xs">{dvd.year}</span>
      ) : null}
      <div className="mt-auto flex items-center justify-between gap-1 pt-2">
        <StarRating rating={dvd.rating} onChange={(rating) => onRate(dvd.id, rating)} size={14} />
        <button
          type="button"
          aria-label={`${dvd.title} löschen`}
          onClick={() => onDelete(dvd)}
          className="shrink-0 cursor-pointer border-0 bg-transparent p-1 text-neutral-500 hover:text-red-600"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </DrawablyCard>
  )
}
