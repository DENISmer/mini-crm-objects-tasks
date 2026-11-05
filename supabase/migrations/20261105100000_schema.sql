-- =============================================================================
-- 0001. Схема данных мини-CRM «Объекты и задачи»
--
-- Принцип: вся авторизация и доменные инварианты живут в базе.
-- Клиент (React) только отображает то, что разрешила база.
-- =============================================================================

create type public.user_role as enum ('manager', 'executor');
comment on type public.user_role is 'manager = постановщик, executor = исполнитель';

create type public.task_status as enum ('new', 'in_progress', 'in_review', 'accepted', 'rework');
comment on type public.task_status is 'Новая / В работе / На проверке / Принята / На доработке';

-- Профиль пользователя: 1:1 с auth.users. Создаётся триггером (см. 0002).
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text not null check (length(btrim(full_name)) between 1 and 100),
  role       public.user_role not null default 'executor',
  created_at timestamptz not null default now()
);
comment on table public.profiles is
  'Профиль пользователя. Роль назначает только администратор через Supabase; клиент менять её не может.';

create table public.objects (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (length(btrim(name)) between 1 and 200),
  address    text not null check (length(btrim(address)) between 1 and 500),
  created_by uuid not null default auth.uid() references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.objects is 'Объект (стройка).';

create table public.tasks (
  id          uuid primary key default gen_random_uuid(),
  object_id   uuid not null references public.objects (id) on delete cascade,
  title       text not null check (length(btrim(title)) between 1 and 200),
  description text not null default '' check (length(description) <= 5000),
  assignee_id uuid references public.profiles (id) on delete set null,
  status      public.task_status not null default 'new',
  author_id   uuid not null default auth.uid() references public.profiles (id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on column public.tasks.status is
  'Меняется только через transition_task(); прямой UPDATE запрещён (см. 0003, 0004).';
comment on column public.tasks.assignee_id is
  'Только пользователь с ролью executor (проверяется триггером). NULL = ещё не назначен.';

create index tasks_object_id_idx   on public.tasks (object_id);
create index tasks_assignee_id_idx on public.tasks (assignee_id);

-- Журнал смен статусов. Только добавление, и только из transition_task() / триггера создания.
create table public.task_status_history (
  id          bigint generated always as identity primary key,
  task_id     uuid not null references public.tasks (id) on delete cascade,
  actor_id    uuid not null references public.profiles (id),
  from_status public.task_status,            -- NULL = запись о создании задачи
  to_status   public.task_status not null,
  comment     text check (comment is null or length(btrim(comment)) between 1 and 2000),
  created_at  timestamptz not null default now()
);
comment on table public.task_status_history is
  'Кто, когда, из какого статуса в какой перевёл задачу. Неизменяема (см. 0003).';

create index task_status_history_task_idx on public.task_status_history (task_id, created_at);

-- Декларативная машина состояний: единственный источник правды и для базы, и для UI.
create table public.task_status_transitions (
  from_status      public.task_status not null,
  to_status        public.task_status not null,
  actor_role       public.user_role not null,
  requires_comment boolean not null default false,
  primary key (from_status, to_status),
  check (from_status <> to_status)
);
comment on table public.task_status_transitions is
  'Разрешённые переходы статусов задачи. Создание задачи (NULL -> new) переходом не считается.';

insert into public.task_status_transitions (from_status, to_status, actor_role, requires_comment) values
  ('new',         'in_progress', 'executor', false),
  ('in_progress', 'in_review',   'executor', false),
  ('in_review',   'accepted',    'manager',  false),
  ('in_review',   'rework',      'manager',  true),
  ('rework',      'in_progress', 'executor', false);
