import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createBoardTodo,
  deleteBoardTodo,
  getTodoDashboardData,
  deleteBoardTodos,
  type TodoRecord,
  type TodoRepository,
  type TodoWhere,
  updateBoardTodo,
  updateBoardTodos,
} from './todo-operations'

const sampleTodo: TodoRecord = {
  id: 'todo-1',
  title: 'Plan week',
  done: false,
  createdAt: new Date('2026-11-19T12:00:00.000Z'),
  dueDate: null,
  userId: 'user-a',
}

function createRepository(overrides: Partial<TodoRepository> = {}) {
  const calls: {
    counts: TodoWhere[]
    page?: { where: TodoWhere; skip: number; take: number }
    activity?: { userId: string; startDate: Date; exclusiveEndDate: Date }
    created?: {
      title: string
      dueDate?: Date
      actorId: string
      boardOwnerId: string
    }
    updated?: {
      id: string
      actorId: string
      boardOwnerId: string
      title?: string
      done?: boolean
      dueDate?: Date | null
    }
    deleted?: { id: string; actorId: string; boardOwnerId: string }
    updatedMany?: {
      ids: string[]
      actorId: string
      boardOwnerId: string
      done: boolean
    }
    deletedMany?: { ids: string[]; actorId: string; boardOwnerId: string }
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
    updateOnBoard: async (args) => {
      calls.updated = args
      return { ...sampleTodo, ...args }
    },
    deleteFromBoard: async (args) => {
      calls.deleted = args
      return true
    },
    updateManyOnBoard: async (args) => {
      calls.updatedMany = args
      return args.ids.length
    },
    deleteManyFromBoard: async (args) => {
      calls.deletedMany = args
      return args.ids.length
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

test('dashboard requests the selected activity period', async () => {
  const { repository, calls } = createRepository()
  const dashboard = await getTodoDashboardData(
    repository,
    'user-a',
    { page: 1, status: 'all', search: '', period: '30d' },
    new Date('2026-11-19T12:00:00.000Z'),
  )

  assert.deepEqual(calls.activity, {
    userId: 'user-a',
    startDate: new Date('2026-10-21T00:00:00.000Z'),
    exclusiveEndDate: new Date('2026-11-20T00:00:00.000Z'),
  })
  assert.equal(dashboard.activity.length, 30)
})

test('create, update, and delete carry the actor and board owner separately', async () => {
  const { repository, calls } = createRepository()

  const dueDate = new Date('2026-12-01T00:00:00.000Z')
  await createBoardTodo(repository, 'user-a', 'user-a', 'Plan week', dueDate)
  await updateBoardTodo(repository, 'user-a', 'user-a', {
    id: 'todo-1',
    title: 'Plan next week',
    dueDate: null,
  })
  await deleteBoardTodo(repository, 'user-a', 'user-a', 'todo-1')

  assert.deepEqual(calls.created, {
    title: 'Plan week',
    dueDate,
    actorId: 'user-a',
    boardOwnerId: 'user-a',
  })
  assert.deepEqual(calls.updated, {
    id: 'todo-1',
    title: 'Plan next week',
    dueDate: null,
    actorId: 'user-a',
    boardOwnerId: 'user-a',
  })
  assert.deepEqual(calls.deleted, {
    id: 'todo-1',
    actorId: 'user-a',
    boardOwnerId: 'user-a',
  })
})

test('update and delete report missing or non-owned todos', async () => {
  const { repository, calls } = createRepository({
    updateOnBoard: async (args) => {
      calls.updated = args
      return null
    },
    deleteFromBoard: async (args) => {
      calls.deleted = args
      return false
    },
  })

  await assert.rejects(
    updateBoardTodo(repository, 'user-a', 'user-a', {
      id: 'todo-other',
      done: true,
    }),
    { message: 'Todo not found' },
  )
  await assert.rejects(
    deleteBoardTodo(repository, 'user-a', 'user-a', 'todo-other'),
    { message: 'Todo not found' },
  )
  assert.deepEqual(calls.updated, {
    id: 'todo-other',
    done: true,
    actorId: 'user-a',
    boardOwnerId: 'user-a',
  })
  assert.deepEqual(calls.deleted, {
    id: 'todo-other',
    actorId: 'user-a',
    boardOwnerId: 'user-a',
  })
})

test('bulk update and delete always scope every id to the authenticated owner', async () => {
  const { repository, calls } = createRepository()

  await updateBoardTodos(repository, 'user-a', 'user-a', ['todo-1', 'todo-2'], true)
  await deleteBoardTodos(repository, 'user-a', 'user-a', ['todo-3', 'todo-4'])

  assert.deepEqual(calls.updatedMany, {
    ids: ['todo-1', 'todo-2'],
    actorId: 'user-a',
    boardOwnerId: 'user-a',
    done: true,
  })
  assert.deepEqual(calls.deletedMany, {
    ids: ['todo-3', 'todo-4'],
    actorId: 'user-a',
    boardOwnerId: 'user-a',
  })
})
