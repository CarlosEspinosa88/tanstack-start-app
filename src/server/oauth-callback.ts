import { parse } from 'cookie'
import {
  clearOAuthStateCookie,
  serializeSessionCookie,
} from './auth-cookies'
import { matchesOAuthState } from './oauth-state'

type OAuthCallbackOptions = {
  authenticate: (code: string) => Promise<{ token: string }>
  secureCookies: boolean
}

export function createOAuthCallbackHandler({
  authenticate,
  secureCookies,
}: OAuthCallbackOptions) {
  const clearedOAuthStateCookie = clearOAuthStateCookie(secureCookies)

  function redirectToLogin(error: string) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: `/login?error=${encodeURIComponent(error)}`,
        'Set-Cookie': clearedOAuthStateCookie,
      },
    })
  }

  return async (request: Request) => {
    const url = new URL(request.url)
    const code = url.searchParams.get('code')
    const returnedState = url.searchParams.get('state')
    const savedState = parse(request.headers.get('cookie') ?? '').oauth_state

    if (!matchesOAuthState(returnedState, savedState)) {
      return redirectToLogin('invalid_state')
    }

    if (url.searchParams.has('error')) {
      return redirectToLogin('google_access_denied')
    }

    if (!code) {
      return redirectToLogin('missing_code')
    }

    try {
      const { token } = await authenticate(code)
      const headers = new Headers({
        Location: '/',
      })
      headers.append('Set-Cookie', clearedOAuthStateCookie)
      headers.append('Set-Cookie', serializeSessionCookie(token, secureCookies))

      return new Response(null, { status: 302, headers })
    } catch {
      return redirectToLogin('google_login_failed')
    }
  }
}
