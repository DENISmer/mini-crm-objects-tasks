import { Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { useDeleteObject } from '@/entities/object'
import { toUserMessage } from '@/shared/api/errors'
import { Button } from '@/shared/ui/button'
import { ConfirmDialog } from '@/shared/ui/confirm-dialog'

interface DeleteObjectButtonProps {
  objectId: string
  objectName: string
  onDeleted: () => void
}

export function DeleteObjectButton({ objectId, objectName, onDeleted }: DeleteObjectButtonProps) {
  const [open, setOpen] = useState(false)
  const deleteObject = useDeleteObject()

  const confirm = async () => {
    try {
      await deleteObject.mutateAsync(objectId)
      toast.success('Объект удалён')
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
        title={`Удалить объект «${objectName}»?`}
        description="Вместе с объектом удалятся все его задачи и их история. Отменить это нельзя."
        confirmLabel="Удалить"
        destructive
        pending={deleteObject.isPending}
        onConfirm={() => void confirm()}
      />
    </>
  )
}
