import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { useAnimation } from '@/hooks/useAnimation'
import { hoverIn, hoverOut, pressDown, pressUp } from '@/lib/animation/presets'
import { playClick, playHover } from '@/lib/sound/sfx'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  silent?: boolean
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, silent, className = '', onClick, onMouseEnter, ...props },
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
      aria-label={label}
      title={label}
      className={`inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full
        border border-border-strong text-text-muted transition-colors hover:bg-surface-hover hover:text-text ${className}`}
      onPointerDown={run(() => pressDown(scope.current))}
      onPointerUp={run(() => pressUp(scope.current))}
      onPointerLeave={run(() => pressUp(scope.current))}
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
    />
  )
})
