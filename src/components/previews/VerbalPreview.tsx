const WORDS = [
  { text: 'river', delay: '0s' },
  { text: 'river', delay: '1.8s' },
  { text: 'cloud', delay: '3.6s' },
]

export function VerbalPreview() {
  return (
    <div className="relative flex h-6 w-16 items-center justify-center overflow-hidden font-mono text-xs font-semibold text-accent-verbal">
      {WORDS.map((word, i) => (
        <span
          key={i}
          className="live-loop absolute lowercase"
          style={{ animation: `word-fade 5.4s ease-in-out ${word.delay} infinite`, opacity: 0 }}
        >
          {word.text}
        </span>
      ))}
    </div>
  )
}
