import assert from 'node:assert/strict'
import test from 'node:test'
import { calendarDateSchema, calendarMonthSchema, monthRange, shiftMonth } from '../lib/calendar'
import { dashboardSearchSchema } from '../lib/dashboard-data'
import { TodoListInput } from '../server/todo.validation'

test('calendar dates and URL state reject invalid dates without losing list context', () => {
  assert.equal(calendarDateSchema.safeParse('2024-02-29').success, true)
  for (const date of ['2025-02-29', '2026-13-01', '0000-01-01', '2026-1-01']) {
    assert.equal(calendarDateSchema.safeParse(date).success, false)
    assert.equal(TodoListInput.safeParse({ dueDate: date }).success, false)
  }
  assert.equal(calendarMonthSchema.safeParse('2026-13').success, false)
  const search = dashboardSearchSchema.parse({
    board: 'owner', page: '2', status: 'open', search: 'plan',
    dueDate: '2024-02-29', month: '2024-02', period: '30d',
  })
  assert.deepEqual(search, {
    board: 'owner', page: 2, status: 'open', search: 'plan',
    dueDate: '2024-02-29', month: '2024-02', period: '30d',
  })
  assert.equal(dashboardSearchSchema.parse({ dueDate: '2025-02-29' }).dueDate, undefined)
})

test('month boundaries use UTC, including leap years and year transitions', () => {
  assert.equal(shiftMonth('2026-12', 1), '2027-01')
  assert.equal(shiftMonth('2026-01', -1), '2025-12')
  assert.equal(shiftMonth('0001-01', -1), undefined)
  assert.equal(shiftMonth('9999-12', 1), undefined)
  const { start, end } = monthRange('2024-02')
  assert.equal(start.toISOString(), '2024-02-01T00:00:00.000Z')
  assert.equal(end.toISOString(), '2024-03-01T00:00:00.000Z')
})
