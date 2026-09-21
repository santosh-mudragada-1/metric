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

export function getDailyProgress(gameId: DailyGameId): DailyProgress {
  const map = read<DailyProgressMap>('dailyProgress', {})
  return map[gameId] ?? EMPTY_DAILY_PROGRESS
}

export function recordDailyCompletion(gameId: DailyGameId, today: string, yesterday: string): DailyProgress {
  const map = read<DailyProgressMap>('dailyProgress', {})
  const prev = map[gameId] ?? EMPTY_DAILY_PROGRESS

  if (prev.lastCompletedDate === today) return prev // already recorded today

  const nextStreak = prev.lastCompletedDate === yesterday ? prev.streak + 1 : 1
  const next: DailyProgress = {
    streak: nextStreak,
    lastCompletedDate: today,
    totalCompleted: prev.totalCompleted + 1,
  }
  map[gameId] = next
  write('dailyProgress', map)
  return next
}

/** Persists in-progress board state per game per day, so a refresh doesn't lose work. */
export function getDailyState<T>(gameId: DailyGameId, dateKey: string, fallback: T): T {
  const wrapper = read<{ date: string; value: T } | null>(`dailyState:${gameId}`, null)
  if (!wrapper || wrapper.date !== dateKey) return fallback
  return wrapper.value
}

export function setDailyState<T>(gameId: DailyGameId, dateKey: string, value: T): void {
  write(`dailyState:${gameId}`, { date: dateKey, value })
}
