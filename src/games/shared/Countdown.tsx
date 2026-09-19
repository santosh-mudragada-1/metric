import { useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { countdownPulse } from '@/lib/animation/presets'
import { playCountdownGo, playCountdownTick } from '@/lib/sound/sfx'

interface CountdownProps {
  seconds?: number
  /** When provided, the countdown syncs to this wall-clock timestamp instead of counting steps locally — used for multiplayer so every player's countdown hits zero at the same instant. */
  endsAt?: number
  onComplete: () => void
}

export function Countdown({ seconds = 3, endsAt, onComplete }: CountdownProps) {
  const [count, setCount] = useState(() => (endsAt ? Math.ceil((endsAt - Date.now()) / 1000) : seconds))
  const numberRef = useRef<HTMLDivElement>(null)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    if (!endsAt) return
    const tick = () => {
      const remaining = Math.ceil((endsAt - Date.now()) / 1000)
      setCount(Math.max(remaining, 0))
    }
    tick()
    const interval = setInterval(tick, 100)
    const done = setTimeout(() => onCompleteRef.current(), Math.max(endsAt - Date.now(), 0))
    return () => {
      clearInterval(interval)
      clearTimeout(done)
    }
  }, [endsAt])

  useEffect(() => {
    if (endsAt) return
    if (count <= 0) {
      playCountdownGo()
      const t = setTimeout(() => onCompleteRef.current(), 400)
      return () => clearTimeout(t)
    }
    playCountdownTick()
    const t = setTimeout(() => setCount((c) => c - 1), 700)
    return () => clearTimeout(t)
  }, [count, endsAt])

  useEffect(() => {
    if (!endsAt) return
    if (count <= 0) playCountdownGo()
    else playCountdownTick()
  }, [count, endsAt])

  useGSAP(() => {
    countdownPulse(numberRef.current)
  }, [count])

  return (
    <div className="flex h-72 items-center justify-center">
      <div ref={numberRef} className="font-display text-8xl font-bold tabular-nums text-text">
        {count > 0 ? count : 'GO'}
      </div>
    </div>
  )
}
