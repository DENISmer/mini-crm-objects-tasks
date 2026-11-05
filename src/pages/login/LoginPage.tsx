import { Navigate, useLocation } from 'react-router'

import { SignInForm, useAuth } from '@/features/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { PageSpinner } from '@/shared/ui/page-state'

export function LoginPage() {
  const { state } = useAuth()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  if (state.status === 'loading') return <PageSpinner />
  if (state.status !== 'anonymous') return <Navigate to={from} replace />

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Вход</CardTitle>
          <CardDescription>
            Мини-CRM «Объекты и задачи». Доступ выдаёт администратор, регистрации нет.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignInForm />
        </CardContent>
      </Card>
    </div>
  )
}
