import { AIM_TRAINER, generateAimTargets } from '../../shared/gameConfig'
import type { AimTrainerRoundContent } from '../../shared/roundContent'

export function generateRoundContent(): AimTrainerRoundContent {
  return { targets: generateAimTargets(AIM_TRAINER.targetCount) }
}
