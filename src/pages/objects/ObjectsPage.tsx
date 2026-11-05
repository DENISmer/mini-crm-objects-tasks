import { PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'

import { useObjects } from '@/entities/object'
import { useCurrentProfile } from '@/features/auth'
import { ObjectFormDialog } from '@/features/object-manage'
import { formatDateTime, pluralize } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import { PageHeader } from '@/shared/ui/page-header'
import { EmptyState, ErrorState, PageSpinner } from '@/shared/ui/page-state'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'

export function ObjectsPage() {
  const profile = useCurrentProfile()
  const isManager = profile.role === 'manager'
  const objectsQuery = useObjects()
  const navigate = useNavigate()
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <>
      <PageHeader
        title="Объекты"
        description={isManager ? 'Все стройки компании.' : 'Объекты, на которых у вас есть задачи.'}
        actions={
          isManager ? (
            <Button onClick={() => setCreateOpen(true)}>
              <PlusIcon />
              Создать объект
            </Button>
          ) : null
        }
      />

      {objectsQuery.isPending ? <PageSpinner /> : null}
      {objectsQuery.isError ? <ErrorState error={objectsQuery.error} /> : null}
      {objectsQuery.data?.length === 0 ? (
        <EmptyState
          title="Объектов пока нет"
          description={
            isManager
              ? 'Создайте первый объект, чтобы ставить по нему задачи.'
              : 'Когда вам назначат задачу, её объект появится здесь.'
          }
        />
      ) : null}
      {objectsQuery.data && objectsQuery.data.length > 0 ? (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Адрес</TableHead>
                <TableHead>Задачи</TableHead>
                <TableHead className="text-right">Создан</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {objectsQuery.data.map((object) => (
                <TableRow
                  key={object.id}
                  className="cursor-pointer"
                  onClick={() => void navigate(`/objects/${object.id}`)}
                >
                  <TableCell className="font-medium">
                    <Link to={`/objects/${object.id}`} onClick={(event) => event.stopPropagation()}>
                      {object.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{object.address}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {object.tasksCount}{' '}
                    {pluralize(object.tasksCount, ['задача', 'задачи', 'задач'])}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatDateTime(object.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}

      {isManager ? <ObjectFormDialog open={createOpen} onOpenChange={setCreateOpen} /> : null}
    </>
  )
}
