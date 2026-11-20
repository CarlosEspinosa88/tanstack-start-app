import assert from 'node:assert/strict'
import test from 'node:test'
import { buildTodoActivity, getOwnedTodoWhere, getUtcActivityRange } from './dashboard'
import { matchesOAuthState } from './oauth-state'
import jwt from 'jsonwebtoken'
import { verifySessionToken } from './session-token'
import {
  CreateTodoInput,
  DeleteTodoInput,
  DeleteTodosInput,
  TodoListInput,
  UpdateTodosInput,
  UpdateTodoInput,
} from './todo.validation'

test('activity always covers today and the previous six UTC days', () => {
  const today = new Date('2026-11-13T21:15:00.000Z')
  const activity = buildTodoActivity(
    [
      new Date('2026-11-13T04:00:00.000Z'),
      new Date('2026-11-13T22:00:00.000Z'),
      new Date('2020-01-01T10:00:00.000Z'),
    ],
    today,
  )

  assert.equal(activity.length, 7)
  assert.equal(activity[0].dateKey, '2026-11-07')
  assert.equal(activity[6].dateKey, '2026-11-13')
  assert.equal(activity[6].count, 2)
  assert.equal(activity.reduce((sum, day) => sum + day.count, 0), 2)
})

test('activity query range includes seven complete UTC calendar days', () => {
  const { startDate, exclusiveEndDate } = getUtcActivityRange(
    new Date('2026-11-13T21:15:00.000Z'),
  )

  assert.equal(startDate.toISOString(), '2026-11-07T00:00:00.000Z')
  assert.equal(exclusiveEndDate.toISOString(), '2026-11-14T00:00:00.000Z')
})

test('activity ranges and chart cover a configurable 30-day window', () => {
  const today = new Date('2026-11-13T21:15:00.000Z')
  const { startDate, exclusiveEndDate } = getUtcActivityRange(today, 30)
  const activity = buildTodoActivity(
    [new Date('2026-10-15T10:00:00.000Z'), new Date('2026-11-13T10:00:00.000Z')],
    today,
    30,
  )

  assert.equal(startDate.toISOString(), '2026-10-15T00:00:00.000Z')
  assert.equal(exclusiveEndDate.toISOString(), '2026-11-14T00:00:00.000Z')
  assert.equal(activity.length, 30)
  assert.equal(activity[0].dateKey, '2026-10-15')
  assert.equal(activity[0].count, 1)
  assert.equal(activity[29].count, 1)
})

test('todo inputs trim titles and reject invalid or empty updates', () => {
  assert.deepEqual(CreateTodoInput.parse({ title: '  Plan week  ' }), {
    title: 'Plan week',
  })
  assert.equal(CreateTodoInput.safeParse({ title: '   ' }).success, false)
  assert.equal(CreateTodoInput.safeParse({ title: 'x'.repeat(141) }).success, false)
  assert.equal(UpdateTodoInput.safeParse({ id: 'todo-1', done: true }).success, true)
  assert.equal(UpdateTodoInput.safeParse({ id: 'todo-1', title: '  Edit  ' }).success, true)
  assert.equal(UpdateTodoInput.safeParse({ id: 'todo-1' }).success, false)
  assert.equal(DeleteTodoInput.safeParse({ id: '' }).success, false)
})

test('task list input validates pagination, status, and search bounds', () => {
  assert.deepEqual(TodoListInput.parse({}), {
    page: 1,
    status: 'all',
    search: '',
    period: '7d',
  })
  assert.equal(
    TodoListInput.safeParse({ page: 0, status: 'all', search: '' }).success,
    false,
  )
  assert.equal(
    TodoListInput.safeParse({ page: 1, status: 'archived', search: '' }).success,
    false,
  )
  assert.equal(
    TodoListInput.safeParse({ page: 1, status: 'all', search: 'x'.repeat(141) })
      .success,
    false,
  )
  assert.equal(
    TodoListInput.safeParse({ page: 1, status: 'all', search: '', period: '90d' })
      .success,
    false,
  )
})

test('bulk inputs require bounded, unique ids and valid completion values', () => {
  assert.equal(UpdateTodosInput.safeParse({ ids: ['todo-1'], done: true }).success, true)
  assert.equal(DeleteTodosInput.safeParse({ ids: ['todo-1', 'todo-2'] }).success, true)
  assert.equal(UpdateTodosInput.safeParse({ ids: [], done: true }).success, false)
  assert.equal(UpdateTodosInput.safeParse({ ids: ['todo-1', 'todo-1'], done: false }).success, false)
  assert.equal(DeleteTodosInput.safeParse({ ids: Array(21).fill('todo') }).success, false)
})

test('owned task queries always include the authenticated user id', () => {
  assert.deepEqual(getOwnedTodoWhere('user-a', 'todo-1'), {
    id: 'todo-1',
    userId: 'user-a',
  })
  assert.notDeepEqual(getOwnedTodoWhere('user-a', 'todo-1'), {
    id: 'todo-1',
    userId: 'user-b',
  })
})

test('OAuth state comparison handles matches, mismatches, and missing values', () => {
  assert.equal(matchesOAuthState('state-value', 'state-value'), true)
  assert.equal(matchesOAuthState('state-value', 'other-value'), false)
  assert.equal(matchesOAuthState('short', 'longer'), false)
  assert.equal(matchesOAuthState(null, 'state-value'), false)
  assert.equal(matchesOAuthState('state-value', undefined), false)
})

test('session claims require a valid HS256 token and expected fields', () => {
  const secret = 'integration-test-session-secret'
  const validToken = jwt.sign(
    { userId: 'user-a', email: 'user-a@example.com' },
    secret,
    { algorithm: 'HS256', expiresIn: '5m' },
  )

  assert.deepEqual(verifySessionToken(validToken, secret), {
    userId: 'user-a',
    email: 'user-a@example.com',
  })
  assert.equal(verifySessionToken(validToken, 'wrong-secret'), null)
  assert.equal(verifySessionToken('not-a-jwt', secret), null)
  assert.equal(
    verifySessionToken(
      jwt.sign({ email: 'missing-user@example.com' }, secret, {
        algorithm: 'HS256',
      }),
      secret,
    ),
    null,
  )
  assert.equal(
    verifySessionToken(
      jwt.sign(
        { userId: 'user-a', email: 'user-a@example.com' },
        secret,
        { algorithm: 'HS256', expiresIn: -1 },
      ),
      secret,
    ),
    null,
  )
})
