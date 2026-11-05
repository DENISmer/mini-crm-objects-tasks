import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'

import { taskHistoryKeys } from '@/entities/task-history/keys'
import { taskKeys } from '@/entities/task/keys'

import { forgetObject, invalidateObjects } from './cache'
import { objectKeys } from './keys'

function clientWith(keys: readonly (readonly unknown[])[]) {
  const queryClient = new QueryClient()
  for (const key of keys) queryClient.setQueryData(key, {})
  return queryClient
}

const invalidated = (queryClient: QueryClient, key: readonly unknown[]) =>
  queryClient.getQueryState(key)?.isInvalidated

describe('forgetObject', () => {
  it('убирает карточку объекта и его задачи из кэша, не перезапрашивая их', async () => {
    const queryClient = clientWith([objectKeys.detail('a'), taskKeys.byObject('a')])
    await forgetObject(queryClient, 'a')
    expect(queryClient.getQueryState(objectKeys.detail('a'))).toBeUndefined()
    expect(queryClient.getQueryState(taskKeys.byObject('a'))).toBeUndefined()
  })

  it('список объектов, задачи и историю помечает устаревшими, чужие карточки не трогает', async () => {
    const queryClient = clientWith([
      objectKeys.list(),
      objectKeys.detail('b'),
      taskKeys.byAssignee('u'),
      taskKeys.detail('t'),
      taskHistoryKeys.byTask('t'),
      taskKeys.transitionRules,
    ])
    await forgetObject(queryClient, 'a')
    expect(invalidated(queryClient, objectKeys.list())).toBe(true)
    expect(invalidated(queryClient, taskKeys.byAssignee('u'))).toBe(true)
    expect(invalidated(queryClient, taskKeys.detail('t'))).toBe(true)
    expect(invalidated(queryClient, taskHistoryKeys.byTask('t'))).toBe(true)
    expect(invalidated(queryClient, objectKeys.detail('b'))).toBe(false)
    expect(invalidated(queryClient, taskKeys.transitionRules)).toBe(false)
  })
})

describe('invalidateObjects', () => {
  it('помечает устаревшими список и карточки, задачи не трогает', async () => {
    const queryClient = clientWith([
      objectKeys.list(),
      objectKeys.detail('a'),
      taskKeys.detail('t'),
    ])
    await invalidateObjects(queryClient)
    expect(invalidated(queryClient, objectKeys.list())).toBe(true)
    expect(invalidated(queryClient, objectKeys.detail('a'))).toBe(true)
    expect(invalidated(queryClient, taskKeys.detail('t'))).toBe(false)
  })
})
