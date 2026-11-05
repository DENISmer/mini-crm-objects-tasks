import { PencilIcon } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

import { TaskStatusBadge, useTask } from '@/entities/task'
import { useCurrentProfile } from '@/features/auth'
import { DeleteTaskButton, TaskFormDialog } from '@/features/task-manage'
import { TaskActions } from '@/features/task-transition'
import { formatDateTime } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { PageHeader } from '@/shared/ui/page-header'
import { ErrorState, PageSpinner } from '@/shared/ui/page-state'
import { TaskHistoryList } from '@/widgets/task-history'

export function TaskPage() {
  const { taskId = '' } = useParams()
  const profile = useCurrentProfile()
  const isManager = profile.role === 'manager'
  const navigate = useNavigate()
  const taskQuery = useTask(taskId)
  const [editOpen, setEditOpen] = useState(false)

  if (taskQuery.isPending) return <PageSpinner />
  if (taskQuery.isError) return <ErrorState error={taskQuery.error} />

  const task = taskQuery.data
  const backTo = task.object
    ? { to: `/objects/${task.object.id}`, label: task.object.name }
    : { to: '/objects', label: 'К объектам' }

  return (
    <>
      <PageHeader
        title={task.title}
        description={<TaskStatusBadge status={task.status} />}
        backTo={backTo}
        actions={
          isManager ? (
            <>
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <PencilIcon />
                Редактировать
              </Button>
              <DeleteTaskButton
                taskId={task.id}
                taskTitle={task.title}
                onDeleted={() => void navigate(backTo.to, { replace: true })}
              />
            </>
          ) : null
        }
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Описание</CardTitle>
            </CardHeader>
            <CardContent>
              {task.description ? (
                <p className="text-sm whitespace-pre-wrap">{task.description}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Описания нет.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Действия</CardTitle>
            </CardHeader>
            <CardContent>
              <TaskActions task={task} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>История</CardTitle>
            </CardHeader>
            <CardContent>
              <TaskHistoryList taskId={task.id} />
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Данные</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Объект</dt>
              <dd>
                {task.object ? (
                  <Link
                    to={`/objects/${task.object.id}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {task.object.name}
                  </Link>
                ) : (
                  '—'
                )}
              </dd>
              <dt className="text-muted-foreground">Исполнитель</dt>
              <dd>{task.assignee?.full_name ?? 'Не назначен'}</dd>
              <dt className="text-muted-foreground">Автор</dt>
              <dd>{task.author?.full_name ?? '—'}</dd>
              <dt className="text-muted-foreground">Создана</dt>
              <dd>{formatDateTime(task.created_at)}</dd>
              <dt className="text-muted-foreground">Обновлена</dt>
              <dd>{formatDateTime(task.updated_at)}</dd>
            </dl>
          </CardContent>
        </Card>
      </div>

      {isManager ? (
        <TaskFormDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          objectId={task.object_id}
          task={task}
        />
      ) : null}
    </>
  )
}
