import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { useCreateObject, useUpdateObject, type ConstructionObject } from '@/entities/object'
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
import { Field, FieldError, FieldGroup, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'

const schema = z.object({
  name: z.string().trim().min(1, 'Укажите название').max(200, 'Не более 200 символов'),
  address: z.string().trim().min(1, 'Укажите адрес').max(500, 'Не более 500 символов'),
})

type FormValues = z.infer<typeof schema>

interface ObjectFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Если передан, диалог работает в режиме редактирования. */
  object?: ConstructionObject
}

export function ObjectFormDialog({ open, onOpenChange, object }: ObjectFormDialogProps) {
  const createObject = useCreateObject()
  const updateObject = useUpdateObject()
  const isEdit = Boolean(object)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', address: '' },
  })
  const { errors, isSubmitting } = form.formState

  useEffect(() => {
    if (open) form.reset({ name: object?.name ?? '', address: object?.address ?? '' })
  }, [open, object, form])

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (object) {
        await updateObject.mutateAsync({ id: object.id, input: values })
        toast.success('Объект обновлён')
      } else {
        await createObject.mutateAsync(values)
        toast.success('Объект создан')
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
            <DialogTitle>{isEdit ? 'Редактировать объект' : 'Новый объект'}</DialogTitle>
            <DialogDescription>Название и адрес стройки.</DialogDescription>
          </DialogHeader>
          <FieldGroup className="py-4">
            <Field data-invalid={Boolean(errors.name)}>
              <FieldLabel htmlFor="object-name">Название</FieldLabel>
              <Input id="object-name" autoFocus {...form.register('name')} />
              <FieldError errors={[errors.name]} />
            </Field>
            <Field data-invalid={Boolean(errors.address)}>
              <FieldLabel htmlFor="object-address">Адрес</FieldLabel>
              <Input id="object-address" {...form.register('address')} />
              <FieldError errors={[errors.address]} />
            </Field>
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
