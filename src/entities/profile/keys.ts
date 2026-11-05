/** Ключи кэша профилей. Модуль без импортов, см. комментарий в entities/object/keys.ts. */
export const profileKeys = {
  all: ['profiles'] as const,
  detail: (id: string) => [...profileKeys.all, 'detail', id] as const,
  executors: () => [...profileKeys.all, 'executors'] as const,
}
