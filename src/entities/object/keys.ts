/**
 * Ключи кэша объектов. Модуль без импортов: другие entities подключают его напрямую
 * (`@/entities/object/keys`), а не через index, чтобы между entities не было циклов.
 */
export const objectKeys = {
  all: ['objects'] as const,
  list: () => [...objectKeys.all, 'list'] as const,
  detail: (id: string) => [...objectKeys.all, 'detail', id] as const,
}
