import { useEffect, useRef, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'

const ASKED_KEY = 'metric:v1:namePromptAsked'

function alreadyAsked(userId: string): boolean {
  try {
    const asked: string[] = JSON.parse(sessionStorage.getItem(ASKED_KEY) ?? '[]')
    return asked.includes(userId)
  } catch {
    return false
  }
}

function markAsked(userId: string): void {
  try {
    const asked: string[] = JSON.parse(sessionStorage.getItem(ASKED_KEY) ?? '[]')
    sessionStorage.setItem(ASKED_KEY, JSON.stringify([...new Set([...asked, userId])]))
  } catch {
    // sessionStorage unavailable — the prompt may reappear this session, which is harmless
  }
}

/** Best-effort display name Google/etc. hands back on the user object, so the field isn't blank. */
function suggestedName(metadata: Record<string, unknown>): string {
  const raw = metadata.full_name ?? metadata.name ?? ''
  return typeof raw === 'string' ? raw.split(' ')[0] : ''
}

/**
 * Collects a display name once, right after sign-in/sign-up, so party rooms never have to ask
 * for it again. Runs before `AddPasskeyPrompt` — see `onResolved`, which that prompt waits on.
 */
export function NamePrompt({ onResolved }: { onResolved: () => void }) {
  const { user } = useAuth()
  const { profile, updateName } = useProfile()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const checkedForRef = useRef<string | null>(null)
  const resolvedRef = useRef(false)

  useEffect(() => {
    if (!user || checkedForRef.current === user.id) return
    checkedForRef.current = user.id

    if (profile.name.trim() || alreadyAsked(user.id)) {
      resolvedRef.current = true
      onResolved()
      return
    }

    setName(suggestedName(user.user_metadata ?? {}))
    setOpen(true)
  }, [user, profile.name, onResolved])

  const finish = () => {
    if (user) markAsked(user.id)
    setOpen(false)
    if (!resolvedRef.current) {
      resolvedRef.current = true
      onResolved()
    }
  }

  const commit = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    updateName(trimmed)
    finish()
  }

  return (
    <Modal open={open} onClose={finish} title="What should we call you?">
      <div className="flex flex-col gap-4 py-2">
        <p className="text-sm text-text-muted">
          Other players will see this name in party rooms — set it once here instead of every time you join.
        </p>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
          maxLength={16}
          placeholder="Enter a display name"
          className="h-13 w-full rounded-full border border-border-strong bg-surface-raised px-4 text-sm text-text
            outline-none focus:border-invert/60"
        />
        <div className="flex flex-col gap-2.5">
          <Button variant="primary" size="lg" disabled={!name.trim()} onClick={commit} className="w-full">
            Save
          </Button>
          <button
            type="button"
            onClick={finish}
            className="cursor-pointer py-2 font-mono text-[0.6875rem] tracking-[0.14em] text-text-dim uppercase
              hover:text-text-muted"
          >
            Not now
          </button>
        </div>
      </div>
    </Modal>
  )
}
