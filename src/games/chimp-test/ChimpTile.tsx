import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { shakeError } from '@/lib/animation/presets'

interface ChimpTileProps {
  label?: number
  found: boolean
  wrong: boolean
  disabled: boolean
  onTap: () => void
}

export function ChimpTile({ label, found, wrong, disabled, onTap }: ChimpTileProps) {
  const ref = useRef<HTMLButtonElement>(null)

  useGSAP(() => {
    if (found) {
      gsap.fromTo(ref.current, { scale: 0.85 }, { scale: 1, duration: 0.18, ease: 'dialedOut' })
    }
  }, [found])

  useGSAP(() => {
    if (wrong) shakeError(ref.current)
  }, [wrong])

  return (
    <button
      ref={ref}
      disabled={disabled}
      onClick={onTap}
      className={`flex aspect-square items-center justify-center rounded-2xl border font-mono text-lg font-extrabold
        tabular-nums transition-colors duration-150 sm:text-2xl
        ${wrong ? 'border-danger bg-danger-dim text-danger' : found ? 'border-accent-chimp bg-accent-chimp text-ink' : 'border-border bg-surface-raised text-text hover:bg-surface-hover'}
        ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
    >
      {label ?? ''}
    </button>
  )
}
