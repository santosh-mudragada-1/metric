import { useState } from 'react'
import { EnvelopeOpenIcon, KeyIcon } from '@heroicons/react/24/outline'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import type { AuthResult } from '@/lib/auth/AuthContext'
import { GoogleIcon } from './icons'

interface AuthModalProps {
  open: boolean
  onClose: () => void
}

type Mode = 'signin' | 'signup'
type Step = 'options' | 'sent'

const TITLES: Record<Mode, string> = {
  signin: 'Sign in',
  signup: 'Create your account',
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const { configured, signInWithGoogle, sendMagicLink, signInWithPasskey } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [step, setStep] = useState<Step>('options')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const reset = () => {
    setMode('signin')
    setStep('options')
    setEmail('')
    setError(null)
    setBusy(false)
  }

  const close = () => {
    reset()
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

  const handleSendLink = async () => {
    if (!email.trim()) return
    if (await run(() => sendMagicLink(email.trim()))) setStep('sent')
  }

  const title = step === 'sent' ? 'Check your email' : TITLES[mode]

  return (
    <Modal open={open} onClose={close} title={title}>
      {!configured && (
        <p className="mb-4 text-sm text-text-muted">
          Sign-in isn't configured yet — add Supabase credentials to enable this.
        </p>
      )}

      {step === 'options' && (
        <div className="flex flex-col gap-3">
          {mode === 'signin' && (
            <Button
              variant="ghost"
              size="lg"
              disabled={!configured || busy}
              onClick={handlePasskey}
              className="w-full gap-3"
            >
              <KeyIcon className="h-4.5 w-4.5" />
              Sign in with a passkey
            </Button>
          )}
          <Button
            variant="ghost"
            size="lg"
            disabled={!configured || busy}
            onClick={() => run(signInWithGoogle)}
            className="w-full gap-3"
          >
            <GoogleIcon />
            Continue with Google
          </Button>

          <div className="my-1 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="font-mono text-[0.6875rem] tracking-[0.14em] text-text-dim uppercase">or</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendLink()}
            disabled={!configured || busy}
            className="h-13 w-full rounded-full border border-border-strong bg-surface-raised px-4 text-sm text-text
              outline-none focus:border-invert/60 disabled:opacity-50"
          />
          <Button
            variant="primary"
            size="lg"
            disabled={!configured || busy || !email.trim()}
            onClick={handleSendLink}
            className="w-full"
          >
            {mode === 'signin' ? 'Email me a sign-in link' : 'Create my account'}
          </Button>

          <button
            type="button"
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            className="mt-1 cursor-pointer text-center font-mono text-[0.6875rem] tracking-[0.14em] text-text-dim
              uppercase hover:text-text-muted"
          >
            {mode === 'signin' ? "New here? Create an account" : 'Already have an account? Sign in'}
          </button>
        </div>
      )}

      {step === 'sent' && (
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <EnvelopeOpenIcon className="h-8 w-8 text-text-dim" />
          <p className="text-sm text-text-muted">
            We sent a sign-in link to <span className="text-text">{email}</span>. Open it on this device to finish
            signing in.
          </p>
          <button
            type="button"
            onClick={() => {
              setStep('options')
              setError(null)
            }}
            className="cursor-pointer font-mono text-[0.6875rem] tracking-[0.14em] text-text-dim uppercase
              hover:text-text-muted"
          >
            Use a different method
          </button>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
    </Modal>
  )
}
