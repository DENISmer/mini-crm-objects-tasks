import { supabase } from '@/shared/api/supabase'

import type {
  Task,
  TaskCreateInput,
  TaskInput,
  TaskStatus,
  TaskTransitionRule,
  TaskWithRelations,
} from './model'

/** У tasks два внешних ключа на profiles, поэтому связи указываем по имени ключа. */
const TASK_WITH_RELATIONS =
  '*, object:objects(id, name), assignee:profiles!tasks_assignee_id_fkey(id, full_name), author:profiles!tasks_author_id_fkey(id, full_name)'

export interface TransitionParams {
  taskId: string
  to: TaskStatus
  comment?: string
}

export const taskApi = {
  async listByObject(objectId: string): Promise<TaskWithRelations[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select(TASK_WITH_RELATIONS)
      .eq('object_id', objectId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  /** RLS и так отдаёт исполнителю только его задачи; фильтр делает намерение явным. */
  async listByAssignee(assigneeId: string): Promise<TaskWithRelations[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select(TASK_WITH_RELATIONS)
      .eq('assignee_id', assigneeId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async getById(id: string): Promise<TaskWithRelations> {
    const { data, error } = await supabase
      .from('tasks')
      .select(TASK_WITH_RELATIONS)
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async create(input: TaskCreateInput): Promise<Task> {
    const { data, error } = await supabase.from('tasks').insert(input).select().single()
    if (error) throw error
    return data
  },

  async update(id: string, input: TaskInput): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .update(input)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) throw error
  },

  /** Единственный способ сменить статус: RPC transition_task() проверяет правила на стороне базы. */
  async transition({ taskId, to, comment }: TransitionParams): Promise<Task> {
    const { data, error } = await supabase.rpc('transition_task', {
      p_task_id: taskId,
      p_to_status: to,
      p_comment: comment,
    })
    if (error) throw error
    return data
  },

  async listTransitionRules(): Promise<TaskTransitionRule[]> {
    const { data, error } = await supabase.from('task_status_transitions').select('*')
    if (error) throw error
    return data
  },
}
