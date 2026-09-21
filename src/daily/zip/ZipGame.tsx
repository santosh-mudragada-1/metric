import { useRef, type CSSProperties } from 'react'
import { generateZip } from '@/daily/zip/generateZip'
import { useDailyPuzzle } from '@/daily/shared/useDailyPuzzle'
import { DailyComplete } from '@/daily/shared/DailyComplete'
import { Button } from '@/components/ui/Button'
import { playClick } from '@/lib/sound/sfx'

interface ZipState {
  path: number[]
}

function isAdjacent(size: number, a: number, b: number): boolean {
  const diff = Math.abs(a - b)
  if (diff === 1) return Math.floor(a / size) === Math.floor(b / size)
  return diff === size
}

function dirTo(size: number, from: number, to: number): 'up' | 'down' | 'left' | 'right' {
  if (to === from - size) return 'up'
  if (to === from + size) return 'down'
  if (to === from - 1) return 'left'
  return 'right'
}

const STUB_STYLE: Record<string, CSSProperties> = {
  up: { left: '32%', top: 0, width: '36%', height: '50%' },
  down: { left: '32%', top: '50%', width: '36%', height: '50%' },
  left: { left: 0, top: '32%', width: '50%', height: '36%' },
  right: { left: '50%', top: '32%', width: '50%', height: '36%' },
}

export function ZipGame() {
  const { puzzle, state, setState, progress, completedToday, complete } = useDailyPuzzle<
    ReturnType<typeof generateZip>,
    ZipState
  >('zip', generateZip, () => ({ path: [] }))
  const drawing = useRef(false)
  const { size, checkpoints } = puzzle
  const total = size * size
  const path = state.path

  const nextRequired = path.filter((idx) => checkpoints[idx] !== 0).length + 1

  const extendTo = (idx: number) => {
    if (completedToday) return
    const existingIndex = path.indexOf(idx)
    if (existingIndex !== -1) {
      setState((prev) => ({ path: prev.path.slice(0, existingIndex + 1) }))
      return
    }
    if (path.length === 0) {
      if (checkpoints[idx] !== 1) return
      setState({ path: [idx] })
      return
    }
    const last = path[path.length - 1]
    if (!isAdjacent(size, last, idx)) return
    const cellNumber = checkpoints[idx]
    if (cellNumber !== 0 && cellNumber !== nextRequired) return
    const next = [...path, idx]
    setState({ path: next })
    if (next.length === total) complete()
  }

  const reset = () => {
    playClick()
    setState({ path: [] })
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {completedToday ? (
        <DailyComplete gameId="zip" progress={progress} />
      ) : (
        <>
          <div
            className="grid touch-none gap-1 select-none"
            style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`, width: 'min(92vw, 26rem)' }}
            onPointerDown={() => (drawing.current = true)}
            onPointerUp={() => (drawing.current = false)}
            onPointerLeave={() => (drawing.current = false)}
          >
            {Array.from({ length: total }, (_, idx) => {
              const posInPath = path.indexOf(idx)
              const inPath = posInPath !== -1
              const prevIdx = posInPath > 0 ? path[posInPath - 1] : null
              const nextIdx = posInPath !== -1 && posInPath < path.length - 1 ? path[posInPath + 1] : null
              const number = checkpoints[idx]

              return (
                <div
                  key={idx}
                  onPointerDown={() => extendTo(idx)}
                  onPointerEnter={() => drawing.current && extendTo(idx)}
                  className={`relative aspect-square rounded-md border transition-colors duration-100 ${
                    inPath ? 'border-accent-zip/60 bg-accent-zip-dim' : 'border-border bg-surface'
                  }`}
                >
                  {inPath && prevIdx !== null && (
                    <div
                      className="absolute rounded-sm bg-accent-zip/70"
                      style={STUB_STYLE[dirTo(size, idx, prevIdx)]}
                    />
                  )}
                  {inPath && nextIdx !== null && (
                    <div
                      className="absolute rounded-sm bg-accent-zip/70"
                      style={STUB_STYLE[dirTo(size, idx, nextIdx)]}
                    />
                  )}
                  {number !== 0 && (
                    <span
                      className={`relative z-10 flex h-full w-full items-center justify-center font-display text-lg
                        font-semibold ${inPath ? 'text-on-invert' : 'text-text'}`}
                    >
                      <span
                        className={`flex h-[62%] w-[62%] items-center justify-center rounded-full ${
                          inPath ? 'bg-accent-zip text-on-invert' : 'border border-border-strong text-text'
                        }`}
                      >
                        {number}
                      </span>
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          <p className="text-center text-sm text-text-muted">
            Drag from 1 through every number, filling every square, without lifting your finger.
          </p>
          <Button variant="ghost" onClick={reset}>
            Reset path
          </Button>
        </>
      )}
    </div>
  )
}
