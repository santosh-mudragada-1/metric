import { type ReactNode, useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { useNavigate } from 'react-router'
import { TrophyIcon } from '@heroicons/react/24/solid'
import { Button } from '@/components/ui/Button'
import { StatTile } from '@/components/ui/StatTile'
import { ACCENT_CLASSES, type GameConfig } from '@/games.config'
import { countUp, flashSuccess, staggerReveal } from '@/lib/animation/presets'
import { playSuccess } from '@/lib/sound/sfx'

interface StatItem {
  label: string
  value: ReactNode
}

interface PrimaryStat {
  value: number
  unit?: string
  label: string
}

interface ResultCardProps {
  accent: GameConfig['accent']
  primary: PrimaryStat
  stats?: StatItem[]
  isNewBest?: boolean
  onPlayAgain: () => void
  playAgainLabel?: string
}

export function ResultCard({
  accent,
  primary,
  stats = [],
  isNewBest,
  onPlayAgain,
  playAgainLabel = 'Play Again',
}: ResultCardProps) {
  const navigate = useNavigate()
  const rootRef = useRef<HTMLDivElement>(null)
  const numberRef = useRef<HTMLSpanElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)
  const classes = ACCENT_CLASSES[accent]

  useGSAP(() => {
    countUp(numberRef.current, { to: primary.value, duration: 0.9 })
    if (statsRef.current && stats.length > 0) {
      staggerReveal(Array.from(statsRef.current.children) as Element[], {
        stagger: 0.07,
        from: { opacity: 0, y: 10, scale: 1 },
      })
    }
    if (isNewBest) {
      playSuccess()
      flashSuccess(rootRef.current)
    }
  }, [])

  return (
    <div ref={rootRef} className="flex flex-col items-center gap-10 py-10 text-center sm:py-16">
      {isNewBest && (
        <div
          className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-mono text-xs font-semibold
            tracking-wide uppercase ${classes.bgDim} ${classes.text}`}
        >
          <TrophyIcon className="h-3.5 w-3.5" />
          new personal best
        </div>
      )}

      <div className="flex flex-col items-center gap-2">
        <span className="font-mono text-xs font-medium tracking-[0.2em] text-text-dim uppercase">
          {primary.label}
        </span>
        <div className={`flex items-baseline gap-2 font-display text-readout font-bold tabular-nums ${classes.text}`}>
          <span ref={numberRef}>0</span>
          {primary.unit && <span className="text-3xl font-semibold text-text-muted sm:text-4xl">{primary.unit}</span>}
        </div>
      </div>

      {stats.length > 0 && (
        <div ref={statsRef} className="grid w-full max-w-sm grid-cols-2 gap-x-8 gap-y-6 sm:max-w-lg sm:grid-cols-3">
          {stats.map((stat) => (
            <StatTile key={stat.label} label={stat.label} value={stat.value} />
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="ghost" onClick={() => navigate('/')}>
          Back to dashboard
        </Button>
        <Button variant="primary" chevron onClick={onPlayAgain}>
          {playAgainLabel}
        </Button>
      </div>
    </div>
  )
}
