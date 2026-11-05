import { TASK_STATUS_LABELS } from '@/entities/task'
import { useTaskHistory } from '@/entities/task-history'
import { formatDateTime } from '@/shared/lib/format'
import { ErrorState } from '@/shared/ui/page-state'
import { Skeleton } from '@/shared/ui/skeleton'

export function TaskHistoryList({ taskId }: { taskId: string }) {
  const historyQuery = useTaskHistory(taskId)

  if (historyQuery.isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }
  if (historyQuery.isError) return <ErrorState error={historyQuery.error} />
  if (historyQuery.data.length === 0) {
    return <p className="text-sm text-muted-foreground">История пуста.</p>
  }

  return (
    <ol className="space-y-4">
      {historyQuery.data.map((entry) => (
        <li key={entry.id} className="border-l-2 pl-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <span className="text-sm font-medium">{entry.actor?.full_name ?? 'Пользователь'}</span>
            <time className="text-xs text-muted-foreground" dateTime={entry.created_at}>
              {formatDateTime(entry.created_at)}
            </time>
          </div>
          <p className="text-sm text-muted-foreground">
            {entry.from_status === null
              ? `Создал(а) задачу в статусе «${TASK_STATUS_LABELS[entry.to_status]}»`
              : `${TASK_STATUS_LABELS[entry.from_status]} → ${TASK_STATUS_LABELS[entry.to_status]}`}
          </p>
          {entry.comment ? (
            <p className="mt-1 rounded-md bg-muted px-3 py-2 text-sm whitespace-pre-wrap">
              {entry.comment}
            </p>
          ) : null}
        </li>
      ))}
    </ol>
  )
}
