import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { ArrowRightStartOnRectangleIcon, ChartBarIcon, KeyIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/hooks/useAuth'
import { playClick } from '@/lib/sound/sfx'
import { withViewTransition } from '@/lib/viewTransition'

function initialsFromEmail(email: string): string {
  return email.slice(0, 2).toUpperCase()
}

export function AccountMenu() {
  const { user, registerPasskey, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const [passkeyMessage, setPasskeyMessage] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('pointerdown', onPointerDown)
    return () => window.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  if (!user) return null

  const email = user.email ?? 'Signed in'

  const handleAddPasskey = async () => {
    const result = await registerPasskey()
    setPasskeyMessage(result.error ?? 'Passkey added.')
    setTimeout(() => setPasskeyMessage(null), 2400)
  }

  const goToStats = () => {
    setOpen(false)
    playClick()
    withViewTransition(() => navigate('/stats'))
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => {
          playClick()
          setOpen((v) => !v)
        }}
        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border-strong
          bg-surface-raised font-mono text-[0.6875rem] font-semibold text-text transition-colors
          hover:border-text-muted hover:bg-surface-hover"
      >
        {initialsFromEmail(email)}
      </button>

      {open && (
        <div
          className="absolute top-12 right-0 z-40 w-64 rounded-panel border border-border-strong bg-surface-raised
            p-2 shadow-[var(--shadow-card)]"
        >
          <p className="truncate px-3 py-2 font-mono text-[0.6875rem] text-text-dim">{email}</p>

          <button
            type="button"
            onClick={goToStats}
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm
              text-text hover:bg-surface-hover"
          >
            <ChartBarIcon className="h-4 w-4" />
            Your stats
          </button>

          <button
            type="button"
            onClick={handleAddPasskey}
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm
              text-text hover:bg-surface-hover"
          >
            <KeyIcon className="h-4 w-4" />
            Add a passkey
          </button>
          {passkeyMessage && <p className="px-3 pb-1 text-xs text-text-dim">{passkeyMessage}</p>}

          <button
            type="button"
            onClick={() => {
              setOpen(false)
              void signOut()
            }}
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm
              text-danger hover:bg-danger-dim"
          >
            <ArrowRightStartOnRectangleIcon className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
