import { Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { useDeleteTask } from '@/entities/task'
import { toUserMessage } from '@/shared/api/errors'
import { Button } from '@/shared/ui/button'
import { ConfirmDialog } from '@/shared/ui/confirm-dialog'

interface DeleteTaskButtonProps {
  taskId: string
  taskTitle: string
  onDeleted: () => void
}

export function DeleteTaskButton({ taskId, taskTitle, onDeleted }: DeleteTaskButtonProps) {
  const [open, setOpen] = useState(false)
  const deleteTask = useDeleteTask()

  const confirm = async () => {
    try {
      await deleteTask.mutateAsync(taskId)
      toast.success('Задача удалена')
      setOpen(false)
      onDeleted()
    } catch (error) {
      toast.error(toUserMessage(error))
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Trash2Icon />
        Удалить
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Удалить задачу «${taskTitle}»?`}
        description="История задачи удалится вместе с ней. Отменить это нельзя."
        confirmLabel="Удалить"
        destructive
        pending={deleteTask.isPending}
        onConfirm={() => void confirm()}
      />
    </>
  )
}
