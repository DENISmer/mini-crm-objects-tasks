/** Ключи кэша задач. Модуль без импортов, см. комментарий в entities/object/keys.ts. */
export const taskKeys = {
  all: ['tasks'] as const,
  byObject: (objectId: string) => [...taskKeys.all, 'by-object', objectId] as const,
  byAssignee: (userId: string) => [...taskKeys.all, 'by-assignee', userId] as const,
  detail: (id: string) => [...taskKeys.all, 'detail', id] as const,
  /** Отдельный префикс: справочник живёт всю сессию и не должен сбрасываться вместе с задачами. */
  transitionRules: ['task-transition-rules'] as const,
}
