import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { prisma } from './db'
import { authMiddleware } from './auth'

const CreateTodoInput = z.object({ title: z.string().min(1).max(140) })

export const getTodos = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const user = context.user

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const todos = await prisma.todo.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    return Response.json(todos)
  })

export const createTodo = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .handler(async ({ data, context }) => {
    const user = context.user

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const parsed = CreateTodoInput.safeParse(data)

    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const todo = await prisma.todo.create({
      data: {
        title: parsed.data.title,
        userId: user.id,
      },
    })

    return Response.json(todo)
  })