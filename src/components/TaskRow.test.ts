import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { getDueDateProgress, TaskRow } from './TaskRow'

function renderTaskRow(isPending: boolean, readOnly = false) {
  return renderToStaticMarkup(
    createElement(TaskRow, {
      todo: {
        id: 'todo-1',
        title: 'Review release',
        done: false,
        createdAt: new Date('2026-11-19T12:00:00.000Z'),
        dueDate: null,
      },
      readOnly,
      isSelected: true,
      isSelectionDisabled: false,
      isEditing: false,
      isPending,
      editTitle: '',
      editDueDate: '',
      onEditTitleChange: () => {},
      onEditDueDateChange: () => {},
      onStartEdit: () => {},
      onCancelEdit: () => {},
      onSaveEdit: () => {},
      onToggle: () => {},
      onSelect: () => {},
      onDelete: () => {},
    }),
  )
}

test('task selection and completion controls have descriptive accessible names', () => {
  const markup = renderTaskRow(false)

  assert.match(markup, /aria-label="Select task: Review release"/)
  assert.match(markup, /aria-label="Mark complete: Review release"/)
  assert.match(markup, /checked=""/)
  assert.match(markup, /aria-busy="false"/)
})

test('task controls are marked busy and disabled during mutations', () => {
  const markup = renderTaskRow(true)

  assert.match(markup, /aria-busy="true"/)
  assert.match(markup, /aria-label="Select task: Review release"[^>]*disabled=""/)
  assert.match(markup, /aria-label="Mark complete: Review release"[^>]*disabled=""/)
})

test('shared task rows show status without edit or selection controls', () => {
  const markup = renderTaskRow(false, true)

  assert.match(markup, /aria-label="In progress"[^>]*role="img"/)
  assert.doesNotMatch(markup, /Select task: Review release/)
  assert.doesNotMatch(markup, /Mark complete: Review release/)
  assert.doesNotMatch(markup, />Edit</)
  assert.doesNotMatch(markup, />Delete</)
})

test('deadline progress compares calendar days and stays within the date range', () => {
  const createdAt = new Date('2026-11-01T18:00:00.000Z')
  const dueDate = new Date('2026-11-05T00:00:00.000Z')

  assert.equal(
    getDueDateProgress(createdAt, dueDate, new Date('2026-10-30T12:00:00.000Z')),
    0,
  )
  assert.equal(
    getDueDateProgress(createdAt, dueDate, new Date('2026-11-03T12:00:00.000Z')),
    50,
  )
  assert.equal(
    getDueDateProgress(createdAt, dueDate, new Date('2026-11-07T12:00:00.000Z')),
    100,
  )
})

test('same-day and already-passed deadlines have stable progress', () => {
  const sameDay = new Date('2026-11-19T00:00:00.000Z')
  assert.equal(getDueDateProgress(sameDay, sameDay, sameDay), 100)
  assert.equal(
    getDueDateProgress(
      new Date('2026-11-20T00:00:00.000Z'),
      sameDay,
      new Date('2026-11-18T00:00:00.000Z'),
    ),
    0,
  )
})
