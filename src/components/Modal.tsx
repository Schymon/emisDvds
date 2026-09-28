import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import type { ReactElement, ReactNode } from 'react'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
}

export function Modal({ title, onClose, children }: ModalProps): ReactElement {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => {
        if (ref.current && !ref.current.contains(e.target as Node)) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        ref={ref}
        className="w-full max-w-lg rounded-md border-2 border-neutral-800 bg-[#fdfbf5] p-5 shadow-[6px_6px_0_0_rgba(43,43,43,0.25)]"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Schließen"
            className="cursor-pointer border-0 bg-transparent p-1 text-neutral-500 hover:text-neutral-900"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
