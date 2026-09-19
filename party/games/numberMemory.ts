import { NUMBER_MEMORY, generateNumber } from '../../shared/gameConfig'
import type { NumberMemoryRoundContent } from '../../shared/roundContent'

export function generateRoundContent(): NumberMemoryRoundContent {
  return {
    numbers: Array.from({ length: NUMBER_MEMORY.maxRounds }, (_, i) => generateNumber(NUMBER_MEMORY.startDigits + i)),
  }
}
