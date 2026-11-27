import { useNavigate, useRouter } from '@tanstack/react-router'
import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'
import { TaskRow } from './TaskRow'
import {
  createTodo,
  deleteTodo,
  deleteTodos,
  updateTodos,
  updateTodo,
} from '../server/todo.server'
import type { TodoRecord } from '../server/todo-operations'
import type { DashboardSearch } from '../lib/dashboard-data'

type TaskManagerProps = {
  dashboard: {
    todos: TodoRecord[]
    summary: {
      allCount: number
      openCount: number
      completedCount: number
    }
    pagination: {
      page: number
      pageSize: number
      total: number
      pageCount: number
    }
  }
  query: DashboardSearch
  canEditBoard: boolean
}

export function TaskManager({
  dashboard,
  query,
  canEditBoard,
}: TaskManagerProps) {
  const router = useRouter()
  const navigate = useNavigate({ from: '/tasks' })
  const { todos, summary, pagination } = dashboard
  const [search, setSearch] = useState(query.search)
  const [newTitle, setNewTitle] = useState('')
  const [newDueDate, setNewDueDate] = useState('')
  const [mutationError, setMutationError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [pendingTodoIds, setPendingTodoIds] = useState<Set<string>>(new Set())
  const [selectedTodoIds, setSelectedTodoIds] = useState<Set<string>>(new Set())
  const [isBulkSaving, setIsBulkSaving] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [editingDueDate, setEditingDueDate] = useState('')

  useEffect(() => {
    setSearch(query.search)
  }, [query.search])

  useEffect(() => {
    setSelectedTodoIds(new Set())
  }, [query.board, query.page, query.period, query.search, query.status, query.dueDate])

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  function navigateToTasks(next: Partial<DashboardSearch>) {
    setSelectedTodoIds(new Set())
    return navigate({
      search: {
        ...query,
        ...next,
        page: next.page ?? 1,
      },
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
      await createTodo({
        data: {
          title,
          dueDate: newDueDate || undefined,
          ...(query.board ? { boardOwnerId: query.board } : {}),
        },
      })
      setNewTitle('')
      setNewDueDate('')
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
      await updateTodo({
        data: {
          id,
          done: !done,
          ...(query.board ? { boardOwnerId: query.board } : {}),
        },
      })
      setSelectedTodoIds(new Set())
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
      await updateTodo({
        data: {
          id,
          title,
          dueDate: editingDueDate || null,
          ...(query.board ? { boardOwnerId: query.board } : {}),
        },
      })
      setEditingId(null)
      setSelectedTodoIds(new Set())
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
      await deleteTodo({
        data: { id, ...(query.board ? { boardOwnerId: query.board } : {}) },
      })
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
      await updateTodos({
        data: {
          ids,
          done: true,
          ...(query.board ? { boardOwnerId: query.board } : {}),
        },
      })
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
      await deleteTodos({
        data: { ids, ...(query.board ? { boardOwnerId: query.board } : {}) },
      })
      setSelectedTodoIds(new Set())
      await router.invalidate()
    } catch {
      setMutationError('Could not delete the selected tasks. Please try again.')
    } finally {
      setIsBulkSaving(false)
    }
  }

  return (
    <section
      className="panel tasks-panel"
      id="tasks"
      tabIndex={-1}
      aria-label="Task management"
    >
      <div className="tasks-heading">
        <div>
          <h2>{query.board ? 'Shared tasks' : 'Your tasks'}</h2>
          <p>
            {query.board
              ? canEditBoard
                ? 'You can create, edit, complete, and delete tasks on this board.'
                : 'These tasks are visible to you but cannot be changed.'
              : 'Stay focused on what matters next.'}
          </p>
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
            disabled={!isHydrated}
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
              disabled={!isHydrated}
            >
              Clear
            </button>
          )}
          <button disabled={!isHydrated} type="submit" className="search-submit">Search</button>
        </form>
      </div>
      {canEditBoard && (
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
          <label className="visually-hidden" htmlFor="new-todo-due-date">
            Due date
          </label>
          <input
            className="todo-due-date-input"
            id="new-todo-due-date"
            onChange={(event) => setNewDueDate(event.currentTarget.value)}
            type="date"
            value={newDueDate}
          />
          <button disabled={!newTitle.trim() || isSaving} type="submit">
            {isSaving ? 'Saving…' : 'Add task'}
          </button>
        </form>
      )}
      {mutationError && <p className="todo-error" role="alert">{mutationError}</p>}
      <div className="task-tabs" role="group" aria-label="Filter tasks">
        {([
          ['all', `All tasks (${summary.allCount})`],
          ['open', `In progress (${summary.openCount})`],
          ['completed', `Completed (${summary.completedCount})`],
        ] as const).map(([value, label]) => (
          <button
            className={query.status === value ? 'task-tab selected' : 'task-tab'}
            key={value}
            onClick={() => void navigateToTasks({ status: value })}
            type="button"
            aria-pressed={query.status === value}
            disabled={!isHydrated}
          >
            {label}
          </button>
        ))}
      </div>
      {canEditBoard && (
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
      )}
      <ul className="task-list">
        {todos.map((todo) => (
          <TaskRow
            key={todo.id}
            todo={todo}
            readOnly={!canEditBoard}
            isSelected={selectedTodoIds.has(todo.id)}
            isSelectionDisabled={!isHydrated}
            isEditing={editingId === todo.id}
            isPending={pendingTodoIds.has(todo.id) || isBulkSaving}
            editTitle={editingTitle}
            editDueDate={editingDueDate}
            onEditTitleChange={setEditingTitle}
            onEditDueDateChange={setEditingDueDate}
            onStartEdit={() => {
              setEditingId(todo.id)
              setEditingTitle(todo.title)
              setEditingDueDate(todo.dueDate?.toISOString().slice(0, 10) ?? '')
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
          <li className="empty-state">
            {summary.allCount === 0
              ? canEditBoard
                ? 'No tasks yet. Add your first task above.'
                : 'This board has no tasks yet.'
              : 'No tasks match this view.'}
          </li>
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
            disabled={!isHydrated || pagination.page <= 1}
            onClick={() => void navigateToTasks({ page: pagination.page - 1 })}
            type="button"
          >
            Previous
          </button>
          <span>Page {pagination.page} of {pagination.pageCount}</span>
          <button
            disabled={!isHydrated || pagination.page >= pagination.pageCount}
            onClick={() => void navigateToTasks({ page: pagination.page + 1 })}
            type="button"
          >
            Next
          </button>
        </span>
      </div>
    </section>
  )
}
