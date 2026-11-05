import type { Tables } from '@/shared/api/database.types'

export type ConstructionObject = Tables<'objects'>

/** Для списка: сколько задач на объекте видит текущий пользователь. */
export interface ObjectListItem extends ConstructionObject {
  tasksCount: number
}

export interface ObjectInput {
  name: string
  address: string
}
