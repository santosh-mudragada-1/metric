/** Deterministic per-day RNG so every player gets the same daily puzzle for a given game. */

function hashStringToSeed(str: string): number {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return h >>> 0
}

function mulberry32(seed: number) {
  let a = seed
  return function random() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type Rng = () => number

export function todayKey(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function yesterdayKey(date = new Date()): string {
  const prev = new Date(date)
  prev.setDate(prev.getDate() - 1)
  return todayKey(prev)
}

/** Day-count since launch day, for a "Daily · day 123" style label. */
export function puzzleNumber(date = new Date()): number {
  const epoch = Date.UTC(2026, 8, 22)
  const utcToday = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  return Math.max(1, Math.floor((utcToday - epoch) / 86_400_000) + 1)
}

export function createDailyRng(gameId: string, date = new Date()): Rng {
  return mulberry32(hashStringToSeed(`${gameId}:${todayKey(date)}`))
}

export function pickRandom<T>(rng: Rng, items: T[]): T {
  return items[Math.floor(rng() * items.length)]
}

export function shuffle<T>(rng: Rng, items: T[]): T[] {
  const arr = items.slice()
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
