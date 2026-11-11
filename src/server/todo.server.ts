import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

const CreateTodoInput = z.object({ title: z.string().trim().min(1).max(140) })
const UpdateTodoInput = z.object({
  id: z.string().min(1),
  done: z.boolean(),
})

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

export const getTodos = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await requireRequestUser()
  const { prisma } = await import('./db')

  return prisma.todo.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  })
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
      where: { id: data.id, userId: user.id },
      data: { done: data.done },
    })

    if (result.count === 0) {
      throw new Error('Todo not found')
    }

    return prisma.todo.findFirstOrThrow({
      where: { id: data.id, userId: user.id },
    })
  })