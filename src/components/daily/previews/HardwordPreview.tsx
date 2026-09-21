const DELAYS = ['0s', '0.3s', '0.6s', '0.9s']

export function HardwordPreview() {
  return (
    <div className="flex h-8 items-center gap-1 sm:h-10">
      {DELAYS.map((delay, i) => (
        <div
          key={i}
          className="live-loop h-6 w-6 rounded-sm border border-border sm:h-7 sm:w-7"
          style={{ animation: `hardword-cycle 2.4s ease-in-out ${delay} infinite` }}
        />
      ))}
    </div>
  )
}
