import type { CSSProperties } from 'react'
import { SunIcon, MoonIcon } from '@heroicons/react/24/solid'
import { ArrowPathIcon, ArrowUturnLeftIcon, SparklesIcon, XMarkIcon as XMarkOutline } from '@heroicons/react/24/outline'
import { generateTango, isTangoSolved, type TangoSymbol } from '@/daily/tango/generateTango'
import { useDailyPuzzle } from '@/daily/shared/useDailyPuzzle'
import { useHistory } from '@/daily/shared/useHistory'
import { useCelebration } from '@/daily/shared/useCelebration'
import { DailyGameCard } from '@/daily/shared/DailyGameCard'
import { PuzzleHelp } from '@/daily/shared/PuzzleHelp'
import { Button } from '@/components/ui/Button'
import { playClick } from '@/lib/sound/sfx'

interface TangoState {
  grid: TangoSymbol[]
}

function nextSymbol(sym: TangoSymbol): TangoSymbol {
  return sym === 0 ? 1 : sym === 1 ? 2 : 0
}

function MiniTangoCell({ icon, invalid }: { icon: 'sun' | 'moon'; invalid?: boolean }) {
  return (
    <div
      className={`relative flex h-6 w-6 items-center justify-center rounded-[4px] border ${
        invalid ? 'border-danger/60 bg-danger-dim' : 'border-border-strong bg-surface'
      }`}
    >
      {icon === 'sun' ? (
        <SunIcon className="h-3.5 w-3.5 text-accent-tango" />
      ) : (
        <MoonIcon className="h-3.5 w-3.5 text-text" />
      )}
      {invalid && <XMarkOutline className="absolute h-4 w-4 text-danger" />}
    </div>
  )
}

function TangoDiagram() {
  return (
    <div className="flex flex-col items-center gap-3 py-1">
      <div className="flex flex-col items-center gap-1.5">
        <div className="flex gap-1">
          <MiniTangoCell icon="sun" />
          <MiniTangoCell icon="sun" />
          <MiniTangoCell icon="sun" invalid />
        </div>
        <span className="text-xs font-semibold text-danger">never three in a row</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <MiniTangoCell icon="sun" />
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-raised font-mono text-xs font-bold text-text-muted">
            =
          </span>
          <MiniTangoCell icon="sun" />
        </div>
        <span className="text-xs text-text-muted">must match</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <MiniTangoCell icon="sun" />
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-raised font-mono text-xs font-bold text-text-muted">
            ×
          </span>
          <MiniTangoCell icon="moon" />
        </div>
        <span className="text-xs text-text-muted">must differ</span>
      </div>
    </div>
  )
}

export function TangoGame() {
  const { puzzle, state, setState, progress, completedToday, complete } = useDailyPuzzle<
    ReturnType<typeof generateTango>,
    TangoState
  >('tango', generateTango, (p) => ({ grid: p.givens.slice() }))
  const { pushAndSet, undo, canUndo } = useHistory(state, setState)
  const { celebrating, trigger } = useCelebration(complete)
  const { size, givens, hConstraints, vConstraints, solution } = puzzle
  const grid = state.grid

  const toggle = (idx: number) => {
    if (celebrating || givens[idx] !== 0) return
    playClick()
    const next = grid.slice()
    next[idx] = nextSymbol(next[idx])
    pushAndSet({ grid: next })
    if (isTangoSolved(next, puzzle)) trigger((2 * size - 2) * 40 + 340)
  }

  const hint = () => {
    if (celebrating) return
    const idx = grid.findIndex((v, i) => v === 0 && givens[i] === 0)
    if (idx === -1) return
    playClick()
    const next = grid.slice()
    next[idx] = solution[idx]
    pushAndSet({ grid: next })
    if (isTangoSolved(next, puzzle)) trigger((2 * size - 2) * 40 + 340)
  }

  const clear = () => {
    playClick()
    pushAndSet({ grid: givens.slice() })
  }

  const trackSizes = (n: number) => Array.from({ length: 2 * n - 1 }, (_, i) => (i % 2 === 0 ? '1fr' : '0.26fr')).join(' ')
  const hasProgress = grid.some((v, i) => v !== givens[i])

  return (
    <DailyGameCard gameId="tango" completedToday={completedToday} progress={progress} hasProgress={hasProgress}>
      <div className="flex flex-col items-center gap-6">
        <div
          className="grid select-none"
          style={{
            gridTemplateColumns: trackSizes(size),
            gridTemplateRows: trackSizes(size),
            width: 'min(92vw, 24rem)',
            aspectRatio: '1 / 1',
          }}
        >
          {Array.from({ length: size * size }, (_, idx) => {
            const r = Math.floor(idx / size)
            const c = idx % size
            const value = grid[idx]
            const isGiven = givens[idx] !== 0
            const style: CSSProperties = {
              gridColumnStart: 2 * c + 1,
              gridColumnEnd: 2 * c + 2,
              gridRowStart: 2 * r + 1,
              gridRowEnd: 2 * r + 2,
            }
            const iconStyle: CSSProperties = celebrating ? { animation: 'tango-settle 320ms ease-out both', animationDelay: `${(r + c) * 40}ms` } : {}
            return (
              <button
                key={idx}
                type="button"
                onClick={() => toggle(idx)}
                disabled={celebrating}
                style={style}
                className={`flex items-center justify-center rounded-md border transition-colors duration-100 ${
                  isGiven ? 'cursor-default border-border-strong bg-surface-raised' : 'cursor-pointer border-border bg-surface hover:bg-surface-hover'
                }`}
              >
                {value === 1 && <SunIcon className="celebrate-cell h-1/2 w-1/2 text-accent-tango" style={iconStyle} />}
                {value === 2 && <MoonIcon className="celebrate-cell h-1/2 w-1/2 text-text" style={iconStyle} />}
              </button>
            )
          })}

          {Object.entries(hConstraints).map(([key, rel]) => {
            const a = Number(key)
            const r = Math.floor(a / size)
            const c = a % size
            const style: CSSProperties = {
              gridColumnStart: 2 * c + 2,
              gridColumnEnd: 2 * c + 3,
              gridRowStart: 2 * r + 1,
              gridRowEnd: 2 * r + 2,
            }
            return (
              <div key={`h-${key}`} style={style} className="pointer-events-none flex items-center justify-center">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-raised font-mono text-xs font-bold text-text-muted">
                  {rel === '=' ? '=' : '×'}
                </span>
              </div>
            )
          })}
          {Object.entries(vConstraints).map(([key, rel]) => {
            const a = Number(key)
            const r = Math.floor(a / size)
            const c = a % size
            const style: CSSProperties = {
              gridColumnStart: 2 * c + 1,
              gridColumnEnd: 2 * c + 2,
              gridRowStart: 2 * r + 2,
              gridRowEnd: 2 * r + 3,
            }
            return (
              <div key={`v-${key}`} style={style} className="pointer-events-none flex items-center justify-center">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-raised font-mono text-xs font-bold text-text-muted">
                  {rel === '=' ? '=' : '×'}
                </span>
              </div>
            )
          })}
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" disabled={!hasProgress || celebrating} onClick={clear}>
            <ArrowPathIcon className="h-4 w-4 shrink-0" />
            Clear
          </Button>
          <Button variant="ghost" disabled={!canUndo || celebrating} onClick={undo}>
            <ArrowUturnLeftIcon className="h-4 w-4 shrink-0" />
            Undo
          </Button>
          <Button variant="ghost" disabled={celebrating} onClick={hint}>
            <SparklesIcon className="h-4 w-4 shrink-0" />
            Hint
          </Button>
        </div>

        <PuzzleHelp
          tip={
            <>
              Resolve cells joined by <strong className="text-text">=</strong> or <strong className="text-text">×</strong>{' '}
              marks first — they pin down a symbol before you have to think about the row and column balance.
            </>
          }
          diagram={<TangoDiagram />}
          rules={
            <>
              Tap a cell to cycle sun, moon, empty. Every row and column needs three of each symbol, and no symbol may repeat
              three times in a row. Cells joined by = must match; cells joined by × must differ.
            </>
          }
        />
      </div>
    </DailyGameCard>
  )
}
