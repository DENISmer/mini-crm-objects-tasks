-- Машина состояний задачи: переходы проверяются на стороне базы.
begin;
\ir _helpers.psql
select plan(24);

select test_helpers.create_user('manager', 'manager@test.local', 'manager',  'Мария Постановщик');
select test_helpers.create_user('alice',   'alice@test.local',   'executor', 'Алиса Исполнитель');
select test_helpers.create_user('bob',     'bob@test.local',     'executor', 'Борис Исполнитель');

select test_helpers.login_as('manager');
with o as (insert into public.objects (name, address) values ('ЖК Север', 'ул. Северная, 1') returning id)
select test_helpers.remember('obj', id) from o;
with t as (
  insert into public.tasks (object_id, title, assignee_id)
  values (test_helpers.fx('obj'), 'Залить фундамент', test_helpers.fx('alice')) returning id
) select test_helpers.remember('task', id) from t;
with t as (
  insert into public.tasks (object_id, title) values (test_helpers.fx('obj'), 'Без исполнителя') returning id
) select test_helpers.remember('task_free', id) from t;

-- ---------- new -> in_progress: только назначенный исполнитель ----------
select throws_ok(
  $$select public.transition_task(test_helpers.fx('task'), 'in_progress')$$,
  '42501', 'TRANSITION_FORBIDDEN_FOR_ROLE', 'постановщик не может взять задачу в работу');

select test_helpers.login_as('bob');
select throws_ok(
  $$select public.transition_task(test_helpers.fx('task'), 'in_progress')$$,
  'P0002', 'TASK_NOT_FOUND', 'чужой исполнитель получает "не найдена", а не "запрещено"');
select throws_ok(
  $$select public.transition_task(test_helpers.fx('task_free'), 'in_progress')$$,
  'P0002', 'TASK_NOT_FOUND', 'неназначенную задачу нельзя взять в работу');

select test_helpers.login_as('alice');
select throws_ok(
  $$select public.transition_task(test_helpers.fx('task'), 'in_review')$$,
  '23514', 'TRANSITION_NOT_ALLOWED', 'нельзя перепрыгнуть new -> in_review');
select throws_ok(
  $$select public.transition_task(test_helpers.fx('task'), 'accepted')$$,
  '23514', 'TRANSITION_NOT_ALLOWED', 'нельзя перепрыгнуть new -> accepted');
select lives_ok(
  $$select public.transition_task(test_helpers.fx('task'), 'in_progress')$$,
  'назначенный исполнитель берёт задачу в работу');
select is((select status from public.tasks where id = test_helpers.fx('task')), 'in_progress'::public.task_status,
  'статус стал in_progress');
select is((select count(*) from public.task_status_history where task_id = test_helpers.fx('task')), 2::bigint,
  'в истории две записи: создание и переход');

-- ---------- in_progress -> in_review ----------
select throws_ok(
  $$select public.transition_task(test_helpers.fx('task'), 'accepted')$$,
  '23514', 'TRANSITION_NOT_ALLOWED', 'из работы нельзя сразу принять');
select lives_ok(
  $$select public.transition_task(test_helpers.fx('task'), 'in_review')$$,
  'исполнитель отправляет на проверку');
select throws_ok(
  $$select public.transition_task(test_helpers.fx('task'), 'accepted')$$,
  '42501', 'TRANSITION_FORBIDDEN_FOR_ROLE', 'исполнитель не может принять свою задачу');
select throws_ok(
  $$select public.transition_task(test_helpers.fx('task'), 'rework', 'сам себе вернул')$$,
  '42501', 'TRANSITION_FORBIDDEN_FOR_ROLE', 'исполнитель не может вернуть на доработку');

-- ---------- in_review -> rework: только постановщик и только с комментарием ----------
select test_helpers.login_as('manager');
select throws_ok(
  $$select public.transition_task(test_helpers.fx('task'), 'rework')$$,
  '23514', 'COMMENT_REQUIRED', 'возврат на доработку без комментария запрещён');
select throws_ok(
  $$select public.transition_task(test_helpers.fx('task'), 'rework', '   ')$$,
  '23514', 'COMMENT_REQUIRED', 'пробелы комментарием не считаются');
select lives_ok(
  $$select public.transition_task(test_helpers.fx('task'), 'rework', 'Не хватает фото акта')$$,
  'постановщик возвращает на доработку с комментарием');
select is(
  (select comment from public.task_status_history where task_id = test_helpers.fx('task') order by id desc limit 1),
  'Не хватает фото акта', 'комментарий сохранён в истории');
select throws_ok(
  $$select public.transition_task(test_helpers.fx('task'), 'in_progress')$$,
  '42501', 'TRANSITION_FORBIDDEN_FOR_ROLE', 'постановщик не может вернуть задачу в работу за исполнителя');

-- ---------- rework -> in_progress -> in_review -> accepted ----------
select test_helpers.login_as('alice');
select lives_ok($$select public.transition_task(test_helpers.fx('task'), 'in_progress')$$,
  'исполнитель продолжает работу после доработки');
select lives_ok($$select public.transition_task(test_helpers.fx('task'), 'in_review')$$,
  'и снова отправляет на проверку');
select test_helpers.login_as('manager');
select lives_ok($$select public.transition_task(test_helpers.fx('task'), 'accepted')$$,
  'постановщик принимает задачу');

-- ---------- accepted: терминальный статус ----------
select throws_ok($$select public.transition_task(test_helpers.fx('task'), 'rework', 'передумал')$$,
  '23514', 'TRANSITION_NOT_ALLOWED', 'принятую задачу нельзя вернуть');
select test_helpers.login_as('alice');
select throws_ok($$select public.transition_task(test_helpers.fx('task'), 'in_progress')$$,
  '23514', 'TRANSITION_NOT_ALLOWED', 'принятую задачу нельзя снова взять в работу');

-- ---------- Полная история в правильном порядке ----------
select results_eq(
  $$select from_status::text, to_status::text, actor_id
      from public.task_status_history where task_id = test_helpers.fx('task') order by id$$,
  $$values
    (null,          'new',         test_helpers.fx('manager')),
    ('new',         'in_progress', test_helpers.fx('alice')),
    ('in_progress', 'in_review',   test_helpers.fx('alice')),
    ('in_review',   'rework',      test_helpers.fx('manager')),
    ('rework',      'in_progress', test_helpers.fx('alice')),
    ('in_progress', 'in_review',   test_helpers.fx('alice')),
    ('in_review',   'accepted',    test_helpers.fx('manager'))$$,
  'история содержит все переходы по порядку с правильными авторами');

-- ---------- Без входа ----------
select test_helpers.login_anon();
select throws_ok($$select public.transition_task(test_helpers.fx('task'), 'in_progress')$$,
  '42501', null, 'аноним не может вызвать переход');

select * from finish();
rollback;
