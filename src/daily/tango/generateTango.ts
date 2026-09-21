import type { Rng } from '@/lib/dailySeed'
import { shuffle } from '@/lib/dailySeed'

export const TANGO_SIZE = 6
export const TANGO_MIN_GIVENS = 10
export const TANGO_RELATION_CLUES = 4

/** 0 = empty, 1 = sun, 2 = moon */
export type TangoSymbol = 0 | 1 | 2
export type TangoRelation = '=' | 'x'

export interface TangoPuzzle {
  size: number
  givens: TangoSymbol[]
  /** Keyed by the index of the left/top cell of the pair. */
  hConstraints: Record<number, TangoRelation>
  vConstraints: Record<number, TangoRelation>
}

function idx(size: number, r: number, c: number): number {
  return r * size + c
}

function violatesTriple(grid: TangoSymbol[], size: number, r: number, c: number, sym: TangoSymbol): boolean {
  if (c >= 2 && grid[idx(size, r, c - 1)] === sym && grid[idx(size, r, c - 2)] === sym) return true
  if (r >= 2 && grid[idx(size, r - 1, c)] === sym && grid[idx(size, r - 2, c)] === sym) return true
  return false
}

function buildSolution(rng: Rng, size: number): TangoSymbol[] {
  const half = size / 2
  const grid: TangoSymbol[] = new Array(size * size).fill(0)

  function rowCount(r: number, sym: TangoSymbol, upto: number): number {
    let n = 0
    for (let c = 0; c < upto; c++) if (grid[idx(size, r, c)] === sym) n++
    return n
  }
  function colCount(c: number, sym: TangoSymbol, upto: number): number {
    let n = 0
    for (let r = 0; r < upto; r++) if (grid[idx(size, r, c)] === sym) n++
    return n
  }

  function backtrack(pos: number): boolean {
    if (pos === size * size) return true
    const r = Math.floor(pos / size)
    const c = pos % size
    const order: TangoSymbol[] = rng() < 0.5 ? [1, 2] : [2, 1]
    for (const sym of order) {
      if (rowCount(r, sym, c) >= half) continue
      if (colCount(c, sym, r) >= half) continue
      if (violatesTriple(grid, size, r, c, sym)) continue
      grid[pos] = sym
      if (backtrack(pos + 1)) return true
      grid[pos] = 0
    }
    return false
  }

  backtrack(0)
  return grid
}

function countSolutions(
  base: TangoSymbol[],
  size: number,
  hConstraints: Record<number, TangoRelation>,
  vConstraints: Record<number, TangoRelation>,
  cap: number,
): number {
  const half = size / 2
  const grid = base.slice()
  const emptyPositions: number[] = []
  for (let i = 0; i < grid.length; i++) if (grid[i] === 0) emptyPositions.push(i)
  let count = 0

  function rowCount(r: number, sym: TangoSymbol): number {
    let n = 0
    for (let c = 0; c < size; c++) if (grid[idx(size, r, c)] === sym) n++
    return n
  }
  function colCount(c: number, sym: TangoSymbol): number {
    let n = 0
    for (let r = 0; r < size; r++) if (grid[idx(size, r, c)] === sym) n++
    return n
  }
  function tripleOk(r: number, c: number): boolean {
    const line = (cells: TangoSymbol[]) => {
      for (let i = 0; i + 2 < cells.length; i++) {
        if (cells[i] !== 0 && cells[i] === cells[i + 1] && cells[i + 1] === cells[i + 2]) return false
      }
      return true
    }
    const row = Array.from({ length: size }, (_, cc) => grid[idx(size, r, cc)])
    const col = Array.from({ length: size }, (_, rr) => grid[idx(size, rr, c)])
    return line(row) && line(col)
  }
  function relationOk(r: number, c: number): boolean {
    const i = idx(size, r, c)
    const pairs: [number, TangoRelation | undefined, number][] = [
      [i, hConstraints[i], c < size - 1 ? idx(size, r, c + 1) : -1],
      [c > 0 ? idx(size, r, c - 1) : -1, hConstraints[c > 0 ? idx(size, r, c - 1) : -1], i],
      [i, vConstraints[i], r < size - 1 ? idx(size, r + 1, c) : -1],
      [r > 0 ? idx(size, r - 1, c) : -1, vConstraints[r > 0 ? idx(size, r - 1, c) : -1], i],
    ]
    for (const [a, rel, b] of pairs) {
      if (a < 0 || b < 0 || !rel) continue
      const av = grid[a]
      const bv = grid[b]
      if (av === 0 || bv === 0) continue
      if (rel === '=' && av !== bv) return false
      if (rel === 'x' && av === bv) return false
    }
    return true
  }

  function backtrack(pos: number): void {
    if (count >= cap) return
    if (pos === emptyPositions.length) {
      count++
      return
    }
    const p = emptyPositions[pos]
    const r = Math.floor(p / size)
    const c = p % size
    for (const sym of [1, 2] as TangoSymbol[]) {
      if (rowCount(r, sym) >= half) continue
      if (colCount(c, sym) >= half) continue
      grid[p] = sym
      if (tripleOk(r, c) && relationOk(r, c)) backtrack(pos + 1)
      grid[p] = 0
      if (count >= cap) return
    }
  }

  backtrack(0)
  return count
}

export function generateTango(rng: Rng): TangoPuzzle {
  const size = TANGO_SIZE
  const solution = buildSolution(rng, size)
  const givens = solution.slice()

  const removalOrder = shuffle(rng, Array.from({ length: size * size }, (_, i) => i))
  let filledCount = size * size
  for (const cellIdx of removalOrder) {
    if (filledCount <= TANGO_MIN_GIVENS) break
    const backup = givens[cellIdx]
    givens[cellIdx] = 0
    const solutions = countSolutions(givens, size, {}, {}, 2)
    if (solutions === 1) {
      filledCount--
    } else {
      givens[cellIdx] = backup
    }
  }

  const emptyPairs: Array<{ a: number; b: number; axis: 'h' | 'v' }> = []
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const a = idx(size, r, c)
      if (givens[a] !== 0) continue
      if (c < size - 1 && givens[idx(size, r, c + 1)] === 0) emptyPairs.push({ a, b: idx(size, r, c + 1), axis: 'h' })
      if (r < size - 1 && givens[idx(size, r + 1, c)] === 0) emptyPairs.push({ a, b: idx(size, r + 1, c), axis: 'v' })
    }
  }

  const hConstraints: Record<number, TangoRelation> = {}
  const vConstraints: Record<number, TangoRelation> = {}
  const chosenPairs = shuffle(rng, emptyPairs).slice(0, TANGO_RELATION_CLUES)
  for (const pair of chosenPairs) {
    const relation: TangoRelation = solution[pair.a] === solution[pair.b] ? '=' : 'x'
    if (pair.axis === 'h') hConstraints[pair.a] = relation
    else vConstraints[pair.a] = relation
  }

  return { size, givens, hConstraints, vConstraints }
}

export function isTangoSolved(grid: TangoSymbol[], puzzle: TangoPuzzle): boolean {
  const { size, hConstraints, vConstraints } = puzzle
  const half = size / 2
  if (grid.some((v) => v === 0)) return false

  for (let r = 0; r < size; r++) {
    const row = Array.from({ length: size }, (_, c) => grid[idx(size, r, c)])
    if (row.filter((v) => v === 1).length !== half) return false
    for (let c = 0; c + 2 < size; c++) {
      if (row[c] === row[c + 1] && row[c + 1] === row[c + 2]) return false
    }
  }
  for (let c = 0; c < size; c++) {
    const col = Array.from({ length: size }, (_, r) => grid[idx(size, r, c)])
    if (col.filter((v) => v === 1).length !== half) return false
    for (let r = 0; r + 2 < size; r++) {
      if (col[r] === col[r + 1] && col[r + 1] === col[r + 2]) return false
    }
  }
  for (const [key, rel] of Object.entries(hConstraints)) {
    const a = Number(key)
    const r = Math.floor(a / size)
    const c = a % size
    const b = idx(size, r, c + 1)
    if (rel === '=' && grid[a] !== grid[b]) return false
    if (rel === 'x' && grid[a] === grid[b]) return false
  }
  for (const [key, rel] of Object.entries(vConstraints)) {
    const a = Number(key)
    const r = Math.floor(a / size)
    const c = a % size
    const b = idx(size, r + 1, c)
    if (rel === '=' && grid[a] !== grid[b]) return false
    if (rel === 'x' && grid[a] === grid[b]) return false
  }
  return true
}
