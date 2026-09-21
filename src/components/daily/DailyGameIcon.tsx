import type { ReactNode } from 'react'
import type { DailyGameId } from '@/lib/storage'
import { DAILY_ACCENT_CLASSES, DAILY_GAME_MAP } from '@/dailyGames.config'

const GLYPHS: Record<DailyGameId, ReactNode> = {
  zip: (
    <path
      d="M4 6h5a2 2 0 0 1 2 2 2 2 0 0 1-2 2H9a2 2 0 0 0-2 2 2 2 0 0 0 2 2h5a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  tango: (
    <>
      <circle cx="9" cy="9" r="4" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M15.5 12a4 4 0 1 1 0-6 5 5 0 0 0 0 6Z"
        fill="currentColor"
      />
    </>
  ),
  queens: (
    <path
      d="M5 17h14M5 17l-1-7 4 3 4-6 4 6 4-3-1 7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  patches: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <rect x="13" y="4" width="7" height="4.5" rx="1.2" fill="currentColor" />
      <rect x="13" y="10.5" width="7" height="4.5" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <rect x="4" y="13" width="7" height="7" rx="1.2" fill="currentColor" />
    </>
  ),
  hardword: (
    <>
      <rect x="3.5" y="9.5" width="4.2" height="4.2" rx="0.8" fill="currentColor" />
      <rect x="9.9" y="9.5" width="4.2" height="4.2" rx="0.8" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <rect x="16.3" y="9.5" width="4.2" height="4.2" rx="0.8" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </>
  ),
}

export function DailyGameIcon({ gameId, className = '' }: { gameId: DailyGameId; className?: string }) {
  const game = DAILY_GAME_MAP[gameId]
  const classes = DAILY_ACCENT_CLASSES[game.accent]

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-xl border border-border ${classes.bgDim} ${classes.text} ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-[55%] w-[55%]">
        {GLYPHS[gameId]}
      </svg>
    </div>
  )
}
