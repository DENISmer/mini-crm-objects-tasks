import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { objectApi } from './api'
import { forgetObject, invalidateObjects } from './cache'
import { objectKeys } from './keys'
import type { ObjectInput } from './model'

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
    onSuccess: () => invalidateObjects(queryClient),
  })
}

export function useUpdateObject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ObjectInput }) => objectApi.update(id, input),
    onSuccess: () => invalidateObjects(queryClient),
  })
}

export function useDeleteObject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: objectApi.remove,
    onSuccess: (_result, id) => forgetObject(queryClient, id),
  })
}
