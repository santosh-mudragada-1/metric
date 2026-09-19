const DELAYS = ['0s', '0.3s', '0.6s', '0.9s']

export function SequencePreview() {
  return (
    <div className="grid h-8 w-8 grid-cols-2 gap-1 sm:h-10 sm:w-10">
      {DELAYS.map((delay, i) => (
        <div
          key={i}
          className="live-loop rounded-full bg-accent-sequence"
          style={{ animation: `sequence-blink 2.4s ease-in-out ${delay} infinite` }}
        />
      ))}
    </div>
  )
}
