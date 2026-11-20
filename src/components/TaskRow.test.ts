import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { TaskRow } from './TaskRow'

function renderTaskRow(isPending: boolean) {
  return renderToStaticMarkup(
    createElement(TaskRow, {
      todo: {
        id: 'todo-1',
        title: 'Review release',
        done: false,
        createdAt: new Date('2026-11-19T12:00:00.000Z'),
      },
      isSelected: true,
      isSelectionDisabled: false,
      isEditing: false,
      isPending,
      editTitle: '',
      onEditTitleChange: () => {},
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
