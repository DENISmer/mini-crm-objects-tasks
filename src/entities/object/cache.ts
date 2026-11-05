import type { QueryClient } from '@tanstack/react-query'

import { taskHistoryKeys } from '@/entities/task-history/keys'
import { taskKeys } from '@/entities/task/keys'

import { objectKeys } from './keys'

/**
 * Что в кэше устаревает после мутаций объектов. Это единственное место, где такое знание живёт:
 * фичи и страницы в кэш не ходят, они только вызывают хуки из queries.ts.
 */
export function invalidateObjects(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: objectKeys.all })
}

/**
 * После удаления. Карточку объекта и список его задач не инвалидируем, а убираем из кэша:
 * инвалидация перезапросила бы их, пока страница объекта ещё открыта, запрос вернул бы
 * «не найдено», TanStack повторил бы его через секунду, и всё это время кнопка висела бы
 * в pending, а страница показывала бы ошибку вместо перехода к списку.
 * Задачи объекта удалились каскадом, поэтому остальные запросы задач и истории устаревают.
 */
export function forgetObject(queryClient: QueryClient, id: string) {
  queryClient.removeQueries({ queryKey: objectKeys.detail(id) })
  queryClient.removeQueries({ queryKey: taskKeys.byObject(id) })
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: objectKeys.list() }),
    queryClient.invalidateQueries({ queryKey: taskKeys.all }),
    queryClient.invalidateQueries({ queryKey: taskHistoryKeys.all }),
  ])
}
