import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { IconButton } from '@/components/ui/IconButton'
import { AnimatedHeading } from '@/components/ui/AnimatedHeading'
import { withViewTransition } from '@/lib/viewTransition'
import { playBack, playHover } from '@/lib/sound/sfx'

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
  /** Overrides the default "back to dashboard" navigation — e.g. to step back within a multi-step flow. */
  onBack?: () => void
  backLabel?: string
}

export function PageHeader({ title, subtitle, action, onBack, backLabel = 'Back to dashboard' }: PageHeaderProps) {
  const navigate = useNavigate()

  return (
    <div className="mb-8 flex items-start justify-between gap-4 pt-4 sm:mb-12 sm:pt-6">
      <div className="flex items-start gap-4 sm:gap-5">
        <IconButton
          label={backLabel}
          silent
          onMouseEnter={() => playHover()}
          onClick={() => {
            playBack()
            if (onBack) onBack()
            else withViewTransition(() => navigate('/'))
          }}
          className="mt-2 shrink-0"
        >
          <ArrowLeftIcon className="h-4 w-4" />
        </IconButton>
        <div className="min-w-0">
          <AnimatedHeading
            as="h1"
            text={title}
            className="text-display font-display font-semibold tracking-tight text-text"
            radius={170}
          />
          {subtitle && <p className="mt-2 text-sm text-text-muted sm:text-base">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}
