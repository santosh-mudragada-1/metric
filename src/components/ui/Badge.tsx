import type { ComponentType, SVGProps } from 'react'
import { ACCENT_CLASSES, type GameConfig } from '@/games.config'

interface BadgeProps {
  Icon: ComponentType<SVGProps<SVGSVGElement>>
  accent: GameConfig['accent']
  size?: 'md' | 'lg'
}

export function Badge({ Icon, accent, size = 'md' }: BadgeProps) {
  const classes = ACCENT_CLASSES[accent]
  const box = size === 'lg' ? 'h-14 w-14 rounded-2xl' : 'h-11 w-11 rounded-xl'
  const icon = size === 'lg' ? 'h-7 w-7' : 'h-5 w-5'

  return (
    <div
      className={`flex ${box} shrink-0 items-center justify-center ${classes.bg}
        shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)]`}
    >
      <Icon className={`${icon} ${classes.onBg}`} strokeWidth={2.25} />
    </div>
  )
}
