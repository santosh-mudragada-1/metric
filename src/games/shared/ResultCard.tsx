import { type ReactNode, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { useNavigate } from 'react-router'
import { TrophyIcon } from '@heroicons/react/24/solid'
import { ArrowUpOnSquareIcon, CheckIcon, UserIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/Button'
import { StatTile } from '@/components/ui/StatTile'
import { ACCENT_CLASSES, GAME_MAP, type GameConfig } from '@/games.config'
import { useProfile } from '@/hooks/useProfile'
import { countUp, flashSuccess, staggerReveal } from '@/lib/animation/presets'
import { playBack, playCopy, playSuccess } from '@/lib/sound/sfx'
import type { GameId } from '@shared/types'

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
  gameId: GameId
  accent: GameConfig['accent']
  primary: PrimaryStat | PrimaryStat[]
  stats?: StatItem[]
  isNewBest?: boolean
  onPlayAgain: () => void
  playAgainLabel?: string
}

/** "santosh mudragada" -> "SM", "dre" -> "DRE" — mirrors the tag a player sees for themselves. */
function initialsFrom(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return ''
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

export function ResultCard({
  gameId,
  accent,
  primary,
  stats = [],
  isNewBest,
  onPlayAgain,
  playAgainLabel = 'Play Again',
}: ResultCardProps) {
  const navigate = useNavigate()
  const { profile, updateName } = useProfile()
  const rootRef = useRef<HTMLDivElement>(null)
  const numberRefs = useRef<(HTMLSpanElement | null)[]>([])
  const statsRef = useRef<HTMLDivElement>(null)
  const classes = ACCENT_CLASSES[accent]
  const primaries = Array.isArray(primary) ? primary : [primary]

  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(profile.name)
  const [shareState, setShareState] = useState<'idle' | 'copied'>('idle')

  useGSAP(() => {
    primaries.forEach((p, i) => countUp(numberRefs.current[i], { to: p.value, duration: 0.9 }))
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

  const commitName = () => {
    const trimmed = nameDraft.trim()
    if (trimmed) updateName(trimmed)
    setEditingName(false)
  }

  const shareResult = async () => {
    const url = `${window.location.origin}/play/${gameId}`
    const scoreText = primaries.map((p) => `${p.value}${p.unit ?? ''}`).join(' · ')
    const shareText = `I scored ${scoreText} on ${GAME_MAP[gameId].name} in Metric — come try it.`

    let shared = false
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Metric', text: shareText, url })
        shared = true
      } catch {
        // share sheet dismissed — fall through to clipboard so the link isn't lost
      }
    }
    if (!shared) {
      try {
        await navigator.clipboard.writeText(url)
      } catch {
        // clipboard unavailable — nothing more to do here
      }
    }

    playCopy()
    flashSuccess(rootRef.current)
    setShareState('copied')
    setTimeout(() => setShareState('idle'), 1800)
  }

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

      <div className={`flex ${primaries.length > 1 ? 'flex-row gap-8 sm:gap-14' : 'flex-col'} items-center`}>
        {primaries.map((p, i) => (
          <div key={p.label} className="flex flex-col items-center gap-2">
            <span className="font-mono text-xs font-medium tracking-[0.2em] text-text-dim uppercase">{p.label}</span>
            <div
              className={`flex items-baseline gap-1.5 font-display font-bold tabular-nums ${classes.text}
                ${primaries.length > 1 ? 'text-5xl sm:text-7xl' : 'text-readout'}`}
            >
              <span ref={(el) => { numberRefs.current[i] = el }}>0</span>
              {p.unit && <span className="text-2xl font-semibold text-text-muted sm:text-3xl">{p.unit}</span>}
            </div>
          </div>
        ))}
      </div>

      {stats.length > 0 && (
        <div ref={statsRef} className="grid w-full max-w-sm grid-cols-2 gap-x-8 gap-y-6 sm:max-w-lg sm:grid-cols-3">
          {stats.map((stat) => (
            <StatTile key={stat.label} label={stat.label} value={stat.value} />
          ))}
        </div>
      )}

      <div className="flex w-full max-w-sm flex-col items-center gap-5">
        <Button variant="primary" size="lg" chevron onClick={onPlayAgain} className="w-full">
          {playAgainLabel}
        </Button>

        <div className="flex w-full gap-2.5">
          {editingName ? (
            <input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => e.key === 'Enter' && commitName()}
              maxLength={16}
              placeholder="Your name"
              className="h-13 flex-1 rounded-full border border-border-strong bg-surface-raised px-4 text-sm
                text-text outline-none focus:border-invert/60"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditingName(true)}
              title="Edit your name"
              className="flex h-13 w-13 shrink-0 cursor-pointer items-center justify-center rounded-full border
                border-border-strong bg-surface-raised font-mono text-[0.6875rem] font-semibold tracking-wide
                text-text transition-colors hover:border-text-muted hover:bg-surface-hover"
            >
              {initialsFrom(profile.name) || <UserIcon className="h-4 w-4 text-text-dim" />}
            </button>
          )}

          <Button
            variant="ghost"
            size="lg"
            disabled={shareState === 'copied'}
            onClick={shareResult}
            className="flex-1 px-4"
          >
            {shareState === 'copied' ? (
              <>
                <CheckIcon className="h-4 w-4 shrink-0 text-success" />
                <span className="truncate">Link copied</span>
              </>
            ) : (
              <>
                <ArrowUpOnSquareIcon className="h-4 w-4 shrink-0" />
                <span className="truncate">Share result &amp; invite a friend</span>
              </>
            )}
          </Button>
        </div>

        <button
          type="button"
          onClick={() => {
            playBack()
            navigate('/')
          }}
          className="mt-1 cursor-pointer font-mono text-[0.6875rem] tracking-[0.14em] text-text-dim uppercase
            transition-colors hover:text-text-muted"
        >
          Back to dashboard
        </button>
      </div>
    </div>
  )
}
