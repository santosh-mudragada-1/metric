export function AimPreview() {
  return (
    <div className="relative h-full w-full">
      <div
        className="live-loop absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-aim shadow-[0_0_14px_-2px_var(--color-accent-aim)] sm:h-3 sm:w-3"
        style={{ animation: 'aim-jump 3.2s ease-in-out infinite' }}
      />
    </div>
  )
}
