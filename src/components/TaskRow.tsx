import type { KeyboardEvent } from 'react'

export type TaskRowTodo = {
  id: string
  title: string
  done: boolean
  createdAt: Date
}

type TaskRowProps = {
  todo: TaskRowTodo
  isEditing: boolean
  isPending: boolean
  editTitle: string
  onEditTitleChange: (title: string) => void
  onStartEdit: () => void
  onCancelEdit: () => void
  onSaveEdit: () => void
  onToggle: () => void
  onDelete: () => void
}

export function TaskRow({
  todo,
  isEditing,
  isPending,
  editTitle,
  onEditTitleChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onToggle,
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

  return (
    <li className="task-row" aria-busy={isPending}>
      <button
        aria-label={`${todo.done ? 'Mark incomplete' : 'Mark complete'}: ${todo.title}`}
        className={todo.done ? 'task-check checked' : 'task-check'}
        disabled={isPending}
        onClick={onToggle}
        type="button"
      >
        {todo.done ? '✓' : ''}
      </button>
      {isEditing ? (
        <input
          autoFocus
          className="task-edit-input"
          aria-label={`Edit task: ${todo.title}`}
          maxLength={140}
          value={editTitle}
          onChange={(event) => onEditTitleChange(event.currentTarget.value)}
          onKeyDown={handleEditKeyDown}
        />
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
        })}
      </time>
      {isEditing ? (
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
      ) : (
        <span className="task-actions">
          <button disabled={isPending} onClick={onStartEdit} type="button">
            Edit
          </button>
          <button disabled={isPending} onClick={onDelete} type="button">
            Delete
          </button>
        </span>
      )}
    </li>
  )
}
