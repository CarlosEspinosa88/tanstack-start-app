import { createServerFn } from '@tanstack/react-start'
import {
  createBoardTodo,
  deleteBoardTodos,
  deleteBoardTodo,
  getTodoDashboardData,
  updateBoardTodos,
  updateBoardTodo,
} from './todo-operations'
import { createTodoRepository } from './todo-prisma-repository'
import {
  CreateTodoInput,
  DeleteTodosInput,
  DeleteTodoInput,
  TodoListInput,
  UpdateTodosInput,
  UpdateTodoInput,
} from './todo.validation'
import {
  InviteToBoardInput,
  RespondToBoardInvitationInput,
  RevokeBoardShareInput,
} from './board-sharing.validation'
import {
  getBoardSharingData,
  ensureBoardViewAccess,
  inviteToBoard,
  respondToBoardInvitation,
  revokeBoardShare,
} from './board-sharing'
import { createBoardSharingRepository } from './board-sharing-prisma-repository'

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
    const boardOwnerId = data.boardOwnerId ?? user.id

    await ensureBoardViewAccess(
      createBoardSharingRepository(prisma),
      boardOwnerId,
      user.id,
    )

    const { boardOwnerId: _boardOwnerId, ...options } = data
    return getTodoDashboardData(
      createTodoRepository(prisma),
      boardOwnerId,
      options,
    )
  })

export const getBoardSharing = createServerFn({ method: 'GET' }).handler(
  async () => {
    const user = await requireRequestUser()
    const { prisma } = await import('./db')
    return getBoardSharingData(createBoardSharingRepository(prisma), user.id)
  },
)

export const inviteToBoardAction = createServerFn({ method: 'POST' })
  .inputValidator(InviteToBoardInput)
  .handler(async ({ data }) => {
    const user = await requireRequestUser()
    const { prisma } = await import('./db')
    return inviteToBoard(
      createBoardSharingRepository(prisma),
      user.id,
      data.email,
      data.role,
    )
  })

export const respondToBoardInvitationAction = createServerFn({
  method: 'POST',
})
  .inputValidator(RespondToBoardInvitationInput)
  .handler(async ({ data }) => {
    const user = await requireRequestUser()
    const { prisma } = await import('./db')
    return respondToBoardInvitation(
      createBoardSharingRepository(prisma),
      user.id,
      data.id,
      data.status,
    )
  })

export const revokeBoardShareAction = createServerFn({ method: 'POST' })
  .inputValidator(RevokeBoardShareInput)
  .handler(async ({ data }) => {
    const user = await requireRequestUser()
    const { prisma } = await import('./db')
    return revokeBoardShare(
      createBoardSharingRepository(prisma),
      user.id,
      data.id,
    )
  })

export const createTodo = createServerFn({ method: 'POST' })
  .inputValidator(CreateTodoInput)
  .handler(async ({ data }) => {
    const user = await requireRequestUser()
    const { prisma } = await import('./db')
    return createBoardTodo(
      createTodoRepository(prisma),
      user.id,
      data.boardOwnerId ?? user.id,
      data.title,
      data.dueDate ? new Date(`${data.dueDate}T00:00:00.000Z`) : undefined,
    )
  })

export const updateTodo = createServerFn({ method: 'POST' })
  .inputValidator(UpdateTodoInput)
  .handler(async ({ data }) => {
    const user = await requireRequestUser()
    const { prisma } = await import('./db')
    const { dueDate: dueDateInput, boardOwnerId, ...fields } = data
    const dueDate = typeof dueDateInput === 'string'
      ? new Date(`${dueDateInput}T00:00:00.000Z`)
      : dueDateInput
    return updateBoardTodo(
      createTodoRepository(prisma),
      user.id,
      boardOwnerId ?? user.id,
      { ...fields, dueDate },
    )
  })

export const deleteTodo = createServerFn({ method: 'POST' })
  .inputValidator(DeleteTodoInput)
  .handler(async ({ data }) => {
    const user = await requireRequestUser()
    const { prisma } = await import('./db')
    return deleteBoardTodo(
      createTodoRepository(prisma),
      user.id,
      data.boardOwnerId ?? user.id,
      data.id,
    )
  })

export const updateTodos = createServerFn({ method: 'POST' })
  .inputValidator(UpdateTodosInput)
  .handler(async ({ data }) => {
    const user = await requireRequestUser()
    const { prisma } = await import('./db')
    const { boardOwnerId, ...fields } = data
    return updateBoardTodos(
      createTodoRepository(prisma),
      user.id,
      boardOwnerId ?? user.id,
      fields.ids,
      fields.done,
    )
  })

export const deleteTodos = createServerFn({ method: 'POST' })
  .inputValidator(DeleteTodosInput)
  .handler(async ({ data }) => {
    const user = await requireRequestUser()
    const { prisma } = await import('./db')
    return deleteBoardTodos(
      createTodoRepository(prisma),
      user.id,
      data.boardOwnerId ?? user.id,
      data.ids,
    )
  })