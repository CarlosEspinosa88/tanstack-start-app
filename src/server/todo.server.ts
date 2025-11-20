import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { prisma } from './db'
import { getUserFromRequest, authMiddleware } from './auth'


// GET: lista TODOs del usuario autenticado
export const getTodos = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
  const { user } = context
  
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }
  
  const todos = await prisma.todo.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  })

  return Response.json(todos)
})


// POST: crea un TODO
const CreateTodoInput = z.object({ title: z.string().min(1).max(140) })


// export const createTodo = createServerFn({ method: 'POST' }).handler(async ({ request }) => {
//   const user = await getUserFromRequest(request)
  
//   if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })


//   const data = await request.json().catch(() => ({}))
//   const parsed = CreateTodoInput.safeParse(data)
  
//   if (!parsed.success) {
//   return new Response(JSON.stringify({ error: parsed.error.flatten() }), { status: 400 })
//   }

//   const todo = await prisma.todo.create({ data: { title: parsed.data.title, userId: user.id } })
  
//   return Response.json(todo)
// })