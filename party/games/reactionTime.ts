import { REACTION_TIME, generateReactionDelay } from '../../shared/gameConfig'
import type { ReactionTimeRoundContent } from '../../shared/roundContent'

export function generateRoundContent(): ReactionTimeRoundContent {
  return { delays: Array.from({ length: REACTION_TIME.rounds }, () => generateReactionDelay()) }
}
