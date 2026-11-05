import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

import {
  TASK_STATUS_LABELS,
  getAvailableTransitions,
  useTransitionRules,
  useTransitionTask,
  type AvailableTransition,
  type Task,
} from '@/entities/task'
import { taskHistoryKeys } from '@/entities/task-history'
import { useCurrentProfile } from '@/features/auth'
import { toUserMessage } from '@/shared/api/errors'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'

import { TransitionCommentDialog } from './TransitionCommentDialog'

interface TaskActionsProps {
  task: Pick<Task, 'id' | 'status' | 'assignee_id'>
}

/**
 * Кнопки доступных переходов. Список берётся из справочника в базе и фильтруется
 * по роли и назначению (getAvailableTransitions), поэтому интерфейс показывает
 * ровно те действия, которые база разрешит.
 */
export function TaskActions({ task }: TaskActionsProps) {
  const profile = useCurrentProfile()
  const rulesQuery = useTransitionRules()
  const transition = useTransitionTask()
  const queryClient = useQueryClient()
  const [commentFor, setCommentFor] = useState<AvailableTransition | null>(null)

  if (rulesQuery.isPending) return <Skeleton className="h-8 w-40" />
  if (rulesQuery.isError) return null

  const actions = getAvailableTransitions({ rules: rulesQuery.data, task, actor: profile })

  if (actions.length === 0) {
    return <p className="text-sm text-muted-foreground">Сейчас для вас нет доступных действий.</p>
  }

  const run = async (action: AvailableTransition, comment?: string) => {
    try {
      await transition.mutateAsync({ taskId: task.id, to: action.to, comment })
      await queryClient.invalidateQueries({ queryKey: taskHistoryKeys.byTask(task.id) })
      setCommentFor(null)
      toast.success(`Статус: ${TASK_STATUS_LABELS[action.to]}`)
    } catch (error) {
      toast.error(toUserMessage(error))
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <Button
          key={action.to}
          variant={action.to === 'rework' ? 'outline' : 'default'}
          disabled={transition.isPending}
          onClick={() => (action.requiresComment ? setCommentFor(action) : void run(action))}
        >
          {action.label}
        </Button>
      ))}
      <TransitionCommentDialog
        open={commentFor !== null}
        onOpenChange={(open) => {
          if (!open) setCommentFor(null)
        }}
        actionLabel={commentFor?.label ?? ''}
        pending={transition.isPending}
        onSubmit={(comment) => {
          if (commentFor) void run(commentFor, comment)
        }}
      />
    </div>
  )
}
