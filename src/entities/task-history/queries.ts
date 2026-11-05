import { useQuery } from '@tanstack/react-query'

import { taskHistoryApi } from './api'
import { taskHistoryKeys } from './keys'

export function useTaskHistory(taskId: string) {
  return useQuery({
    queryKey: taskHistoryKeys.byTask(taskId),
    queryFn: () => taskHistoryApi.listByTask(taskId),
  })
}
