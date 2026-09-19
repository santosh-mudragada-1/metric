const DELAYS = ['0s', '0.5s', '0.2s', '0.8s', '0.35s', '0.1s', '0.65s', '0.45s', '0s']

export function VisualPreview() {
  return (
    <div className="grid h-9 w-9 grid-cols-3 gap-1 sm:h-11 sm:w-11">
      {DELAYS.map((delay, i) => (
        <div
          key={i}
          className="live-loop rounded-sm bg-accent-visual"
          style={{ animation: `sequence-blink 2.8s ease-in-out ${delay} infinite` }}
        />
      ))}
    </div>
  )
}
