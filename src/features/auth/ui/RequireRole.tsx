import type { ReactNode } from 'react'
import { Navigate } from 'react-router'

import type { UserRole } from '@/entities/profile'

import { useCurrentProfile } from '../model/use-auth'

/** Экран только для одной роли. Это удобство навигации, не защита: защита в RLS. */
export function RequireRole({ role, children }: { role: UserRole; children: ReactNode }) {
  const profile = useCurrentProfile()
  if (profile.role !== role) return <Navigate to="/" replace />
  return <>{children}</>
}
