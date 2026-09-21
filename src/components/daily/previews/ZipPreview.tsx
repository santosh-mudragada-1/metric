// Grid positions 0..5 (2 rows x 3 cols); delays trace a snake path 0-1-2-5-4-3 so the
// highlight appears to travel around the corner, matching the game's path-drawing mechanic.
const DELAYS = ['0s', '0.4s', '0.8s', '1.2s', '1.6s', '2.0s']
const ORDER = [0, 1, 2, 5, 4, 3]
const DELAY_BY_CELL = ORDER.reduce<Record<number, string>>((acc, cell, i) => {
  acc[cell] = DELAYS[i]
  return acc
}, {})

export function ZipPreview() {
  return (
    <div className="grid h-8 w-8 grid-cols-3 grid-rows-2 gap-1 sm:h-10 sm:w-10">
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          className="live-loop rounded-sm bg-accent-zip"
          style={{ animation: `sequence-blink 2.4s ease-in-out ${DELAY_BY_CELL[i]} infinite` }}
        />
      ))}
    </div>
  )
}
