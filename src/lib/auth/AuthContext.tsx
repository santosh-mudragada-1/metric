import { createContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

export interface AuthResult {
  error?: string
}

export interface AuthContextValue {
  user: User | null
  loading: boolean
  configured: boolean
  signInWithGoogle: () => Promise<AuthResult>
  sendMagicLink: (email: string) => Promise<AuthResult>
  signInWithPasskey: () => Promise<AuthResult>
  registerPasskey: () => Promise<AuthResult>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

function errorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) return String((error as { message: unknown }).message)
  return 'Something went wrong. Try again.'
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
      return error ? { error: errorMessage(error) } : {}
    } catch (error) {
      return { error: errorMessage(error) }
    }
  }

  const registerPasskey = async (): Promise<AuthResult> => {
    if (!supabase) return NOT_CONFIGURED
    try {
      const { error } = await supabase.auth.registerPasskey()
      return error ? { error: errorMessage(error) } : {}
    } catch (error) {
      return { error: errorMessage(error) }
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
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
