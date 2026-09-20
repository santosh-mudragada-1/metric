import { useEffect, useRef, useState } from 'react'
import { ChevronDownIcon, LockClosedIcon } from '@heroicons/react/24/outline'
import { GAMES, GAME_MAP, type GameConfig } from '@/games.config'
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
  /** Shown as a title/tooltip when the selected game is locked. */
  lockedReason?: string
}

/** A themed dropdown (not the browser's native `<select>` popup) so it matches dark mode and can show each game's accent dot. */
export function GamePicker({ value, onChange, disabled, lockedGameIds, lockedReason }: GamePickerProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const selected = GAME_MAP[value]
  const valueLocked = lockedGameIds?.includes(value) ?? false

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        title={valueLocked ? lockedReason : undefined}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center gap-3 rounded-full border border-border-strong
          bg-surface-raised px-4 py-3 text-left outline-none transition-colors focus:border-invert/60
          disabled:cursor-default disabled:opacity-50"
      >
        <span className={`h-2 w-2 shrink-0 rounded-full ${DOT_CLASSES[selected.accent]}`} />
        <span className="font-display text-lg font-medium lowercase tracking-tight text-text">{selected.name}</span>
        <ChevronDownIcon
          className={`ml-auto h-4 w-4 shrink-0 text-text-dim transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          className="absolute top-[calc(100%+0.5rem)] left-0 z-40 w-full rounded-panel border border-border-strong
            bg-surface-raised p-1.5 shadow-[var(--shadow-card)]"
        >
          {GAMES.map((game) => {
            const isSelected = game.id === value
            const locked = lockedGameIds?.includes(game.id) ?? false
            return (
              <button
                key={game.id}
                type="button"
                disabled={locked}
                title={locked ? lockedReason : undefined}
                onClick={() => {
                  onChange(game.id)
                  setOpen(false)
                }}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-left
                  transition-colors disabled:cursor-default disabled:opacity-40
                  ${isSelected ? 'bg-surface-hover text-text' : 'text-text-muted hover:bg-surface-hover hover:text-text'}`}
              >
                <span className={`h-2 w-2 shrink-0 rounded-full ${DOT_CLASSES[game.accent]}`} />
                <span className="font-display text-base font-medium lowercase tracking-tight">{game.name}</span>
                {locked && <LockClosedIcon className="ml-auto h-3.5 w-3.5 shrink-0 text-text-dim" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
