import type { ReactElement } from 'react'
import type { Dvd } from '@/types'
import { DvdCard } from './DvdCard'

interface DvdGridProps {
  dvds: Dvd[]
  onRate: (id: string, rating: number) => void
  onDelete: (dvd: Dvd) => void
}

export function DvdGrid({ dvds, onRate, onDelete }: DvdGridProps): ReactElement {
  if (dvds.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <p className="text-xl font-semibold sm:text-2xl">Noch keine DVDs in deiner Sammlung</p>
        <p className="mt-2 text-sm text-neutral-500 sm:text-base">
          Klicke auf den &bdquo;Erstellen&ldquo;-Button unten rechts, um deinen ersten Film hinzuzuf&uuml;gen.
        </p>
      </div>
    )
  }
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-6">
      {dvds.map((dvd) => (
        <DvdCard key={dvd.id} dvd={dvd} onRate={onRate} onDelete={onDelete} />
      ))}
    </div>
  )
}
