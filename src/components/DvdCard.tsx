import { Trash2, Film } from 'lucide-react'
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
  return (
    <DrawablyCard className="flex flex-col p-2 sm:p-3">
      <div className="flex aspect-[2/3] items-center justify-center overflow-hidden rounded-sm bg-neutral-100">
        {poster ? (
          <img src={poster} alt={dvd.title} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <Film size={32} className="text-neutral-300" />
        )}
      </div>
      <h3 className="mt-2 line-clamp-2 text-[11px] font-semibold leading-snug sm:text-sm">
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
