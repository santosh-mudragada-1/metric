import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { staggerReveal } from '@/lib/animation/presets'
import { playFail, playLevelUp, playReveal } from '@/lib/sound/sfx'

interface DigitDisplayProps {
  answer: string
  input: string
  wasCorrect: boolean
}

export function DigitDisplay({ answer, input, wasCorrect }: DigitDisplayProps) {
  const rowRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!rowRef.current) return
    staggerReveal(Array.from(rowRef.current.children) as Element[], {
      stagger: 0.1,
      from: { opacity: 0, y: 12, scale: 0.7 },
      onEach: () => playReveal(),
      onDone: () => (wasCorrect ? playLevelUp() : playFail()),
    })
  }, [])

  return (
    <div ref={rowRef} className="flex flex-wrap justify-center gap-2">
      {answer.split('').map((digit, i) => {
        const hit = input[i] === digit
        return (
          <div
            key={i}
            className={`flex h-14 w-11 items-center justify-center rounded-full border font-mono text-2xl font-bold tabular-nums
              ${hit ? 'border-success/40 bg-success-dim text-success' : 'border-danger/40 bg-danger-dim text-danger'}`}
          >
            {digit}
          </div>
        )
      })}
    </div>
  )
}
