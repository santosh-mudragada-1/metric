import { useState } from 'react'
import { KeyIcon } from '@heroicons/react/24/outline'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import type { AuthResult } from '@/lib/auth/AuthContext'
import { GoogleIcon } from './icons'

interface AuthModalProps {
  open: boolean
  onClose: () => void
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const { configured, signInWithGoogle, signInWithPasskey } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const close = () => {
    setError(null)
    setBusy(false)
    onClose()
  }

  /** Returns true on success. A cancelled passkey prompt resolves quietly — it isn't a real error. */
  const run = async (fn: () => Promise<AuthResult>): Promise<boolean> => {
    setBusy(true)
    setError(null)
    const result = await fn()
    setBusy(false)
    if (result.cancelled) return false
    if (result.error) {
      setError(result.error)
      return false
    }
    return true
  }

  const handlePasskey = async () => {
    if (await run(signInWithPasskey)) close()
  }

  return (
    <Modal open={open} onClose={close} title="Sign in">
      {!configured && (
        <p className="mb-4 text-sm text-text-muted">
          Sign-in isn't configured yet — add Supabase credentials to enable this.
        </p>
      )}

      <div className="flex flex-col gap-3">
        <Button variant="ghost" size="lg" disabled={!configured || busy} onClick={handlePasskey} className="w-full gap-3">
          <KeyIcon className="h-4.5 w-4.5" />
          Sign in with a passkey
        </Button>
        <Button
          variant="primary"
          size="lg"
          disabled={!configured || busy}
          onClick={() => run(signInWithGoogle)}
          className="w-full gap-3"
        >
          <GoogleIcon />
          Continue with Google
        </Button>
      </div>

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
    </Modal>
  )
}
