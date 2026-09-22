import type { Rng } from '@/lib/dailySeed'
import { shuffle } from '@/lib/dailySeed'

export const ZIP_SIZE = 6
export const ZIP_CHECKPOINTS = 6

export interface ZipPuzzle {
  size: number
  /** checkpoints[cellIndex] = 1-based number, or 0 if the cell carries no number. */
  checkpoints: number[]
  /** The Hamiltonian route used to place the checkpoints — a valid full solution, kept around
   *  only so the in-game hint can reveal "the next cell" without re-deriving one. */
  solutionPath: number[]
  /** Blocked edges between orthogonally adjacent cells — walls the path may never cross.
   *  Always chosen from edges the solution path doesn't use, so it stays solvable. */
  walls: Array<[number, number]>
}

function edgeKey(a: number, b: number): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`
}

/** True when a and b are adjacent cells separated by a wall. */
export function isWallBetween(walls: Array<[number, number]>, a: number, b: number): boolean {
  const key = edgeKey(a, b)
  return walls.some(([x, y]) => edgeKey(x, y) === key)
}

function neighbors(size: number, idx: number): number[] {
  const r = Math.floor(idx / size)
  const c = idx % size
  const out: number[] = []
  if (r > 0) out.push(idx - size)
  if (r < size - 1) out.push(idx + size)
  if (c > 0) out.push(idx - 1)
  if (c < size - 1) out.push(idx + 1)
  return out
}

/** Randomized DFS with a Warnsdorff-style heuristic (fewest onward options first) to find a
 *  Hamiltonian path over the grid quickly and with a different route each day. */
function generateHamiltonianPath(size: number, rng: Rng): number[] {
  const total = size * size
  const start = Math.floor(rng() * total)
  const path: number[] = [start]
  const visited = new Uint8Array(total)
  visited[start] = 1

  const unvisitedDegree = (idx: number) => neighbors(size, idx).filter((n) => !visited[n]).length

  function backtrack(): boolean {
    if (path.length === total) return true
    const current = path[path.length - 1]
    const candidates = neighbors(size, current).filter((n) => !visited[n])
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1))
      ;[candidates[i], candidates[j]] = [candidates[j], candidates[i]]
    }
    candidates.sort((a, b) => unvisitedDegree(a) - unvisitedDegree(b))
    for (const next of candidates) {
      visited[next] = 1
      path.push(next)
      if (backtrack()) return true
      path.pop()
      visited[next] = 0
    }
    return false
  }

  if (!backtrack()) {
    // Practically unreachable on an open grid, but fall back to a guaranteed snake path.
    path.length = 0
    for (let r = 0; r < size; r++) {
      const cols = r % 2 === 0 ? Array.from({ length: size }, (_, i) => i) : Array.from({ length: size }, (_, i) => size - 1 - i)
      for (const c of cols) path.push(r * size + c)
    }
  }

  return path
}

export function generateZip(rng: Rng): ZipPuzzle {
  const size = ZIP_SIZE
  const total = size * size
  const path = generateHamiltonianPath(size, rng)

  const checkpoints = new Array<number>(total).fill(0)
  const k = ZIP_CHECKPOINTS
  for (let i = 0; i < k; i++) {
    const pos = Math.round((i / (k - 1)) * (total - 1))
    checkpoints[path[pos]] = i + 1
  }

  // Walls only ever sit on edges the solution path doesn't use, so the puzzle stays solvable —
  // they just close off shortcuts the player would otherwise be tempted to take.
  const usedEdges = new Set<string>()
  for (let i = 0; i < path.length - 1; i++) usedEdges.add(edgeKey(path[i], path[i + 1]))

  const candidateEdges: Array<[number, number]> = []
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const idx = r * size + c
      if (c < size - 1 && !usedEdges.has(edgeKey(idx, idx + 1))) candidateEdges.push([idx, idx + 1])
      if (r < size - 1 && !usedEdges.has(edgeKey(idx, idx + size))) candidateEdges.push([idx, idx + size])
    }
  }
  const wallCount = Math.min(candidateEdges.length, Math.max(2, Math.round(size / 2)))
  const walls = shuffle(rng, candidateEdges).slice(0, wallCount)

  return { size, checkpoints, solutionPath: path, walls }
}
