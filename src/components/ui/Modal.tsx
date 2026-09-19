import { type ReactNode, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useGSAP(
    () => {
      if (!open) return
      gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.18, ease: 'power2.out' })
      gsap.fromTo(
        panelRef.current,
        { opacity: 0, y: 16, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.28, ease: 'dialedOut' },
      )
    },
    [open],
  )

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div ref={backdropRef} className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md rounded-3xl border border-border-strong bg-surface-raised p-6 shadow-[var(--shadow-card)]"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-text">{title}</h2>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-full p-1 text-text-muted hover:bg-surface-hover hover:text-text"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}
