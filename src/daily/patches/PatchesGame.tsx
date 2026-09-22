import { useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { generatePatches, isPatchesSolved, PATCHES_PALETTE, type PatchesShape, type Rect } from '@/daily/patches/generatePatches'
import { useDailyPuzzle } from '@/daily/shared/useDailyPuzzle'
import { useHistory } from '@/daily/shared/useHistory'
import { useCelebration } from '@/daily/shared/useCelebration'
import { DailyGameCard } from '@/daily/shared/DailyGameCard'
import { PuzzleHelp } from '@/daily/shared/PuzzleHelp'
import { Button } from '@/components/ui/Button'
import { ArrowPathIcon, ArrowUturnLeftIcon, CheckIcon, SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { playClick } from '@/lib/sound/sfx'

interface PatchesState {
  rects: Rect[]
}

interface Point {
  x: number
  y: number
}

function boundsOf(a: Point, b: Point): Rect {
  const x = Math.min(a.x, b.x)
  const y = Math.min(a.y, b.y)
  const w = Math.abs(a.x - b.x) + 1
  const h = Math.abs(a.y - b.y) + 1
  return { x, y, w, h }
}

function rectsEqual(a: Rect, b: Rect): boolean {
  return a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h
}

function cellsOf(rect: Rect, width: number): number[] {
  const out: number[] = []
  for (let y = rect.y; y < rect.y + rect.h; y++) {
    for (let x = rect.x; x < rect.x + rect.w; x++) out.push(y * width + x)
  }
  return out
}

const STRONG_BORDER = '2px solid var(--color-ink)'
const SEED_BORDER = '1px dashed var(--color-border)'

function darkenHex(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.round(((n >> 16) & 255) * (1 - amount))
  const g = Math.round(((n >> 8) & 255) * (1 - amount))
  const b = Math.round((n & 255) * (1 - amount))
  return `rgb(${r}, ${g}, ${b})`
}

/** Positions a rect as a single absolutely-positioned box within the board (percentage-based, so
 *  it tracks the grid at any size), inset by a fixed pixel gutter so adjacent regions read as
 *  distinct rounded shapes rather than one edge-to-edge slab. */
function rectStyle(rect: Rect, width: number, height: number, gutter: number): CSSProperties {
  const leftPct = (rect.x / width) * 100
  const topPct = (rect.y / height) * 100
  const wPct = (rect.w / width) * 100
  const hPct = (rect.h / height) * 100
  return {
    left: `calc(${leftPct}% + ${gutter}px)`,
    top: `calc(${topPct}% + ${gutter}px)`,
    width: `calc(${wPct}% - ${gutter * 2}px)`,
    height: `calc(${hPct}% - ${gutter * 2}px)`,
  }
}

/** A badge's width/height (as a fraction of its cell) — wide and tall clues get an
 *  aspect-ratio-hinting badge; square and ambiguous ("any") clues get an even one. */
function badgeSize(shape: PatchesShape): CSSProperties {
  switch (shape) {
    case 'wide':
      return { width: '72%', height: '42%' }
    case 'tall':
      return { width: '42%', height: '72%' }
    default:
      return { width: '56%', height: '56%' }
  }
}

function ShapeIcon({ shape }: { shape: PatchesShape }) {
  return (
    <span
      className={shape === 'any' ? 'patches-any-icon rounded-[3px] border-2 border-dashed border-text-dim' : 'rounded-[3px] bg-text-dim'}
      style={badgeSize(shape) as CSSProperties}
    />
  )
}

function PatchesShapeLegend() {
  return (
    <div className="w-full rounded-panel border border-border bg-surface p-4" style={{ maxWidth: 'min(92vw, 32rem)' }}>
      <p className="text-center font-display text-sm font-bold text-text">Complete each shape to fill the grid</p>
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center">
            <ShapeIcon shape="square" />
          </span>
          <span className="text-sm font-semibold text-text">Square</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center">
            <ShapeIcon shape="tall" />
          </span>
          <span className="text-sm font-semibold text-text">Tall rectangle</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center">
            <ShapeIcon shape="wide" />
          </span>
          <span className="text-sm font-semibold text-text">Wide rectangle</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center">
            <ShapeIcon shape="any" />
          </span>
          <span className="text-sm font-semibold text-text">Any of the above</span>
        </div>
      </div>
      <p className="mt-3 text-center text-sm text-text-muted">If a shape has a number, it must be that size.</p>
    </div>
  )
}

function PatchesDiagram() {
  // A 2x3 filled block reads as "valid rectangle"; the same 6-cell bounding box with one
  // corner left empty reads as the "L-shaped" case that Patches never allows.
  const lShapeFilled = [true, true, true, true, false, true]
  return (
    <div className="flex items-center justify-center gap-6 py-1">
      <div className="flex flex-col items-center gap-1.5">
        <div className="grid grid-cols-3 gap-0" style={{ width: '3.75rem' }}>
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="relative flex aspect-square items-center justify-center"
              style={{ backgroundColor: '#5b8defcc', border: STRONG_BORDER, borderWidth: '1.5px' }}
            >
              {i === 0 && <span className="text-[0.6rem] font-bold text-white">6</span>}
            </div>
          ))}
        </div>
        <span className="flex items-center gap-1 text-xs font-semibold text-success">
          <CheckIcon className="h-3 w-3 shrink-0" /> 2×3 rectangle
        </span>
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <div className="grid grid-cols-3 gap-0" style={{ width: '3.75rem' }}>
          {lShapeFilled.map((filled, i) => (
            <div
              key={i}
              className="relative flex aspect-square items-center justify-center"
              style={
                filled
                  ? { backgroundColor: '#5b8defcc', border: STRONG_BORDER, borderWidth: '1.5px' }
                  : { border: SEED_BORDER }
              }
            >
              {i === 0 && <span className="text-[0.6rem] font-bold text-white">6</span>}
            </div>
          ))}
        </div>
        <span className="flex items-center gap-1 text-xs font-semibold text-danger">
          <XMarkIcon className="h-3 w-3 shrink-0" /> L-shape, not allowed
        </span>
      </div>
    </div>
  )
}

export function PatchesGame() {
  const { puzzle, state, setState, progress, completedToday, complete } = useDailyPuzzle<
    ReturnType<typeof generatePatches>,
    PatchesState
  >('patches', generatePatches, () => ({ rects: [] }))
  const { pushAndSet, undo, canUndo } = useHistory(state, setState)
  const { celebrating, trigger } = useCelebration(complete)
  const { width, height, clues, solution } = puzzle
  const rects = state.rects

  const containerRef = useRef<HTMLDivElement>(null)
  const drawing = useRef(false)
  const lastCellRef = useRef<string | null>(null)
  const [dragStart, setDragStart] = useState<Point | null>(null)
  const [dragCurrent, setDragCurrent] = useState<Point | null>(null)
  const [rejectFlash, setRejectFlash] = useState(false)

  const clueAt = new Map(clues.map((c) => [c.idx, c]))
  const coveredBy = new Map<number, number>()
  rects.forEach((rect, ri) => cellsOf(rect, width).forEach((i) => coveredBy.set(i, ri)))

  // Per placed rectangle: its color (from whichever seed it contains), whether it's the right
  // size, and the cell at its geometric center (for the small "echo" badge once it's complete).
  const rectInfo = rects.map((rect, ri) => {
    const containedClue = clues.find((c) => {
      const cx = c.idx % width
      const cy = Math.floor(c.idx / width)
      return cx >= rect.x && cx < rect.x + rect.w && cy >= rect.y && cy < rect.y + rect.h
    })
    const color = containedClue?.color ?? PATCHES_PALETTE[ri % PATCHES_PALETTE.length]
    const isComplete = containedClue ? rect.w * rect.h === containedClue.value : true
    const centerX = rect.x + Math.floor((rect.w - 1) / 2)
    const centerY = rect.y + Math.floor((rect.h - 1) / 2)
    return { color, isComplete, clueIdx: containedClue?.idx, value: containedClue?.value, centerIdx: centerY * width + centerX }
  })

  const overlaps = (rect: Rect, excludeIdx?: number): boolean =>
    cellsOf(rect, width).some((i) => coveredBy.has(i) && coveredBy.get(i) !== excludeIdx)

  const beginDrag = (x: number, y: number) => {
    if (celebrating) return
    setDragStart({ x, y })
    setDragCurrent({ x, y })
  }

  const updateDrag = (x: number, y: number) => {
    if (!dragStart) return
    setDragCurrent({ x, y })
  }

  const cellFromEvent = (e: ReactPointerEvent<HTMLDivElement>): Point | null => {
    const el = containerRef.current
    if (!el) return null
    const rect = el.getBoundingClientRect()
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top
    if (px < 0 || py < 0 || px >= rect.width || py >= rect.height) return null
    const x = Math.min(width - 1, Math.floor((px / rect.width) * width))
    const y = Math.min(height - 1, Math.floor((py / rect.height) * height))
    return { x, y }
  }

  const onGridPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const cell = cellFromEvent(e)
    if (!cell) return
    containerRef.current?.setPointerCapture(e.pointerId)
    drawing.current = true
    lastCellRef.current = `${cell.x},${cell.y}`
    beginDrag(cell.x, cell.y)
  }

  const onGridPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drawing.current) return
    const cell = cellFromEvent(e)
    if (!cell) return
    const key = `${cell.x},${cell.y}`
    if (key === lastCellRef.current) return
    lastCellRef.current = key
    updateDrag(cell.x, cell.y)
  }

  const stopDrawing = () => {
    drawing.current = false
    lastCellRef.current = null
  }

  const endDrag = () => {
    stopDrawing()
    if (!dragStart || !dragCurrent) return
    const candidate = boundsOf(dragStart, dragCurrent)
    setDragStart(null)
    setDragCurrent(null)

    const isSingleCell = candidate.w === 1 && candidate.h === 1
    if (isSingleCell) {
      const idx = candidate.y * width + candidate.x
      const existingRectIdx = coveredBy.get(idx)
      if (existingRectIdx !== undefined) {
        playClick()
        const next = rects.filter((_, i) => i !== existingRectIdx)
        pushAndSet({ rects: next })
        return
      }
    }

    const matchIdx = rects.findIndex((r) => rectsEqual(r, candidate))
    if (matchIdx !== -1) {
      playClick()
      pushAndSet({ rects: rects.filter((_, i) => i !== matchIdx) })
      return
    }

    if (overlaps(candidate)) {
      setRejectFlash(true)
      setTimeout(() => setRejectFlash(false), 220)
      return
    }

    playClick()
    const next = [...rects, candidate]
    pushAndSet({ rects: next })
    if (isPatchesSolved(next, puzzle)) trigger(next.length * 60 + 320)
  }

  const hint = () => {
    if (celebrating) return
    const missing = solution.find((r) => !rects.some((pr) => rectsEqual(pr, r)) && !overlaps(r))
    if (!missing) return
    playClick()
    const next = [...rects, missing]
    pushAndSet({ rects: next })
    if (isPatchesSolved(next, puzzle)) trigger(next.length * 60 + 320)
  }

  const clear = () => {
    playClick()
    pushAndSet({ rects: [] })
  }

  const dragRect = dragStart && dragCurrent ? boundsOf(dragStart, dragCurrent) : null
  const largestClue = clues.reduce((max, c) => (c.value > max.value ? c : max), clues[0])

  return (
    <DailyGameCard
      gameId="patches"
      completedToday={completedToday}
      progress={progress}
      hasProgress={rects.length > 0}
    >
      <div className="flex flex-col items-center gap-6">
        <div
          ref={containerRef}
          className={`relative touch-none select-none transition-transform ${rejectFlash ? 'animate-pulse' : ''}`}
          style={{ width: 'min(92vw, 32rem)', aspectRatio: `${width} / ${height}` }}
          onPointerDown={onGridPointerDown}
          onPointerMove={onGridPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerLeave={() => dragStart && endDrag()}
        >
          {/* Base dashed grid — always visible underneath everything else. */}
          <div
            className="absolute inset-0 grid overflow-hidden rounded-xl"
            style={{ gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${height}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: width * height }, (_, idx) => (
              <div key={idx} style={{ border: SEED_BORDER }} />
            ))}
          </div>

          {/* Drag-in-progress preview — a single rounded rectangle, not per-cell tinting. */}
          {dragRect && (
            <div
              className="pointer-events-none absolute rounded-xl border-2 border-dashed border-text"
              style={{ ...rectStyle(dragRect, width, height, 2), backgroundColor: 'color-mix(in oklab, var(--color-text) 12%, transparent)' }}
            />
          )}

          {/* Locked/placed regions — each its own rounded rectangle with a saturated stroke and a
              light, pastel fill, matching the reference's clean rectangle-and-stroke look. */}
          {rects.map((rect, ri) => {
            const info = rectInfo[ri]
            const strokeColor = darkenHex(info.color, 0.2)
            return (
              <div
                key={ri}
                className="celebrate-cell pointer-events-none absolute rounded-xl"
                style={{
                  ...rectStyle(rect, width, height, 3),
                  border: `2px solid ${strokeColor}`,
                  backgroundColor: `${info.color}${info.isComplete ? '30' : '55'}`,
                  ...(celebrating ? { animation: 'patches-lock 340ms ease-out both', animationDelay: `${ri * 60}ms` } : {}),
                }}
              />
            )
          })}

          {/* Clue + shape-hint badges, positioned per-cell on top of everything. */}
          <div
            className="pointer-events-none absolute inset-0 grid"
            style={{ gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${height}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: width * height }, (_, idx) => {
              const rectIdx = coveredBy.get(idx)
              const info = rectIdx !== undefined ? rectInfo[rectIdx] : null
              const clue = clueAt.get(idx)
              const regionBorderColor = info ? darkenHex(info.color, 0.35) : null
              const isEchoCell = info && rectIdx !== undefined && info.isComplete && rectInfo[rectIdx].centerIdx === idx && idx !== info.clueIdx

              return (
                <div key={idx} className="relative flex items-center justify-center">
                  {/* The original numbered seed stays visible at its own cell for the entire
                      game, solid and un-decorated — it never gets hidden once its region is
                      complete. Its shape reflects what the number alone tells you about the
                      piece's orientation (see the legend below the board). */}
                  {clue && clue.value !== 1 && (
                    <div
                      className={clue.shape === 'any' ? 'patches-any-icon absolute flex items-center justify-center rounded-md border-2 border-dashed' : 'absolute flex items-center justify-center rounded-md'}
                      style={{ ...badgeSize(clue.shape), backgroundColor: clue.color, borderColor: clue.shape === 'any' ? darkenHex(clue.color, 0.35) : undefined }}
                    >
                      <span className="font-display text-sm font-bold text-white sm:text-base">{clue.value}</span>
                    </div>
                  )}
                  {isEchoCell && info.value !== 1 && (
                    <div
                      className="absolute inset-[38%] flex items-center justify-center rounded-md border"
                      style={{ borderColor: regionBorderColor ?? undefined, backgroundColor: 'var(--color-surface)' }}
                    >
                      <span className="font-display text-[0.6rem] font-bold sm:text-xs" style={{ color: regionBorderColor ?? undefined }}>
                        {info.value}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" disabled={rects.length === 0 || celebrating} onClick={clear}>
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

        <PatchesShapeLegend />

        <PuzzleHelp
          tip={
            largestClue ? (
              <>
                Start with the <strong className="text-text">{largestClue.value}</strong>-cell seed — bigger numbers have
                fewer possible rectangle shapes, so they're the fastest to pin down first.
              </>
            ) : (
              'Start with the largest numbered seed — it has fewer possible shapes.'
            )
          }
          diagram={<PatchesDiagram />}
          rules={
            <>
              Each colored seed must grow into a rectangle worth exactly its number of cells. Drag to size a rectangle around
              a seed — every rectangle holds exactly one seed, and together they must cover the whole board.
            </>
          }
        />
      </div>
    </DailyGameCard>
  )
}
