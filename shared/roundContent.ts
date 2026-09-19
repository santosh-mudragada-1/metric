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
