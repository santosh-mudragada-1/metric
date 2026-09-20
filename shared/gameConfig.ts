import type { DeviceType, GameId, GameResult, Player } from './types'
import { WORD_BANK } from './wordBank'

/**
 * Games where touch input (mobile/tablet) vs. mouse+keyboard (desktop) meaningfully changes
 * how fast or precise a player can be — disabled in a room once players span more than one
 * device type, so nobody's stuck competing on an uneven playing field.
 */
export const DEVICE_SENSITIVE_GAMES: GameId[] = ['reaction-time', 'aim-trainer', 'typing']

export function connectedDeviceTypes(players: Player[]): Set<DeviceType> {
  return new Set(players.filter((p) => p.connected).map((p) => p.device))
}

export function hasMixedDevices(players: Player[]): boolean {
  return connectedDeviceTypes(players).size > 1
}

export function isGameAllowedForPlayers(gameId: GameId, players: Player[]): boolean {
  if (!DEVICE_SENSITIVE_GAMES.includes(gameId)) return true
  return !hasMixedDevices(players)
}

export const REACTION_TIME = {
  rounds: 5,
  minDelayMs: 1200,
  maxDelayMs: 3800,
}

export const AIM_TRAINER = {
  targetCount: 30,
  targetRadiusPct: 0.045,
  minSpawnGapMs: 120,
  maxSpawnGapMs: 380,
}

export const SEQUENCE_MEMORY = {
  gridSize: 9,
  startLength: 1,
  maxLength: 24,
  flashOnMs: 480,
  flashGapMs: 260,
  betweenRoundsMs: 900,
}

export const NUMBER_MEMORY = {
  startDigits: 3,
  maxRounds: 16,
  baseDisplayMs: 1800,
  perDigitDisplayMs: 500,
  betweenRoundsMs: 900,
}

export const CHIMP_TEST = {
  columns: 6,
  rows: 5,
  startTiles: 4,
  maxLevel: 20,
  betweenRoundsMs: 900,
}

export const VISUAL_MEMORY = {
  gridSize: 5,
  startTiles: 3,
  maxLevel: 20,
  showMs: 2200,
  betweenRoundsMs: 900,
}

export const VERBAL_MEMORY = {
  lives: 3,
  sequenceLength: 120,
  repeatProbability: 0.5,
}

export const TYPING = {
  wordCount: 40,
  timeLimitMs: 60_000,
}

export function generateReactionDelay(): number {
  return REACTION_TIME.minDelayMs + Math.random() * (REACTION_TIME.maxDelayMs - REACTION_TIME.minDelayMs)
}

export interface AimTarget {
  x: number
  y: number
}

export function generateAimTargets(count: number = AIM_TRAINER.targetCount): AimTarget[] {
  const margin = AIM_TRAINER.targetRadiusPct + 0.03
  const targets: AimTarget[] = []
  for (let i = 0; i < count; i++) {
    targets.push({
      x: margin + Math.random() * (1 - margin * 2),
      y: margin + Math.random() * (1 - margin * 2),
    })
  }
  return targets
}

export function generateSequence(length: number, gridSize: number = SEQUENCE_MEMORY.gridSize): number[] {
  const sequence: number[] = []
  for (let i = 0; i < length; i++) {
    sequence.push(Math.floor(Math.random() * gridSize))
  }
  return sequence
}

export function extendSequence(sequence: number[], gridSize: number = SEQUENCE_MEMORY.gridSize): number[] {
  return [...sequence, Math.floor(Math.random() * gridSize)]
}

export function generateNumber(digitCount: number): string {
  let digits = String(Math.floor(Math.random() * 9) + 1)
  for (let i = 1; i < digitCount; i++) {
    digits += String(Math.floor(Math.random() * 10))
  }
  return digits
}

export function numberDisplayMs(digitCount: number): number {
  return NUMBER_MEMORY.baseDisplayMs + digitCount * NUMBER_MEMORY.perDigitDisplayMs
}

function shuffledIndices(count: number): number[] {
  const indices = Array.from({ length: count }, (_, i) => i)
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }
  return indices
}

/** One chimp-test level: `tilesToShow` distinct cell indices, ordered — `positions[k]` is where number `k + 1` sits. */
export function generateChimpLevel(tilesToShow: number, cellCount: number = CHIMP_TEST.columns * CHIMP_TEST.rows): number[] {
  return shuffledIndices(cellCount).slice(0, tilesToShow)
}

export function generateChimpLevels(maxLevel: number = CHIMP_TEST.maxLevel): number[][] {
  return Array.from({ length: maxLevel }, (_, i) => generateChimpLevel(CHIMP_TEST.startTiles + i))
}

/** One visual-memory level: `tilesToShow` distinct cell indices to light up, order doesn't matter. */
export function generateVisualMemoryLevel(
  tilesToShow: number,
  cellCount: number = VISUAL_MEMORY.gridSize * VISUAL_MEMORY.gridSize,
): number[] {
  return shuffledIndices(cellCount)
    .slice(0, tilesToShow)
    .sort((a, b) => a - b)
}

export function generateVisualMemoryLevels(maxLevel: number = VISUAL_MEMORY.maxLevel): number[][] {
  return Array.from({ length: maxLevel }, (_, i) => generateVisualMemoryLevel(VISUAL_MEMORY.startTiles + i))
}

/** A sequence of words where each is either freshly introduced or a repeat of one already shown — the player judges which. */
export function generateVerbalMemoryWords(length: number = VERBAL_MEMORY.sequenceLength): string[] {
  const pool = shuffledIndices(WORD_BANK.length).map((i) => WORD_BANK[i])
  const seen: string[] = []
  const out: string[] = []
  let poolIndex = 0
  for (let i = 0; i < length; i++) {
    const prev = out[out.length - 1]
    // Exclude the immediately preceding word so a repeat never looks like a no-op.
    const repeatCandidates = seen.filter((w) => w !== prev)
    const poolExhausted = poolIndex >= pool.length
    const shouldRepeat = repeatCandidates.length > 0 && (poolExhausted || Math.random() < VERBAL_MEMORY.repeatProbability)
    if (shouldRepeat) {
      out.push(repeatCandidates[Math.floor(Math.random() * repeatCandidates.length)])
    } else {
      const word = pool[poolIndex++]
      out.push(word)
      seen.push(word)
    }
  }
  return out
}

export function wasWordSeenBefore(words: string[], index: number): boolean {
  return words.slice(0, index).includes(words[index])
}

export function generateTypingPassage(wordCount: number = TYPING.wordCount): string {
  const indices = shuffledIndices(WORD_BANK.length)
  const words: string[] = []
  for (let i = 0; i < wordCount; i++) {
    words.push(WORD_BANK[indices[i % indices.length]])
  }
  return words.join(' ')
}

export function scoreOf(result: GameResult): number {
  switch (result.gameId) {
    case 'reaction-time':
      return Math.max(0, Math.round(1000 - result.averageMs))
    case 'aim-trainer':
      return Math.round(result.accuracy) + result.hits * 2
    case 'sequence-memory':
      return result.levelReached * 10
    case 'number-memory':
      return result.digitsReached * 10
    case 'chimp-test':
      return result.levelReached * 10
    case 'visual-memory':
      return result.levelReached * 10
    case 'verbal-memory':
      return result.score * 5
    case 'typing':
      return result.wpm + Math.round(result.accuracy / 5)
  }
}
