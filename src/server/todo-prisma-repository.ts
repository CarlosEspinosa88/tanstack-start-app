import type { PrismaClient } from '../../generated/client'
import type { TodoRepository } from './todo-operations'

export function createTodoRepository(prisma: PrismaClient): TodoRepository {
  return {
    count: (where) => prisma.todo.count({ where }),
    findSummary: async (userId) => {
      const groups = await prisma.todo.groupBy({
        by: ['done'],
        where: { userId },
        _count: { _all: true },
      })
      const openCount =
        groups.find((group) => group.done === false)?._count._all ?? 0
      const completedCount =
        groups.find((group) => group.done === true)?._count._all ?? 0

      return {
        allCount: openCount + completedCount,
        openCount,
        completedCount,
      }
    },
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
