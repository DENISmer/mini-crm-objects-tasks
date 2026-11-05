import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { useExecutors } from '@/entities/profile'
import { useCreateTask, useUpdateTask, type Task } from '@/entities/task'
import { toUserMessage } from '@/shared/api/errors'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Textarea } from '@/shared/ui/textarea'

/** Radix Select не принимает пустую строку как значение, поэтому «не назначен» кодируем явно. */
const UNASSIGNED = '__unassigned__'

const schema = z.object({
  title: z.string().trim().min(1, 'Укажите название').max(200, 'Не более 200 символов'),
  description: z.string().trim().max(5000, 'Не более 5000 символов'),
  assigneeId: z.string(),
})

type FormValues = z.infer<typeof schema>

interface TaskFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  objectId: string
  /** Если передана, диалог работает в режиме редактирования. */
  task?: Task
}

export function TaskFormDialog({ open, onOpenChange, objectId, task }: TaskFormDialogProps) {
  const executorsQuery = useExecutors()
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const isEdit = Boolean(task)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '', assigneeId: UNASSIGNED },
  })
  const { errors, isSubmitting } = form.formState

  useEffect(() => {
    if (open) {
      form.reset({
        title: task?.title ?? '',
        description: task?.description ?? '',
        assigneeId: task?.assignee_id ?? UNASSIGNED,
      })
    }
  }, [open, task, form])

  const onSubmit = form.handleSubmit(async (values) => {
    const input = {
      title: values.title,
      description: values.description,
      assignee_id: values.assigneeId === UNASSIGNED ? null : values.assigneeId,
    }
    try {
      if (task) {
        await updateTask.mutateAsync({ id: task.id, input })
        toast.success('Задача обновлена')
      } else {
        await createTask.mutateAsync({ ...input, object_id: objectId })
        toast.success('Задача создана')
      }
      onOpenChange(false)
    } catch (error) {
      toast.error(toUserMessage(error))
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={onSubmit} noValidate>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Редактировать задачу' : 'Новая задача'}</DialogTitle>
            <DialogDescription>
              Статус задаёт система: новая задача всегда создаётся в статусе «Новая».
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="py-4">
            <Field data-invalid={Boolean(errors.title)}>
              <FieldLabel htmlFor="task-title">Название</FieldLabel>
              <Input id="task-title" autoFocus {...form.register('title')} />
              <FieldError errors={[errors.title]} />
            </Field>
            <Field data-invalid={Boolean(errors.description)}>
              <FieldLabel htmlFor="task-description">Описание</FieldLabel>
              <Textarea id="task-description" rows={4} {...form.register('description')} />
              <FieldError errors={[errors.description]} />
            </Field>
            <Controller
              control={form.control}
              name="assigneeId"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="task-assignee">Исполнитель</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="task-assignee" className="w-full">
                      <SelectValue placeholder="Не назначен" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UNASSIGNED}>Не назначен</SelectItem>
                      {(executorsQuery.data ?? []).map((executor) => (
                        <SelectItem key={executor.id} value={executor.id}>
                          {executor.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    Взять задачу в работу сможет только назначенный исполнитель.
                  </FieldDescription>
                </Field>
              )}
            />
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isEdit ? 'Сохранить' : 'Создать'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
