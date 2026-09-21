import type { Rng } from '@/lib/dailySeed'

export const ZIP_SIZE = 6
export const ZIP_CHECKPOINTS = 6

export interface ZipPuzzle {
  size: number
  /** checkpoints[cellIndex] = 1-based number, or 0 if the cell carries no number. */
  checkpoints: number[]
  /** The Hamiltonian route used to place the checkpoints — a valid full solution, kept around
   *  only so the in-game hint can reveal "the next cell" without re-deriving one. */
  solutionPath: number[]
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

  return { size, checkpoints, solutionPath: path }
}
