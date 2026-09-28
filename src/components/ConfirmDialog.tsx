import { DrawablyButton } from 'drawably/react'
import type { ReactElement } from 'react'
import { Modal } from './Modal'

interface ConfirmDialogProps {
  title: string
  description: string
  confirmLabel?: string
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Löschen',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps): ReactElement {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="mb-6 text-sm text-neutral-600">{description}</p>
      <div className="flex justify-end gap-3">
        <DrawablyButton variant="outline" tone="neutral" onClick={onCancel} disabled={loading}>
          Abbrechen
        </DrawablyButton>
        <DrawablyButton variant="solid" tone="danger" onClick={onConfirm} disabled={loading}>
          {loading ? 'Wird gelöscht…' : confirmLabel}
        </DrawablyButton>
      </div>
    </Modal>
  )
}
