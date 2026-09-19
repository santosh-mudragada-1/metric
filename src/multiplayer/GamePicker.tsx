import { GAMES, type GameConfig } from '@/games.config'
import type { GameId } from '@shared/types'

const DOT_CLASSES: Record<GameConfig['accent'], string> = {
  reaction: 'bg-accent-reaction',
  aim: 'bg-accent-aim',
  sequence: 'bg-accent-sequence',
  number: 'bg-accent-number',
}

interface GamePickerProps {
  value: GameId
  onChange: (id: GameId) => void
  disabled?: boolean
}

export function GamePicker({ value, onChange, disabled }: GamePickerProps) {
  return (
    <div className="flex flex-col divide-y divide-border border-y border-border">
      {GAMES.map((game) => {
        const selected = game.id === value
        return (
          <button
            key={game.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(game.id)}
            className={`flex cursor-pointer items-center gap-3 py-3.5 text-left transition-colors
              disabled:cursor-default disabled:pointer-events-none ${selected ? 'text-text' : 'text-text-muted hover:text-text'}`}
          >
            <span className={`h-2 w-2 shrink-0 rounded-full transition-colors ${selected ? DOT_CLASSES[game.accent] : 'bg-text-dim'}`} />
            <span className="font-display text-lg font-medium lowercase tracking-tight">{game.name}</span>
            {selected && (
              <span className="ml-auto font-mono text-[0.6875rem] tracking-[0.14em] text-text-dim uppercase">selected</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
