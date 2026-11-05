import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'

import { TASK_STATUS_CLASS, TASK_STATUS_LABELS, type TaskStatus } from '../model'

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <Badge variant="outline" className={cn('border-transparent', TASK_STATUS_CLASS[status])}>
      {TASK_STATUS_LABELS[status]}
    </Badge>
  )
}
