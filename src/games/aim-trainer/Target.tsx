import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { popIn } from '@/lib/animation/presets'
import { playReveal } from '@/lib/sound/sfx'

interface TargetProps {
  x: number
  y: number
  onHit: () => void
}

export function Target({ x, y, onHit }: TargetProps) {
  const ref = useRef<HTMLButtonElement>(null)

  useGSAP(() => {
    popIn(ref.current)
  }, [])

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    playReveal()
    if (!ref.current) return onHit()
    gsap.to(ref.current, {
      scale: 0.6,
      opacity: 0,
      duration: 0.12,
      ease: 'power2.in',
      onComplete: onHit,
    })
  }

  return (
    <button
      ref={ref}
      onClick={handleClick}
      aria-label="target"
      style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
      className="absolute h-10 w-10 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full
        bg-accent-aim shadow-[0_0_24px_-4px_var(--color-accent-aim)]"
    />
  )
}
