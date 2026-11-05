import { z } from 'zod'

/**
 * Публичные параметры подключения. Проверяются при старте: приложение с пустым ключом
 * не должно молча падать на первом запросе.
 * Секретных ключей (service_role) здесь нет и быть не может: всё из import.meta.env попадает в бандл.
 */
const schema = z.object({
  VITE_SUPABASE_URL: z.url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
})

const result = schema.safeParse(import.meta.env)

if (!result.success) {
  const missing = result.error.issues.map((issue) => issue.path.join('.')).join(', ')
  throw new Error(`Не заданы переменные окружения: ${missing}. См. .env.example`)
}

export const env = {
  supabaseUrl: result.data.VITE_SUPABASE_URL,
  supabaseAnonKey: result.data.VITE_SUPABASE_ANON_KEY,
} as const
