import { useQuery } from '@tanstack/react-query'

import { profileApi } from './api'

export const profileKeys = {
  all: ['profiles'] as const,
  detail: (id: string) => [...profileKeys.all, 'detail', id] as const,
  executors: () => [...profileKeys.all, 'executors'] as const,
}

export function useProfile(id: string | undefined) {
  return useQuery({
    queryKey: profileKeys.detail(id ?? ''),
    queryFn: () => profileApi.getById(id as string),
    enabled: Boolean(id),
  })
}

export function useExecutors() {
  return useQuery({ queryKey: profileKeys.executors(), queryFn: profileApi.listExecutors })
}
