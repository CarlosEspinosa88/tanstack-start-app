import assert from 'node:assert/strict'
import test from 'node:test'
import jwt from 'jsonwebtoken'
import { verifySessionToken } from './session-token'

test('session JWT verification accepts only matching HS256 claims', () => {
  const secret = 'test-session-secret'
  const token = jwt.sign(
    { userId: 'user-a', email: 'user-a@example.com' },
    secret,
    { expiresIn: '5m', algorithm: 'HS256' },
  )

  assert.deepEqual(verifySessionToken(token, secret), {
    userId: 'user-a',
    email: 'user-a@example.com',
  })
})

test('session JWT verification rejects invalid signatures, expirations, algorithms, and claims', () => {
  const secret = 'test-session-secret'
  const validClaims = { userId: 'user-a', email: 'user-a@example.com' }

  assert.equal(verifySessionToken('not-a-jwt', secret), null)
  assert.equal(
    verifySessionToken(jwt.sign(validClaims, 'wrong-secret'), secret),
    null,
  )
  assert.equal(
    verifySessionToken(
      jwt.sign(validClaims, secret, { expiresIn: -1 }),
      secret,
    ),
    null,
  )
  assert.equal(
    verifySessionToken(
      jwt.sign(validClaims, secret, { algorithm: 'HS384' }),
      secret,
    ),
    null,
  )
  assert.equal(
    verifySessionToken(jwt.sign({ email: 'user-a@example.com' }, secret), secret),
    null,
  )
  assert.equal(
    verifySessionToken(jwt.sign({ userId: '', email: 'user-a@example.com' }, secret), secret),
    null,
  )
})
