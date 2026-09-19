export function ReactionPreview() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div
        className="live-loop h-7 w-7 rounded-full bg-accent-reaction shadow-[0_0_20px_-2px_var(--color-accent-reaction)] sm:h-9 sm:w-9"
        style={{ animation: 'reaction-pulse 1.7s ease-in-out infinite' }}
      />
    </div>
  )
}
