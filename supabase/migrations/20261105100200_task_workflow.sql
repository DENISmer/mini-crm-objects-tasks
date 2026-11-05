-- =============================================================================
-- 0003. Бизнес-правила задач: роли, переходы статусов, история
-- =============================================================================

-- ---------- Вспомогательные функции для политик ----------
-- security definer: читают profiles/tasks в обход RLS, чтобы политики не зависели друг от друга.
-- stable: планировщик вычисляет их один раз на запрос, когда в политике они обёрнуты в (select ...).

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role from public.profiles p where p.id = auth.uid();
$$;

create or replace function public.is_manager()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_user_role() = 'manager', false);
$$;

create or replace function public.can_access_task(p_task_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_manager()
      or exists (
        select 1 from public.tasks t
        where t.id = p_task_id and t.assignee_id = auth.uid()
      );
$$;

-- ---------- Инварианты задач ----------

-- Исполнителем может быть только пользователь с ролью executor.
create or replace function public.tasks_check_assignee()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.assignee_id is not null and not exists (
    select 1 from public.profiles p where p.id = new.assignee_id and p.role = 'executor'
  ) then
    raise exception 'ASSIGNEE_MUST_BE_EXECUTOR' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger tasks_check_assignee
  before insert or update of assignee_id on public.tasks
  for each row execute function public.tasks_check_assignee();

-- Статус задачи меняется только внутри transition_task().
-- Это второй замок после привилегий на колонки (0004): срабатывает даже для владельца БД и service_role.
create or replace function public.tasks_guard_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.status <> 'new' then
      raise exception 'TASK_MUST_START_AS_NEW' using errcode = 'check_violation';
    end if;
    return new;
  end if;

  if new.status is distinct from old.status
     and coalesce(current_setting('app.transition_ctx', true), '') <> 'transition_task' then
    raise exception 'STATUS_CHANGE_ONLY_VIA_TRANSITION' using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

create trigger tasks_guard_status
  before insert or update on public.tasks
  for each row execute function public.tasks_guard_status();

-- ---------- История ----------

-- Создание задачи фиксируется в истории (NULL -> new) от имени автора.
-- Флаг app.history_ctx сообщает триггеру истории, что запись легитимна.
create or replace function public.tasks_log_creation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_prev_ctx text := coalesce(current_setting('app.history_ctx', true), '');
begin
  perform set_config('app.history_ctx', 'tasks_log_creation', true);
  insert into public.task_status_history (task_id, actor_id, from_status, to_status)
  values (new.id, new.author_id, null, new.status);
  perform set_config('app.history_ctx', v_prev_ctx, true);
  return new;
end;
$$;

create trigger tasks_log_creation
  after insert on public.tasks
  for each row execute function public.tasks_log_creation();

-- История неизменяема и не подделываема:
--   INSERT — только из transition_task() / триггера создания (флаг app.history_ctx);
--   UPDATE — запрещён всегда;
--   DELETE — только каскадом вместе с задачей (к моменту каскада строка задачи уже удалена,
--            поэтому exists() возвращает false).
-- Срабатывает для любой роли, включая владельца БД и service_role.
create or replace function public.history_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if coalesce(current_setting('app.history_ctx', true), '')
       not in ('transition_task', 'tasks_log_creation') then
      raise exception 'HISTORY_IS_APPEND_ONLY_VIA_WORKFLOW' using errcode = 'insufficient_privilege';
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    raise exception 'HISTORY_IS_IMMUTABLE' using errcode = 'insufficient_privilege';
  end if;

  if exists (select 1 from public.tasks t where t.id = old.task_id) then
    raise exception 'HISTORY_IS_IMMUTABLE' using errcode = 'insufficient_privilege';
  end if;
  return old;
end;
$$;

create trigger history_guard
  before insert or update or delete on public.task_status_history
  for each row execute function public.history_guard();

-- ---------- Команда перехода статуса ----------
-- Единственная точка изменения статуса. Атомарно: проверки -> UPDATE -> запись истории.
-- Сообщения об ошибках — стабильные ключи, по ним UI показывает человекочитаемый текст.
create or replace function public.transition_task(
  p_task_id   uuid,
  p_to_status public.task_status,
  p_comment   text default null
)
returns public.tasks
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id   uuid := auth.uid();
  v_actor_role public.user_role;
  v_task       public.tasks;
  v_rule       public.task_status_transitions;
  v_comment    text := nullif(btrim(p_comment), '');
begin
  if v_actor_id is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = 'insufficient_privilege';
  end if;

  select p.role into v_actor_role from public.profiles p where p.id = v_actor_id;
  if v_actor_role is null then
    raise exception 'PROFILE_NOT_FOUND' using errcode = 'insufficient_privilege';
  end if;

  -- Блокируем строку: два параллельных перехода не пройдут оба.
  select t.* into v_task from public.tasks t where t.id = p_task_id for update;

  -- Исполнитель не должен узнать даже о существовании чужой задачи:
  -- ответ тот же, что и для несуществующей.
  if v_task.id is null
     or (v_actor_role = 'executor' and v_task.assignee_id is distinct from v_actor_id) then
    raise exception 'TASK_NOT_FOUND' using errcode = 'no_data_found';
  end if;

  select r.* into v_rule
  from public.task_status_transitions r
  where r.from_status = v_task.status and r.to_status = p_to_status;

  if v_rule.from_status is null then
    raise exception 'TRANSITION_NOT_ALLOWED'
      using errcode = 'check_violation',
            detail  = format('%s -> %s', v_task.status, p_to_status);
  end if;

  if v_rule.actor_role <> v_actor_role then
    raise exception 'TRANSITION_FORBIDDEN_FOR_ROLE'
      using errcode = 'insufficient_privilege',
            detail  = format('required role: %s', v_rule.actor_role);
  end if;

  if v_rule.requires_comment and v_comment is null then
    raise exception 'COMMENT_REQUIRED' using errcode = 'check_violation';
  end if;

  -- Флаги транзакции открывают "замки" триггеров ровно на время этой операции.
  perform set_config('app.transition_ctx', 'transition_task', true);
  perform set_config('app.history_ctx',    'transition_task', true);

  update public.tasks t
     set status = p_to_status
   where t.id = p_task_id
  returning t.* into v_task;

  insert into public.task_status_history (task_id, actor_id, from_status, to_status, comment)
  values (p_task_id, v_actor_id, v_rule.from_status, v_rule.to_status, v_comment);

  perform set_config('app.transition_ctx', '', true);
  perform set_config('app.history_ctx',    '', true);

  return v_task;
end;
$$;

comment on function public.transition_task is
  'Единственный способ сменить статус задачи. Проверяет роль, назначение и обязательность комментария по task_status_transitions.';
