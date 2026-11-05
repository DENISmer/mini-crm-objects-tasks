import { Link } from 'react-router'

import { buttonVariants } from '@/shared/ui/button'

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">Страница не найдена</h1>
      <Link to="/" className={buttonVariants({ variant: 'outline' })}>
        На главную
      </Link>
    </div>
  )
}
