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
    // localStorage unavailable (private mode / quota) — fail silently, it's an enhancement only
  }
}

export interface ReactionTimeBest {
  bestMs: number
  lastPlayedAt: string
}

export interface AimTrainerBest {
  bestHits: number
  bestAccuracy: number
  lastPlayedAt: string
}

export interface SequenceMemoryBest {
  bestLevel: number
  lastPlayedAt: string
}

export interface NumberMemoryBest {
  bestDigits: number
  lastPlayedAt: string
}

export interface ChimpTestBest {
  bestLevel: number
  lastPlayedAt: string
}

export interface VisualMemoryBest {
  bestLevel: number
  lastPlayedAt: string
}

export interface VerbalMemoryBest {
  bestScore: number
  lastPlayedAt: string
}

export interface TypingBest {
  bestWpm: number
  bestAccuracy: number
  lastPlayedAt: string
}

export interface Bests {
  'reaction-time'?: ReactionTimeBest
  'aim-trainer'?: AimTrainerBest
  'sequence-memory'?: SequenceMemoryBest
  'number-memory'?: NumberMemoryBest
  'chimp-test'?: ChimpTestBest
  'visual-memory'?: VisualMemoryBest
  'verbal-memory'?: VerbalMemoryBest
  typing?: TypingBest
}

export function getBests(): Bests {
  return read<Bests>('bests', {})
}

export function setBest<K extends keyof Bests>(gameId: K, value: NonNullable<Bests[K]>): void {
  const bests = getBests()
  bests[gameId] = value
  write('bests', bests)
}

export interface Profile {
  clientPlayerId: string
  name: string
}

export function getProfile(): Profile | null {
  return read<Profile | null>('profile', null)
}

export function setProfile(profile: Profile): void {
  write('profile', profile)
}

export function getMuted(): boolean {
  return read<boolean>('muted', false)
}

export function setMuted(muted: boolean): void {
  write('muted', muted)
}

export function getStatsMigrated(): boolean {
  return read<boolean>('statsMigrated', false)
}

export function setStatsMigrated(): void {
  write('statsMigrated', true)
}

export type Theme = 'dark' | 'light'

export function getStoredTheme(): Theme | null {
  return read<Theme | null>('theme', null)
}

export function setStoredTheme(theme: Theme): void {
  write('theme', theme)
}

export type DailyGameId = 'zip' | 'tango' | 'queens' | 'patches' | 'hardword'

export interface DailyProgress {
  streak: number
  lastCompletedDate: string | null
  totalCompleted: number
}

export type DailyProgressMap = Partial<Record<DailyGameId, DailyProgress>>

const EMPTY_DAILY_PROGRESS: DailyProgress = { streak: 0, lastCompletedDate: null, totalCompleted: 0 }

// v3: bumped again to invalidate progress saved by earlier test builds while iterating on the
// Daily tab's redesign — every player starts fresh once this ships.
export function getDailyProgress(gameId: DailyGameId): DailyProgress {
  const map = read<DailyProgressMap>('dailyProgressV3', {})
  return map[gameId] ?? EMPTY_DAILY_PROGRESS
}

export function recordDailyCompletion(gameId: DailyGameId, today: string, yesterday: string): DailyProgress {
  const map = read<DailyProgressMap>('dailyProgressV3', {})
  const prev = map[gameId] ?? EMPTY_DAILY_PROGRESS

  if (prev.lastCompletedDate === today) return prev // already recorded today

  const nextStreak = prev.lastCompletedDate === yesterday ? prev.streak + 1 : 1
  const next: DailyProgress = {
    streak: nextStreak,
    lastCompletedDate: today,
    totalCompleted: prev.totalCompleted + 1,
  }
  map[gameId] = next
  write('dailyProgressV3', map)
  return next
}

export interface DailyTimeRecord {
  date: string
  ms: number
}

export type DailyTimesMap = Partial<Record<DailyGameId, DailyTimeRecord[]>>

/** How many past solve times to keep per game — enough for a stable average without the array
 *  growing without bound. */
const MAX_TIME_HISTORY = 365

export function getDailyTimes(gameId: DailyGameId): DailyTimeRecord[] {
  const map = read<DailyTimesMap>('dailyTimesV1', {})
  return map[gameId] ?? []
}

/** Records how long today's puzzle took, once per day — a duplicate call for the same date
 *  (e.g. a re-render racing the completion effect) is a no-op. */
export function recordDailyTime(gameId: DailyGameId, date: string, ms: number): DailyTimeRecord[] {
  const map = read<DailyTimesMap>('dailyTimesV1', {})
  const list = map[gameId] ?? []
  if (list.some((r) => r.date === date)) return list
  const next = [...list, { date, ms }].slice(-MAX_TIME_HISTORY)
  map[gameId] = next
  write('dailyTimesV1', map)
  return next
}

export interface DailyTimeStats {
  todayMs: number | null
  avgMs: number | null
  count: number
}

export function getDailyTimeStats(gameId: DailyGameId, dateKey: string): DailyTimeStats {
  const list = getDailyTimes(gameId)
  const today = list.find((r) => r.date === dateKey)
  const avgMs = list.length > 0 ? Math.round(list.reduce((sum, r) => sum + r.ms, 0) / list.length) : null
  return { todayMs: today?.ms ?? null, avgMs, count: list.length }
}

/** Tracks when today's attempt at a puzzle began, so a mid-solve refresh keeps counting from the
 *  original start rather than resetting to zero. */
export function getDailyTimerStart(gameId: DailyGameId, dateKey: string): number | null {
  const wrapper = read<{ date: string; startedAt: number } | null>(`dailyTimerV1:${gameId}`, null)
  if (!wrapper || wrapper.date !== dateKey) return null
  return wrapper.startedAt
}

/** Returns today's start timestamp, creating one now if this is the first call today. */
export function getOrStartDailyTimer(gameId: DailyGameId, dateKey: string): number {
  const existing = getDailyTimerStart(gameId, dateKey)
  if (existing !== null) return existing
  const startedAt = Date.now()
  write(`dailyTimerV1:${gameId}`, { date: dateKey, startedAt })
  return startedAt
}

/** Persists in-progress board state per game per day, so a refresh doesn't lose work. */
export function getDailyState<T>(gameId: DailyGameId, dateKey: string, fallback: T): T {
  const wrapper = read<{ date: string; value: T } | null>(`dailyStateV3:${gameId}`, null)
  if (!wrapper || wrapper.date !== dateKey) return fallback
  return wrapper.value
}

export function setDailyState<T>(gameId: DailyGameId, dateKey: string, value: T): void {
  write(`dailyStateV3:${gameId}`, { date: dateKey, value })
}
