import { PencilIcon, PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'

import { useObject } from '@/entities/object'
import { compareByStatusOrder, useTasksByObject } from '@/entities/task'
import { useCurrentProfile } from '@/features/auth'
import { DeleteObjectButton, ObjectFormDialog } from '@/features/object-manage'
import { TaskFormDialog } from '@/features/task-manage'
import { Button } from '@/shared/ui/button'
import { PageHeader } from '@/shared/ui/page-header'
import { EmptyState, ErrorState, PageSpinner } from '@/shared/ui/page-state'
import { TaskTable } from '@/widgets/task-table'

export function ObjectPage() {
  const { objectId = '' } = useParams()
  const profile = useCurrentProfile()
  const isManager = profile.role === 'manager'
  const navigate = useNavigate()
  const objectQuery = useObject(objectId)
  const tasksQuery = useTasksByObject(objectId)
  const [editOpen, setEditOpen] = useState(false)
  const [createTaskOpen, setCreateTaskOpen] = useState(false)

  if (objectQuery.isPending) return <PageSpinner />
  if (objectQuery.isError) return <ErrorState error={objectQuery.error} />

  const object = objectQuery.data
  const tasks = tasksQuery.data ? [...tasksQuery.data].sort(compareByStatusOrder) : []

  return (
    <>
      <PageHeader
        title={object.name}
        description={object.address}
        backTo={{ to: '/objects', label: 'К списку объектов' }}
        actions={
          isManager ? (
            <>
              <Button onClick={() => setCreateTaskOpen(true)}>
                <PlusIcon />
                Новая задача
              </Button>
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <PencilIcon />
                Редактировать
              </Button>
              <DeleteObjectButton
                objectId={object.id}
                objectName={object.name}
                onDeleted={() => void navigate('/objects', { replace: true })}
              />
            </>
          ) : null
        }
      />

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Задачи</h2>
          {!isManager ? (
            <span className="text-sm text-muted-foreground">Показаны только ваши задачи</span>
          ) : null}
        </div>
        {tasksQuery.isPending ? <PageSpinner /> : null}
        {tasksQuery.isError ? <ErrorState error={tasksQuery.error} /> : null}
        {tasksQuery.data && tasks.length === 0 ? (
          <EmptyState
            title="Задач пока нет"
            description={isManager ? 'Поставьте первую задачу по этому объекту.' : undefined}
          />
        ) : null}
        {tasks.length > 0 ? <TaskTable tasks={tasks} /> : null}
      </section>

      {isManager ? (
        <>
          <ObjectFormDialog open={editOpen} onOpenChange={setEditOpen} object={object} />
          <TaskFormDialog
            open={createTaskOpen}
            onOpenChange={setCreateTaskOpen}
            objectId={object.id}
          />
        </>
      ) : null}
    </>
  )
}
