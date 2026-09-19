import { useRef, useState } from 'react'
import { CheckIcon, ClipboardIcon } from '@heroicons/react/24/outline'
import { useAnimation } from '@/hooks/useAnimation'
import { flashSuccess } from '@/lib/animation/presets'
import { playCopy } from '@/lib/sound/sfx'

interface CopyableCodeProps {
  value: string
  displayValue?: string
}

export function CopyableCode({ value, displayValue }: CopyableCodeProps) {
  const [copied, setCopied] = useState(false)
  const { scope, run } = useAnimation<HTMLButtonElement>()
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const copy = run(async () => {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      // clipboard permission denied — the code is still visible for manual copy
    }
    playCopy()
    flashSuccess(scope.current)
    setCopied(true)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setCopied(false), 1600)
  })

  return (
    <button
      ref={scope}
      onClick={copy}
      className="group inline-flex cursor-pointer items-center gap-3 rounded-lg border border-border-strong
        bg-surface-raised px-5 py-3 font-mono text-xl font-semibold tracking-[0.3em] text-text
        transition-colors hover:bg-surface-hover"
    >
      {displayValue ?? value}
      {copied ? (
        <CheckIcon className="h-5 w-5 text-success" />
      ) : (
        <ClipboardIcon className="h-5 w-5 text-text-dim group-hover:text-text-muted" />
      )}
    </button>
  )
}
