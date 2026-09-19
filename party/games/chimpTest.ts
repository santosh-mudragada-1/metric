import { generateChimpLevels } from '../../shared/gameConfig'
import type { ChimpTestRoundContent } from '../../shared/roundContent'

export function generateRoundContent(): ChimpTestRoundContent {
  return { levels: generateChimpLevels() }
}
