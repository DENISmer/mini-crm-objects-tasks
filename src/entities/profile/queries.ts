import { useQuery } from '@tanstack/react-query'

import { profileApi } from './api'
import { profileKeys } from './keys'

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
