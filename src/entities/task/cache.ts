import type { QueryClient } from '@tanstack/react-query'

import { objectKeys } from '@/entities/object/keys'
import { taskHistoryKeys } from '@/entities/task-history/keys'

import { taskKeys } from './keys'

/**
 * Что в кэше устаревает после мутаций задач (см. также entities/object/cache.ts).
 * Создание и правка задачи меняют списки задач, а у объектов — счётчики и видимость
 * для исполнителя, то есть только список объектов, не их карточки.
 */
export function invalidateTasks(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: taskKeys.all }),
    queryClient.invalidateQueries({ queryKey: objectKeys.list() }),
  ])
}

/**
 * После удаления: карточку и историю задачи убираем из кэша, а не инвалидируем
 * (почему — см. forgetObject). Остальное устаревает как при обычной правке.
 */
export function forgetTask(queryClient: QueryClient, id: string) {
  queryClient.removeQueries({ queryKey: taskKeys.detail(id) })
  queryClient.removeQueries({ queryKey: taskHistoryKeys.byTask(id) })
  return invalidateTasks(queryClient)
}

/** Смена статуса: карточка и списки задач плюс история этой задачи. Объекты не затронуты. */
export function invalidateAfterTransition(queryClient: QueryClient, taskId: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: taskKeys.all }),
    queryClient.invalidateQueries({ queryKey: taskHistoryKeys.byTask(taskId) }),
  ])
}
