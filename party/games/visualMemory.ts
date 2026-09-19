import { generateVisualMemoryLevels } from '../../shared/gameConfig'
import type { VisualMemoryRoundContent } from '../../shared/roundContent'

export function generateRoundContent(): VisualMemoryRoundContent {
  return { levels: generateVisualMemoryLevels() }
}
