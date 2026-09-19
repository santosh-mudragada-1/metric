const COLUMNS = [
  { digits: ['4', '1', '8', '2'], duration: '3.6s' },
  { digits: ['7', '3', '0', '9'], duration: '4.4s' },
  { digits: ['2', '9', '5', '1'], duration: '5.2s' },
]

export function NumberPreview() {
  return (
    <div className="flex h-full w-full items-center justify-center gap-0.5 font-mono text-lg font-semibold text-accent-number sm:text-xl">
      {COLUMNS.map((col, i) => (
        <div key={i} className="h-[1.2em] w-[0.7em] overflow-hidden">
          <div className="live-loop" style={{ animation: `number-tick ${col.duration} ease-in-out infinite` }}>
            {col.digits.map((d, j) => (
              <div key={j} className="flex h-[1.2em] items-center justify-center tabular-nums">
                {d}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
