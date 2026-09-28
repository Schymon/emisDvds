import { Star } from 'lucide-react'
import type { ReactElement } from 'react'

interface StarRatingProps {
  rating: number
  onChange: (rating: number) => void
  size?: number
}

export function StarRating({ rating, onChange, size = 20 }: StarRatingProps): ReactElement {
  return (
    <div className="flex items-center gap-0.5" role="radiogroup" aria-label="Bewertung">
      {[1, 2, 3, 4, 5].map((value) => (
        <button
          key={value}
          type="button"
          className="cursor-pointer p-0 border-0 bg-transparent"
          aria-label={`${value} von 5 Sternen`}
          onClick={() => onChange(value === rating ? 0 : value)}
        >
          <Star
            size={size}
            className={value <= rating ? 'fill-amber-400 text-amber-500' : 'text-neutral-400'}
          />
        </button>
      ))}
    </div>
  )
}
