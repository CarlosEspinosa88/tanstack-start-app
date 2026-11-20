import { clearSessionCookie } from './auth-cookies'

export function createLogoutHandler(secureCookies: boolean) {
  return async () =>
    new Response(null, {
      status: 303,
      headers: {
        Location: '/login',
        'Set-Cookie': clearSessionCookie(secureCookies),
      },
    })
}
