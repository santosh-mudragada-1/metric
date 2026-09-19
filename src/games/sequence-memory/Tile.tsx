import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { shakeError } from '@/lib/animation/presets'

interface TileProps {
  active: boolean
  wrong: boolean
  disabled: boolean
  onTap: () => void
}

export function Tile({ active, wrong, disabled, onTap }: TileProps) {
  const ref = useRef<HTMLButtonElement>(null)

  useGSAP(() => {
    if (active) {
      gsap.fromTo(ref.current, { scale: 0.85 }, { scale: 1, duration: 0.18, ease: 'dialedOut' })
    }
  }, [active])

  useGSAP(() => {
    if (wrong) shakeError(ref.current)
  }, [wrong])

  return (
    <button
      ref={ref}
      disabled={disabled}
      onClick={onTap}
      className={`aspect-square rounded-2xl border transition-colors duration-150
        ${wrong ? 'border-danger bg-danger-dim' : active ? 'border-accent-sequence bg-accent-sequence' : 'border-border bg-surface-raised hover:bg-surface-hover'}
        ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
    />
  )
}
