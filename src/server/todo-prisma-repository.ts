import type { PrismaClient } from '../../generated/client'
import type { TodoRepository } from './todo-operations'

export function createTodoRepository(prisma: PrismaClient): TodoRepository {
  return {
    count: (where) => prisma.todo.count({ where }),
    findPage: ({ where, skip, take }) =>
      prisma.todo.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take,
      }),
    findActivityDates: async ({ userId, startDate, exclusiveEndDate }) => {
      const todos = await prisma.todo.findMany({
        where: {
          userId,
          createdAt: { gte: startDate, lt: exclusiveEndDate },
        },
        select: { createdAt: true },
      })

      return todos.map((todo) => todo.createdAt)
    },
    create: ({ title, userId }) =>
      prisma.todo.create({ data: { title, userId } }),
    updateOwned: async ({ id, userId, ...data }) => {
      const result = await prisma.todo.updateMany({
        where: { id, userId },
        data,
      })

      return result.count
        ? prisma.todo.findFirstOrThrow({ where: { id, userId } })
        : null
    },
    deleteOwned: async ({ id, userId }) => {
      const result = await prisma.todo.deleteMany({ where: { id, userId } })
      return result.count > 0
    },
    updateManyOwned: ({ ids, userId, done }) =>
      prisma.todo.updateMany({
        where: { id: { in: ids }, userId },
        data: { done },
      }).then((result) => result.count),
    deleteManyOwned: ({ ids, userId }) =>
      prisma.todo.deleteMany({
        where: { id: { in: ids }, userId },
      }).then((result) => result.count),
  }
}
