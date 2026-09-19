export function TypingPreview() {
  return (
    <div className="flex h-6 w-20 items-center overflow-hidden font-mono text-sm font-semibold text-accent-typing">
      <span className="live-loop whitespace-nowrap" style={{ animation: 'type-reveal 3.2s steps(9, end) infinite' }}>
        type_fast
      </span>
      <span className="live-loop -ml-0.5" style={{ animation: 'caret-blink 1s step-end infinite' }}>
        |
      </span>
    </div>
  )
}
