// Violet -> magenta -> rose -> red, sampled by how far along the path a cell sits —
// gives the "rainbow snake" look of a completed path instead of one flat accent color.
export const ZIP_GRADIENT_STOPS = ['#7c3aed', '#c026d3', '#e11d48', '#dc2626']
const GRADIENT_STOPS = ZIP_GRADIENT_STOPS

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function toHex(v: number): string {
  return Math.round(v).toString(16).padStart(2, '0')
}

export function zipColorAt(t: number): string {
  const clamped = Math.min(Math.max(t, 0), 1)
  const scaled = clamped * (GRADIENT_STOPS.length - 1)
  const i = Math.min(Math.floor(scaled), GRADIENT_STOPS.length - 2)
  const localT = scaled - i
  const [r1, g1, b1] = hexToRgb(GRADIENT_STOPS[i])
  const [r2, g2, b2] = hexToRgb(GRADIENT_STOPS[i + 1])
  const r = r1 + (r2 - r1) * localT
  const g = g1 + (g2 - g1) * localT
  const b = b1 + (b2 - b1) * localT
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}
