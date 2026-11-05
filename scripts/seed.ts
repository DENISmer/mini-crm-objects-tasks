/**
 * Наполняет базу демо-данными ЧЕРЕЗ ПУБЛИЧНЫЙ API от имени пользователей:
 * те же RLS-политики и transition_task(), что и у интерфейса. Это одновременно
 * сквозная проверка, что правила доступа не ломают нормальные сценарии.
 *
 * service_role используется только для создания пользователей (регистрация закрыта)
 * и читается из .env.seed.local, который не попадает в репозиторий.
 *
 * Запуск: npm run seed
 * Для другого окружения: SEED_ENV_FILE=.env.seed.cloud.local npm run seed
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { config as loadEnv } from 'dotenv'

import type { Database } from '../src/shared/api/database.types.ts'

loadEnv({ path: process.env.SEED_ENV_FILE ?? '.env.seed.local' })

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Не задана переменная ${name} (см. .env.seed.example)`)
  return value
}

const SUPABASE_URL = requireEnv('SUPABASE_URL')
const ANON_KEY = requireEnv('SUPABASE_ANON_KEY')
const SERVICE_ROLE_KEY = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
const SEED_PASSWORD = requireEnv('SEED_PASSWORD')

type Client = SupabaseClient<Database>
type Role = Database['public']['Enums']['user_role']
type Status = Database['public']['Enums']['task_status']

interface SeedUser {
  key: 'manager' | 'manager2' | 'alice' | 'bob'
  email: string
  fullName: string
  role: Role
}

const USERS: SeedUser[] = [
  { key: 'manager', email: 'manager@crm.demo', fullName: 'Мария Руководитель', role: 'manager' },
  { key: 'manager2', email: 'manager2@crm.demo', fullName: 'Михаил Прораб', role: 'manager' },
  { key: 'alice', email: 'alice@crm.demo', fullName: 'Алиса Монтажник', role: 'executor' },
  { key: 'bob', email: 'bob@crm.demo', fullName: 'Борис Электрик', role: 'executor' },
]

const admin = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function ensureUser(user: SeedUser): Promise<string> {
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (error) throw error
  const existing = data.users.find((u) => u.email === user.email)
  if (existing) {
    // Пароль подтягиваем к SEED_PASSWORD: так его можно сменить, не пересоздавая пользователей.
    const { error: updateError } = await admin.auth.admin.updateUserById(existing.id, {
      password: SEED_PASSWORD,
    })
    if (updateError) throw updateError
    console.log(`= ${user.email} уже существует, пароль обновлён`)
    return existing.id
  }
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: user.email,
    password: SEED_PASSWORD,
    email_confirm: true,
    app_metadata: { role: user.role },
    user_metadata: { full_name: user.fullName },
  })
  if (createError) throw createError
  console.log(`+ ${user.email} (${user.role})`)
  return created.user.id
}

async function signIn(user: SeedUser): Promise<Client> {
  const client = createClient<Database>(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { error } = await client.auth.signInWithPassword({
    email: user.email,
    password: SEED_PASSWORD,
  })
  if (error) throw new Error(`Вход ${user.email}: ${error.message}`)
  return client
}

async function createObject(client: Client, name: string, address: string): Promise<string> {
  const { data, error } = await client
    .from('objects')
    .insert({ name, address })
    .select('id')
    .single()
  if (error) throw new Error(`Объект «${name}»: ${error.message}`)
  console.log(`+ объект «${name}»`)
  return data.id
}

interface TaskSeed {
  objectId: string
  title: string
  description: string
  assigneeId: string | null
}

async function createTask(client: Client, task: TaskSeed): Promise<string> {
  const { data, error } = await client
    .from('tasks')
    .insert({
      object_id: task.objectId,
      title: task.title,
      description: task.description,
      assignee_id: task.assigneeId,
    })
    .select('id')
    .single()
  if (error) throw new Error(`Задача «${task.title}»: ${error.message}`)
  console.log(`  + задача «${task.title}»`)
  return data.id
}

async function transition(client: Client, taskId: string, to: Status, comment?: string) {
  const { error } = await client.rpc('transition_task', {
    p_task_id: taskId,
    p_to_status: to,
    p_comment: comment,
  })
  if (error) throw new Error(`Переход в ${to}: ${error.message}`)
}

function printCredentials() {
  console.log('\nДоступы (пароль у всех одинаковый, из SEED_PASSWORD):')
  for (const user of USERS) {
    console.log(`  ${user.role.padEnd(8)} ${user.email.padEnd(22)} ${user.fullName}`)
  }
}

async function main() {
  const ids = {} as Record<SeedUser['key'], string>
  for (const user of USERS) ids[user.key] = await ensureUser(user)

  const manager = await signIn(USERS[0]!)

  const { count, error: countError } = await manager
    .from('objects')
    .select('*', { count: 'exact', head: true })
  if (countError) throw countError
  if ((count ?? 0) > 0) {
    console.log('\nОбъекты уже есть, данные не трогаю.')
    printCredentials()
    return
  }

  const alice = await signIn(USERS[2]!)
  const bob = await signIn(USERS[3]!)

  // ---------- Объекты ----------
  const north = await createObject(manager, 'ЖК «Северный»', 'ул. Строителей, 12')
  const school = await createObject(manager, 'Школа № 17', 'пр. Мира, 3')
  const warehouse = await createObject(
    manager,
    'Склад логистического центра',
    'Промзона, участок 4',
  )

  // ---------- Задачи и их жизненный цикл ----------
  const foundation = await createTask(manager, {
    objectId: north,
    title: 'Залить фундамент блока Б',
    description: 'Бетон М300, по проекту. После заливки приложить фото и акт.',
    assigneeId: ids.alice,
  })
  await transition(alice, foundation, 'in_progress')
  await transition(alice, foundation, 'in_review')
  await transition(manager, foundation, 'accepted') // принята

  const formwork = await createTask(manager, {
    objectId: north,
    title: 'Смонтировать опалубку 3 этажа',
    description: 'Опалубка по осям А–Д. Срок — до конца недели.',
    assigneeId: ids.alice,
  })
  await transition(alice, formwork, 'in_progress') // в работе

  const waterproofing = await createTask(manager, {
    objectId: north,
    title: 'Проверить гидроизоляцию подвала',
    description: 'Пройти по всему периметру, отметить дефекты на схеме.',
    assigneeId: ids.bob,
  })
  await transition(bob, waterproofing, 'in_progress')
  await transition(bob, waterproofing, 'in_review') // ждёт проверки

  const switchboard = await createTask(manager, {
    objectId: school,
    title: 'Заменить электрощит в столовой',
    description: 'Новый щит по спецификации. Обязателен акт скрытых работ.',
    assigneeId: ids.bob,
  })
  await transition(bob, switchboard, 'in_progress')
  await transition(bob, switchboard, 'in_review')
  await transition(manager, switchboard, 'rework', 'Нет акта скрытых работ, приложите фото') // на доработке

  const gym = await createTask(manager, {
    objectId: school,
    title: 'Развести электрику в спортзале',
    description: 'Кабель по проекту, розетки на высоте 1,5 м.',
    assigneeId: ids.bob,
  })
  await transition(bob, gym, 'in_progress')
  await transition(bob, gym, 'in_review')
  await transition(manager, gym, 'rework', 'Не хватает розеток у тренерской, см. лист 4')
  await transition(bob, gym, 'in_progress') // снова в работе после доработки

  await createTask(manager, {
    objectId: school,
    title: 'Установить окна в кабинетах 2 этажа',
    description: 'Окна привезут во вторник, монтаж по графику.',
    assigneeId: ids.alice,
  }) // новая

  await createTask(manager, {
    objectId: warehouse,
    title: 'Подготовить площадку под стеллажи',
    description: 'Выровнять пол, разметить ряды.',
    assigneeId: ids.bob,
  }) // новая

  await createTask(manager, {
    objectId: warehouse,
    title: 'Разметить зоны погрузки',
    description: 'Исполнителя назначить после согласования схемы.',
    assigneeId: null,
  }) // новая, без исполнителя

  const ventilation = await createTask(manager, {
    objectId: warehouse,
    title: 'Проверить вентиляцию',
    description: 'Замерить расход воздуха в каждой секции.',
    assigneeId: ids.alice,
  })
  await transition(alice, ventilation, 'in_progress')
  await transition(alice, ventilation, 'in_review') // ждёт проверки

  console.log('\nГотово.')
  printCredentials()
}

main().catch((error: unknown) => {
  console.error('\nОшибка:', error instanceof Error ? error.message : error)
  process.exit(1)
})
