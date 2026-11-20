import assert from 'node:assert/strict'
import test from 'node:test'
import {
  clearOAuthStateCookie,
  clearSessionCookie,
  serializeOAuthStateCookie,
  serializeSessionCookie,
} from './auth-cookies'

test('OAuth state cookie is short-lived, callback-scoped, and HTTP-only', () => {
  const cookie = serializeOAuthStateCookie('state-value', false)

  assert.match(cookie, /^oauth_state=state-value;/)
  assert.match(cookie, /Max-Age=600/)
  assert.match(cookie, /Path=\/auth\/callback/)
  assert.match(cookie, /HttpOnly/)
  assert.match(cookie, /SameSite=Lax/)
  assert.doesNotMatch(cookie, /; Secure/)
})

test('session cookie is secure in production and cleared with matching scope', () => {
  const cookie = serializeSessionCookie('signed-token', true)
  const cleared = clearSessionCookie(true)
  const clearedState = clearOAuthStateCookie(true)

  assert.match(cookie, /^session=signed-token;/)
  assert.match(cookie, /Max-Age=604800/)
  assert.match(cookie, /Path=\//)
  assert.match(cookie, /HttpOnly/)
  assert.match(cookie, /SameSite=Lax/)
  assert.match(cookie, /; Secure/)
  assert.match(cleared, /^session=;/)
  assert.match(cleared, /Max-Age=0/)
  assert.match(cleared, /Path=\//)
  assert.match(cleared, /; Secure/)
  assert.match(clearedState, /^oauth_state=;/)
  assert.match(clearedState, /Max-Age=0/)
  assert.match(clearedState, /Path=\/auth\/callback/)
  assert.match(clearedState, /; Secure/)
})
