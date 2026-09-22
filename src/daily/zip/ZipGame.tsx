import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { generateZip } from '@/daily/zip/generateZip'
import { zipColorAt, ZIP_GRADIENT_STOPS } from '@/daily/zip/pathColor'
import { useDailyPuzzle } from '@/daily/shared/useDailyPuzzle'
import { useHistory } from '@/daily/shared/useHistory'
import { useCelebration } from '@/daily/shared/useCelebration'
import { DailyGameCard } from '@/daily/shared/DailyGameCard'
import { PuzzleHelp } from '@/daily/shared/PuzzleHelp'
import { Button } from '@/components/ui/Button'
import { ArrowPathIcon, ArrowUturnLeftIcon, CheckIcon, SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { playClick } from '@/lib/sound/sfx'

interface ZipState {
  path: number[]
}

function isAdjacent(size: number, a: number, b: number): boolean {
  const diff = Math.abs(a - b)
  if (diff === 1) return Math.floor(a / size) === Math.floor(b / size)
  return diff === size
}

function ZipDiagram() {
  return (
    <div className="flex flex-col items-center gap-3 py-1">
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink font-display text-xs font-bold text-chalk">
              {i + 1}
            </span>
            {i < 2 && <span className="h-1 w-6 rounded-full" style={{ backgroundColor: zipColorAt(i / 2) }} />}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1 text-xs font-semibold text-success">
          <CheckIcon className="h-3 w-3 shrink-0" /> adjacent move
        </span>
        <span className="flex items-center gap-1 text-xs font-semibold text-danger">
          <XMarkIcon className="h-3 w-3 shrink-0" /> jump ahead
        </span>
      </div>
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
  const { size, checkpoints, solutionPath } = puzzle
  const total = size * size
  const path = state.path

  const containerRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<SVGPathElement>(null)
  const drawing = useRef(false)
  const lastIdxRef = useRef<number | null>(null)
  const [rejectedIdx, setRejectedIdx] = useState<number | null>(null)
  const rejectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const nextRequired = path.filter((idx) => checkpoints[idx] !== 0).length + 1

  const sweepDuration = () => Math.min(1400, 480 + (total - 1) * 16)

  const extendTo = (idx: number): boolean => {
    if (celebrating) return false
    const existingIndex = path.indexOf(idx)
    if (existingIndex !== -1) {
      pushAndSet((prev) => ({ path: prev.path.slice(0, existingIndex + 1) }))
      return true
    }
    if (path.length === 0) {
      if (checkpoints[idx] !== 1) return false
      pushAndSet({ path: [idx] })
      return true
    }
    const last = path[path.length - 1]
    if (!isAdjacent(size, last, idx)) return false
    const cellNumber = checkpoints[idx]
    if (cellNumber !== 0 && cellNumber !== nextRequired) return false
    const next = [...path, idx]
    pushAndSet({ path: next })
    if (next.length === total) trigger(sweepDuration() + 260)
    return true
  }

  const flashReject = (idx: number) => {
    if (rejectTimer.current) clearTimeout(rejectTimer.current)
    setRejectedIdx(idx)
    rejectTimer.current = setTimeout(() => setRejectedIdx(null), 220)
  }

  const cellFromEvent = (e: ReactPointerEvent<HTMLDivElement>): number | null => {
    const el = containerRef.current
    if (!el) return null
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    if (x < 0 || y < 0 || x >= rect.width || y >= rect.height) return null
    const col = Math.min(size - 1, Math.floor((x / rect.width) * size))
    const row = Math.min(size - 1, Math.floor((y / rect.height) * size))
    return row * size + col
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (celebrating) return
    const idx = cellFromEvent(e)
    if (idx === null) return
    containerRef.current?.setPointerCapture(e.pointerId)
    drawing.current = true
    lastIdxRef.current = idx
    if (!extendTo(idx)) flashReject(idx)
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drawing.current) return
    const idx = cellFromEvent(e)
    if (idx === null || idx === lastIdxRef.current) return
    lastIdxRef.current = idx
    if (!extendTo(idx)) flashReject(idx)
  }

  const stopDrawing = () => {
    drawing.current = false
    lastIdxRef.current = null
  }

  const clear = () => {
    playClick()
    pushAndSet({ path: [] })
  }

  const hint = () => {
    if (celebrating || path.length >= total) return
    playClick()
    const next = solutionPath.slice(0, Math.min(path.length + 1, total))
    pushAndSet({ path: next })
    if (next.length === total) trigger(sweepDuration() + 260)
  }

  useEffect(() => {
    if (!celebrating || !glowRef.current) return
    const len = Math.max(path.length - 1, 1)
    glowRef.current.animate([{ strokeDashoffset: len + 4 }, { strokeDashoffset: -4 }], {
      duration: sweepDuration(),
      easing: 'linear',
      fill: 'forwards',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [celebrating])

  const points = path.map((idx) => ({ x: (idx % size) + 0.5, y: Math.floor(idx / size) + 0.5 }))
  const pathD = points.length > 0 ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ') : ''
  const pathLen = Math.max(points.length - 1, 1)
  const gradientId = 'zip-path-gradient'

  return (
    <DailyGameCard gameId="zip" completedToday={completedToday} progress={progress} hasProgress={path.length > 0}>
      <div className="flex flex-col items-center gap-6">
        <div
          ref={containerRef}
          className="relative touch-none select-none"
          style={{ width: 'min(92vw, 26rem)', aspectRatio: '1 / 1' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={stopDrawing}
          onPointerCancel={stopDrawing}
          onPointerLeave={stopDrawing}
        >
          <div
            className="absolute inset-0 grid overflow-hidden rounded-xl border border-border-strong"
            style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${size}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: total }, (_, idx) => (
              <div key={idx} className="relative border border-border/70">
                {rejectedIdx === idx && <div className="zip-reject-flash absolute inset-[10%] rounded-full bg-danger/50" />}
              </div>
            ))}
          </div>

          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox={`0 0 ${size} ${size}`}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient
                id={gradientId}
                gradientUnits="userSpaceOnUse"
                x1={points[0]?.x ?? 0}
                y1={points[0]?.y ?? 0}
                x2={points[points.length - 1]?.x ?? size}
                y2={points[points.length - 1]?.y ?? size}
              >
                {ZIP_GRADIENT_STOPS.map((stop, i) => (
                  <stop key={stop} offset={i / (ZIP_GRADIENT_STOPS.length - 1)} stopColor={stop} />
                ))}
              </linearGradient>
            </defs>
            {pathD && (
              <path
                d={pathD}
                fill="none"
                stroke={`url(#${gradientId})`}
                strokeWidth={0.34}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {pathD && celebrating && (
              <path
                ref={glowRef}
                d={pathD}
                fill="none"
                stroke="white"
                strokeOpacity={0.85}
                strokeWidth={0.34}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={`3 ${pathLen}`}
                strokeDashoffset={pathLen + 4}
              />
            )}
          </svg>

          <div
            className="pointer-events-none absolute inset-0 grid"
            style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${size}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: total }, (_, idx) => {
              const number = checkpoints[idx]
              const posInPath = path.indexOf(idx)
              const badgeStyle: CSSProperties =
                celebrating && posInPath !== -1
                  ? { animation: 'zip-travel 380ms ease-out both', animationDelay: `${(posInPath / Math.max(path.length - 1, 1)) * sweepDuration()}ms` }
                  : {}
              return (
                <div key={idx} className="relative flex items-center justify-center">
                  {number !== 0 && (
                    <span
                      className="flex h-[50%] w-[50%] items-center justify-center rounded-full bg-ink font-display text-lg font-semibold text-chalk"
                      style={badgeStyle}
                    >
                      {number}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" disabled={path.length === 0 || celebrating} onClick={clear}>
            <ArrowPathIcon className="h-4 w-4 shrink-0" />
            Clear
          </Button>
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
              Press and drag from checkpoint 1 through every following number, in order, without lifting your finger. The
              path must pass through every square on the board exactly once.
            </>
          }
        />
      </div>
    </DailyGameCard>
  )
}
