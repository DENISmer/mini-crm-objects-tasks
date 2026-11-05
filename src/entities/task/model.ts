import type { ConstructionObject } from '@/entities/object'
import type { ProfileRef } from '@/entities/profile'
import type { Enums, Tables } from '@/shared/api/database.types'

export type Task = Tables<'tasks'>
export type TaskStatus = Enums<'task_status'>
/** Строка справочника переходов из базы (единственный источник правды о машине состояний). */
export type TaskTransitionRule = Tables<'task_status_transitions'>

export interface TaskWithRelations extends Task {
  object: Pick<ConstructionObject, 'id' | 'name'> | null
  assignee: ProfileRef | null
  author: ProfileRef | null
}

/** Поля, которые постановщик может задавать руками. Статус и автор ставит база. */
export interface TaskInput {
  title: string
  description: string
  assignee_id: string | null
}

export interface TaskCreateInput extends TaskInput {
  object_id: string
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  new: 'Новая',
  in_progress: 'В работе',
  in_review: 'На проверке',
  accepted: 'Принята',
  rework: 'На доработке',
}

/** Порядок для сортировки списков: сначала то, что требует действий. */
export const TASK_STATUS_ORDER: readonly TaskStatus[] = [
  'rework',
  'new',
  'in_progress',
  'in_review',
  'accepted',
]

export const TASK_STATUS_CLASS: Record<TaskStatus, string> = {
  new: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-800',
  in_review: 'bg-amber-100 text-amber-800',
  accepted: 'bg-green-100 text-green-800',
  rework: 'bg-red-100 text-red-800',
}

const TRANSITION_LABELS: Partial<Record<`${TaskStatus}->${TaskStatus}`, string>> = {
  'new->in_progress': 'Взять в работу',
  'in_progress->in_review': 'Отправить на проверку',
  'in_review->accepted': 'Принять',
  'in_review->rework': 'Вернуть на доработку',
  'rework->in_progress': 'Продолжить работу',
}

export function getTransitionLabel(from: TaskStatus, to: TaskStatus): string {
  return TRANSITION_LABELS[`${from}->${to}`] ?? `Перевести в «${TASK_STATUS_LABELS[to]}»`
}

export function compareByStatusOrder(a: Pick<Task, 'status'>, b: Pick<Task, 'status'>): number {
  return TASK_STATUS_ORDER.indexOf(a.status) - TASK_STATUS_ORDER.indexOf(b.status)
}
