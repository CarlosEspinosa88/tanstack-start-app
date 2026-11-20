import { createFileRoute, redirect, useNavigate, useRouter } from '@tanstack/react-router'
import {
  useEffect,
  useState,
  type CSSProperties,
  type FormEvent,
} from 'react'
import { z } from 'zod'
import { TaskRow } from '../components/TaskRow'
import {
  createTodo,
  deleteTodo,
  deleteTodos,
  getCurrentUser,
  getTodoDashboard,
  updateTodos,
  updateTodo,
} from '../server/todo.server'

type TodoFilter = 'all' | 'open' | 'completed'
type ActivityPeriod = '7d' | '30d'
type ProgressStyle = CSSProperties & { '--progress': string }

export const Route = createFileRoute('/')({
  validateSearch: z.object({
    page: z.coerce.number().int().min(1).catch(1),
    status: z.enum(['all', 'open', 'completed']).catch('all'),
    search: z.string().catch(''),
    period: z.enum(['7d', '30d']).catch('7d'),
  }).partial({
    page: true,
    status: true,
    search: true,
    period: true,
  }).transform((search) => ({
    page: search.page ?? 1,
    status: search.status ?? 'all',
    search: search.search ?? '',
    period: search.period ?? '7d',
  })),
  loaderDeps: ({ search }) => search,
  component: Home,
  loader: async ({ deps }) => {
    const user = await getCurrentUser()

    if (!user) {
      throw redirect({ to: '/login', search: { error: undefined } })
    }

    const dashboard = await getTodoDashboard({
      data: {
        page: deps.page,
        status: deps.status,
        search: deps.search,
        period: deps.period,
      },
    })

    if (dashboard.pagination.page !== deps.page) {
      throw redirect({
        to: '/',
        search: { ...deps, page: dashboard.pagination.page },
      })
    }

    return { user, dashboard }
  },
})

function Home() {
  const router = useRouter()
  const navigate = useNavigate({ from: '/' })
  const { user, dashboard } = Route.useLoaderData()
  const query = Route.useSearch()
  const { todos, summary, activity, pagination } = dashboard
  const filter = query.status as TodoFilter
  const [search, setSearch] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [mutationError, setMutationError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [pendingTodoIds, setPendingTodoIds] = useState<Set<string>>(new Set())
  const [selectedTodoIds, setSelectedTodoIds] = useState<Set<string>>(new Set())
  const [isBulkSaving, setIsBulkSaving] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const completionRate = summary.allCount
    ? Math.round((summary.completedCount / summary.allCount) * 100)
    : 0
  const maxActivity = Math.max(1, ...activity.map((day) => day.count))

  useEffect(() => {
    setSearch(query.search)
  }, [query.search])

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  function navigateToTasks(next: Partial<typeof query>) {
    setSelectedTodoIds(new Set())
    return navigate({
      search: (previous) => ({
        ...previous,
        ...next,
        page: next.page ?? 1,
      }),
    })
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const searchValue = formData.get('search')
    const submittedSearch =
      typeof searchValue === 'string' ? searchValue.trim() : search.trim()
    setSearch(submittedSearch)
    void navigateToTasks({ search: submittedSearch })
  }

  async function handleCreateTodo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const title = newTitle.trim()

    if (!title || isSaving) {
      return
    }

    setIsSaving(true)
    setMutationError('')

    try {
      await createTodo({ data: { title } })
      setNewTitle('')
      await router.invalidate()
    } catch {
      setMutationError('Could not save your task. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleToggleTodo(id: string, done: boolean) {
    if (pendingTodoIds.has(id)) {
      return
    }

    setPendingTodoIds((current) => new Set(current).add(id))
    setMutationError('')

    try {
      await updateTodo({ data: { id, done: !done } })
      await router.invalidate()
    } catch {
      setMutationError('Could not update your task. Please try again.')
    } finally {
      setPendingTodoIds((current) => {
        const next = new Set(current)
        next.delete(id)
        return next
      })
    }
  }

  async function handleSaveEdit(id: string) {
    const title = editingTitle.trim()

    if (!title || pendingTodoIds.has(id)) {
      return
    }

    setPendingTodoIds((current) => new Set(current).add(id))
    setMutationError('')

    try {
      await updateTodo({ data: { id, title } })
      setEditingId(null)
      await router.invalidate()
    } catch {
      setMutationError('Could not update your task. Please try again.')
    } finally {
      setPendingTodoIds((current) => {
        const next = new Set(current)
        next.delete(id)
        return next
      })
    }
  }

  async function handleDeleteTodo(id: string, title: string) {
    if (pendingTodoIds.has(id) || !window.confirm(`Delete "${title}"? This cannot be undone.`)) {
      return
    }

    setPendingTodoIds((current) => new Set(current).add(id))
    setMutationError('')

    try {
      await deleteTodo({ data: { id } })
      await router.invalidate()
    } catch {
      setMutationError('Could not delete your task. Please try again.')
    } finally {
      setPendingTodoIds((current) => {
        const next = new Set(current)
        next.delete(id)
        return next
      })
    }
  }

  async function handleCompleteSelected() {
    const ids = [...selectedTodoIds]

    if (!ids.length || isBulkSaving) {
      return
    }

    setIsBulkSaving(true)
    setMutationError('')

    try {
      await updateTodos({ data: { ids, done: true } })
      setSelectedTodoIds(new Set())
      await router.invalidate()
    } catch {
      setMutationError('Could not complete the selected tasks. Please try again.')
    } finally {
      setIsBulkSaving(false)
    }
  }

  async function handleDeleteSelected() {
    const ids = [...selectedTodoIds]

    if (
      !ids.length ||
      isBulkSaving ||
      !window.confirm(`Delete ${ids.length} selected task${ids.length === 1 ? '' : 's'}? This cannot be undone.`)
    ) {
      return
    }

    setIsBulkSaving(true)
    setMutationError('')

    try {
      await deleteTodos({ data: { ids } })
      setSelectedTodoIds(new Set())
      await router.invalidate()
    } catch {
      setMutationError('Could not delete the selected tasks. Please try again.')
    } finally {
      setIsBulkSaving(false)
    }
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#tasks">Skip to tasks</a>
      <aside className="sidebar">
        <a className="brand" href="#overview" aria-label="Daymark home">
          <span className="brand-mark">d</span>
          <span>daymark</span>
        </a>
        <p className="sidebar-label">WORKSPACE</p>
        <nav className="sidebar-nav" aria-label="Workspace">
          <a className="nav-link active" href="#overview">
            <span className="nav-icon" aria-hidden="true">◫</span>
            Overview
          </a>
          <a className="nav-link" href="#tasks">
            <span className="nav-icon" aria-hidden="true">☷</span>
            My tasks
          </a>
          <form className="mobile-sign-out" action="/auth/logout" method="post">
            <button type="submit">Sign out</button>
          </form>
        </nav>
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
          <p>Workspace <span>/</span> Overview</p>
          <div className="demo-indicator"><span /> Your workspace</div>
        </header>

        <div className="dashboard-content">
          <section className="welcome-row" id="overview">
            <div>
              <p className="eyebrow">PERSONAL WORKSPACE</p>
              <h1>Good work starts here.</h1>
              <p className="welcome-copy">
                A clear view of your tasks and the progress you have made.
              </p>
            </div>
            <label className="date-chip">
              <span className="calendar-icon" aria-hidden="true">▦</span>
              <span className="visually-hidden">Activity period</span>
              <select
                aria-label="Activity period"
                value={query.period}
                onChange={(event) => {
                  const period: ActivityPeriod = event.currentTarget.value === '30d' ? '30d' : '7d'
                  void navigateToTasks({ period })
                }}
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
              </select>
            </label>
          </section>

          <section className="metrics-grid" aria-label="Task summary">
            <article className="metric-card">
              <div className="metric-heading">
                <span>Total tasks</span>
                <span className="metric-icon purple" aria-hidden="true">☷</span>
              </div>
              <strong className="metric-value">{summary.allCount}</strong>
              <span className="metric-caption">In your workspace</span>
            </article>
            <article className="metric-card">
              <div className="metric-heading">
                <span>In progress</span>
                <span className="metric-icon orange" aria-hidden="true">◷</span>
              </div>
              <strong className="metric-value">{summary.openCount}</strong>
              <span className="metric-caption">Ready when you are</span>
            </article>
            <article className="metric-card">
              <div className="metric-heading">
                <span>Completed</span>
                <span className="metric-icon green" aria-hidden="true">✓</span>
              </div>
              <strong className="metric-value">{summary.completedCount}</strong>
              <span className="metric-caption">Tasks checked off</span>
            </article>
            <article className="metric-card progress-card">
              <div className="metric-heading">
                <span>Completion rate</span>
                <span className="metric-icon blue" aria-hidden="true">↗</span>
              </div>
              <strong className="metric-value">{completionRate}%</strong>
              <div
                className="progress-track"
                role="progressbar"
                aria-label="Completion rate"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={completionRate}
              >
                <span style={{ width: `${completionRate}%` }} />
              </div>
            </article>
          </section>

          <section className="insights-grid" aria-label="Task insights">
            <article className="panel activity-panel">
              <div className="panel-heading">
                <div>
                  <h2>Task activity</h2>
                  <p>Tasks created over the last {query.period === '30d' ? 30 : 7} days</p>
                </div>
                <span className="panel-period">{query.period === '30d' ? 30 : 7} days</span>
              </div>
              <div
                className="chart"
                data-period={query.period}
                role="img"
                aria-label={`Daily tasks created over the last ${query.period === '30d' ? 30 : 7} days`}
              >
                {activity.map((day) => (
                  <div className="chart-column" key={day.dateKey}>
                    <span className="chart-count">{day.count || ''}</span>
                    <div className="chart-bar-track">
                      <span
                        className={day.count ? 'chart-bar filled' : 'chart-bar'}
                        style={{ height: `${Math.max(8, (day.count / maxActivity) * 100)}%` }}
                      />
                    </div>
                    <span className="chart-label">{day.label}</span>
                  </div>
                ))}
              </div>
            </article>
            <article className="panel progress-panel">
              <div className="panel-heading">
                <div>
                  <h2>Overall progress</h2>
                  <p>Your completed tasks</p>
                </div>
              </div>
              <div className="progress-summary">
                <div
                  className="progress-ring"
                  style={{ '--progress': `${completionRate}%` } as ProgressStyle}
                  role="img"
                  aria-label={`${completionRate}% of tasks completed`}
                >
                  <div>
                    <strong>{completionRate}%</strong>
                    <span>complete</span>
                  </div>
                </div>
                <p>
                  <strong>{summary.completedCount} of {summary.allCount}</strong>
                  <span>tasks completed</span>
                </p>
              </div>
              <div className="progress-legend">
                <span><i className="legend-dot done" />Completed</span>
                <span><i className="legend-dot open" />In progress</span>
              </div>
            </article>
          </section>

          <section className="panel tasks-panel" id="tasks">
            <div className="tasks-heading">
              <div>
                <h2>Your tasks</h2>
                <p>Stay focused on what matters next.</p>
              </div>
              <form className="search-box" onSubmit={handleSearch}>
                <span aria-hidden="true">⌕</span>
                <input
                  type="search"
                  name="search"
                  maxLength={140}
                  placeholder="Search tasks"
                  value={search}
                  onChange={(event) => setSearch(event.currentTarget.value)}
                  aria-label="Search tasks"
                />
                {search && (
                  <button
                    aria-label="Clear task search"
                    className="search-clear"
                    onClick={() => {
                      setSearch('')
                      void navigateToTasks({ search: '' })
                    }}
                    type="button"
                  >
                    Clear
                  </button>
                )}
                <button type="submit" className="search-submit">Search</button>
              </form>
            </div>
            <form className="todo-form" onSubmit={handleCreateTodo}>
              <label className="visually-hidden" htmlFor="new-todo-title">
                New task
              </label>
              <input
                id="new-todo-title"
                maxLength={140}
                onChange={(event) => setNewTitle(event.currentTarget.value)}
                placeholder="Add a task"
                value={newTitle}
              />
              <button disabled={!newTitle.trim() || isSaving} type="submit">
                {isSaving ? 'Saving…' : 'Add task'}
              </button>
            </form>
            {mutationError && <p className="todo-error" role="alert">{mutationError}</p>}
            <div className="task-tabs" role="group" aria-label="Filter tasks">
              {([
                  ['all', `All tasks (${summary.allCount})`],
                  ['open', `In progress (${summary.openCount})`],
                  ['completed', `Completed (${summary.completedCount})`],
              ] as const).map(([value, label]) => (
                <button
                  className={filter === value ? 'task-tab selected' : 'task-tab'}
                  key={value}
                  onClick={() => void navigateToTasks({ status: value })}
                  type="button"
                  aria-pressed={filter === value}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="bulk-actions">
              <label>
                <input
                  aria-label="Select all tasks on this page"
                  checked={todos.length > 0 && todos.every((todo) => selectedTodoIds.has(todo.id))}
                  disabled={!isHydrated || !todos.length || isBulkSaving}
                  onChange={(event) => {
                    const checked = event.currentTarget.checked
                    setSelectedTodoIds((current) => {
                      const next = new Set(current)
                      for (const todo of todos) {
                        if (checked) {
                          next.add(todo.id)
                        } else {
                          next.delete(todo.id)
                        }
                      }
                      return next
                    })
                  }}
                  type="checkbox"
                />
                Select page
              </label>
              {selectedTodoIds.size > 0 && (
                <div className="bulk-buttons">
                  <span>{selectedTodoIds.size} selected</span>
                  <button
                    disabled={isBulkSaving}
                    onClick={() => void handleCompleteSelected()}
                    type="button"
                  >
                    {isBulkSaving ? 'Saving…' : 'Mark complete'}
                  </button>
                  <button
                    disabled={isBulkSaving}
                    onClick={() => void handleDeleteSelected()}
                    type="button"
                  >
                    Delete selected
                  </button>
                </div>
              )}
            </div>
            <ul className="task-list">
              {todos.map((todo) => (
                <TaskRow
                  key={todo.id}
                  todo={todo}
                  isSelected={selectedTodoIds.has(todo.id)}
                  isSelectionDisabled={!isHydrated}
                  isEditing={editingId === todo.id}
                  isPending={pendingTodoIds.has(todo.id) || isBulkSaving}
                  editTitle={editingTitle}
                  onEditTitleChange={setEditingTitle}
                  onStartEdit={() => {
                    setEditingId(todo.id)
                    setEditingTitle(todo.title)
                  }}
                  onCancelEdit={() => setEditingId(null)}
                  onSaveEdit={() => void handleSaveEdit(todo.id)}
                  onToggle={() => void handleToggleTodo(todo.id, todo.done)}
                  onSelect={() => setSelectedTodoIds((current) => {
                    const next = new Set(current)
                    if (next.has(todo.id)) {
                      next.delete(todo.id)
                    } else {
                      next.add(todo.id)
                    }
                    return next
                  })}
                  onDelete={() => void handleDeleteTodo(todo.id, todo.title)}
                />
              ))}
              {todos.length === 0 && (
                <li className="empty-state">No tasks match this view.</li>
              )}
            </ul>
            <div className="tasks-footer">
              <span>
                Showing {todos.length ? (pagination.page - 1) * pagination.pageSize + 1 : 0}
                –{Math.min(pagination.page * pagination.pageSize, pagination.total)}
                {' '}of {pagination.total} tasks
              </span>
              <span className="pagination-controls">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => void navigateToTasks({ page: pagination.page - 1 })}
                  type="button"
                >Previous</button>
                <span>Page {pagination.page} of {pagination.pageCount}</span>
                <button
                  disabled={pagination.page >= pagination.pageCount}
                  onClick={() => void navigateToTasks({ page: pagination.page + 1 })}
                  type="button"
                >Next</button>
              </span>
            </div>
          </section>
          <footer className="dashboard-footer">
            Your tasks are saved to your account.
          </footer>
        </div>
      </main>
    </div>
  )
}
