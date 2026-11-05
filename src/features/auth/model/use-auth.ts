import { useContext } from 'react'

import type { Profile } from '@/entities/profile'

import { AuthContext, type AuthContextValue } from './auth-context'

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth можно вызывать только внутри <AuthProvider>')
  return context
}

/** Для экранов под <RequireAuth>: профиль гарантированно есть. */
export function useCurrentProfile(): Profile {
  const { state } = useAuth()
  if (state.status !== 'authenticated') {
    throw new Error('useCurrentProfile можно вызывать только под <RequireAuth>')
  }
  return state.profile
}
