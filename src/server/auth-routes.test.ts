import assert from 'node:assert/strict'
import test from 'node:test'
import { createLogoutHandler } from './auth-logout'
import { createOAuthCallbackHandler } from './oauth-callback'

function callbackRequest(query: string, cookie = 'oauth_state=state-value') {
  return new Request(`https://todo.dev/auth/callback?${query}`, {
    headers: { cookie },
  })
}

test('OAuth callback rejects an invalid or missing state and clears the state cookie', async () => {
  const handler = createOAuthCallbackHandler({
    authenticate: async () => ({ token: 'unused-token' }),
    secureCookies: false,
  })

  const response = await handler(
    callbackRequest('code=auth-code&state=wrong-state'),
  )

  assert.equal(response.status, 302)
  assert.equal(response.headers.get('location'), '/login?error=invalid_state')
  assert.match(response.headers.get('set-cookie') ?? '', /oauth_state=;/)
  assert.equal(
    (await handler(callbackRequest('code=auth-code', ''))).headers.get('location'),
    '/login?error=invalid_state',
  )
})

test('OAuth callback reports provider denial and missing authorization codes', async () => {
  const handler = createOAuthCallbackHandler({
    authenticate: async () => ({ token: 'unused-token' }),
    secureCookies: false,
  })

  assert.equal(
    (await handler(callbackRequest('state=state-value&error=access_denied')))
      .headers.get('location'),
    '/login?error=google_access_denied',
  )
  assert.equal(
    (await handler(callbackRequest('state=state-value')))
      .headers.get('location'),
    '/login?error=missing_code',
  )
})

test('OAuth callback creates the session cookie after successful authentication', async () => {
  const authenticatedCodes: string[] = []
  const handler = createOAuthCallbackHandler({
    authenticate: async (code) => {
      authenticatedCodes.push(code)
      return { token: 'session-token' }
    },
    secureCookies: true,
  })

  const response = await handler(
    callbackRequest('code=auth-code&state=state-value'),
  )

  assert.deepEqual(authenticatedCodes, ['auth-code'])
  assert.equal(response.status, 302)
  assert.equal(response.headers.get('location'), '/')
  assert.match(response.headers.get('set-cookie') ?? '', /oauth_state=;/)
  assert.match(response.headers.get('set-cookie') ?? '', /session=session-token;/)
  assert.match(response.headers.get('set-cookie') ?? '', /; Secure/)
})

test('OAuth callback redirects authentication failures to a safe login error', async () => {
  const handler = createOAuthCallbackHandler({
    authenticate: async () => {
      throw new Error('provider failure')
    },
    secureCookies: false,
  })

  const response = await handler(
    callbackRequest('code=auth-code&state=state-value'),
  )

  assert.equal(response.status, 302)
  assert.equal(response.headers.get('location'), '/login?error=google_login_failed')
})

test('logout redirects to login and expires the session cookie', async () => {
  const response = await createLogoutHandler(true)()

  assert.equal(response.status, 303)
  assert.equal(response.headers.get('location'), '/login')
  assert.match(response.headers.get('set-cookie') ?? '', /^session=;/)
  assert.match(response.headers.get('set-cookie') ?? '', /Max-Age=0/)
  assert.match(response.headers.get('set-cookie') ?? '', /; Secure/)
})
