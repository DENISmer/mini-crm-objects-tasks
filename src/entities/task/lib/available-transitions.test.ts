import { describe, expect, it } from 'vitest'

import type { TaskTransitionRule } from '../model'
import { getAvailableTransitions } from './available-transitions'

/** Копия справочника из миграции 0001. */
const rules: TaskTransitionRule[] = [
  { from_status: 'new', to_status: 'in_progress', actor_role: 'executor', requires_comment: false },
  {
    from_status: 'in_progress',
    to_status: 'in_review',
    actor_role: 'executor',
    requires_comment: false,
  },
  {
    from_status: 'in_review',
    to_status: 'accepted',
    actor_role: 'manager',
    requires_comment: false,
  },
  { from_status: 'in_review', to_status: 'rework', actor_role: 'manager', requires_comment: true },
  {
    from_status: 'rework',
    to_status: 'in_progress',
    actor_role: 'executor',
    requires_comment: false,
  },
]

const manager = { id: 'm1', role: 'manager' } as const
const alice = { id: 'e1', role: 'executor' } as const
const bob = { id: 'e2', role: 'executor' } as const

describe('getAvailableTransitions', () => {
  it('назначенный исполнитель может взять новую задачу в работу', () => {
    const result = getAvailableTransitions({
      rules,
      task: { status: 'new', assignee_id: alice.id },
      actor: alice,
    })
    expect(result).toEqual([{ to: 'in_progress', label: 'Взять в работу', requiresComment: false }])
  })

  it('чужой исполнитель не видит действий', () => {
    expect(
      getAvailableTransitions({
        rules,
        task: { status: 'new', assignee_id: alice.id },
        actor: bob,
      }),
    ).toEqual([])
  })

  it('постановщик не берёт задачу в работу', () => {
    expect(
      getAvailableTransitions({
        rules,
        task: { status: 'new', assignee_id: alice.id },
        actor: manager,
      }),
    ).toEqual([])
  })

  it('на проверке у постановщика два действия, возврат требует комментарий', () => {
    const result = getAvailableTransitions({
      rules,
      task: { status: 'in_review', assignee_id: alice.id },
      actor: manager,
    })
    expect(result.map((t) => t.to)).toEqual(['accepted', 'rework'])
    expect(result.find((t) => t.to === 'rework')?.requiresComment).toBe(true)
  })

  it('принятая задача терминальна для всех', () => {
    expect(
      getAvailableTransitions({
        rules,
        task: { status: 'accepted', assignee_id: alice.id },
        actor: manager,
      }),
    ).toEqual([])
    expect(
      getAvailableTransitions({
        rules,
        task: { status: 'accepted', assignee_id: alice.id },
        actor: alice,
      }),
    ).toEqual([])
  })

  it('неназначенную задачу никто не может взять в работу', () => {
    expect(
      getAvailableTransitions({ rules, task: { status: 'new', assignee_id: null }, actor: alice }),
    ).toEqual([])
  })
})
