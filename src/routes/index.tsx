import { createFileRoute } from '@tanstack/react-router'
import { useState, type CSSProperties } from 'react'
import mockData from '../data/mock-data.json'

type TodoFilter = 'all' | 'open' | 'completed'
type ProgressStyle = CSSProperties & { '--progress': string }

export const Route = createFileRoute('/')({
  component: Home,
  loader: () => mockData.todos,
})

function Home() {
  const todos = Route.useLoaderData()
  const [filter, setFilter] = useState<TodoFilter>('all')
  const [search, setSearch] = useState('')
  const completedCount = todos.filter((todo) => todo.done).length
  const openCount = todos.length - completedCount
  const completionRate = todos.length
    ? Math.round((completedCount / todos.length) * 100)
    : 0
  const normalizedSearch = search.trim().toLowerCase()
  const visibleTodos = todos.filter((todo) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'open' && !todo.done) ||
      (filter === 'completed' && todo.done)

    return matchesFilter && todo.title.toLowerCase().includes(normalizedSearch)
  })
  const latestTodoDate = todos.reduce(
    (latest, todo) =>
      todo.createdAt.slice(0, 10) > latest ? todo.createdAt.slice(0, 10) : latest,
    '',
  )
  const activityEndDate = latestTodoDate
    ? new Date(`${latestTodoDate}T00:00:00Z`)
    : new Date()
  const activity = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(activityEndDate)
    date.setUTCDate(date.getUTCDate() - (6 - index))
    const dateKey = date.toISOString().slice(0, 10)

    return {
      dateKey,
      label: date.toLocaleDateString(undefined, {
        weekday: 'short',
        timeZone: 'UTC',
      }),
      count: todos.filter((todo) => todo.createdAt.slice(0, 10) === dateKey)
        .length,
    }
  })
  const maxActivity = Math.max(1, ...activity.map((day) => day.count))

  return (
    <div className="app-shell">
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
        </nav>
        <div className="sidebar-bottom">
          <div className="avatar">D</div>
          <div>
            <strong>Demo User</strong>
            <span>Personal workspace</span>
          </div>
          <span className="more-icon" aria-hidden="true">···</span>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <p>Workspace <span>/</span> Overview</p>
          <div className="demo-indicator"><span /> Sample data</div>
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
            <div className="date-chip">
              <span className="calendar-icon" aria-hidden="true">▦</span>
              Last 7 days
            </div>
          </section>

          <section className="metrics-grid" aria-label="Task summary">
            <article className="metric-card">
              <div className="metric-heading">
                <span>Total tasks</span>
                <span className="metric-icon purple" aria-hidden="true">☷</span>
              </div>
              <strong className="metric-value">{todos.length}</strong>
              <span className="metric-caption">In your workspace</span>
            </article>
            <article className="metric-card">
              <div className="metric-heading">
                <span>In progress</span>
                <span className="metric-icon orange" aria-hidden="true">◷</span>
              </div>
              <strong className="metric-value">{openCount}</strong>
              <span className="metric-caption">Ready when you are</span>
            </article>
            <article className="metric-card">
              <div className="metric-heading">
                <span>Completed</span>
                <span className="metric-icon green" aria-hidden="true">✓</span>
              </div>
              <strong className="metric-value">{completedCount}</strong>
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
                  <p>Tasks created over the last 7 days</p>
                </div>
                <span className="panel-period">7 days</span>
              </div>
              <div className="chart" role="img" aria-label="Daily tasks created over the last seven days">
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
                  <strong>{completedCount} of {todos.length}</strong>
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
              <label className="search-box">
                <span aria-hidden="true">⌕</span>
                <input
                  type="search"
                  placeholder="Search tasks"
                  value={search}
                  onChange={(event) => setSearch(event.currentTarget.value)}
                  aria-label="Search tasks"
                />
              </label>
            </div>
            <div className="task-tabs" role="group" aria-label="Filter tasks">
              {([
                ['all', 'All tasks'],
                ['open', 'In progress'],
                ['completed', 'Completed'],
              ] as const).map(([value, label]) => (
                <button
                  className={filter === value ? 'task-tab selected' : 'task-tab'}
                  key={value}
                  onClick={() => setFilter(value)}
                  type="button"
                  aria-pressed={filter === value}
                >
                  {label}
                  {value === 'all' && <span>{todos.length}</span>}
                </button>
              ))}
            </div>
            <ul className="task-list">
              {visibleTodos.map((todo) => (
                <li className="task-row" key={todo.id}>
                  <span className={todo.done ? 'task-check checked' : 'task-check'}>
                    {todo.done ? '✓' : ''}
                  </span>
                  <span className={todo.done ? 'task-title completed-title' : 'task-title'}>
                    {todo.title}
                  </span>
                  <span className={todo.done ? 'status-pill completed-status' : 'status-pill open-status'}>
                    <i />
                    {todo.done ? 'Completed' : 'In progress'}
                  </span>
                  <time className="task-date" dateTime={todo.createdAt}>
                    {new Date(todo.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </time>
                </li>
              ))}
              {visibleTodos.length === 0 && (
                <li className="empty-state">No tasks match this view.</li>
              )}
            </ul>
            <div className="tasks-footer">
              Showing {visibleTodos.length} of {todos.length} tasks
            </div>
          </section>
          <footer className="dashboard-footer">
            Demo data generated with DuckDB. Regenerate with <code>npm run mock:generate</code>.
          </footer>
        </div>
      </main>
    </div>
  )
}
