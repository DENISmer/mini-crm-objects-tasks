-- =============================================================================
-- 0005. Явные привилегии вместо платформенных дефолтов
--
-- Дефолтные привилегии отличаются между локальным стеком и облачным Supabase:
-- в облаке service_role получает на новые таблицы только TRUNCATE/REFERENCES/TRIGGER/MAINTAIN,
-- локально — полный набор. Серверные инструменты (Admin API, seed-скрипт, Edge Functions)
-- работают от service_role, поэтому его права задаём явно, а не полагаемся на дефолты.
-- Ключ service_role во фронтенд и в репозиторий не попадает (см. README).
-- =============================================================================

grant all on all tables    in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all functions in schema public to service_role;

alter default privileges for role postgres in schema public grant all on tables    to service_role;
alter default privileges for role postgres in schema public grant all on sequences to service_role;
alter default privileges for role postgres in schema public grant all on functions to service_role;

-- Postgres по умолчанию даёт EXECUTE на каждую новую функцию роли PUBLIC, а значит и anon.
-- transition_task() и так отвергает анонима (NOT_AUTHENTICATED), но лишний вход закрываем:
-- вызывать функции могут только authenticated (явные grant'ы в 0004) и service_role.
revoke execute on all functions in schema public from public;
alter default privileges for role postgres in schema public revoke execute on functions from public;
