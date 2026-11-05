import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'

import { objectKeys } from '@/entities/object/keys'
import { taskHistoryKeys } from '@/entities/task-history/keys'

import { forgetTask, invalidateAfterTransition, invalidateTasks } from './cache'
import { taskKeys } from './keys'

function clientWith(keys: readonly (readonly unknown[])[]) {
  const queryClient = new QueryClient()
  for (const key of keys) queryClient.setQueryData(key, {})
  return queryClient
}

const invalidated = (queryClient: QueryClient, key: readonly unknown[]) =>
  queryClient.getQueryState(key)?.isInvalidated

describe('invalidateTasks', () => {
  it('помечает устаревшими задачи и список объектов, карточки объектов и справочник не трогает', async () => {
    const queryClient = clientWith([
      taskKeys.byObject('o'),
      taskKeys.detail('t'),
      objectKeys.list(),
      objectKeys.detail('o'),
      taskKeys.transitionRules,
    ])
    await invalidateTasks(queryClient)
    expect(invalidated(queryClient, taskKeys.byObject('o'))).toBe(true)
    expect(invalidated(queryClient, taskKeys.detail('t'))).toBe(true)
    expect(invalidated(queryClient, objectKeys.list())).toBe(true)
    expect(invalidated(queryClient, objectKeys.detail('o'))).toBe(false)
    expect(invalidated(queryClient, taskKeys.transitionRules)).toBe(false)
  })
})

describe('forgetTask', () => {
  it('убирает карточку и историю задачи из кэша, остальное помечает устаревшим', async () => {
    const queryClient = clientWith([
      taskKeys.detail('t'),
      taskHistoryKeys.byTask('t'),
      taskKeys.byObject('o'),
      objectKeys.list(),
    ])
    await forgetTask(queryClient, 't')
    expect(queryClient.getQueryState(taskKeys.detail('t'))).toBeUndefined()
    expect(queryClient.getQueryState(taskHistoryKeys.byTask('t'))).toBeUndefined()
    expect(invalidated(queryClient, taskKeys.byObject('o'))).toBe(true)
    expect(invalidated(queryClient, objectKeys.list())).toBe(true)
  })
})

describe('invalidateAfterTransition', () => {
  it('помечает устаревшими задачи и историю этой задачи, объекты не трогает', async () => {
    const queryClient = clientWith([
      taskKeys.detail('t'),
      taskHistoryKeys.byTask('t'),
      taskHistoryKeys.byTask('other'),
      objectKeys.list(),
    ])
    await invalidateAfterTransition(queryClient, 't')
    expect(invalidated(queryClient, taskKeys.detail('t'))).toBe(true)
    expect(invalidated(queryClient, taskHistoryKeys.byTask('t'))).toBe(true)
    expect(invalidated(queryClient, taskHistoryKeys.byTask('other'))).toBe(false)
    expect(invalidated(queryClient, objectKeys.list())).toBe(false)
  })
})
