import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createOwnedTodo,
  deleteOwnedTodo,
  getTodoDashboardData,
  type TodoRecord,
  type TodoRepository,
  type TodoWhere,
  updateOwnedTodo,
} from './todo-operations'

const sampleTodo: TodoRecord = {
  id: 'todo-1',
  title: 'Plan week',
  done: false,
  createdAt: new Date('2026-11-19T12:00:00.000Z'),
  userId: 'user-a',
}

function createRepository(overrides: Partial<TodoRepository> = {}) {
  const calls: {
    counts: TodoWhere[]
    page?: { where: TodoWhere; skip: number; take: number }
    activity?: { userId: string; startDate: Date; exclusiveEndDate: Date }
    created?: { title: string; userId: string }
    updated?: { id: string; userId: string; title?: string; done?: boolean }
    deleted?: { id: string; userId: string }
  } = { counts: [] }

  const repository: TodoRepository = {
    count: async (where) => {
      calls.counts.push(where)
      return where.title ? 41 : where.done === false ? 7 : where.done === true ? 34 : 41
    },
    findPage: async (args) => {
      calls.page = args
      return []
    },
    findActivityDates: async (args) => {
      calls.activity = args
      return []
    },
    create: async (args) => {
      calls.created = args
      return { ...sampleTodo, ...args }
    },
    updateOwned: async (args) => {
      calls.updated = args
      return { ...sampleTodo, ...args }
    },
    deleteOwned: async (args) => {
      calls.deleted = args
      return true
    },
    ...overrides,
  }

  return { repository, calls }
}

test('dashboard scopes search, status, counts, activity, and pagination to the user', async () => {
  const { repository, calls } = createRepository()
  const dashboard = await getTodoDashboardData(
    repository,
    'user-a',
    { page: 8, status: 'open', search: 'plan' },
    new Date('2026-11-19T12:00:00.000Z'),
  )

  assert.deepEqual(calls.counts, [
    { userId: 'user-a', done: false, title: { contains: 'plan' } },
    { userId: 'user-a' },
    { userId: 'user-a', done: false },
    { userId: 'user-a', done: true },
  ])
  assert.deepEqual(calls.page, {
    where: { userId: 'user-a', done: false, title: { contains: 'plan' } },
    skip: 40,
    take: 20,
  })
  assert.deepEqual(calls.activity, {
    userId: 'user-a',
    startDate: new Date('2026-11-13T00:00:00.000Z'),
    exclusiveEndDate: new Date('2026-11-20T00:00:00.000Z'),
  })
  assert.deepEqual(dashboard.summary, {
    allCount: 41,
    openCount: 7,
    completedCount: 34,
  })
  assert.deepEqual(dashboard.pagination, {
    page: 3,
    pageSize: 20,
    total: 41,
    pageCount: 3,
  })
})

test('create, update, and delete always carry the authenticated owner id', async () => {
  const { repository, calls } = createRepository()

  await createOwnedTodo(repository, 'user-a', 'Plan week')
  await updateOwnedTodo(repository, 'user-a', {
    id: 'todo-1',
    title: 'Plan next week',
  })
  await deleteOwnedTodo(repository, 'user-a', 'todo-1')

  assert.deepEqual(calls.created, { title: 'Plan week', userId: 'user-a' })
  assert.deepEqual(calls.updated, {
    id: 'todo-1',
    title: 'Plan next week',
    userId: 'user-a',
  })
  assert.deepEqual(calls.deleted, { id: 'todo-1', userId: 'user-a' })
})

test('update and delete report missing or non-owned todos', async () => {
  const { repository, calls } = createRepository({
    updateOwned: async (args) => {
      calls.updated = args
      return null
    },
    deleteOwned: async (args) => {
      calls.deleted = args
      return false
    },
  })

  await assert.rejects(
    updateOwnedTodo(repository, 'user-a', { id: 'todo-other', done: true }),
    { message: 'Todo not found' },
  )
  await assert.rejects(
    deleteOwnedTodo(repository, 'user-a', 'todo-other'),
    { message: 'Todo not found' },
  )
  assert.deepEqual(calls.updated, {
    id: 'todo-other',
    done: true,
    userId: 'user-a',
  })
  assert.deepEqual(calls.deleted, { id: 'todo-other', userId: 'user-a' })
})
