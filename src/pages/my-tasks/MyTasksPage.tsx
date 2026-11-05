import { useMemo, useState } from 'react'

import {
  TASK_STATUS_LABELS,
  TASK_STATUS_ORDER,
  compareByStatusOrder,
  useTasksByAssignee,
  type TaskStatus,
  type TaskWithRelations,
} from '@/entities/task'
import { useCurrentProfile } from '@/features/auth'
import { cn } from '@/shared/lib/utils'
import { buttonVariants } from '@/shared/ui/button'
import { PageHeader } from '@/shared/ui/page-header'
import { EmptyState, ErrorState, PageSpinner } from '@/shared/ui/page-state'
import { TaskTable } from '@/widgets/task-table'

type Filter = TaskStatus | 'all'

/** Стабильная ссылка, чтобы useMemo ниже не пересчитывался на каждом рендере до загрузки. */
const NO_TASKS: TaskWithRelations[] = []

export function MyTasksPage() {
  const profile = useCurrentProfile()
  const tasksQuery = useTasksByAssignee(profile.id)
  const [filter, setFilter] = useState<Filter>('all')

  const tasks = tasksQuery.data ?? NO_TASKS
  const counts = useMemo(() => {
    const result = new Map<TaskStatus, number>()
    for (const task of tasks) result.set(task.status, (result.get(task.status) ?? 0) + 1)
    return result
  }, [tasks])

  const visible = useMemo(
    () =>
      [...tasks]
        .filter((task) => filter === 'all' || task.status === filter)
        .sort(compareByStatusOrder),
    [tasks, filter],
  )

  const filters: { value: Filter; label: string; count: number }[] = [
    { value: 'all', label: 'Все', count: tasks.length },
    ...TASK_STATUS_ORDER.map((status) => ({
      value: status,
      label: TASK_STATUS_LABELS[status],
      count: counts.get(status) ?? 0,
    })),
  ]

  return (
    <>
      <PageHeader title="Мои задачи" description="Задачи, назначенные на вас." />

      <div className="mb-4 flex flex-wrap gap-1">
        {filters.map((item) => (
          <button
            key={item.value}
            type="button"
            className={cn(
              buttonVariants({
                variant: filter === item.value ? 'secondary' : 'ghost',
                size: 'sm',
              }),
            )}
            onClick={() => setFilter(item.value)}
          >
            {item.label}
            <span className="text-muted-foreground">{item.count}</span>
          </button>
        ))}
      </div>

      {tasksQuery.isPending ? <PageSpinner /> : null}
      {tasksQuery.isError ? <ErrorState error={tasksQuery.error} /> : null}
      {tasksQuery.data && tasks.length === 0 ? (
        <EmptyState title="Вам пока не назначили задач" />
      ) : null}
      {tasks.length > 0 && visible.length === 0 ? (
        <EmptyState title="В этом статусе задач нет" />
      ) : null}
      {visible.length > 0 ? <TaskTable tasks={visible} showObject /> : null}
    </>
  )
}
