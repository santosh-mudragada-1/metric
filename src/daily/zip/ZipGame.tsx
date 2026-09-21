import { useRef, type CSSProperties } from 'react'
import { generateZip } from '@/daily/zip/generateZip'
import { zipColorAt } from '@/daily/zip/pathColor'
import { useDailyPuzzle } from '@/daily/shared/useDailyPuzzle'
import { useHistory } from '@/daily/shared/useHistory'
import { useCelebration } from '@/daily/shared/useCelebration'
import { DailyGameCard } from '@/daily/shared/DailyGameCard'
import { PuzzleHelp } from '@/daily/shared/PuzzleHelp'
import { Button } from '@/components/ui/Button'
import { ArrowUturnLeftIcon, SparklesIcon } from '@heroicons/react/24/outline'
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

function ZipDiagram() {
  return (
    <div className="flex items-center justify-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink font-display text-xs font-bold text-chalk">
            {i + 1}
          </span>
          {i < 2 && <span className="h-1 w-6 rounded-full" style={{ backgroundColor: zipColorAt(i / 2) }} />}
        </div>
      ))}
    </div>
  )
}

export function ZipGame() {
  const { puzzle, state, setState, progress, completedToday, complete } = useDailyPuzzle<
    ReturnType<typeof generateZip>,
    ZipState
  >('zip', generateZip, () => ({ path: [] }))
  const { pushAndSet, undo, canUndo } = useHistory(state, setState)
  const { celebrating, trigger } = useCelebration(complete)
  const drawing = useRef(false)
  const { size, checkpoints, solutionPath } = puzzle
  const total = size * size
  const path = state.path

  const nextRequired = path.filter((idx) => checkpoints[idx] !== 0).length + 1

  const extendTo = (idx: number) => {
    if (celebrating) return
    const existingIndex = path.indexOf(idx)
    if (existingIndex !== -1) {
      pushAndSet((prev) => ({ path: prev.path.slice(0, existingIndex + 1) }))
      return
    }
    if (path.length === 0) {
      if (checkpoints[idx] !== 1) return
      pushAndSet({ path: [idx] })
      return
    }
    const last = path[path.length - 1]
    if (!isAdjacent(size, last, idx)) return
    const cellNumber = checkpoints[idx]
    if (cellNumber !== 0 && cellNumber !== nextRequired) return
    const next = [...path, idx]
    pushAndSet({ path: next })
    if (next.length === total) {
      const step = 480 / total
      trigger(step * total + 380)
    }
  }

  const hint = () => {
    if (celebrating || path.length >= total) return
    playClick()
    const next = solutionPath.slice(0, Math.min(path.length + 1, total))
    pushAndSet({ path: next })
    if (next.length === total) {
      const step = 480 / total
      trigger(step * total + 380)
    }
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
            const celebrateStyle: CSSProperties =
              celebrating && inPath ? { animation: 'zip-travel 380ms ease-out both', animationDelay: `${posInPath * (480 / total)}ms` } : {}

            return (
              <div
                key={idx}
                onPointerDown={() => extendTo(idx)}
                onPointerEnter={() => drawing.current && extendTo(idx)}
                className={`relative aspect-square rounded-md border transition-colors duration-100 ${
                  inPath ? 'border-transparent' : 'border-border bg-surface hover:bg-surface-hover'
                }`}
              >
                {inPath && color && (
                  <div className="celebrate-cell absolute inset-0" style={celebrateStyle}>
                    <div className="absolute inset-[16%] rounded-full" style={{ backgroundColor: color }} />
                    {prevIdx !== null && (
                      <div className="absolute rounded-full" style={{ ...STUB_STYLE[dirTo(size, idx, prevIdx)], backgroundColor: color }} />
                    )}
                    {nextIdx !== null && (
                      <div className="absolute rounded-full" style={{ ...STUB_STYLE[dirTo(size, idx, nextIdx)], backgroundColor: color }} />
                    )}
                  </div>
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

        <div className="flex items-center gap-3">
          <Button variant="ghost" disabled={!canUndo || celebrating} onClick={undo}>
            <ArrowUturnLeftIcon className="h-4 w-4 shrink-0" />
            Undo
          </Button>
          <Button variant="ghost" disabled={celebrating || path.length >= total} onClick={hint}>
            <SparklesIcon className="h-4 w-4 shrink-0" />
            Hint
          </Button>
        </div>

        <PuzzleHelp
          tip={
            <>
              Trace outward from checkpoint <strong className="text-text">1</strong> first — a wrong turn early is easier to
              back out of than one near the end of all {total} cells.
            </>
          }
          diagram={<ZipDiagram />}
          rules={
            <>
              Drag from checkpoint 1 through every following number, in order, without lifting your finger. The path must pass
              through every square on the board exactly once.
            </>
          }
        />
      </div>
    </DailyGameCard>
  )
}
