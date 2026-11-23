import type { KeyboardEvent } from 'react'

export type TaskRowTodo = {
  id: string
  title: string
  done: boolean
  createdAt: Date
  dueDate: Date | null
}

type TaskRowProps = {
  todo: TaskRowTodo
  readOnly?: boolean
  isSelected: boolean
  isSelectionDisabled: boolean
  isEditing: boolean
  isPending: boolean
  editTitle: string
  editDueDate: string
  onEditTitleChange: (title: string) => void
  onEditDueDateChange: (dueDate: string) => void
  onStartEdit: () => void
  onCancelEdit: () => void
  onSaveEdit: () => void
  onToggle: () => void
  onSelect: () => void
  onDelete: () => void
}

export function TaskRow({
  todo,
  readOnly = false,
  isSelected,
  isSelectionDisabled,
  isEditing,
  isPending,
  editTitle,
  editDueDate,
  onEditTitleChange,
  onEditDueDateChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onToggle,
  onSelect,
  onDelete,
}: TaskRowProps) {
  function handleEditKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      onSaveEdit()
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      onCancelEdit()
    }
  }

  const dueDateProgress = todo.dueDate
    ? getDueDateProgress(todo.createdAt, todo.dueDate, new Date())
    : null
  const isOverdue = Boolean(
    todo.dueDate &&
    !todo.done &&
    getUtcDay(new Date()) > getUtcDay(todo.dueDate),
  )

  return (
    <li className="task-row" aria-busy={isPending}>
      {!readOnly && (
        <input
          aria-label={`Select task: ${todo.title}`}
          checked={isSelected}
          className="task-select"
          disabled={isPending || isSelectionDisabled}
          onChange={onSelect}
          type="checkbox"
        />
      )}
      {readOnly ? (
        <span
          aria-label={todo.done ? 'Completed' : 'In progress'}
          className={todo.done ? 'task-check checked' : 'task-check'}
          role="img"
        >
          {todo.done ? '✓' : ''}
        </span>
      ) : (
        <button
          aria-label={`${todo.done ? 'Mark incomplete' : 'Mark complete'}: ${todo.title}`}
          className={todo.done ? 'task-check checked' : 'task-check'}
          disabled={isPending}
          onClick={onToggle}
          type="button"
        >
          {todo.done ? '✓' : ''}
        </button>
      )}
      {isEditing && !readOnly ? (
        <>
          <input
            autoFocus
            className="task-edit-input"
            aria-label={`Edit task: ${todo.title}`}
            maxLength={140}
            value={editTitle}
            onChange={(event) => onEditTitleChange(event.currentTarget.value)}
            onKeyDown={handleEditKeyDown}
          />
          <input
            aria-label={`Due date for task: ${todo.title}`}
            className="task-due-date-input"
            onChange={(event) => onEditDueDateChange(event.currentTarget.value)}
            type="date"
            value={editDueDate}
          />
        </>
      ) : (
        <span className={todo.done ? 'task-title completed-title' : 'task-title'}>
          {todo.title}
        </span>
      )}
      <span className={todo.done ? 'status-pill completed-status' : 'status-pill open-status'}>
        <i />
        {todo.done ? 'Completed' : 'In progress'}
      </span>
      <time className="task-date" dateTime={todo.createdAt.toISOString()}>
        {new Date(todo.createdAt).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          timeZone: 'UTC',
        })}
      </time>
      {todo.dueDate && dueDateProgress !== null && (
        <span className={`due-date-progress${isOverdue ? ' overdue' : ''}`}>
          <time dateTime={todo.dueDate.toISOString().slice(0, 10)}>
            {isOverdue ? 'Overdue' : 'Due'}{' '}
            {todo.dueDate.toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              timeZone: 'UTC',
            })}
          </time>
          <span
            aria-label={`Time elapsed until due date: ${dueDateProgress}%`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={dueDateProgress}
            className="due-date-progress-track"
            role="progressbar"
          >
            <span style={{ width: `${dueDateProgress}%` }} />
          </span>
        </span>
      )}
      {!readOnly && isEditing ? (
        <span className="task-actions">
          <button
            disabled={!editTitle.trim() || isPending}
            onClick={onSaveEdit}
            type="button"
          >
            Save
          </button>
          <button disabled={isPending} onClick={onCancelEdit} type="button">
            Cancel
          </button>
        </span>
      ) : !readOnly ? (
        <span className="task-actions">
          <button disabled={isPending} onClick={onStartEdit} type="button">
            Edit
          </button>
          <button disabled={isPending} onClick={onDelete} type="button">
            Delete
          </button>
        </span>
      ) : null}
    </li>
  )
}

function getUtcDay(date: Date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
}

export function getDueDateProgress(createdAt: Date, dueDate: Date, now: Date) {
  const start = getUtcDay(createdAt)
  const deadline = getUtcDay(dueDate)
  const current = getUtcDay(now)
  const duration = deadline - start

  if (duration <= 0) {
    return current >= deadline ? 100 : 0
  }

  return Math.max(0, Math.min(100, Math.round(((current - start) / duration) * 100)))
}
