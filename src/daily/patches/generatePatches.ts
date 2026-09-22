import type { Rng } from '@/lib/dailySeed'
import { shuffle } from '@/lib/dailySeed'

export const PATCHES_WIDTH = 6
export const PATCHES_HEIGHT = 6
const MAX_PIECE_AREA = 9

export const PATCHES_PALETTE = [
  '#f87171',
  '#fb923c',
  '#fbbf24',
  '#a3e635',
  '#34d399',
  '#38bdf8',
  '#a78bfa',
  '#f472b6',
  '#facc15',
  '#4ade80',
]

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

/** The clue's own hint shape — drawn as a miniature of the piece's real orientation, so the
 *  badge itself previews square / tall / wide before the region is placed. 'any' is reserved for
 *  degenerate cases with no well-formed rectangle (kept for the legend's sake; generation never
 *  produces it, since every generated piece has a concrete w × h). */
export type PatchesShape = 'square' | 'tall' | 'wide' | 'any'

export interface PatchesClue {
  idx: number
  value: number
  /** Stable per-piece color, assigned at generation time (not draw order). */
  color: string
  shape: PatchesShape
}

export function classifyPatchesShape(w: number, h: number): PatchesShape {
  if (w < 1 || h < 1) return 'any'
  return w === h ? 'square' : h > w ? 'tall' : 'wide'
}

export interface PatchesPuzzle {
  width: number
  height: number
  clues: PatchesClue[]
  /** The generated rectangle solution — kept only so the in-game hint can reveal one correct
   *  rectangle without re-solving the board. */
  solution: Rect[]
}

/** A cut point for splitting a length-`total` run into two pieces, chosen so that if the
 *  perpendicular side is only 1 cell wide, neither resulting piece ends up as a 1x1 — Patches
 *  pieces are never allowed to be a single cell. Returns null when no such cut exists (the run
 *  is too short to split safely), meaning the caller should not split at all. */
function chooseCut(rng: Rng, total: number, perpendicularIsOne: boolean): number | null {
  if (!perpendicularIsOne) return 1 + Math.floor(rng() * (total - 1))
  if (total < 4) return null
  return 2 + Math.floor(rng() * (total - 3))
}

function subdivide(rng: Rng, rect: Rect, out: Rect[]): void {
  const area = rect.w * rect.h
  const canSplitVert = rect.w >= 2
  const canSplitHorz = rect.h >= 2
  const mustSplit = area > MAX_PIECE_AREA
  const stopChance = area <= 4 ? 0.55 : area <= 8 ? 0.25 : 0.05

  if (!canSplitVert && !canSplitHorz) {
    out.push(rect)
    return
  }
  // Never split a domino (or smaller) — that's the only way a 1x1 piece could appear.
  if (area <= 2) {
    out.push(rect)
    return
  }
  if (!mustSplit && rng() < stopChance) {
    out.push(rect)
    return
  }

  const axis: 'v' | 'h' = canSplitVert && canSplitHorz ? (rng() < 0.5 ? 'v' : 'h') : canSplitVert ? 'v' : 'h'

  if (axis === 'v') {
    const cut = chooseCut(rng, rect.w, rect.h === 1)
    if (cut === null) {
      out.push(rect)
      return
    }
    subdivide(rng, { x: rect.x, y: rect.y, w: cut, h: rect.h }, out)
    subdivide(rng, { x: rect.x + cut, y: rect.y, w: rect.w - cut, h: rect.h }, out)
  } else {
    const cut = chooseCut(rng, rect.h, rect.w === 1)
    if (cut === null) {
      out.push(rect)
      return
    }
    subdivide(rng, { x: rect.x, y: rect.y, w: rect.w, h: cut }, out)
    subdivide(rng, { x: rect.x, y: rect.y + cut, w: rect.w, h: rect.h - cut }, out)
  }
}

export function generatePatches(rng: Rng): PatchesPuzzle {
  const width = PATCHES_WIDTH
  const height = PATCHES_HEIGHT
  const pieces: Rect[] = []
  subdivide(rng, { x: 0, y: 0, w: width, h: height }, pieces)

  const colors = shuffle(rng, PATCHES_PALETTE)
  const clues: PatchesClue[] = pieces.map((rect, i) => {
    const cx = rect.x + Math.floor(rng() * rect.w)
    const cy = rect.y + Math.floor(rng() * rect.h)
    const value = rect.w * rect.h
    return { idx: cy * width + cx, value, color: colors[i % colors.length], shape: classifyPatchesShape(rect.w, rect.h) }
  })

  return { width, height, clues, solution: pieces }
}

export function isPatchesSolved(rects: Rect[], puzzle: PatchesPuzzle): boolean {
  const { width, height, clues } = puzzle
  const total = width * height
  const covered = new Array<number>(total).fill(-1)

  for (const [ri, rect] of rects.entries()) {
    for (let y = rect.y; y < rect.y + rect.h; y++) {
      for (let x = rect.x; x < rect.x + rect.w; x++) {
        const i = y * width + x
        if (covered[i] !== -1) return false
        covered[i] = ri
      }
    }
  }
  if (covered.some((c) => c === -1)) return false

  const clueCountPerRect = new Array(rects.length).fill(0)
  for (const clue of clues) {
    const ri = covered[clue.idx]
    const rect = rects[ri]
    if (rect.w * rect.h !== clue.value) return false
    clueCountPerRect[ri]++
  }
  if (clueCountPerRect.some((n) => n !== 1)) return false

  return true
}
