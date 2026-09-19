import { AimTrainerBoard } from '@/games/aim-trainer/AimTrainerBoard'
import { WaitingForOthers } from '../WaitingForOthers'
import { useAimTrainerMultiplayer } from './useAimTrainerMultiplayer'

export function AimTrainerMultiplayer() {
  const { phase, target, hits, totalTargets, streak, done, onHit, onMiss } = useAimTrainerMultiplayer()

  if (done) return <WaitingForOthers />

  return (
    <AimTrainerBoard
      phase={phase}
      target={target}
      hits={hits}
      totalTargets={totalTargets}
      streak={streak}
      onStart={() => {}}
      onHit={onHit}
      onMiss={onMiss}
    />
  )
}
