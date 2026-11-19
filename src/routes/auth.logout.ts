import { createFileRoute } from '@tanstack/react-router'
import { clearSessionCookie } from '../server/auth-cookies'

export const Route = createFileRoute('/auth/logout')({
  server: {
    handlers: {
      POST: async () =>
        new Response(null, {
          status: 303,
          headers: {
            Location: '/login',
            'Set-Cookie': clearSessionCookie(
              process.env.NODE_ENV === 'production',
            ),
          },
        }),
    },
  },
})
