import { useState, type ReactNode } from 'react'
import { ChevronDownIcon, LightBulbIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline'
import { playClick } from '@/lib/sound/sfx'

function Disclosure({
  label,
  icon,
  defaultOpen = false,
  children,
}: {
  label: string
  icon: ReactNode
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-border-strong bg-surface-raised">
      <button
        type="button"
        onClick={() => {
          playClick()
          setOpen((o) => !o)
        }}
        className="flex w-full cursor-pointer items-center justify-between gap-2 px-4 py-3 text-left transition-colors duration-150 hover:bg-surface-hover"
      >
        <span className="flex items-center gap-2 font-display text-sm font-semibold text-text">
          {icon}
          {label}
        </span>
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 text-text-dim transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div className="grid transition-[grid-template-rows] duration-200 ease-out" style={{ gridTemplateRows: open ? '1fr' : '0fr' }}>
        <div className="overflow-hidden">
          <div className="px-4 pb-4">{children}</div>
        </div>
      </div>
    </div>
  )
}

interface PuzzleHelpProps {
  /** Short, specific-to-today strategy hint. */
  tip: ReactNode
  /** A small illustrative diagram built from the game's own visual language. */
  diagram: ReactNode
  /** The permanent rules explanation. */
  rules: ReactNode
}

/** The Tip and How-to-play sections shown below every daily board — kept as two separate,
 *  independently collapsible disclosures rather than one paragraph of text. */
export function PuzzleHelp({ tip, diagram, rules }: PuzzleHelpProps) {
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <Disclosure label="Tip" icon={<LightBulbIcon className="h-4 w-4 text-accent-hardword" />}>
        <p className="text-sm leading-relaxed text-text-muted">{tip}</p>
      </Disclosure>
      <Disclosure label="How to play" icon={<QuestionMarkCircleIcon className="h-4 w-4 text-text-dim" />}>
        <div className="flex flex-col gap-4">
          {diagram}
          <div className="text-sm leading-relaxed text-text-muted">{rules}</div>
        </div>
      </Disclosure>
    </div>
  )
}
