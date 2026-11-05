import { Loader2Icon } from 'lucide-react'
import type { ReactNode } from 'react'

import { toUserMessage } from '@/shared/api/errors'
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert'

export function PageSpinner() {
  return (
    <div
      className="flex justify-center py-16 text-muted-foreground"
      role="status"
      aria-label="Загрузка"
    >
      <Loader2Icon className="size-6 animate-spin" />
    </div>
  )
}

export function ErrorState({ error }: { error: unknown }) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Ошибка</AlertTitle>
      <AlertDescription>{toUserMessage(error)}</AlertDescription>
    </Alert>
  )
}

interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-6 py-12 text-center">
      <p className="font-medium">{title}</p>
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}
