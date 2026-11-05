import { Navigate } from 'react-router'

import { useCurrentProfile } from '@/features/auth'

/** Стартовый экран зависит от роли. */
export function HomeRedirect() {
  const profile = useCurrentProfile()
  return <Navigate to={profile.role === 'manager' ? '/objects' : '/my-tasks'} replace />
}
