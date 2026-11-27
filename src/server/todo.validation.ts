import { z } from 'zod'
import { calendarDateSchema, calendarMonthSchema } from '../lib/calendar'

export const CreateTodoInput = z.object({
  title: z.string().trim().min(1).max(140),
  dueDate: z.iso.date().optional(),
  boardOwnerId: z.string().min(1).optional(),
})

export const UpdateTodoInput = z.object({
  id: z.string().min(1),
  boardOwnerId: z.string().min(1).optional(),
  title: z.string().trim().min(1).max(140).optional(),
  done: z.boolean().optional(),
  dueDate: z.iso.date().nullable().optional(),
}).refine((data) => (
  data.title !== undefined ||
  data.done !== undefined ||
  data.dueDate !== undefined
), {
  message: 'At least one field must be updated',
})

export const DeleteTodoInput = z.object({
  id: z.string().min(1),
  boardOwnerId: z.string().min(1).optional(),
})

export const TodoListInput = z.object({
  page: z.number().int().min(1).default(1),
  status: z.enum(['all', 'open', 'completed']).default('all'),
  search: z.string().trim().max(140).default(''),
  period: z.enum(['7d', '30d']).default('7d'),
  boardOwnerId: z.string().min(1).optional(),
  dueDate: calendarDateSchema.optional(),
  month: calendarMonthSchema.optional(),
})

const TodoIds = z.array(z.string().min(1)).min(1).max(20).refine(
  (ids) => new Set(ids).size === ids.length,
  { message: 'Todo ids must be unique' },
)

export const UpdateTodosInput = z.object({
  ids: TodoIds,
  done: z.boolean(),
  boardOwnerId: z.string().min(1).optional(),
})

export const DeleteTodosInput = z.object({
  ids: TodoIds,
  boardOwnerId: z.string().min(1).optional(),
})
