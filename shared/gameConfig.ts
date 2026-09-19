import type { GameResult } from './types'

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
  }
}
