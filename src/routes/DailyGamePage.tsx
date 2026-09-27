import { useEffect } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { DAILY_GAME_MAP, isDailyGameId } from '@/dailyGames.config'
import { PageHeader } from '@/components/layout/PageHeader'
import { withViewTransition } from '@/lib/viewTransition'
import { ZipGame } from '@/daily/zip/ZipGame'
import { TangoGame } from '@/daily/tango/TangoGame'
import { QueensGame } from '@/daily/queens/QueensGame'
import { PatchesGame } from '@/daily/patches/PatchesGame'
import { HardwordGame } from '@/daily/hardword/HardwordGame'
import { gameScreenLeft } from '@/lib/myAnalytics'

export default function DailyGamePage() {
  const { gameId } = useParams<{ gameId: string }>()
  const navigate = useNavigate()
  useEffect(() => () => gameScreenLeft(), [gameId])

  if (!gameId || !isDailyGameId(gameId)) return <Navigate to="/daily" replace />

  const game = DAILY_GAME_MAP[gameId]

  return (
    <div className="pt-6">
      <PageHeader
        title={game.name}
        subtitle={game.blurb}
        onBack={() => withViewTransition(() => navigate('/daily'))}
        backLabel="Back to Daily"
      />
      {gameId === 'zip' && <ZipGame />}
      {gameId === 'tango' && <TangoGame />}
      {gameId === 'queens' && <QueensGame />}
      {gameId === 'patches' && <PatchesGame />}
      {gameId === 'hardword' && <HardwordGame />}
    </div>
  )
}
