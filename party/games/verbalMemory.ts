import { generateVerbalMemoryWords } from '../../shared/gameConfig'
import type { VerbalMemoryRoundContent } from '../../shared/roundContent'

export function generateRoundContent(): VerbalMemoryRoundContent {
  return { words: generateVerbalMemoryWords() }
}
