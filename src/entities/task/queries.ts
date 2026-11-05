import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { objectKeys } from '@/entities/object'

import { taskApi } from './api'
import type { TaskInput } from './model'

export const taskKeys = {
  all: ['tasks'] as const,
  byObject: (objectId: string) => [...taskKeys.all, 'by-object', objectId] as const,
  byAssignee: (userId: string) => [...taskKeys.all, 'by-assignee', userId] as const,
  detail: (id: string) => [...taskKeys.all, 'detail', id] as const,
  transitionRules: ['task-transition-rules'] as const,
}

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

/** Любое изменение задач влияет на видимость объектов и счётчики, поэтому сбрасываем и их. */
function useInvalidateTasks() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: taskKeys.all }),
      queryClient.invalidateQueries({ queryKey: objectKeys.all }),
    ])
}

export function useCreateTask() {
  const invalidate = useInvalidateTasks()
  return useMutation({ mutationFn: taskApi.create, onSuccess: invalidate })
}

export function useUpdateTask() {
  const invalidate = useInvalidateTasks()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TaskInput }) => taskApi.update(id, input),
    onSuccess: invalidate,
  })
}

export function useDeleteTask() {
  const invalidate = useInvalidateTasks()
  return useMutation({ mutationFn: taskApi.remove, onSuccess: invalidate })
}

export function useTransitionTask() {
  const invalidate = useInvalidateTasks()
  return useMutation({ mutationFn: taskApi.transition, onSuccess: invalidate })
}
