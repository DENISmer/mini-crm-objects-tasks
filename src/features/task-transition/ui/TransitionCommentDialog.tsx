import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Field, FieldError, FieldLabel } from '@/shared/ui/field'
import { Textarea } from '@/shared/ui/textarea'

const schema = z.object({
  comment: z.string().trim().min(1, 'Комментарий обязателен').max(2000, 'Не более 2000 символов'),
})

type FormValues = z.infer<typeof schema>

interface TransitionCommentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  actionLabel: string
  pending: boolean
  onSubmit: (comment: string) => void
}

/** Переходы с requires_comment = true: база откажет без комментария, поэтому спрашиваем заранее. */
export function TransitionCommentDialog({
  open,
  onOpenChange,
  actionLabel,
  pending,
  onSubmit,
}: TransitionCommentDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { comment: '' },
  })
  const { errors } = form.formState

  useEffect(() => {
    if (open) form.reset({ comment: '' })
  }, [open, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={form.handleSubmit((values) => onSubmit(values.comment))} noValidate>
          <DialogHeader>
            <DialogTitle>{actionLabel}</DialogTitle>
            <DialogDescription>
              Напишите исполнителю, что нужно исправить. Комментарий сохранится в истории задачи.
            </DialogDescription>
          </DialogHeader>
          <Field className="py-4" data-invalid={Boolean(errors.comment)}>
            <FieldLabel htmlFor="transition-comment">Комментарий</FieldLabel>
            <Textarea id="transition-comment" rows={4} autoFocus {...form.register('comment')} />
            <FieldError errors={[errors.comment]} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={pending}>
              {actionLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
