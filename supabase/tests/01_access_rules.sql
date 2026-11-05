-- Права доступа: привилегии ролей и RLS.
-- Проверяем требование ТЗ: правила работают при прямом обращении к базе, в обход интерфейса.
begin;
\ir _helpers.psql
select plan(22);

-- ---------- Фикстуры ----------
select test_helpers.create_user('manager',  'manager@test.local',  'manager',  'Мария Постановщик');
select test_helpers.create_user('manager2', 'manager2@test.local', 'manager',  'Михаил Постановщик');
select test_helpers.create_user('alice',    'alice@test.local',    'executor', 'Алиса Исполнитель');
select test_helpers.create_user('bob',      'bob@test.local',      'executor', 'Борис Исполнитель');

select test_helpers.login_as('manager');

with o as (insert into public.objects (name, address) values ('ЖК Север', 'ул. Северная, 1') returning id)
select test_helpers.remember('obj_north', id) from o;
with o as (insert into public.objects (name, address) values ('ЖК Юг', 'ул. Южная, 2') returning id)
select test_helpers.remember('obj_south', id) from o;

with t as (
  insert into public.tasks (object_id, title, assignee_id)
  values (test_helpers.fx('obj_north'), 'Задача Алисы', test_helpers.fx('alice')) returning id
) select test_helpers.remember('task_alice', id) from t;
with t as (
  insert into public.tasks (object_id, title, assignee_id)
  values (test_helpers.fx('obj_south'), 'Задача Бориса', test_helpers.fx('bob')) returning id
) select test_helpers.remember('task_bob', id) from t;
with t as (
  insert into public.tasks (object_id, title)
  values (test_helpers.fx('obj_north'), 'Без исполнителя') returning id
) select test_helpers.remember('task_free', id) from t;

-- ---------- Постановщик ----------
-- Считаем только свои фикстуры: в базе могут быть и другие данные (например, после seed).
select is(
  (select count(*) from public.objects where id in (test_helpers.fx('obj_north'), test_helpers.fx('obj_south'))),
  2::bigint, 'постановщик видит все объекты');
select is(
  (select count(*) from public.tasks
    where id in (test_helpers.fx('task_alice'), test_helpers.fx('task_bob'), test_helpers.fx('task_free'))),
  3::bigint, 'постановщик видит все задачи, включая чужие и неназначенные');
select is(
  (select count(*) from public.task_status_history
    where task_id in (test_helpers.fx('task_alice'), test_helpers.fx('task_bob'), test_helpers.fx('task_free'))),
  3::bigint, 'постановщик видит историю всех задач (3 записи о создании)');
select is((select author_id from public.tasks where id = test_helpers.fx('task_alice')), test_helpers.fx('manager'),
  'автор задачи проставляется из auth.uid()');

select throws_ok(
  $$update public.tasks set status = 'in_progress' where id = test_helpers.fx('task_alice')$$,
  '42501', null, 'постановщик не может менять статус прямым UPDATE (нет привилегии на колонку)');
select throws_ok(
  $$insert into public.tasks (object_id, title, status) values (test_helpers.fx('obj_north'), 'x', 'accepted')$$,
  '42501', null, 'нельзя создать задачу сразу в произвольном статусе');
select throws_ok(
  $$insert into public.tasks (object_id, title, author_id) values (test_helpers.fx('obj_north'), 'x', test_helpers.fx('alice'))$$,
  '42501', null, 'нельзя подделать автора задачи');
select throws_ok(
  $$update public.tasks set assignee_id = test_helpers.fx('manager2') where id = test_helpers.fx('task_free')$$,
  '23514', 'ASSIGNEE_MUST_BE_EXECUTOR', 'исполнителем может быть только пользователь с ролью executor');
select throws_ok(
  $$insert into public.task_status_history (task_id, actor_id, from_status, to_status)
    values (test_helpers.fx('task_alice'), test_helpers.fx('manager'), 'new', 'accepted')$$,
  '42501', null, 'постановщик не может дописать историю');
select throws_ok(
  $$update public.task_status_history set comment = 'hack'$$,
  '42501', null, 'постановщик не может изменить историю');
select throws_ok(
  $$delete from public.task_status_history$$,
  '42501', null, 'постановщик не может удалить историю');
select throws_ok(
  $$insert into public.task_status_transitions values ('new', 'accepted', 'manager', false)$$,
  '42501', null, 'таблица переходов только для чтения');
select throws_ok(
  $$update public.profiles set role = 'manager' where id = test_helpers.fx('alice')$$,
  '42501', null, 'роли через API не меняются даже постановщиком');

-- ---------- Исполнитель ----------
select test_helpers.login_as('alice');

select set_eq('select id from public.objects', array[test_helpers.fx('obj_north')],
  'исполнитель видит только объекты со своими задачами');
select set_eq('select id from public.tasks', array[test_helpers.fx('task_alice')],
  'исполнитель видит только свои задачи');
select set_eq('select task_id from public.task_status_history', array[test_helpers.fx('task_alice')],
  'исполнитель видит историю только своих задач');

select throws_ok(
  $$insert into public.objects (name, address) values ('Чужой объект', 'адрес')$$,
  '42501', null, 'исполнитель не может создать объект');
select throws_ok(
  $$insert into public.tasks (object_id, title) values (test_helpers.fx('obj_north'), 'x')$$,
  '42501', null, 'исполнитель не может создать задачу');
select throws_ok(
  $$update public.tasks set status = 'in_progress' where id = test_helpers.fx('task_alice')$$,
  '42501', null, 'исполнитель не может менять статус прямым UPDATE даже у своей задачи');

-- UPDATE/DELETE чужих строк не падают, а просто не находят строк: RLS их скрывает.
with u as (update public.tasks set title = 'hack' where id = test_helpers.fx('task_bob') returning 1)
select is((select count(*) from u), 0::bigint, 'исполнитель не может изменить чужую задачу');
with d as (delete from public.tasks where id = test_helpers.fx('task_alice') returning 1)
select is((select count(*) from d), 0::bigint, 'исполнитель не может удалить даже свою задачу');

-- ---------- Без входа ----------
select test_helpers.login_anon();
select throws_ok($$select count(*) from public.tasks$$, '42501', null, 'аноним не видит задачи');

select * from finish();
rollback;
