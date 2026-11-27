import { createFileRoute, useNavigate, useRouter, Link } from '@tanstack/react-router'
import {
  useState,
  type CSSProperties,
  type FormEvent,
} from 'react'
import { TaskManager } from '../components/TaskManager'
import { SidebarCalendar } from '../components/SidebarCalendar'
import {
  inviteToBoardAction,
  respondToBoardInvitationAction,
  revokeBoardShareAction,
} from '../server/todo.server'
import {
  dashboardSearchSchema,
  loadDashboard,
} from '../lib/dashboard-data'

type ActivityPeriod = '7d' | '30d'
type ProgressStyle = CSSProperties & { '--progress': string }

export const Route = createFileRoute('/')({
  validateSearch: dashboardSearchSchema,
  loaderDeps: ({ search }) => search,
  component: Home,
  loader: async ({ deps }) => loadDashboard(deps, '/'),
})

function Home() {
  const router = useRouter()
  const navigate = useNavigate({ from: '/' })
  const { user, dashboard, sharing } = Route.useLoaderData()
  const query = Route.useSearch()
  const { summary, activity } = dashboard
  const isSharedBoard = Boolean(query.board)
  const selectedBoardShare = isSharedBoard
    ? sharing.sharedBoards.find((share) => share.user.id === query.board)
    : undefined
  const selectedBoard = selectedBoardShare?.user
  const canEditBoard = !isSharedBoard || selectedBoardShare?.role === 'EDITOR'
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'VIEWER' | 'EDITOR'>('EDITOR')
  const [sharingError, setSharingError] = useState('')
  const [sharingMessage, setSharingMessage] = useState('')
  const [sharingBusy, setSharingBusy] = useState(false)
  const completionRate = summary.allCount
    ? Math.round((summary.completedCount / summary.allCount) * 100)
    : 0
  const maxActivity = Math.max(1, ...activity.map((day) => day.count))

  async function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!inviteEmail.trim() || sharingBusy) {
      return
    }

    setSharingBusy(true)
    setSharingError('')
    setSharingMessage('')

    try {
      await inviteToBoardAction({
        data: { email: inviteEmail.trim(), role: inviteRole },
      })
      setInviteEmail('')
      setSharingMessage('Invitation sent.')
      await router.invalidate()
    } catch (error) {
      setSharingError(
        error instanceof Error ? error.message : 'Could not send the invitation.',
      )
    } finally {
      setSharingBusy(false)
    }
  }

  async function handleInvitationResponse(id: string, status: 'ACCEPTED' | 'DECLINED') {
    setSharingBusy(true)
    setSharingError('')
    setSharingMessage('')

    try {
      await respondToBoardInvitationAction({ data: { id, status } })
      setSharingMessage(status === 'ACCEPTED' ? 'Board access accepted.' : 'Invitation declined.')
      await router.invalidate()
    } catch {
      setSharingError('Could not update the invitation. Please try again.')
    } finally {
      setSharingBusy(false)
    }
  }

  async function handleRevokeShare(id: string) {
    setSharingBusy(true)
    setSharingError('')
    setSharingMessage('')

    try {
      await revokeBoardShareAction({ data: { id } })
      setSharingMessage('Board access removed.')
      await router.invalidate()
    } catch {
      setSharingError('Could not remove board access. Please try again.')
    } finally {
      setSharingBusy(false)
    }
  }

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
          <a className="nav-link active" href="#overview">
            <span className="nav-icon" aria-hidden="true">◫</span>
            Overview
          </a>
          <Link className="nav-link" to="/tasks" search={query}>
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
          onMonthChange={(month) => void navigate({ search: (previous) => ({ ...previous, month }) })}
          onSelectDate={(dueDate) => void navigate({
            to: '/tasks',
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
          <p>Workspace <span>/</span> Overview</p>
          <label className="board-switcher">
            <span className="visually-hidden">Choose a board</span>
            <select
              aria-label="Choose a board"
              style={{ width: 'min(240px, 42vw)' }}
              onChange={(event) => {
                const board = event.currentTarget.value || undefined
                void navigate({
                  search: (previous) => ({
                    ...previous,
                    board,
                    page: 1,
                  }),
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

        <div className="dashboard-content">
          <section className="welcome-row" id="overview">
            <div>
              <p className="eyebrow">{isSharedBoard ? 'SHARED WORKSPACE' : 'PERSONAL WORKSPACE'}</p>
              <h1>{isSharedBoard ? `${selectedBoard?.name ?? selectedBoard?.email ?? 'Shared'}'s board` : 'Good work starts here.'}</h1>
              <p className="welcome-copy">
                {isSharedBoard
                  ? 'You have read-only access to this board.'
                  : 'A clear view of your tasks and the progress you have made.'}
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
                  void navigate({
                    search: (previous) => ({
                      ...previous,
                      period,
                      page: 1,
                    }),
                  })
                }}
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
              </select>
            </label>
          </section>

          <section className="panel sharing-panel" aria-label="Board sharing">
            <div className="panel-heading">
              <div>
                <h2>{isSharedBoard ? 'Shared board' : 'Share your board'}</h2>
                <p>
                  {isSharedBoard
                    ? `Shared by ${selectedBoard?.name ?? selectedBoard?.email ?? 'another user'} · ${canEditBoard ? 'can edit tasks' : 'read-only access'}`
                    : 'Invite another user to view or edit your tasks.'}
                </p>
              </div>
            </div>
            {!isSharedBoard && (
              <>
                <form className="sharing-form" onSubmit={handleInvite}>
                  <label className="visually-hidden" htmlFor="share-email">
                    Invite by email
                  </label>
                  <input
                    autoComplete="email"
                    id="share-email"
                    maxLength={254}
                    onChange={(event) => setInviteEmail(event.currentTarget.value)}
                    placeholder="Email address"
                    type="email"
                    value={inviteEmail}
                  />
                  <label className="visually-hidden" htmlFor="share-role">
                    Permission for invited user
                  </label>
                  <select
                    id="share-role"
                    onChange={(event) =>
                      setInviteRole(event.currentTarget.value as 'VIEWER' | 'EDITOR')
                    }
                    value={inviteRole}
                  >
                    <option value="EDITOR">Can edit tasks</option>
                    <option value="VIEWER">View only</option>
                  </select>
                  <button disabled={!inviteEmail.trim() || sharingBusy} type="submit">
                    {sharingBusy ? 'Sending…' : 'Send invitation'}
                  </button>
                </form>
                {sharingError && <p className="sharing-error" role="alert">{sharingError}</p>}
                {sharingMessage && <p className="sharing-message" role="status">{sharingMessage}</p>}
                {sharing.sentInvitations.length > 0 && (
                  <div className="sharing-list">
                    <h3>People with access or invited</h3>
                    {sharing.sentInvitations.map((share) => (
                      <div className="sharing-item" key={share.id}>
                        <span>{share.user.name ?? share.user.email}</span>
                        <span className={`share-status ${share.status.toLowerCase()}`}>
                          {share.status.toLowerCase()}
                        </span>
                        <span className="share-status">
                          {share.role === 'EDITOR' ? 'can edit' : 'view only'}
                        </span>
                        {share.status === 'ACCEPTED' && (
                          <button
                            disabled={sharingBusy}
                            onClick={() => void handleRevokeShare(share.id)}
                            type="button"
                          >
                            Remove access
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            {sharing.receivedInvitations.length > 0 && (
              <div className="sharing-list">
                <h3>Board invitations</h3>
                {sharing.receivedInvitations.map((share) => (
                  <div className="sharing-item" key={share.id}>
                    <span>
                      {share.user.name ?? share.user.email} invited you to{' '}
                      {share.role === 'EDITOR' ? 'edit' : 'view'} their board
                    </span>
                    <span className="sharing-item-actions">
                      <button
                        disabled={sharingBusy}
                        onClick={() => void handleInvitationResponse(share.id, 'ACCEPTED')}
                        type="button"
                      >
                        Accept
                      </button>
                      <button
                        disabled={sharingBusy}
                        onClick={() => void handleInvitationResponse(share.id, 'DECLINED')}
                        type="button"
                      >
                        Decline
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            )}
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

          <section className="panel tasks-overview" id="tasks">
            <div className="panel-heading">
              <div>
                <h2>Manage your tasks</h2>
                <p>Search, filter, edit, and organize tasks in the dedicated task manager.</p>
              </div>
              <Link
                className="primary-link"
                search={query}
                to="/tasks"
              >
                Open task manager
              </Link>
            </div>
          </section>
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
