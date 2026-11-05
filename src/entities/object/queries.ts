import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { objectApi } from './api'
import type { ObjectInput } from './model'

export const objectKeys = {
  all: ['objects'] as const,
  list: () => [...objectKeys.all, 'list'] as const,
  detail: (id: string) => [...objectKeys.all, 'detail', id] as const,
}

export function useObjects() {
  return useQuery({ queryKey: objectKeys.list(), queryFn: objectApi.list })
}

export function useObject(id: string) {
  return useQuery({ queryKey: objectKeys.detail(id), queryFn: () => objectApi.getById(id) })
}

export function useCreateObject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: objectApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: objectKeys.all }),
  })
}

export function useUpdateObject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ObjectInput }) => objectApi.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: objectKeys.all }),
  })
}

export function useDeleteObject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: objectApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: objectKeys.all }),
  })
}
