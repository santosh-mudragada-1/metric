import { generateTypingPassage } from '../../shared/gameConfig'
import type { TypingRoundContent } from '../../shared/roundContent'

export function generateRoundContent(): TypingRoundContent {
  return { text: generateTypingPassage() }
}
