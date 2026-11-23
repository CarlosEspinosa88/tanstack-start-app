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
    userId: string
  }): Promise<TodoRecord>
  updateOwned(args: {
    id: string
    userId: string
    title?: string
    done?: boolean
    dueDate?: Date | null
  }): Promise<TodoRecord | null>
  deleteOwned(args: { id: string; userId: string }): Promise<boolean>
  updateManyOwned(args: {
    ids: string[]
    userId: string
    done: boolean
  }): Promise<number>
  deleteManyOwned(args: { ids: string[]; userId: string }): Promise<number>
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

export async function createOwnedTodo(
  repository: TodoRepository,
  userId: string,
  title: string,
  dueDate?: Date,
) {
  return repository.create({ title, dueDate, userId })
}

export async function updateOwnedTodo(
  repository: TodoRepository,
  userId: string,
  input: {
    id: string
    title?: string
    done?: boolean
    dueDate?: Date | null
  },
) {
  const todo = await repository.updateOwned({ ...input, userId })

  if (!todo) {
    throw new Error('Todo not found')
  }

  return todo
}

export async function deleteOwnedTodo(
  repository: TodoRepository,
  userId: string,
  id: string,
) {
  const deleted = await repository.deleteOwned({ id, userId })

  if (!deleted) {
    throw new Error('Todo not found')
  }
}

export function updateOwnedTodos(
  repository: TodoRepository,
  userId: string,
  ids: string[],
  done: boolean,
) {
  return repository.updateManyOwned({ ids, userId, done })
}

export function deleteOwnedTodos(
  repository: TodoRepository,
  userId: string,
  ids: string[],
) {
  return repository.deleteManyOwned({ ids, userId })
}
