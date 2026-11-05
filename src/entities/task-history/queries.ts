import { useQuery } from '@tanstack/react-query'

import { taskHistoryApi } from './api'

export const taskHistoryKeys = {
  all: ['task-history'] as const,
  byTask: (taskId: string) => [...taskHistoryKeys.all, taskId] as const,
}

export function useTaskHistory(taskId: string) {
  return useQuery({
    queryKey: taskHistoryKeys.byTask(taskId),
    queryFn: () => taskHistoryApi.listByTask(taskId),
  })
}
