import { timingSafeEqual } from 'node:crypto'
import { createFileRoute } from '@tanstack/react-router'
import { parse, serialize } from 'cookie'
import { handleGoogleCallback } from '../server/auth'

const clearOAuthStateCookie = serialize('oauth_state', '', {
  httpOnly: true,
  maxAge: 0,
  path: '/auth/callback',
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
})

function redirectToLogin(error: string) {
  return new Response(null, {
    status: 302,
    headers: {
      Location: `/login?error=${encodeURIComponent(error)}`,
      'Set-Cookie': clearOAuthStateCookie,
    },
  })
}

export const Route = createFileRoute('/auth/callback')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const code = url.searchParams.get('code')
        const returnedState = url.searchParams.get('state')
        const savedState = parse(request.headers.get('cookie') ?? '').oauth_state
        const returnedStateBuffer = Buffer.from(returnedState ?? '')
        const savedStateBuffer = Buffer.from(savedState ?? '')

        if (
          !returnedState ||
          !savedState ||
          returnedStateBuffer.length !== savedStateBuffer.length ||
          !timingSafeEqual(returnedStateBuffer, savedStateBuffer)
        ) {
          return redirectToLogin('invalid_state')
        }

        if (url.searchParams.has('error')) {
          return redirectToLogin('google_access_denied')
        }

        if (!code) {
          return redirectToLogin('missing_code')
        }

        try {
          const { token } = await handleGoogleCallback(code)
          const headers = new Headers({
            Location: '/',
          })
          headers.append('Set-Cookie', clearOAuthStateCookie)
          headers.append(
            'Set-Cookie',
            serialize('session', token, {
              httpOnly: true,
              maxAge: 60 * 60 * 24 * 7,
              path: '/',
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
            }),
          )

          return new Response(null, { status: 302, headers })
        } catch {
          return redirectToLogin('google_login_failed')
        }
      },
    },
  },
})
