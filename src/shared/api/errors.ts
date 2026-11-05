import { AuthError } from '@supabase/supabase-js'

/** Ключи, которые поднимает база через raise exception 'KEY' (см. миграцию 0003). */
const DOMAIN_MESSAGES: Record<string, string> = {
  TRANSITION_NOT_ALLOWED: 'Такой переход статуса запрещён',
  TRANSITION_FORBIDDEN_FOR_ROLE: 'Это действие недоступно для вашей роли',
  COMMENT_REQUIRED: 'Укажите комментарий',
  TASK_NOT_FOUND: 'Задача не найдена или недоступна',
  ASSIGNEE_MUST_BE_EXECUTOR: 'Исполнителем может быть только пользователь с ролью «Исполнитель»',
  NOT_AUTHENTICATED: 'Нужно войти в систему',
  PROFILE_NOT_FOUND: 'Профиль пользователя не найден',
  STATUS_CHANGE_ONLY_VIA_TRANSITION: 'Статус меняется только действиями на карточке задачи',
  HISTORY_IS_IMMUTABLE: 'Историю изменить нельзя',
}

/** Стандартные коды PostgreSQL / PostgREST. */
const PG_CODE_MESSAGES: Record<string, string> = {
  '42501': 'Недостаточно прав для этого действия',
  '23503': 'Нельзя удалить: есть связанные записи',
  '23514': 'Данные не прошли проверку',
  '23505': 'Такая запись уже есть',
  PGRST116: 'Запись не найдена',
}

const AUTH_MESSAGES: Record<string, string> = {
  'Invalid login credentials': 'Неверный email или пароль',
  'Email not confirmed': 'Email не подтверждён',
}

interface PostgrestLikeError {
  code: string
  message: string
}

function isPostgrestLikeError(error: unknown): error is PostgrestLikeError {
  return (
    typeof error === 'object' &&
    error !== null &&
    typeof (error as PostgrestLikeError).code === 'string' &&
    typeof (error as PostgrestLikeError).message === 'string'
  )
}

/** Переводит любую ошибку в текст для пользователя. Технические детали наружу не выходят. */
export function toUserMessage(error: unknown): string {
  if (error instanceof AuthError) {
    return AUTH_MESSAGES[error.message] ?? 'Не удалось войти. Попробуйте ещё раз'
  }
  if (isPostgrestLikeError(error)) {
    return (
      DOMAIN_MESSAGES[error.message] ??
      PG_CODE_MESSAGES[error.code] ??
      'Не удалось выполнить действие'
    )
  }
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return 'Нет связи с сервером'
  }
  return 'Что-то пошло не так. Попробуйте ещё раз'
}
