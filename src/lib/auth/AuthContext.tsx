import { createContext, useEffect, useState, type ReactNode } from 'react'
import { usePostHog } from '@posthog/react'
import type { User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { migrateLocalBestsIfNeeded } from '@/lib/statsMigration'

export interface AuthResult {
  error?: string
  /** The browser's passkey prompt was dismissed or timed out — not a real failure, don't show it as an error. */
  cancelled?: boolean
}

export interface AuthContextValue {
  user: User | null
  loading: boolean
  configured: boolean
  signInWithGoogle: () => Promise<AuthResult>
  signInWithPasskey: () => Promise<AuthResult>
  registerPasskey: () => Promise<AuthResult>
  hasPasskey: () => Promise<boolean>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

/** Maps raw GoTrue error text to copy a player would actually understand. */
const FRIENDLY_ERROR_PATTERNS: [RegExp, string][] = [
  [/network|fetch failed|failed to fetch/i, "Couldn't reach the sign-in service — check your connection and try again."],
]

function errorMessage(error: unknown): string {
  const raw =
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message: unknown }).message)
      : ''
  for (const [pattern, friendly] of FRIENDLY_ERROR_PATTERNS) {
    if (pattern.test(raw)) return friendly
  }
  return raw || 'Something went wrong. Try again.'
}

/** WebAuthn throws NotAllowedError both when the user cancels and when the prompt times out. */
function isPasskeyCancelled(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const name = 'name' in error ? String((error as { name: unknown }).name) : ''
  const message = 'message' in error ? String((error as { message: unknown }).message) : ''
  return name === 'NotAllowedError' || message.toLowerCase().includes('timed out or was not allowed')
}

const NOT_CONFIGURED: AuthResult = { error: "Sign-in isn't configured yet — add Supabase credentials to enable this." }

export function AuthProvider({ children }: { children: ReactNode }) {
  const posthog = usePostHog()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      const sessionUser = data.session?.user ?? null
      setUser(sessionUser)
      if (sessionUser) {
        posthog?.identify(sessionUser.id, {
          email: sessionUser.email,
          auth_provider: sessionUser.app_metadata.provider,
        })
      }
      setLoading(false)
    })
    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      const sessionUser = session?.user ?? null
      setUser(sessionUser)
      if (sessionUser) {
        posthog?.identify(sessionUser.id, {
          email: sessionUser.email,
          auth_provider: sessionUser.app_metadata.provider,
        })
        if (event === 'SIGNED_IN') {
          posthog?.capture('user_signed_in', {
            auth_provider: sessionUser.app_metadata.provider ?? 'unknown',
          })
          // A brand-new account's first sign-in lands within seconds of its creation timestamp —
          // a returning user's `last_sign_in_at` is always far later than `created_at`.
          const createdAt = new Date(sessionUser.created_at).getTime()
          const lastSignInAt = sessionUser.last_sign_in_at ? new Date(sessionUser.last_sign_in_at).getTime() : createdAt
          if (lastSignInAt - createdAt < 10_000) {
            posthog?.capture('signup_completed', {
              auth_provider: sessionUser.app_metadata.provider ?? 'unknown',
            })
          }
        }
      } else if (event === 'SIGNED_OUT') {
        posthog?.capture('user_signed_out')
        posthog?.reset()
      }
    })
    return () => subscription.subscription.unsubscribe()
  }, [posthog])

  // Backfill any pre-sign-in guest bests so the stats page reflects what the home page already shows.
  useEffect(() => {
    if (user) void migrateLocalBestsIfNeeded(user.id)
  }, [user])

  const signInWithGoogle = async (): Promise<AuthResult> => {
    if (!supabase) return NOT_CONFIGURED
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    return error ? { error: errorMessage(error) } : {}
  }

  const signInWithPasskey = async (): Promise<AuthResult> => {
    if (!supabase) return NOT_CONFIGURED
    try {
      const { error } = await supabase.auth.signInWithPasskey()
      if (!error) return {}
      return isPasskeyCancelled(error) ? { cancelled: true } : { error: errorMessage(error) }
    } catch (error) {
      return isPasskeyCancelled(error) ? { cancelled: true } : { error: errorMessage(error) }
    }
  }

  const registerPasskey = async (): Promise<AuthResult> => {
    if (!supabase) return NOT_CONFIGURED
    try {
      const { error } = await supabase.auth.registerPasskey()
      if (!error) return {}
      return isPasskeyCancelled(error) ? { cancelled: true } : { error: errorMessage(error) }
    } catch (error) {
      return isPasskeyCancelled(error) ? { cancelled: true } : { error: errorMessage(error) }
    }
  }

  const hasPasskey = async (): Promise<boolean> => {
    if (!supabase) return false
    try {
      const { data, error } = await supabase.auth.passkey.list()
      if (error) return false
      return (data?.length ?? 0) > 0
    } catch {
      return false
    }
  }

  const signOut = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        configured: isSupabaseConfigured,
        signInWithGoogle,
        signInWithPasskey,
        registerPasskey,
        hasPasskey,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
