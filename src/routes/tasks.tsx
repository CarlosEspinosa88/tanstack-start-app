import {
  createFileRoute,
  Link,
  useNavigate,
  useRouter,
} from '@tanstack/react-router'
import { TaskManager } from '../components/TaskManager'
import { SidebarCalendar } from '../components/SidebarCalendar'
import {
  dashboardSearchSchema,
  loadDashboard,
} from '../lib/dashboard-data'

export const Route = createFileRoute('/tasks')({
  validateSearch: dashboardSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => loadDashboard(deps, '/tasks'),
  pendingComponent: TasksPending,
  errorComponent: TasksError,
  component: TasksRoute,
})

function TasksRoute() {
  const navigate = useNavigate({ from: '/tasks' })
  const { user, dashboard, sharing } = Route.useLoaderData()
  const query = Route.useSearch()
  const isSharedBoard = Boolean(query.board)
  const selectedBoardShare = isSharedBoard
    ? sharing.sharedBoards.find((share) => share.user.id === query.board)
    : undefined
  const canEditBoard = !isSharedBoard || selectedBoardShare?.role === 'EDITOR'

  return (
    <div className="app-shell">
      <a className="skip-link" href="#tasks">Skip to tasks</a>
      <aside className="sidebar">
        <Link className="brand" to="/" search={query} aria-label="Daymark home">
          <span className="brand-mark">d</span>
          <span>daymark</span>
        </Link>
        <p className="sidebar-label">WORKSPACE</p>
        <nav className="sidebar-nav" aria-label="Workspace">
          <Link className="nav-link" to="/" search={query}>
            <span className="nav-icon" aria-hidden="true">◫</span>
            Overview
          </Link>
          <Link className="nav-link active" to="/tasks" search={query}>
            <span className="nav-icon" aria-hidden="true">☷</span>
            My tasks
          </Link>
          <form className="mobile-sign-out" action="/auth/logout" method="post">
            <button type="submit">Sign out</button>
          </form>
        </nav>
        <SidebarCalendar
          {...dashboard.calendar}
          selectedDate={query.dueDate}
          onMonthChange={(month) => void navigate({ search: { ...query, month } })}
          onSelectDate={(dueDate) => void navigate({
            search: { ...query, month: dashboard.calendar.month, dueDate, page: 1 },
          })}
        />
        <div className="sidebar-bottom">
          {user.picture ? (
            <img className="avatar" src={user.picture} alt="" />
          ) : (
            <div className="avatar" aria-hidden="true">
              {(user.name ?? user.email).slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <strong>{user.name ?? user.email}</strong>
            <span>Personal workspace</span>
          </div>
          <form action="/auth/logout" method="post">
            <button className="sign-out-button" type="submit">Sign out</button>
          </form>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <p>Workspace <span>/</span> My tasks</p>
          <label className="board-switcher">
            <span className="visually-hidden">Choose a board</span>
            <select
              aria-label="Choose a board"
              style={{ width: 'min(240px, 42vw)' }}
              onChange={(event) => {
                const board = event.currentTarget.value || undefined
                void navigate({
                  search: {
                    ...query,
                    board,
                    page: 1,
                  },
                })
              }}
              value={query.board ?? ''}
            >
              <option value="">My board</option>
              {sharing.sharedBoards.map((share) => (
                <option key={share.id} value={share.user.id}>
                  {share.user.name ?? share.user.email}'s board
                </option>
              ))}
            </select>
          </label>
        </header>

        <div className="dashboard-content tasks-route-content">
          <section className="welcome-row">
            <div>
              <p className="eyebrow">{isSharedBoard ? 'SHARED WORKSPACE' : 'PERSONAL WORKSPACE'}</p>
              <h1>{isSharedBoard ? 'Shared board tasks' : 'Your task manager'}</h1>
              <p className="welcome-copy">
                {isSharedBoard
                  ? canEditBoard
                    ? 'Manage tasks shared with you.'
                    : 'Review tasks shared with you.'
                  : 'Keep every task organized in one focused view.'}
              </p>
            </div>
            <Link className="secondary-link" to="/" search={query}>
              View overview
            </Link>
          </section>
          <TaskManager
            canEditBoard={canEditBoard}
            dashboard={dashboard}
            query={query}
          />
          <footer className="dashboard-footer">
            {isSharedBoard
              ? canEditBoard
                ? 'Changes are saved to the shared board.'
                : 'You have read-only access to this shared board.'
              : 'Your tasks are saved to your account.'}
          </footer>
        </div>
      </main>
    </div>
  )
}

function TasksPending() {
  return (
    <main className="route-state" aria-busy="true">
      <p>Loading your tasks…</p>
    </main>
  )
}

function TasksError({ reset }: { reset: () => void }) {
  const router = useRouter()

  async function handleRetry() {
    await router.invalidate()
    reset()
  }

  return (
    <main className="route-state">
      <h1>Tasks are unavailable</h1>
      <p>We could not load this task view. Please try again.</p>
      <button onClick={() => void handleRetry()} type="button">Retry</button>
    </main>
  )
}
