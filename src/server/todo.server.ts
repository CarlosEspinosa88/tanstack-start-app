import { createServerFn } from '@tanstack/react-start'
import {
  buildTodoActivity,
  getOwnedTodoWhere,
  getUtcActivityRange,
} from './dashboard'
import {
  CreateTodoInput,
  DeleteTodoInput,
  TodoListInput,
  UpdateTodoInput,
} from './todo.validation'

async function getRequestUser() {
  const [{ getRequest }, { getUserFromRequest }] = await Promise.all([
    import('@tanstack/react-start/server'),
    import('./auth'),
  ])

  return getUserFromRequest(getRequest())
}

async function requireRequestUser() {
  const user = await getRequestUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  return user
}

export const getCurrentUser = createServerFn({ method: 'GET' }).handler(
  getRequestUser,
)

export const getTodoDashboard = createServerFn({ method: 'GET' })
  .inputValidator(TodoListInput)
  .handler(async ({ data }) => {
    const user = await requireRequestUser()
    const { prisma } = await import('./db')
    const pageSize = 20
    const where = {
      userId: user.id,
      ...(data.status === 'open' ? { done: false } : {}),
      ...(data.status === 'completed' ? { done: true } : {}),
      ...(data.search ? { title: { contains: data.search } } : {}),
    }
    const now = new Date()
    const activityRange = getUtcActivityRange(now)
    const [total, allCount, openCount, completedCount, activityTodos] =
      await Promise.all([
        prisma.todo.count({ where }),
        prisma.todo.count({ where: { userId: user.id } }),
        prisma.todo.count({ where: { userId: user.id, done: false } }),
        prisma.todo.count({ where: { userId: user.id, done: true } }),
        prisma.todo.findMany({
          where: {
            userId: user.id,
            createdAt: {
              gte: activityRange.startDate,
              lt: activityRange.exclusiveEndDate,
            },
          },
          select: { createdAt: true },
        }),
      ])
    const pageCount = Math.max(1, Math.ceil(total / pageSize))
    const page = Math.min(data.page, pageCount)
    const todos = await prisma.todo.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    return {
      todos,
      summary: { allCount, openCount, completedCount },
      activity: buildTodoActivity(
        activityTodos.map((todo) => todo.createdAt),
        now,
      ),
      pagination: {
        page,
        pageSize,
        total,
        pageCount,
      },
    }
  })

export const createTodo = createServerFn({ method: 'POST' })
  .inputValidator(CreateTodoInput)
  .handler(async ({ data }) => {
    const user = await requireRequestUser()
    const { prisma } = await import('./db')

    return prisma.todo.create({
      data: {
        title: data.title,
        userId: user.id,
      },
    })
  })

export const updateTodo = createServerFn({ method: 'POST' })
  .inputValidator(UpdateTodoInput)
  .handler(async ({ data }) => {
    const user = await requireRequestUser()
    const { prisma } = await import('./db')
    const result = await prisma.todo.updateMany({
      where: getOwnedTodoWhere(user.id, data.id),
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.done !== undefined ? { done: data.done } : {}),
      },
    })

    if (result.count === 0) {
      throw new Error('Todo not found')
    }

    return prisma.todo.findFirstOrThrow({
      where: getOwnedTodoWhere(user.id, data.id),
    })
  })

export const deleteTodo = createServerFn({ method: 'POST' })
  .inputValidator(DeleteTodoInput)
  .handler(async ({ data }) => {
    const user = await requireRequestUser()
    const { prisma } = await import('./db')
    const result = await prisma.todo.deleteMany({
      where: getOwnedTodoWhere(user.id, data.id),
    })

    if (result.count === 0) {
      throw new Error('Todo not found')
    }
  })