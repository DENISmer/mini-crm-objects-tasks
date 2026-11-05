import type { Profile } from '@/entities/profile'

import { getTransitionLabel, type Task, type TaskStatus, type TaskTransitionRule } from '../model'

export interface AvailableTransition {
  to: TaskStatus
  label: string
  requiresComment: boolean
}

interface Params {
  rules: readonly TaskTransitionRule[]
  task: Pick<Task, 'status' | 'assignee_id'>
  actor: Pick<Profile, 'id' | 'role'>
}

/**
 * Какие переходы показать пользователю для задачи. Повторяет проверки transition_task() в базе:
 * исходный статус, роль и (для исполнителя) назначение на задачу.
 * База всё равно перепроверит запрос; здесь только решаем, какие кнопки рисовать.
 */
export function getAvailableTransitions({ rules, task, actor }: Params): AvailableTransition[] {
  return rules
    .filter(
      (rule) =>
        rule.from_status === task.status &&
        rule.actor_role === actor.role &&
        (actor.role !== 'executor' || task.assignee_id === actor.id),
    )
    .map((rule) => ({
      to: rule.to_status,
      label: getTransitionLabel(rule.from_status, rule.to_status),
      requiresComment: rule.requires_comment,
    }))
}
