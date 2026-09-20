import { createContext, useEffect, useState, type ReactNode } from 'react'
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
  sendMagicLink: (email: string) => Promise<AuthResult>
  signInWithPasskey: () => Promise<AuthResult>
  registerPasskey: () => Promise<AuthResult>
  hasPasskey: () => Promise<boolean>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

function errorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) return String((error as { message: unknown }).message)
  return 'Something went wrong. Try again.'
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
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.subscription.unsubscribe()
  }, [])

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

  const sendMagicLink = async (email: string): Promise<AuthResult> => {
    if (!supabase) return NOT_CONFIGURED
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, emailRedirectTo: window.location.origin },
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
        sendMagicLink,
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
