import { LockClosedIcon } from '@heroicons/react/24/outline'
import { GAMES, type GameConfig } from '@/games.config'
import type { GameId } from '@shared/types'

const DOT_CLASSES: Record<GameConfig['accent'], string> = {
  reaction: 'bg-accent-reaction',
  aim: 'bg-accent-aim',
  sequence: 'bg-accent-sequence',
  number: 'bg-accent-number',
  chimp: 'bg-accent-chimp',
  visual: 'bg-accent-visual',
  verbal: 'bg-accent-verbal',
  typing: 'bg-accent-typing',
}

interface GamePickerProps {
  value: GameId
  onChange: (id: GameId) => void
  disabled?: boolean
  /** Games that can't be selected right now (e.g. unfair across the room's mixed device types). */
  lockedGameIds?: GameId[]
  /** Shown as a title/tooltip on locked games. */
  lockedReason?: string
}

export function GamePicker({ value, onChange, disabled, lockedGameIds, lockedReason }: GamePickerProps) {
  return (
    <div className="flex flex-col divide-y divide-border border-y border-border">
      {GAMES.map((game) => {
        const selected = game.id === value
        const locked = lockedGameIds?.includes(game.id) ?? false
        return (
          <button
            key={game.id}
            type="button"
            disabled={disabled || locked}
            title={locked ? lockedReason : undefined}
            onClick={() => onChange(game.id)}
            className={`flex cursor-pointer items-center gap-3 py-3.5 text-left transition-colors
              disabled:cursor-default disabled:pointer-events-none ${locked ? 'opacity-40' : ''}
              ${selected ? 'text-text' : 'text-text-muted hover:text-text'}`}
          >
            <span className={`h-2 w-2 shrink-0 rounded-full transition-colors ${selected ? DOT_CLASSES[game.accent] : 'bg-text-dim'}`} />
            <span className="font-display text-lg font-medium lowercase tracking-tight">{game.name}</span>
            {locked ? (
              <LockClosedIcon className="ml-auto h-3.5 w-3.5 shrink-0 text-text-dim" />
            ) : (
              selected && (
                <span className="ml-auto font-mono text-[0.6875rem] tracking-[0.14em] text-text-dim uppercase">selected</span>
              )
            )}
          </button>
        )
      })}
    </div>
  )
}
