import { redirect } from '@tanstack/react-router'
import { z } from 'zod'
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
}).partial({
  page: true,
  status: true,
  search: true,
  period: true,
  board: true,
}).transform((search) => ({
  page: search.page ?? 1,
  status: search.status ?? 'all',
  search: search.search ?? '',
  period: search.period ?? '7d',
  board: search.board,
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
