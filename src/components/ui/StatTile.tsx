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
    <div className="flex flex-col gap-1.5 border-t border-border-strong pt-3 text-left">
      <span className="flex items-center gap-1.5 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-text-dim">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </span>
      <span className={`font-mono text-3xl font-semibold tabular-nums ${classes ? classes.text : 'text-text'}`}>
        {value}
      </span>
    </div>
  )
}
