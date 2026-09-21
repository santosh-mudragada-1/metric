import type { Rng } from '@/lib/dailySeed'
import { pickRandom, shuffle } from '@/lib/dailySeed'

export const QUEENS_SIZE = 8

export const QUEENS_PALETTE = [
  '#f87171',
  '#fb923c',
  '#fbbf24',
  '#a3e635',
  '#34d399',
  '#38bdf8',
  '#a78bfa',
  '#f472b6',
]

export interface QueensPuzzle {
  size: number
  /** Region (color) index per cell. */
  regionOf: number[]
  palette: string[]
  /** solution[row] = column of that row's queen in the generated solution — kept only so the
   *  in-game hint can reveal one correct placement without re-solving the board. */
  solution: number[]
}

function orthogonalNeighbors(size: number, idx: number): number[] {
  const r = Math.floor(idx / size)
  const c = idx % size
  const out: number[] = []
  if (r > 0) out.push(idx - size)
  if (r < size - 1) out.push(idx + size)
  if (c > 0) out.push(idx - 1)
  if (c < size - 1) out.push(idx + 1)
  return out
}

/** One queen per row with no two touching (incl. diagonally) — adjacency only needs to be
 *  checked against the immediately preceding row, since rows two or more apart can't touch. */
function placeQueens(rng: Rng, size: number): number[] {
  const cols: number[] = []

  function backtrack(row: number, used: Set<number>): boolean {
    if (row === size) return true
    const candidates = shuffle(rng, Array.from({ length: size }, (_, c) => c))
    for (const c of candidates) {
      if (used.has(c)) continue
      if (row > 0) {
        const prevCol = cols[row - 1]
        if (Math.abs(prevCol - c) <= 1) continue
      }
      cols[row] = c
      used.add(c)
      if (backtrack(row + 1, used)) return true
      used.delete(c)
    }
    return false
  }

  if (!backtrack(0, new Set())) {
    // Fallback (shouldn't trigger for size >= 5): a fixed non-touching diagonal-ish pattern.
    for (let r = 0; r < size; r++) cols[r] = (r * 2) % size
  }

  return cols
}

function growRegions(rng: Rng, size: number, queenCols: number[]): number[] {
  const total = size * size
  const regionOf = new Array(total).fill(-1)
  const frontiers: number[][] = queenCols.map(() => [])

  queenCols.forEach((col, row) => {
    const i = row * size + col
    regionOf[i] = row
    frontiers[row].push(i)
  })

  let remaining = total - queenCols.length
  while (remaining > 0) {
    const activeRegions = frontiers
      .map((_, r) => r)
      .filter((r) => frontiers[r].some((cell) => orthogonalNeighbors(size, cell).some((n) => regionOf[n] === -1)))

    const r = pickRandom(rng, activeRegions)
    const candidates = frontiers[r].filter((cell) => orthogonalNeighbors(size, cell).some((n) => regionOf[n] === -1))
    const cell = pickRandom(rng, candidates)
    const openNeighbors = orthogonalNeighbors(size, cell).filter((n) => regionOf[n] === -1)
    const chosen = pickRandom(rng, openNeighbors)

    regionOf[chosen] = r
    frontiers[r].push(chosen)
    remaining--
  }

  return regionOf
}

export function generateQueens(rng: Rng): QueensPuzzle {
  const size = QUEENS_SIZE
  const queenCols = placeQueens(rng, size)
  const regionOf = growRegions(rng, size, queenCols)
  return { size, regionOf, palette: QUEENS_PALETTE.slice(0, size), solution: queenCols }
}

/** 0 = empty, 1 = marked (X), 2 = crown */
export type QueensCell = 0 | 1 | 2

export function isQueensSolved(grid: QueensCell[], puzzle: QueensPuzzle): boolean {
  const { size, regionOf } = puzzle
  const crownCells: number[] = []
  grid.forEach((v, i) => {
    if (v === 2) crownCells.push(i)
  })
  if (crownCells.length !== size) return false

  const rows = new Set<number>()
  const cols = new Set<number>()
  const regions = new Set<number>()
  for (const i of crownCells) {
    const r = Math.floor(i / size)
    const c = i % size
    rows.add(r)
    cols.add(c)
    regions.add(regionOf[i])
  }
  if (rows.size !== size || cols.size !== size || regions.size !== size) return false

  for (let a = 0; a < crownCells.length; a++) {
    for (let b = a + 1; b < crownCells.length; b++) {
      const r1 = Math.floor(crownCells[a] / size)
      const c1 = crownCells[a] % size
      const r2 = Math.floor(crownCells[b] / size)
      const c2 = crownCells[b] % size
      if (Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1) return false
    }
  }

  return true
}
