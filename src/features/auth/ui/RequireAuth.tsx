import { Navigate, Outlet, useLocation } from 'react-router'

import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { PageSpinner } from '@/shared/ui/page-state'

import { useAuth } from '../model/use-auth'

/** Обёртка маршрутов: пускает дальше только пользователя с сессией и профилем. */
export function RequireAuth() {
  const { state, signOut } = useAuth()
  const location = useLocation()

  if (state.status === 'loading') return <PageSpinner />

  if (state.status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (state.status === 'profile-error') {
    return (
      <div className="mx-auto max-w-md p-6">
        <Alert variant="destructive">
          <AlertTitle>Профиль не найден</AlertTitle>
          <AlertDescription>
            Пользователь есть, но у него нет профиля с ролью. Обратитесь к администратору.
          </AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-4" onClick={() => void signOut()}>
          Выйти
        </Button>
      </div>
    )
  }

  return <Outlet />
}
