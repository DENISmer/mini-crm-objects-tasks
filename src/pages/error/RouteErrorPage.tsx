import { useEffect } from 'react'
import { Link, useRouteError } from 'react-router'

import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert'
import { Button, buttonVariants } from '@/shared/ui/button'

/**
 * errorElement роутера: ошибка рендера на любом экране показывает объяснение и выход,
 * а не белый экран. Текст ошибки виден только в dev-сборке.
 */
export function RouteErrorPage() {
  const error = useRouteError()

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="mx-auto max-w-md p-6">
      <Alert variant="destructive">
        <AlertTitle>Что-то пошло не так</AlertTitle>
        <AlertDescription>
          <p>Страница не смогла отобразиться. Обновите её или вернитесь на главную.</p>
          {import.meta.env.DEV && error instanceof Error ? (
            <pre className="mt-2 whitespace-pre-wrap text-xs">{error.message}</pre>
          ) : null}
        </AlertDescription>
      </Alert>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => window.location.reload()}>
          Обновить страницу
        </Button>
        <Link to="/" className={buttonVariants({ variant: 'ghost' })}>
          На главную
        </Link>
      </div>
    </div>
  )
}
