import { QUEENS_PALETTE } from '@/daily/queens/generateQueens'

const CELL_COLORS = [QUEENS_PALETTE[0], QUEENS_PALETTE[5], QUEENS_PALETTE[6], QUEENS_PALETTE[3]]
const DELAYS = ['0s', '0.5s', '1s', '1.5s']

export function QueensPreview() {
  return (
    <div className="grid h-8 w-8 grid-cols-2 grid-rows-2 gap-1 sm:h-10 sm:w-10">
      {CELL_COLORS.map((color, i) => (
        <div
          key={i}
          className="live-loop rounded-sm"
          style={{ backgroundColor: color, animation: `chimp-highlight 2s ease-in-out ${DELAYS[i]} infinite` }}
        />
      ))}
    </div>
  )
}
