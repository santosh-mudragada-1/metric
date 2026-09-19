import { SEQUENCE_MEMORY, generateSequence } from '../../shared/gameConfig'
import type { SequenceMemoryRoundContent } from '../../shared/roundContent'

export function generateRoundContent(): SequenceMemoryRoundContent {
  return { sequence: generateSequence(SEQUENCE_MEMORY.maxLength) }
}
