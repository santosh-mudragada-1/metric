import { type ReactNode, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { usePostHog } from '@posthog/react'
import { useNavigate } from 'react-router'
import { TrophyIcon } from '@heroicons/react/24/solid'
import { ArrowUpOnSquareIcon, CheckIcon, UserIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/Button'
import { StatTile } from '@/components/ui/StatTile'
import { ACCENT_CLASSES, GAME_MAP, type GameConfig } from '@/games.config'
import { useProfile } from '@/hooks/useProfile'
import { countUp, flashSuccess, staggerReveal } from '@/lib/animation/presets'
import { playBack, playCopy, playSuccess } from '@/lib/sound/sfx'
import { bestMetric, getPlayStreak, getRuns, isBetter, percentileFor } from '@/lib/progress'
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

/** How a gap of `n` in each game's metric reads in a sentence. */
const AMOUNT: Record<GameId, (n: number) => string> = {
  'reaction-time': (n) => `${n} ms`,
  'aim-trainer': (n) => `${n}%`,
  'sequence-memory': (n) => `${n} level${n === 1 ? '' : 's'}`,
  'number-memory': (n) => `${n} digit${n === 1 ? '' : 's'}`,
  'chimp-test': (n) => `${n} number${n === 1 ? '' : 's'}`,
  'visual-memory': (n) => `${n} level${n === 1 ? '' : 's'}`,
  'verbal-memory': (n) => `${n} word${n === 1 ? '' : 's'}`,
  typing: (n) => `${n} wpm`,
}

const SPEED_GAMES: GameId[] = ['reaction-time', 'typing']

/** Snapshot of the player's history as it stood *before* this run — read once, at mount, before the
 *  game hook's effect records the run and overwrites the stored best. */
function readPriorContext(gameId: GameId) {
  const streak = getPlayStreak()
  return {
    prevBest: bestMetric(gameId),
    runNumber: getRuns(gameId).length + 1,
    streakAfterRun: streak.playedToday ? streak.streak : streak.streak + 1,
    extendedStreak: !streak.playedToday,
  }
}

function describeGap(gameId: GameId, value: number, prevBest: number | null, isNewBest: boolean): string | null {
  if (prevBest === null) return 'first run — your baseline'
  const gap = Math.abs(Math.round(value - prevBest))
  if (isNewBest) return gap > 0 ? `${AMOUNT[gameId](gap)} better than your old best` : null
  if (gap === 0 && !isBetter(gameId, value, prevBest)) return 'tied your best'
  return `${AMOUNT[gameId](gap)} off your best`
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
  const posthog = usePostHog()
  const { profile, updateName } = useProfile()
  const rootRef = useRef<HTMLDivElement>(null)
  const numberRefs = useRef<(HTMLSpanElement | null)[]>([])
  const statsRef = useRef<HTMLDivElement>(null)
  const classes = ACCENT_CLASSES[accent]
  const primaries = Array.isArray(primary) ? primary : [primary]

  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(profile.name)
  const [shareState, setShareState] = useState<'idle' | 'copied'>('idle')
  const insightRef = useRef<HTMLDivElement>(null)

  // The game hook records the new best right after this mounts, which would flip `isNewBest` back to
  // false on the next render — latch the value this run finished with.
  const [newBest] = useState(Boolean(isNewBest))
  const [prior] = useState(() => readPriorContext(gameId))
  const metricValue = primaries[0].value
  const percentile = percentileFor(gameId, metricValue)
  const gapLine = describeGap(gameId, metricValue, prior.prevBest, newBest)
  const progressLine = [
    `run ${prior.runNumber}`,
    prior.extendedStreak && prior.streakAfterRun > 1 ? `${prior.streakAfterRun}-day streak` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  // Enter / Space replays — the fastest path to "one more". Armed after a beat so the keypress that
  // ended the run (e.g. submitting an answer) can't instantly restart it.
  const playAgainRef = useRef(onPlayAgain)
  playAgainRef.current = onPlayAgain
  useEffect(() => {
    const armedAt = performance.now() + 600
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || performance.now() < armedAt) return
      if (e.key !== 'Enter' && e.key !== ' ') return
      const el = e.target as HTMLElement | null
      if (el && el.closest('input, textarea, button, a, [role="button"]')) return
      e.preventDefault()
      playAgainRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useGSAP(() => {
    const insightLines = insightRef.current ? (Array.from(insightRef.current.children) as Element[]) : []
    if (insightLines.length > 0) gsap.set(insightLines, { opacity: 0 })
    primaries.forEach((p, i) =>
      countUp(numberRefs.current[i], {
        to: p.value,
        duration: 0.9,
        onDone:
          i === 0 && insightLines.length > 0
            ? () => staggerReveal(insightLines, { stagger: 0.1, from: { opacity: 0, y: 6, scale: 1 } })
            : undefined,
      }),
    )
    if (statsRef.current && stats.length > 0) {
      staggerReveal(Array.from(statsRef.current.children) as Element[], {
        stagger: 0.07,
        from: { opacity: 0, y: 10, scale: 1 },
      })
    }
    if (newBest) {
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
    const brag =
      percentile !== null && percentile >= 50
        ? ` — ${SPEED_GAMES.includes(gameId) ? 'faster' : 'better'} than ~${percentile}% of people`
        : ''
    const shareText = `I scored ${scoreText} on ${GAME_MAP[gameId].name} in Metric${brag}. Can you beat it?`

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

    posthog?.capture('game_result_shared', {
      game_id: gameId,
      share_method: shared ? 'native_share' : 'clipboard',
      is_new_best: newBest,
    })
    posthog?.capture('result_shared', {
      game: gameId,
      mode: 'practice',
      share_method: shared ? 'native_share' : 'clipboard',
      is_new_best: newBest,
    })
    playCopy()
    flashSuccess(rootRef.current)
    setShareState('copied')
    setTimeout(() => setShareState('idle'), 1800)
  }

  return (
    <div ref={rootRef} className="flex flex-col items-center gap-10 py-10 text-center sm:py-16">
      {newBest && (
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

      {(percentile !== null || gapLine || progressLine) && (
        <div
          ref={insightRef}
          className="-mt-4 flex flex-col items-center gap-2 font-mono text-xs tracking-[0.14em] uppercase"
        >
          {percentile !== null && (
            <span className="text-text-muted">
              {SPEED_GAMES.includes(gameId) ? 'faster' : 'better'} than{' '}
              <span className={`font-semibold ${classes.text}`}>~{percentile}%</span> of people
            </span>
          )}
          <span className="text-text-dim">{[gapLine, progressLine].filter(Boolean).join(' · ')}</span>
        </div>
      )}

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
