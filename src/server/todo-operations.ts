import { buildTodoActivity, getUtcActivityRange } from './dashboard'

export type TodoRecord = {
  id: string
  title: string
  done: boolean
  createdAt: Date
  dueDate: Date | null
  userId: string
}

export type TodoWhere = {
  userId: string
  done?: boolean
  title?: { contains: string }
}

export type TodoListOptions = {
  page: number
  status: 'all' | 'open' | 'completed'
  search: string
  period?: '7d' | '30d'
}

export type TodoRepository = {
  count(where: TodoWhere): Promise<number>
  findPage(args: {
    where: TodoWhere
    skip: number
    take: number
  }): Promise<TodoRecord[]>
  findActivityDates(args: {
    userId: string
    startDate: Date
    exclusiveEndDate: Date
  }): Promise<Date[]>
  create(args: {
    title: string
    dueDate?: Date
    actorId: string
    boardOwnerId: string
  }): Promise<TodoRecord>
  updateOnBoard(args: {
    id: string
    actorId: string
    boardOwnerId: string
    title?: string
    done?: boolean
    dueDate?: Date | null
  }): Promise<TodoRecord | null>
  deleteFromBoard(args: {
    id: string
    actorId: string
    boardOwnerId: string
  }): Promise<boolean>
  updateManyOnBoard(args: {
    ids: string[]
    actorId: string
    boardOwnerId: string
    done: boolean
  }): Promise<number>
  deleteManyFromBoard(args: {
    ids: string[]
    actorId: string
    boardOwnerId: string
  }): Promise<number>
}

const pageSize = 20

export async function getTodoDashboardData(
  repository: TodoRepository,
  userId: string,
  options: TodoListOptions,
  now = new Date(),
) {
  const where: TodoWhere = {
    userId,
    ...(options.status === 'open' ? { done: false } : {}),
    ...(options.status === 'completed' ? { done: true } : {}),
    ...(options.search ? { title: { contains: options.search } } : {}),
  }
  const activityDayCount = options.period === '30d' ? 30 : 7
  const activityRange = getUtcActivityRange(now, activityDayCount)
  const [total, allCount, openCount, completedCount, activityDates] =
    await Promise.all([
      repository.count(where),
      repository.count({ userId }),
      repository.count({ userId, done: false }),
      repository.count({ userId, done: true }),
      repository.findActivityDates({
        userId,
        startDate: activityRange.startDate,
        exclusiveEndDate: activityRange.exclusiveEndDate,
      }),
    ])
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(options.page, pageCount)
  const todos = await repository.findPage({
    where,
    skip: (page - 1) * pageSize,
    take: pageSize,
  })

  return {
    todos,
    summary: { allCount, openCount, completedCount },
    activity: buildTodoActivity(activityDates, now, activityDayCount),
    pagination: { page, pageSize, total, pageCount },
  }
}

export async function createBoardTodo(
  repository: TodoRepository,
  actorId: string,
  boardOwnerId: string,
  title: string,
  dueDate?: Date,
) {
  return repository.create({ title, dueDate, actorId, boardOwnerId })
}

export async function updateBoardTodo(
  repository: TodoRepository,
  actorId: string,
  boardOwnerId: string,
  input: {
    id: string
    title?: string
    done?: boolean
    dueDate?: Date | null
  },
) {
  const todo = await repository.updateOnBoard({ ...input, actorId, boardOwnerId })

  if (!todo) {
    throw new Error('Todo not found')
  }

  return todo
}

export async function deleteBoardTodo(
  repository: TodoRepository,
  actorId: string,
  boardOwnerId: string,
  id: string,
) {
  const deleted = await repository.deleteFromBoard({ id, actorId, boardOwnerId })

  if (!deleted) {
    throw new Error('Todo not found')
  }
}

export function updateBoardTodos(
  repository: TodoRepository,
  actorId: string,
  boardOwnerId: string,
  ids: string[],
  done: boolean,
) {
  return repository.updateManyOnBoard({ ids, actorId, boardOwnerId, done })
}

export function deleteBoardTodos(
  repository: TodoRepository,
  actorId: string,
  boardOwnerId: string,
  ids: string[],
) {
  return repository.deleteManyFromBoard({ ids, actorId, boardOwnerId })
}
