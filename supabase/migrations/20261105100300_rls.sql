-- =============================================================================
-- 0004. Права доступа: привилегии ролей + Row Level Security
--
-- Supabase по умолчанию выдаёт anon/authenticated GRANT ALL на новые таблицы.
-- Здесь это снимается и выдаётся ровно то, что нужно. anon не получает ничего:
-- без входа API возвращает "permission denied".
-- =============================================================================

-- ---------- Привилегии (первый замок: что вообще можно трогать) ----------
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;

-- Таблицы и функции, которые появятся позже, тоже будут закрыты по умолчанию.
alter default privileges for role postgres in schema public revoke all on tables    from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on functions from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;

grant select on public.profiles to authenticated;

grant select, delete         on public.objects to authenticated;
grant insert (name, address) on public.objects to authenticated;
grant update (name, address) on public.objects to authenticated;

-- status и author_id в списке нет: их нельзя передать ни при создании, ни при изменении.
-- Статус меняется только через transition_task(), автор ставится default'ом auth.uid().
grant select, delete                                       on public.tasks to authenticated;
grant insert (object_id, title, description, assignee_id) on public.tasks to authenticated;
grant update (object_id, title, description, assignee_id) on public.tasks to authenticated;

grant select on public.task_status_history     to authenticated;   -- только чтение
grant select on public.task_status_transitions to authenticated;   -- только чтение

grant execute on function public.current_user_role()                             to authenticated;
grant execute on function public.is_manager()                                    to authenticated;
grant execute on function public.can_access_task(uuid)                           to authenticated;
grant execute on function public.transition_task(uuid, public.task_status, text) to authenticated;

-- ---------- RLS (второй замок: какие строки видны и изменяемы) ----------
alter table public.profiles                enable row level security;
alter table public.objects                 enable row level security;
alter table public.tasks                   enable row level security;
alter table public.task_status_history     enable row level security;
alter table public.task_status_transitions enable row level security;

-- profiles: имена и роли видны всем вошедшим (нужны для выбора исполнителя и подписи автора).
-- Контактных данных в таблице нет. Политик на запись нет: роль меняет только администратор.
create policy "profiles_select_authenticated"
  on public.profiles for select to authenticated
  using (true);

-- objects: постановщик видит все, исполнитель — только те, где у него есть задачи.
create policy "objects_select"
  on public.objects for select to authenticated
  using (
    (select public.is_manager())
    or exists (
      select 1 from public.tasks t
      where t.object_id = objects.id and t.assignee_id = (select auth.uid())
    )
  );

create policy "objects_insert_manager"
  on public.objects for insert to authenticated
  with check ((select public.is_manager()));

create policy "objects_update_manager"
  on public.objects for update to authenticated
  using ((select public.is_manager()))
  with check ((select public.is_manager()));

create policy "objects_delete_manager"
  on public.objects for delete to authenticated
  using ((select public.is_manager()));

-- tasks: постановщик видит и правит все, исполнитель видит только свои.
create policy "tasks_select"
  on public.tasks for select to authenticated
  using ((select public.is_manager()) or assignee_id = (select auth.uid()));

create policy "tasks_insert_manager"
  on public.tasks for insert to authenticated
  with check ((select public.is_manager()));

create policy "tasks_update_manager"
  on public.tasks for update to authenticated
  using ((select public.is_manager()))
  with check ((select public.is_manager()));

create policy "tasks_delete_manager"
  on public.tasks for delete to authenticated
  using ((select public.is_manager()));

-- history: видна тем, кто видит задачу. Политик на запись нет вообще.
create policy "history_select"
  on public.task_status_history for select to authenticated
  using (public.can_access_task(task_id));

-- transitions: справочник, читают все вошедшие.
create policy "transitions_select"
  on public.task_status_transitions for select to authenticated
  using (true);
