-- =============================================================================
-- 0002. Профили и служебные триггеры
-- =============================================================================

-- ---------- updated_at ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger objects_set_updated_at
  before update on public.objects
  for each row execute function public.set_updated_at();

create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- ---------- Профиль при создании пользователя ----------
-- Открытая регистрация выключена, пользователей создаёт администратор
-- (Dashboard или Admin API с service_role). Профиль появляется автоматически.
--
-- Роль берётся из app_metadata (её может задать только администратор),
-- для ручного создания через Dashboard допускается user_metadata; по умолчанию executor.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role public.user_role;
  v_name text;
begin
  v_role := coalesce(
    (new.raw_app_meta_data  ->> 'role')::public.user_role,
    (new.raw_user_meta_data ->> 'role')::public.user_role,
    'executor'
  );
  v_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    split_part(new.email, '@', 1)
  );

  insert into public.profiles (id, full_name, role)
  values (new.id, v_name, v_role);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Роль из app_metadata может прийти позже самой строки пользователя: Admin API (auth.admin.createUser)
-- сначала вставляет пользователя, а app_metadata дописывает отдельным UPDATE. Поэтому роль
-- синхронизируется и при изменении app_metadata. Если роли в app_metadata нет, профиль не трогаем:
-- тогда роль правят прямо в таблице profiles (Dashboard).
create or replace function public.sync_user_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_new_role public.user_role := (new.raw_app_meta_data ->> 'role')::public.user_role;
  v_old_role public.user_role := (old.raw_app_meta_data ->> 'role')::public.user_role;
begin
  if v_new_role is not null and v_new_role is distinct from v_old_role then
    update public.profiles set role = v_new_role where id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_role_changed
  after update of raw_app_meta_data on auth.users
  for each row execute function public.sync_user_role();
