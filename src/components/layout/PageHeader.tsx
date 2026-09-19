import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { IconButton } from '@/components/ui/IconButton'
import { withViewTransition } from '@/lib/viewTransition'

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  const navigate = useNavigate()

  return (
    <div className="mb-8 flex items-start justify-between gap-4 pt-4 sm:mb-12 sm:pt-6">
      <div className="flex items-start gap-4 sm:gap-5">
        <IconButton
          label="Back to dashboard"
          silent
          onClick={() => withViewTransition(() => navigate('/'))}
          className="mt-2 shrink-0"
        >
          <ArrowLeftIcon className="h-4 w-4" />
        </IconButton>
        <div className="min-w-0">
          <h1 className="text-display font-display font-semibold tracking-tight text-text">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-text-muted sm:text-base">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}
