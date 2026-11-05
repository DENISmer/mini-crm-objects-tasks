import { supabase } from '@/shared/api/supabase'

import type { Profile } from './model'

export const profileApi = {
  async getById(id: string): Promise<Profile> {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single()
    if (error) throw error
    return data
  },

  async listExecutors(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'executor')
      .order('full_name')
    if (error) throw error
    return data
  },
}
