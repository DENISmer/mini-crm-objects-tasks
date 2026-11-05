import type { Enums, Tables } from '@/shared/api/database.types'

export type Profile = Tables<'profiles'>
export type UserRole = Enums<'user_role'>

/** Минимум, который нужен, чтобы подписать автора/исполнителя. */
export type ProfileRef = Pick<Profile, 'id' | 'full_name'>

export const ROLE_LABELS: Record<UserRole, string> = {
  manager: 'Постановщик',
  executor: 'Исполнитель',
}
