import { redirect } from '@tanstack/react-router'
import { z } from 'zod'
import { calendarDateSchema, calendarMonthSchema } from './calendar'
import {
  getBoardSharing,
  getCurrentUser,
  getTodoDashboard,
} from '../server/todo.server'

export const dashboardSearchSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  status: z.enum(['all', 'open', 'completed']).catch('all'),
  search: z.string().catch(''),
  period: z.enum(['7d', '30d']).catch('7d'),
  board: z.string().min(1).optional(),
  dueDate: calendarDateSchema.optional().catch(undefined),
  month: calendarMonthSchema.optional().catch(undefined),
}).partial({
  page: true,
  status: true,
  search: true,
  period: true,
  board: true,
  dueDate: true,
  month: true,
}).transform((search) => ({
  page: search.page ?? 1,
  status: search.status ?? 'all',
  search: search.search ?? '',
  period: search.period ?? '7d',
  board: search.board,
  dueDate: search.dueDate,
  month: search.month,
}))

export type DashboardSearch = z.infer<typeof dashboardSearchSchema>

export async function loadDashboard(
  deps: DashboardSearch,
  route: '/' | '/tasks',
) {
  const user = await getCurrentUser()

  if (!user) {
    throw redirect({ to: '/login', search: { error: undefined } })
  }

  const [dashboard, sharing] = await Promise.all([
    getTodoDashboard({
      data: {
        page: deps.page,
        status: deps.status,
        search: deps.search,
        period: deps.period,
        boardOwnerId: deps.board,
        dueDate: deps.dueDate,
        month: deps.month ?? deps.dueDate?.slice(0, 7),
      },
    }),
    getBoardSharing(),
  ])

  if (dashboard.pagination.page !== deps.page) {
    throw redirect({
      to: route,
      search: { ...deps, page: dashboard.pagination.page },
    })
  }

  return { user, dashboard, sharing }
}
