import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import test from 'node:test'
import { PrismaClient } from '../../generated/client'
import {
  createBoardTodo,
  deleteBoardTodo,
  deleteBoardTodos,
  getTodoDashboardData,
  updateBoardTodo,
  updateBoardTodos,
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
      const editor = await prisma.user.create({
        data: {
          email: `test-editor-${suffix}@todo.dev`,
          googleId: `test-editor-${suffix}`,
        },
      })
      userIds.push(editor.id)
      const viewer = await prisma.user.create({
        data: {
          email: `test-viewer-${suffix}@todo.dev`,
          googleId: `test-viewer-${suffix}`,
        },
      })
      userIds.push(viewer.id)
      await prisma.boardShare.createMany({
        data: [
          {
            ownerId: firstUser.id,
            recipientId: editor.id,
            status: 'ACCEPTED',
            role: 'EDITOR',
          },
          {
            ownerId: firstUser.id,
            recipientId: viewer.id,
            status: 'ACCEPTED',
            role: 'VIEWER',
          },
          {
            ownerId: firstUser.id,
            recipientId: secondUser.id,
            status: 'PENDING',
            role: 'EDITOR',
          },
        ],
      })

      const repository = createTodoRepository(prisma)
      await prisma.todo.createMany({
        data: [
          ...Array.from({ length: 21 }, (_, index) => ({
            title: `Date filter ${index}`, userId: firstUser.id,
            dueDate: new Date('2024-02-29T00:00:00.000Z'),
          })),
          { title: 'No date', userId: firstUser.id },
          { title: 'Next day', userId: firstUser.id, dueDate: new Date('2024-03-01T00:00:00.000Z') },
          { title: 'Other board', userId: secondUser.id, dueDate: new Date('2024-02-29T00:00:00.000Z') },
        ],
      })
      const datePage = await getTodoDashboardData(repository, firstUser.id, {
        page: 2, status: 'all', search: 'Date filter', dueDate: '2024-02-29', month: '2024-02',
      })
      assert.equal(datePage.pagination.total, 21)
      assert.equal(datePage.todos.length, 1)
      assert.deepEqual(datePage.calendar.dueDateCounts, [{ date: '2024-02-29', count: 21 }])
      const unfiltered = await getTodoDashboardData(repository, firstUser.id, {
        page: 1, status: 'all', search: 'No date', month: '2024-02',
      })
      assert.equal(unfiltered.todos.length, 1)
      await prisma.todo.deleteMany({ where: { userId: { in: [firstUser.id, secondUser.id] } } })
      const dueDate = new Date('2026-12-01T00:00:00.000Z')
      const todo = await createBoardTodo(
        repository,
        firstUser.id,
        firstUser.id,
        'Integration task',
        dueDate,
      )
      assert.equal(todo.dueDate?.toISOString(), dueDate.toISOString())
      await updateBoardTodo(repository, firstUser.id, firstUser.id, {
        id: todo.id,
        title: 'Updated integration task',
        done: true,
        dueDate: null,
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
      assert.equal(dashboard.todos[0]?.dueDate, null)
      assert.equal(dashboard.summary.allCount, 1)
      assert.equal(dashboard.summary.completedCount, 1)

      await assert.rejects(
        updateBoardTodo(repository, secondUser.id, firstUser.id, {
          id: todo.id,
          done: false,
        }),
        { message: 'Todo not found' },
      )
      await assert.rejects(
        deleteBoardTodo(repository, secondUser.id, firstUser.id, todo.id),
        { message: 'Todo not found' },
      )
      assert.equal(await prisma.todo.count({ where: { id: todo.id } }), 1)

      const editorTodo = await createBoardTodo(
        repository,
        editor.id,
        firstUser.id,
        'Editor-created task',
      )
      assert.equal(editorTodo.userId, firstUser.id)
      assert.equal(
        await prisma.todo.count({
          where: {
            id: editorTodo.id,
            userId: firstUser.id,
            user: {
              is: {
                ownedBoardShares: {
                  some: {
                    recipientId: editor.id,
                    status: 'ACCEPTED',
                    role: 'EDITOR',
                  },
                },
              },
            },
          },
        }),
        1,
      )
      await updateBoardTodo(repository, editor.id, firstUser.id, {
        id: editorTodo.id,
        title: 'Edited by collaborator',
      })
      assert.equal(
        (await prisma.todo.findUniqueOrThrow({ where: { id: editorTodo.id } }))
          .title,
        'Edited by collaborator',
      )
      assert.equal(
        await updateBoardTodos(
          repository,
          editor.id,
          firstUser.id,
          [editorTodo.id],
          true,
        ),
        1,
      )
      assert.equal(
        await deleteBoardTodos(repository, editor.id, firstUser.id, [editorTodo.id]),
        1,
      )

      const protectedTodo = await createBoardTodo(
        repository,
        firstUser.id,
        firstUser.id,
        'Viewer-protected task',
      )
      await assert.rejects(
        createBoardTodo(
          repository,
          viewer.id,
          firstUser.id,
          'Viewer-created task',
        ),
        { message: 'Board not found' },
      )
      await assert.rejects(
        updateBoardTodo(repository, viewer.id, firstUser.id, {
          id: protectedTodo.id,
          done: true,
        }),
        { message: 'Todo not found' },
      )
      await assert.rejects(
        deleteBoardTodo(repository, viewer.id, firstUser.id, protectedTodo.id),
        { message: 'Todo not found' },
      )
      assert.equal(
        await updateBoardTodos(
          repository,
          viewer.id,
          firstUser.id,
          [protectedTodo.id],
          true,
        ),
        0,
      )
      assert.equal(
        await deleteBoardTodos(repository, secondUser.id, firstUser.id, [
          protectedTodo.id,
        ]),
        0,
      )
      assert.equal(
        (await prisma.todo.findUniqueOrThrow({ where: { id: protectedTodo.id } }))
          .done,
        false,
      )

      const revokedTodo = await createBoardTodo(
        repository,
        firstUser.id,
        firstUser.id,
        'Revoked collaborator task',
      )
      await prisma.boardShare.updateMany({
        where: {
          ownerId: firstUser.id,
          recipientId: editor.id,
          status: 'ACCEPTED',
        },
        data: { status: 'REVOKED' },
      })
      await assert.rejects(
        updateBoardTodo(repository, editor.id, firstUser.id, {
          id: revokedTodo.id,
          done: true,
        }),
        { message: 'Todo not found' },
      )

      const bulkTodo = await createBoardTodo(
        repository,
        firstUser.id,
        firstUser.id,
        'Bulk integration task',
      )
      const secondUserTodo = await createBoardTodo(
        repository,
        secondUser.id,
        secondUser.id,
        'Other user bulk task',
      )
      assert.equal(
        await repository.updateManyOnBoard({
          ids: [bulkTodo.id, secondUserTodo.id],
          actorId: firstUser.id,
          boardOwnerId: firstUser.id,
          done: true,
        }),
        1,
      )
      assert.equal(
        (await prisma.todo.findUniqueOrThrow({ where: { id: bulkTodo.id } })).done,
        true,
      )
      assert.equal(
        (await prisma.todo.findUniqueOrThrow({ where: { id: secondUserTodo.id } }))
          .done,
        false,
      )
      assert.equal(
        await repository.deleteManyFromBoard({
          ids: [bulkTodo.id, secondUserTodo.id],
          actorId: firstUser.id,
          boardOwnerId: firstUser.id,
        }),
        1,
      )
      assert.equal(await prisma.todo.count({ where: { id: bulkTodo.id } }), 0)
      assert.equal(await prisma.todo.count({ where: { id: secondUserTodo.id } }), 1)

      await deleteBoardTodo(repository, firstUser.id, firstUser.id, todo.id)
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
