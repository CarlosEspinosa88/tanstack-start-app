import { serialize } from 'cookie'

export function serializeOAuthStateCookie(state: string, secure: boolean) {
  return serialize('oauth_state', state, {
    httpOnly: true,
    maxAge: 600,
    path: '/auth/callback',
    sameSite: 'lax',
    secure,
  })
}

export function clearOAuthStateCookie(secure: boolean) {
  return serialize('oauth_state', '', {
    httpOnly: true,
    maxAge: 0,
    path: '/auth/callback',
    sameSite: 'lax',
    secure,
  })
}

export function serializeSessionCookie(token: string, secure: boolean) {
  return serialize('session', token, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
    sameSite: 'lax',
    secure,
  })
}

export function clearSessionCookie(secure: boolean) {
  return serialize('session', '', {
    httpOnly: true,
    maxAge: 0,
    path: '/',
    sameSite: 'lax',
    secure,
  })
}
