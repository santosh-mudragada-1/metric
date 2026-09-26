import type { GameId } from '@shared/types'
import { SCORE_METRICS } from '@/lib/scoreMetrics'
import { getBests, type Bests } from '@/lib/storage'

const NAMESPACE = 'metric:v1'

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`${NAMESPACE}:${key}`)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`${NAMESPACE}:${key}`, JSON.stringify(value))
  } catch {
    // localStorage unavailable — progress tracking is an enhancement only
  }
}

/** Local calendar day, not UTC — a streak should roll over at the player's midnight. */
function dayKey(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function yesterdayKey(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return dayKey(d)
}

// ---------------------------------------------------------------------------------------------
// Run history — every completed solo run, per game, in SCORE_METRICS units.

export interface RunRecord {
  /** Metric value, same units as SCORE_METRICS[gameId]. */
  v: number
  /** Epoch ms. */
  t: number
}

type RunsMap = Partial<Record<GameId, RunRecord[]>>

const MAX_RUNS = 200

export function getRuns(gameId: GameId): RunRecord[] {
  return read<RunsMap>('runsV1', {})[gameId] ?? []
}

export function getAllRuns(): RunsMap {
  return read<RunsMap>('runsV1', {})
}

/** Records one completed run and bumps the play streak. */
export function recordRun(gameId: GameId, value: number): void {
  const map = read<RunsMap>('runsV1', {})
  map[gameId] = [...(map[gameId] ?? []), { v: value, t: Date.now() }].slice(-MAX_RUNS)
  write('runsV1', map)
  touchPlayStreak()
}

// ---------------------------------------------------------------------------------------------
// Play streak — consecutive local days with at least one completed run of any test.

interface PlayStreak {
  streak: number
  lastDate: string | null
}

export function touchPlayStreak(): PlayStreak {
  const prev = read<PlayStreak>('playStreakV1', { streak: 0, lastDate: null })
  const today = dayKey()
  if (prev.lastDate === today) return prev
  const next = { streak: prev.lastDate === yesterdayKey() ? prev.streak + 1 : 1, lastDate: today }
  write('playStreakV1', next)
  return next
}

export interface PlayStreakStatus {
  streak: number
  playedToday: boolean
}

/** A streak survives until the end of the day after it was last extended. */
export function getPlayStreak(): PlayStreakStatus {
  const s = read<PlayStreak>('playStreakV1', { streak: 0, lastDate: null })
  if (s.lastDate === dayKey()) return { streak: s.streak, playedToday: true }
  if (s.lastDate === yesterdayKey()) return { streak: s.streak, playedToday: false }
  return { streak: 0, playedToday: false }
}

// ---------------------------------------------------------------------------------------------
// Personal best, in the same units as the run history.

export function bestMetric(gameId: GameId, bests: Bests = getBests()): number | null {
  switch (gameId) {
    case 'reaction-time':
      return bests[gameId]?.bestMs ?? null
    case 'aim-trainer':
      return bests[gameId]?.bestAccuracy ?? null
    case 'sequence-memory':
    case 'chimp-test':
    case 'visual-memory':
      return bests[gameId]?.bestLevel ?? null
    case 'number-memory':
      return bests[gameId]?.bestDigits ?? null
    case 'verbal-memory':
      return bests[gameId]?.bestScore ?? null
    case 'typing':
      return bests[gameId]?.bestWpm ?? null
  }
}

export function isBetter(gameId: GameId, a: number, b: number): boolean {
  return SCORE_METRICS[gameId].direction === 'lower-better' ? a < b : a > b
}

// ---------------------------------------------------------------------------------------------
// Population percentile — rough normal fits to widely published human-benchmark distributions.
// Estimates only, so the copy rounds and hedges ("~"). Aim Trainer is left out: its accuracy
// metric has no comparable public baseline.

const POPULATION: Partial<Record<GameId, { mean: number; sd: number }>> = {
  'reaction-time': { mean: 275, sd: 50 },
  'sequence-memory': { mean: 8, sd: 3 },
  'number-memory': { mean: 8, sd: 2 },
  'chimp-test': { mean: 9, sd: 3 },
  'visual-memory': { mean: 9, sd: 3 },
  'verbal-memory': { mean: 45, sd: 22 },
  typing: { mean: 42, sd: 16 },
}

/** Abramowitz–Stegun erf approximation, accurate to ~1e-7. */
function erf(x: number): number {
  const sign = x < 0 ? -1 : 1
  const ax = Math.abs(x)
  const t = 1 / (1 + 0.3275911 * ax)
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-ax * ax)
  return sign * y
}

/** Share of people (1–99) this score beats, or null when the game has no baseline — or when the
 *  number would only sting (a rough run shouldn't end on "faster than 3% of people"). */
export function percentileFor(gameId: GameId, value: number): number | null {
  const pop = POPULATION[gameId]
  if (!pop || value <= 0) return null
  const z = (value - pop.mean) / pop.sd
  const cdf = 0.5 * (1 + erf(z / Math.SQRT2))
  const beaten = SCORE_METRICS[gameId].direction === 'lower-better' ? 1 - cdf : cdf
  const pct = Math.min(99, Math.round(beaten * 100))
  return pct >= 15 ? pct : null
}
