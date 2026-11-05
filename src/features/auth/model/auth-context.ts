import type { Session } from '@supabase/supabase-js'
import { createContext } from 'react'

import type { Profile } from '@/entities/profile'

export type AuthState =
  | { status: 'loading'; session: null; profile: null }
  | { status: 'anonymous'; session: null; profile: null }
  | { status: 'authenticated'; session: Session; profile: Profile }
  /** Сессия есть, а профиля нет: пользователь создан без профиля или профиль удалён. */
  | { status: 'profile-error'; session: Session; profile: null; error: unknown }

export interface AuthContextValue {
  state: AuthState
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
