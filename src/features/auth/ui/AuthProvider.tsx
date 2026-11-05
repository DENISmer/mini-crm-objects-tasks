import type { Session } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import { useProfile } from '@/entities/profile'
import { supabase } from '@/shared/api/supabase'

import { AuthContext, type AuthContextValue, type AuthState } from '../model/auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState<Session | null>(null)
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    let active = true

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setSessionReady(true)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setSessionReady(true)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const profileQuery = useProfile(session?.user.id)

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    queryClient.clear()
  }, [queryClient])

  const state = useMemo<AuthState>(() => {
    if (!sessionReady) return { status: 'loading', session: null, profile: null }
    if (!session) return { status: 'anonymous', session: null, profile: null }
    if (profileQuery.data) return { status: 'authenticated', session, profile: profileQuery.data }
    if (profileQuery.isError) {
      return { status: 'profile-error', session, profile: null, error: profileQuery.error }
    }
    return { status: 'loading', session: null, profile: null }
  }, [sessionReady, session, profileQuery.data, profileQuery.isError, profileQuery.error])

  const value = useMemo<AuthContextValue>(() => ({ state, signOut }), [state, signOut])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
