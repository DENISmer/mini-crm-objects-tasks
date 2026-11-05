-- История статусов: нельзя подделать, изменить или удалить. Даже владельцу базы.
begin;
\ir _helpers.psql
select plan(10);

select test_helpers.create_user('manager', 'manager@test.local', 'manager',  'Мария Постановщик');
select test_helpers.create_user('alice',   'alice@test.local',   'executor', 'Алиса Исполнитель');

select test_helpers.login_as('manager');
with o as (insert into public.objects (name, address) values ('ЖК Север', 'ул. Северная, 1') returning id)
select test_helpers.remember('obj', id) from o;
with t as (
  insert into public.tasks (object_id, title, assignee_id)
  values (test_helpers.fx('obj'), 'Задача', test_helpers.fx('alice')) returning id
) select test_helpers.remember('task', id) from t;
select test_helpers.login_as('alice');
select public.transition_task(test_helpers.fx('task'), 'in_progress');

-- ---------- Владелец БД (эквивалент service_role / SQL-редактора): замки работают и для него ----------
select test_helpers.logout();
select is((select count(*) from public.task_status_history where task_id = test_helpers.fx('task')), 2::bigint,
  'в истории 2 записи');
select throws_ok(
  $$insert into public.task_status_history (task_id, actor_id, from_status, to_status)
    values (test_helpers.fx('task'), test_helpers.fx('alice'), 'in_progress', 'accepted')$$,
  '42501', 'HISTORY_IS_APPEND_ONLY_VIA_WORKFLOW', 'историю нельзя дописать мимо функции перехода даже владельцу');
select throws_ok(
  $$update public.task_status_history set comment = 'подделка' where task_id = test_helpers.fx('task')$$,
  '42501', 'HISTORY_IS_IMMUTABLE', 'историю нельзя изменить даже владельцу');
select throws_ok(
  $$delete from public.task_status_history where task_id = test_helpers.fx('task')$$,
  '42501', 'HISTORY_IS_IMMUTABLE', 'историю нельзя удалить даже владельцу');
select throws_ok(
  $$update public.tasks set status = 'accepted' where id = test_helpers.fx('task')$$,
  '42501', 'STATUS_CHANGE_ONLY_VIA_TRANSITION', 'статус нельзя сменить прямым UPDATE даже владельцу');
select throws_ok(
  $$insert into public.tasks (object_id, title, author_id, status)
    values (test_helpers.fx('obj'), 'x', test_helpers.fx('manager'), 'accepted')$$,
  '23514', 'TASK_MUST_START_AS_NEW', 'задачу нельзя создать сразу принятой даже владельцу');
select is((select count(*) from public.task_status_history where task_id = test_helpers.fx('task')), 2::bigint,
  'история не изменилась');

-- ---------- Удаление задачи постановщиком: история уходит вместе с задачей (каскад) ----------
select test_helpers.login_as('manager');
select lives_ok($$delete from public.tasks where id = test_helpers.fx('task')$$, 'постановщик может удалить задачу');
select test_helpers.logout();
select is((select count(*) from public.task_status_history where task_id = test_helpers.fx('task')), 0::bigint,
  'история удалённой задачи удалена каскадом');

-- ---------- Удаление объекта: каскад объект -> задачи -> история ----------
select test_helpers.login_as('manager');
with t as (
  insert into public.tasks (object_id, title, assignee_id)
  values (test_helpers.fx('obj'), 'Ещё задача', test_helpers.fx('alice')) returning id
) select test_helpers.remember('task2', id) from t;
select lives_ok($$delete from public.objects where id = test_helpers.fx('obj')$$,
  'постановщик может удалить объект вместе с задачами');

select * from finish();
rollback;
