import { useEffect, useRef, useState } from 'react'
import { KeyIcon } from '@heroicons/react/24/outline'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'

const ASKED_KEY = 'metric:v1:passkeyPromptAsked'

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

/** Prompts a signed-in player who has zero passkeys to add one, once per session, never again once they have one. */
export function AddPasskeyPrompt() {
  const { user, hasPasskey, registerPasskey } = useAuth()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const checkedForRef = useRef<string | null>(null)

  useEffect(() => {
    if (!user || checkedForRef.current === user.id || alreadyAsked(user.id)) return
    checkedForRef.current = user.id
    hasPasskey().then((has) => {
      if (!has) setOpen(true)
    })
  }, [user, hasPasskey])

  const dismiss = () => {
    if (user) markAsked(user.id)
    setOpen(false)
    setError(null)
  }

  const handleAdd = async () => {
    setBusy(true)
    setError(null)
    const result = await registerPasskey()
    setBusy(false)
    if (result.cancelled) return
    if (result.error) {
      setError(result.error)
      return
    }
    dismiss()
  }

  return (
    <Modal open={open} onClose={dismiss} title="Add a passkey">
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-hover">
          <KeyIcon className="h-5 w-5 text-text" />
        </div>
        <p className="text-sm text-text-muted">
          Sign in faster next time with Face ID, Touch ID, or your device PIN — no email or password needed.
        </p>
        <div className="flex w-full flex-col gap-2.5">
          <Button variant="primary" size="lg" disabled={busy} onClick={handleAdd} className="w-full">
            Add passkey
          </Button>
          <button
            type="button"
            onClick={dismiss}
            className="cursor-pointer py-2 font-mono text-[0.6875rem] tracking-[0.14em] text-text-dim uppercase
              hover:text-text-muted"
          >
            Not now
          </button>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    </Modal>
  )
}
