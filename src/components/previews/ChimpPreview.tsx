const DIGITS = ['1', '', '3', '', '2', '', '', '4', '']

export function ChimpPreview() {
  return (
    <div className="grid h-9 w-9 grid-cols-3 gap-1 sm:h-11 sm:w-11">
      {DIGITS.map((digit, i) => (
        <div
          key={i}
          className="live-loop flex items-center justify-center rounded-[3px] bg-accent-chimp font-mono text-[0.5rem]
            font-bold text-ink"
          style={{ animation: `chimp-highlight 2.6s ease-in-out ${(i % 4) * 0.3}s infinite` }}
        >
          {digit}
        </div>
      ))}
    </div>
  )
}
