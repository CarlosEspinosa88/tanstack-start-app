import { z } from 'zod'

export const CreateTodoInput = z.object({
  title: z.string().trim().min(1).max(140),
})

export const UpdateTodoInput = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1).max(140).optional(),
  done: z.boolean().optional(),
}).refine((data) => data.title !== undefined || data.done !== undefined, {
  message: 'At least one field must be updated',
})

export const DeleteTodoInput = z.object({
  id: z.string().min(1),
})

export const TodoListInput = z.object({
  page: z.number().int().min(1).default(1),
  status: z.enum(['all', 'open', 'completed']).default('all'),
  search: z.string().trim().max(140).default(''),
})
