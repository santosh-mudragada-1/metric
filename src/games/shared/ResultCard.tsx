import { type ReactNode, useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { useNavigate } from 'react-router'
import { TrophyIcon } from '@heroicons/react/24/solid'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ACCENT_CLASSES, type GameConfig } from '@/games.config'
import { flashSuccess, staggerReveal } from '@/lib/animation/presets'
import { playSuccess } from '@/lib/sound/sfx'

interface StatItem {
  label: string
  value: ReactNode
}

interface ResultCardProps {
  accent: GameConfig['accent']
  title: string
  stats: StatItem[]
  isNewBest?: boolean
  onPlayAgain: () => void
  playAgainLabel?: string
}

export function ResultCard({ accent, title, stats, isNewBest, onPlayAgain, playAgainLabel = 'Play Again' }: ResultCardProps) {
  const navigate = useNavigate()
  const cardRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)
  const classes = ACCENT_CLASSES[accent]

  useGSAP(() => {
    if (!statsRef.current) return
    staggerReveal(Array.from(statsRef.current.children) as Element[], { stagger: 0.08 })
    if (isNewBest) {
      playSuccess()
      flashSuccess(cardRef.current)
    }
  }, [])

  return (
    <Card ref={cardRef} className="flex flex-col items-center gap-6 p-8 text-center">
      {isNewBest && (
        <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${classes.bgDim} ${classes.text}`}>
          <TrophyIcon className="h-3.5 w-3.5" />
          New Personal Best
        </div>
      )}
      <h2 className="font-display text-2xl font-semibold tracking-tight text-text">{title}</h2>
      <div ref={statsRef} className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col gap-1 rounded-2xl border border-border bg-surface-raised px-4 py-3">
            <span className="text-xs font-medium uppercase tracking-wide text-text-dim">{stat.label}</span>
            <span className="font-mono text-2xl font-semibold tabular-nums text-text">{stat.value}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <Button variant="ghost" onClick={() => navigate('/')}>
          Back to Dashboard
        </Button>
        <Button variant="primary" chevron onClick={onPlayAgain}>
          {playAgainLabel}
        </Button>
      </div>
    </Card>
  )
}
