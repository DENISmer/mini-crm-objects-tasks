import { supabase } from '@/shared/api/supabase'

import type { TaskHistoryEntry } from './model'

export const taskHistoryApi = {
  async listByTask(taskId: string): Promise<TaskHistoryEntry[]> {
    const { data, error } = await supabase
      .from('task_status_history')
      .select('*, actor:profiles(id, full_name)')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
    if (error) throw error
    return data
  },
}
