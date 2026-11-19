import { createServerFn } from '@tanstack/react-start'
import {
  createOwnedTodo,
  deleteOwnedTodo,
  getTodoDashboardData,
  updateOwnedTodo,
} from './todo-operations'
import { createTodoRepository } from './todo-prisma-repository'
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
    return getTodoDashboardData(createTodoRepository(prisma), user.id, data)
  })

export const createTodo = createServerFn({ method: 'POST' })
  .inputValidator(CreateTodoInput)
  .handler(async ({ data }) => {
    const user = await requireRequestUser()
    const { prisma } = await import('./db')
    return createOwnedTodo(createTodoRepository(prisma), user.id, data.title)
  })

export const updateTodo = createServerFn({ method: 'POST' })
  .inputValidator(UpdateTodoInput)
  .handler(async ({ data }) => {
    const user = await requireRequestUser()
    const { prisma } = await import('./db')
    return updateOwnedTodo(createTodoRepository(prisma), user.id, data)
  })

export const deleteTodo = createServerFn({ method: 'POST' })
  .inputValidator(DeleteTodoInput)
  .handler(async ({ data }) => {
    const user = await requireRequestUser()
    const { prisma } = await import('./db')
    return deleteOwnedTodo(createTodoRepository(prisma), user.id, data.id)
  })