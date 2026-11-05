import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { taskApi } from './api'
import { forgetTask, invalidateAfterTransition, invalidateTasks } from './cache'
import { taskKeys } from './keys'
import type { TaskInput } from './model'

export function useTasksByObject(objectId: string) {
  return useQuery({
    queryKey: taskKeys.byObject(objectId),
    queryFn: () => taskApi.listByObject(objectId),
  })
}

export function useTasksByAssignee(userId: string) {
  return useQuery({
    queryKey: taskKeys.byAssignee(userId),
    queryFn: () => taskApi.listByAssignee(userId),
  })
}

export function useTask(id: string) {
  return useQuery({ queryKey: taskKeys.detail(id), queryFn: () => taskApi.getById(id) })
}

/** Справочник переходов меняется только миграцией, поэтому кэшируем на всю сессию. */
export function useTransitionRules() {
  return useQuery({
    queryKey: taskKeys.transitionRules,
    queryFn: taskApi.listTransitionRules,
    staleTime: Infinity,
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: taskApi.create, onSuccess: () => invalidateTasks(queryClient) })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TaskInput }) => taskApi.update(id, input),
    onSuccess: () => invalidateTasks(queryClient),
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: taskApi.remove,
    onSuccess: (_result, id) => forgetTask(queryClient, id),
  })
}

export function useTransitionTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: taskApi.transition,
    onSuccess: (_task, { taskId }) => invalidateAfterTransition(queryClient, taskId),
  })
}
