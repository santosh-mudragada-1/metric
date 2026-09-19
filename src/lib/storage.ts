const NAMESPACE = 'reflex-arena:v1'

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

export interface Bests {
  'reaction-time'?: ReactionTimeBest
  'aim-trainer'?: AimTrainerBest
  'sequence-memory'?: SequenceMemoryBest
  'number-memory'?: NumberMemoryBest
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
