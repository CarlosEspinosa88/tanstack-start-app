import type { PrismaClient } from '../../generated/client'
import type { TodoRepository } from './todo-operations'

export function createTodoRepository(prisma: PrismaClient): TodoRepository {
  function boardTodoAccess(actorId: string, boardOwnerId: string) {
    return {
      userId: boardOwnerId,
      ...(actorId === boardOwnerId
        ? {}
        : {
            user: {
              is: {
                ownedBoardShares: {
                  some: {
                    recipientId: actorId,
                    status: 'ACCEPTED' as const,
                    role: 'EDITOR' as const,
                  },
                },
              },
            },
          }),
    }
  }

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
    findDueDateCounts: async ({ userId, start, end }) => {
      const groups = await prisma.todo.groupBy({
        by: ['dueDate'],
        where: { userId, dueDate: { gte: start, lt: end } },
        _count: { _all: true },
      })
      return groups.flatMap((group) => group.dueDate
        ? [{ date: group.dueDate.toISOString().slice(0, 10), count: group._count._all }]
        : [])
    },
    create: ({ title, actorId, boardOwnerId, dueDate }) => {
      const data = { title, userId: boardOwnerId, dueDate }

      if (actorId === boardOwnerId) {
        return prisma.todo.create({ data })
      }

      return prisma.$transaction(async (transaction) => {
        const share = await transaction.boardShare.findFirst({
          where: {
            ownerId: boardOwnerId,
            recipientId: actorId,
            status: 'ACCEPTED',
            role: 'EDITOR',
          },
          select: { id: true },
        })

        if (!share) {
          throw new Error('Board not found')
        }

        return transaction.todo.create({ data })
      }, { isolationLevel: 'Serializable' })
    },
    updateOnBoard: async ({ id, actorId, boardOwnerId, ...data }) => {
      const result = await prisma.todo.updateManyAndReturn({
        where: { id, ...boardTodoAccess(actorId, boardOwnerId) },
        data,
      })

      return result[0] ?? null
    },
    deleteFromBoard: async ({ id, actorId, boardOwnerId }) => {
      const result = await prisma.todo.deleteMany({
        where: { id, ...boardTodoAccess(actorId, boardOwnerId) },
      })
      return result.count > 0
    },
    updateManyOnBoard: ({ ids, actorId, boardOwnerId, done }) =>
      prisma.todo.updateMany({
        where: { id: { in: ids }, ...boardTodoAccess(actorId, boardOwnerId) },
        data: { done },
      }).then((result) => result.count),
    deleteManyFromBoard: ({ ids, actorId, boardOwnerId }) =>
      prisma.todo.deleteMany({
        where: { id: { in: ids }, ...boardTodoAccess(actorId, boardOwnerId) },
      }).then((result) => result.count),
  }
}
