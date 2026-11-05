-- Создание профилей: роль берётся из app_metadata, по умолчанию executor (минимум прав).
begin;
\ir _helpers.psql
select plan(5);

-- Пользователь без метаданных: профиль с ролью executor и именем из email.
insert into auth.users (id, instance_id, aud, role, email, created_at, updated_at)
values ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000',
        'authenticated', 'authenticated', 'plain.user@test.local', now(), now());
select is((select role from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  'executor'::public.user_role, 'роль по умолчанию — executor');
select is((select full_name from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  'plain.user', 'имя по умолчанию — из email');

-- Роль задана в app_metadata при вставке (ручной INSERT / Dashboard с метаданными).
select test_helpers.create_user('manager', 'manager@test.local', 'manager', 'Мария Постановщик');
select is((select role from public.profiles where id = test_helpers.fx('manager')),
  'manager'::public.user_role, 'роль из app_metadata при создании');

-- Роль пришла позже отдельным UPDATE (так делает Admin API createUser).
update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role": "manager"}'::jsonb
 where id = '11111111-1111-1111-1111-111111111111';
select is((select role from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  'manager'::public.user_role, 'роль синхронизируется при обновлении app_metadata');

-- Обновление app_metadata без роли профиль не трогает.
update auth.users
   set raw_app_meta_data = raw_app_meta_data - 'role'
 where id = '11111111-1111-1111-1111-111111111111';
select is((select role from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  'manager'::public.user_role, 'без роли в app_metadata профиль остаётся как был');

select * from finish();
rollback;
