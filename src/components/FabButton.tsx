import { Plus } from 'lucide-react'
import { DrawablyButton } from 'drawably/react'
import type { ReactElement } from 'react'

interface FabButtonProps {
  onClick: () => void
}

export function FabButton({ onClick }: FabButtonProps): ReactElement {
  return (
    <DrawablyButton
      variant="solid"
      onClick={onClick}
      className="fab-pastel flex cursor-pointer items-center gap-2 !rounded-full !px-4 !py-2.5 text-sm font-semibold sm:!px-5 sm:!py-3 sm:text-base"
      aria-label="Neue DVD erstellen"
    >
      <Plus size={20} />
      Erstellen
    </DrawablyButton>
  )
}
