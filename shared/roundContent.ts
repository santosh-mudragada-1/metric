import type { AimTarget } from './gameConfig'

export interface ReactionTimeRoundContent {
  delays: number[]
}

export interface AimTrainerRoundContent {
  targets: AimTarget[]
}

export interface SequenceMemoryRoundContent {
  sequence: number[]
}

export interface NumberMemoryRoundContent {
  numbers: string[]
}

export interface ChimpTestRoundContent {
  /** `levels[i][k]` is the cell index holding number `k + 1` at level `i + 1`. */
  levels: number[][]
}

export interface VisualMemoryRoundContent {
  /** `levels[i]` is the set of cell indices lit up at level `i + 1`. */
  levels: number[][]
}

export interface VerbalMemoryRoundContent {
  words: string[]
}

export interface TypingRoundContent {
  text: string
}
