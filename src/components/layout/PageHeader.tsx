import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { IconButton } from '@/components/ui/IconButton'

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  const navigate = useNavigate()

  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <IconButton label="Back" silent onClick={() => navigate('/')}>
          <ArrowLeftIcon className="h-5 w-5" />
        </IconButton>
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-text">{title}</h1>
          {subtitle && <p className="text-sm text-text-muted">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}
