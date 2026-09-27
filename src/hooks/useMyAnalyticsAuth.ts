import { useEffect } from 'react'
import { identify, reset, track } from '@/lib/myAnalytics'
import { supabase } from '@/lib/supabase'

/**
 * Auth → My Analytics: links sessions to the Supabase user id (never the email) and records
 * login/signup/logout. Mirrors AuthContext's PostHog logic without touching that file.
 */
export function useMyAnalyticsAuth() {
  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) identify(data.session.user.id)
    })
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user
      if (user) {
        identify(user.id)
        if (event === 'SIGNED_IN') {
          const provider = user.app_metadata.provider ?? 'unknown'
          const created = new Date(user.created_at).getTime()
          const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at).getTime() : created
          // Same heuristic as AuthContext: a brand-new account signs in within seconds of creation.
          track(lastSignIn - created < 10_000 ? 'signup_completed' : 'login_completed', { auth_provider: provider })
        }
      } else if (event === 'SIGNED_OUT') {
        track('logout_completed')
        reset()
      }
    })
    return () => data.subscription.unsubscribe()
  }, [])
}
