import { supabase } from '@/shared/api/supabase'

import type { ConstructionObject, ObjectInput, ObjectListItem } from './model'

export const objectApi = {
  async list(): Promise<ObjectListItem[]> {
    const { data, error } = await supabase
      .from('objects')
      .select('*, tasks(count)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data.map(({ tasks, ...object }) => ({ ...object, tasksCount: tasks[0]?.count ?? 0 }))
  },

  async getById(id: string): Promise<ConstructionObject> {
    const { data, error } = await supabase.from('objects').select('*').eq('id', id).single()
    if (error) throw error
    return data
  },

  async create(input: ObjectInput): Promise<ConstructionObject> {
    const { data, error } = await supabase.from('objects').insert(input).select().single()
    if (error) throw error
    return data
  },

  async update(id: string, input: ObjectInput): Promise<ConstructionObject> {
    const { data, error } = await supabase
      .from('objects')
      .update(input)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('objects').delete().eq('id', id)
    if (error) throw error
  },
}
