import type { CSSProperties } from 'react'
import { SunIcon, MoonIcon } from '@heroicons/react/24/solid'
import { generateTango, isTangoSolved, type TangoSymbol } from '@/daily/tango/generateTango'
import { useDailyPuzzle } from '@/daily/shared/useDailyPuzzle'
import { DailyComplete } from '@/daily/shared/DailyComplete'
import { playClick } from '@/lib/sound/sfx'

interface TangoState {
  grid: TangoSymbol[]
}

function nextSymbol(sym: TangoSymbol): TangoSymbol {
  return sym === 0 ? 1 : sym === 1 ? 2 : 0
}

export function TangoGame() {
  const { puzzle, state, setState, progress, completedToday, complete } = useDailyPuzzle<
    ReturnType<typeof generateTango>,
    TangoState
  >('tango', generateTango, (p) => ({ grid: p.givens.slice() }))
  const { size, givens, hConstraints, vConstraints } = puzzle
  const grid = state.grid

  const toggle = (idx: number) => {
    if (completedToday || givens[idx] !== 0) return
    playClick()
    const next = grid.slice()
    next[idx] = nextSymbol(next[idx])
    setState({ grid: next })
    if (isTangoSolved(next, puzzle)) complete()
  }

  const trackSizes = (n: number) => Array.from({ length: 2 * n - 1 }, (_, i) => (i % 2 === 0 ? '1fr' : '0.26fr')).join(' ')

  return (
    <div className="flex flex-col items-center gap-6">
      {completedToday ? (
        <DailyComplete gameId="tango" progress={progress} />
      ) : (
        <>
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
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggle(idx)}
                  style={style}
                  className={`flex items-center justify-center rounded-md border transition-colors duration-100 ${
                    isGiven ? 'cursor-default border-border-strong bg-surface-raised' : 'cursor-pointer border-border bg-surface hover:bg-surface-hover'
                  }`}
                >
                  {value === 1 && <SunIcon className="h-1/2 w-1/2 text-accent-tango" />}
                  {value === 2 && <MoonIcon className="h-1/2 w-1/2 text-text" />}
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

          <p className="text-center text-sm text-text-muted">
            Tap a cell to cycle sun, moon, empty. Every row and column needs {size / 2} of each, never three in a
            row.
          </p>
        </>
      )}
    </div>
  )
}
