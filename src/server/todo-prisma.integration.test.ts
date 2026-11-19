import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import test from 'node:test'
import { PrismaClient } from '../../generated/client'
import {
  createOwnedTodo,
  deleteOwnedTodo,
  getTodoDashboardData,
  updateOwnedTodo,
} from './todo-operations'
import { createTodoRepository } from './todo-prisma-repository'

const databaseUrl = process.env.TEST_DATABASE_URL

test(
  'Prisma-backed todo workflows persist changes and enforce owner scoping',
  { skip: !databaseUrl },
  async () => {
    if (!databaseUrl) {
      return
    }

    const prisma = new PrismaClient({
      datasources: { db: { url: databaseUrl } },
    })
    const userIds: string[] = []

    try {
      const suffix = randomUUID()
      const firstUser = await prisma.user.create({
        data: {
          email: `test-a-${suffix}@todo.dev`,
          googleId: `test-a-${suffix}`,
        },
      })
      userIds.push(firstUser.id)
      const secondUser = await prisma.user.create({
        data: {
          email: `test-b-${suffix}@todo.dev`,
          googleId: `test-b-${suffix}`,
        },
      })
      userIds.push(secondUser.id)

      const repository = createTodoRepository(prisma)
      const todo = await createOwnedTodo(
        repository,
        firstUser.id,
        'Integration task',
      )
      await updateOwnedTodo(repository, firstUser.id, {
        id: todo.id,
        title: 'Updated integration task',
        done: true,
      })

      const dashboard = await getTodoDashboardData(
        repository,
        firstUser.id,
        { page: 1, status: 'completed', search: 'Updated' },
        new Date(Date.now() + 24 * 60 * 60 * 1000),
      )
      assert.equal(dashboard.pagination.total, 1)
      assert.equal(dashboard.todos[0]?.id, todo.id)
      assert.equal(dashboard.todos[0]?.title, 'Updated integration task')
      assert.equal(dashboard.summary.allCount, 1)
      assert.equal(dashboard.summary.completedCount, 1)

      await assert.rejects(
        updateOwnedTodo(repository, secondUser.id, {
          id: todo.id,
          done: false,
        }),
        { message: 'Todo not found' },
      )
      await assert.rejects(
        deleteOwnedTodo(repository, secondUser.id, todo.id),
        { message: 'Todo not found' },
      )
      assert.equal(await prisma.todo.count({ where: { id: todo.id } }), 1)

      await deleteOwnedTodo(repository, firstUser.id, todo.id)
      assert.equal(await prisma.todo.count({ where: { id: todo.id } }), 0)
    } finally {
      if (userIds.length > 0) {
        await prisma.todo.deleteMany({ where: { userId: { in: userIds } } })
        await prisma.user.deleteMany({ where: { id: { in: userIds } } })
      }

      await prisma.$disconnect()
    }
  },
)
