import { createClient } from '@supabase/supabase-js'

import { env } from '@/shared/config/env'

import type { Database } from './database.types'

/**
 * Единственный экземпляр клиента. Используется только в entities/*\/api.ts и features/auth:
 * компоненты и страницы про Supabase не знают.
 */
export const supabase = createClient<Database>(env.supabaseUrl, env.supabaseAnonKey)
