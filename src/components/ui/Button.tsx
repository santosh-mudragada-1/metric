import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { ChevronRightIcon } from '@heroicons/react/24/solid'
import { useAnimation } from '@/hooks/useAnimation'
import { hoverIn, hoverOut, pressDown, pressUp } from '@/lib/animation/presets'
import { playClick, playHover } from '@/lib/sound/sfx'

type Variant = 'primary' | 'ghost' | 'danger'
type Size = 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  silent?: boolean
  /** Appends a trailing chevron, for "Play X ›" style action pills */
  chevron?: boolean
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-chalk text-ink shadow-[var(--shadow-chalk)] hover:bg-white',
  ghost: 'bg-transparent text-text border border-border-strong hover:border-text-muted hover:bg-surface-hover',
  danger: 'bg-danger-dim text-danger border border-danger/40 hover:bg-danger/20',
}

const SIZE_CLASSES: Record<Size, string> = {
  md: 'h-10 px-5 text-sm gap-1.5 tracking-tight',
  lg: 'h-13 px-7 text-base gap-2 tracking-tight',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', silent, chevron, className = '', onPointerDown, onPointerUp, onPointerLeave, onMouseEnter, onClick, children, ...props },
  forwardedRef,
) {
  const { scope, run } = useAnimation<HTMLButtonElement>()

  return (
    <button
      ref={(node) => {
        scope.current = node
        if (typeof forwardedRef === 'function') forwardedRef(node)
        else if (forwardedRef) forwardedRef.current = node
      }}
      className={`inline-flex items-center justify-center rounded-lg font-medium font-display
        transition-colors duration-150 disabled:opacity-40 disabled:pointer-events-none
        cursor-pointer select-none ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      onPointerDown={run((e) => {
        pressDown(scope.current)
        onPointerDown?.(e)
      })}
      onPointerUp={run((e) => {
        pressUp(scope.current)
        onPointerUp?.(e)
      })}
      onPointerLeave={run((e) => {
        pressUp(scope.current)
        onPointerLeave?.(e)
      })}
      onMouseEnter={run((e) => {
        hoverIn(scope.current)
        if (!silent) playHover()
        onMouseEnter?.(e)
      })}
      onMouseLeave={run(() => hoverOut(scope.current))}
      onClick={(e) => {
        if (!silent) playClick()
        onClick?.(e)
      }}
      {...props}
    >
      {children}
      {chevron && <ChevronRightIcon className="-mr-1 h-4 w-4" />}
    </button>
  )
})
