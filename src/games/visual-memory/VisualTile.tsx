import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { shakeError } from '@/lib/animation/presets'

interface VisualTileProps {
  active: boolean
  wrong: boolean
  disabled: boolean
  onTap: () => void
}

export function VisualTile({ active, wrong, disabled, onTap }: VisualTileProps) {
  const ref = useRef<HTMLButtonElement>(null)
  const [tapped, setTapped] = useState(false)
  const tapTimeoutRef = useRef<number | undefined>(undefined)

  useGSAP(() => {
    if (active) {
      gsap.fromTo(ref.current, { scale: 0.85 }, { scale: 1, duration: 0.18, ease: 'dialedOut' })
    }
  }, [active])

  useGSAP(() => {
    if (wrong) shakeError(ref.current)
  }, [wrong])

  const handlePointerDown = () => {
    if (disabled) return
    window.clearTimeout(tapTimeoutRef.current)
    setTapped(true)
    gsap.fromTo(ref.current, { scale: 0.78 }, { scale: 1, duration: 0.32, ease: 'elastic.out(1, 0.55)' })
    tapTimeoutRef.current = window.setTimeout(() => setTapped(false), 200)
  }

  return (
    <button
      ref={ref}
      disabled={disabled}
      onPointerDown={handlePointerDown}
      onClick={onTap}
      className={`aspect-square rounded-full border transition-[background-color,border-color,box-shadow] duration-150
        ${
          wrong
            ? 'border-danger bg-danger-dim'
            : active
              ? 'border-accent-visual bg-accent-visual'
              : tapped
                ? 'border-accent-visual bg-surface-hover shadow-[0_0_0_4px_var(--color-accent-visual-dim)]'
                : 'border-border bg-surface-raised hover:bg-surface-hover'
        }
        ${disabled ? 'cursor-default' : 'cursor-pointer active:scale-90'}`}
    />
  )
}
