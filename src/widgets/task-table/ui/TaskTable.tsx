import { Link, useNavigate } from 'react-router'

import { TaskStatusBadge, type TaskWithRelations } from '@/entities/task'
import { formatDateTime } from '@/shared/lib/format'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'

interface TaskTableProps {
  tasks: TaskWithRelations[]
  /** Колонка «Объект» нужна в сводных списках, на карточке объекта она избыточна. */
  showObject?: boolean
}

export function TaskTable({ tasks, showObject = false }: TaskTableProps) {
  const navigate = useNavigate()

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Задача</TableHead>
            {showObject ? <TableHead>Объект</TableHead> : null}
            <TableHead>Исполнитель</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead className="text-right">Создана</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow
              key={task.id}
              className="cursor-pointer"
              onClick={() => void navigate(`/tasks/${task.id}`)}
            >
              <TableCell className="font-medium">
                <Link to={`/tasks/${task.id}`} onClick={(event) => event.stopPropagation()}>
                  {task.title}
                </Link>
              </TableCell>
              {showObject ? (
                <TableCell className="text-muted-foreground">{task.object?.name ?? '—'}</TableCell>
              ) : null}
              <TableCell className="text-muted-foreground">
                {task.assignee?.full_name ?? 'Не назначен'}
              </TableCell>
              <TableCell>
                <TaskStatusBadge status={task.status} />
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {formatDateTime(task.created_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
