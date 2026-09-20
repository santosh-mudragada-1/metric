import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { GAMES } from '@/games.config'
import type { GameId } from '@shared/types'

interface GamePickerProps {
  value: GameId
  onChange: (id: GameId) => void
  disabled?: boolean
  /** Games that can't be selected right now (e.g. unfair across the room's mixed device types). */
  lockedGameIds?: GameId[]
  /** Shown as a title/tooltip when the selected game is locked. */
  lockedReason?: string
}

export function GamePicker({ value, onChange, disabled, lockedGameIds, lockedReason }: GamePickerProps) {
  const valueLocked = lockedGameIds?.includes(value) ?? false

  return (
    <div className="relative">
      <select
        value={value}
        disabled={disabled}
        title={valueLocked ? lockedReason : undefined}
        onChange={(e) => onChange(e.target.value as GameId)}
        className="w-full cursor-pointer appearance-none rounded-full border border-border-strong bg-surface-raised
          py-3 pr-10 pl-4 font-display text-lg font-medium lowercase tracking-tight text-text outline-none
          focus:border-invert/60 disabled:cursor-default disabled:opacity-50"
      >
        {GAMES.map((game) => {
          const locked = lockedGameIds?.includes(game.id) ?? false
          return (
            <option key={game.id} value={game.id} disabled={locked}>
              {game.name}
              {locked ? ' — disabled' : ''}
            </option>
          )
        })}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-text-dim" />
    </div>
  )
}
