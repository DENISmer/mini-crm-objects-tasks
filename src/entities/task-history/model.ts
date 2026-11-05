import type { ProfileRef } from '@/entities/profile'
import type { Tables } from '@/shared/api/database.types'

export interface TaskHistoryEntry extends Tables<'task_status_history'> {
  actor: ProfileRef | null
}
