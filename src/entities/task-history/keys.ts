/** Ключи кэша истории статусов. Модуль без импортов, см. комментарий в entities/object/keys.ts. */
export const taskHistoryKeys = {
  all: ['task-history'] as const,
  byTask: (taskId: string) => [...taskHistoryKeys.all, taskId] as const,
}
