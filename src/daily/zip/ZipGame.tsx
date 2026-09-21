import { useRef, type CSSProperties } from 'react'
import { generateZip } from '@/daily/zip/generateZip'
import { zipColorAt } from '@/daily/zip/pathColor'
import { useDailyPuzzle } from '@/daily/shared/useDailyPuzzle'
import { DailyGameCard } from '@/daily/shared/DailyGameCard'
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
  up: { left: '26%', top: 0, width: '48%', height: '54%' },
  down: { left: '26%', top: '46%', width: '48%', height: '54%' },
  left: { left: 0, top: '26%', width: '54%', height: '48%' },
  right: { left: '46%', top: '26%', width: '54%', height: '48%' },
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
    <DailyGameCard gameId="zip" completedToday={completedToday} progress={progress} hasProgress={path.length > 0}>
      <div className="flex flex-col items-center gap-6">
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
            const color = inPath ? zipColorAt(posInPath / Math.max(total - 1, 1)) : null

            return (
              <div
                key={idx}
                onPointerDown={() => extendTo(idx)}
                onPointerEnter={() => drawing.current && extendTo(idx)}
                className={`relative aspect-square rounded-md border transition-colors duration-100 ${
                  inPath ? 'border-transparent' : 'border-border bg-surface'
                }`}
              >
                {inPath && color && (
                  <>
                    <div className="absolute inset-[16%] rounded-full" style={{ backgroundColor: color }} />
                    {prevIdx !== null && (
                      <div className="absolute rounded-full" style={{ ...STUB_STYLE[dirTo(size, idx, prevIdx)], backgroundColor: color }} />
                    )}
                    {nextIdx !== null && (
                      <div className="absolute rounded-full" style={{ ...STUB_STYLE[dirTo(size, idx, nextIdx)], backgroundColor: color }} />
                    )}
                  </>
                )}
                {number !== 0 && (
                  <span className="relative z-10 flex h-full w-full items-center justify-center font-display text-lg font-semibold">
                    <span className="flex h-[62%] w-[62%] items-center justify-center rounded-full bg-ink text-chalk">
                      {number}
                    </span>
                  </span>
                )}
              </div>
            )
          })}
        </div>

        <Button variant="ghost" onClick={reset}>
          Reset path
        </Button>
      </div>
    </DailyGameCard>
  )
}
