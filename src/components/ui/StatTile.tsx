import type { ComponentType, ReactNode, SVGProps } from 'react'
import { ACCENT_CLASSES, type GameConfig } from '@/games.config'

interface StatTileProps {
  label: string
  value: ReactNode
  accent?: GameConfig['accent']
  icon?: ComponentType<SVGProps<SVGSVGElement>>
}

export function StatTile({ label, value, accent, icon: Icon }: StatTileProps) {
  const classes = accent ? ACCENT_CLASSES[accent] : null

  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border bg-surface-raised px-4 py-3">
      <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-text-dim">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </span>
      <span className={`font-mono text-2xl font-semibold tabular-nums ${classes ? classes.text : 'text-text'}`}>
        {value}
      </span>
    </div>
  )
}
