import { createFileRoute } from '@tanstack/react-router'
import { serialize } from 'cookie'

export const Route = createFileRoute('/auth/logout')({
  server: {
    handlers: {
      POST: async () =>
        new Response(null, {
          status: 303,
          headers: {
            Location: '/login',
            'Set-Cookie': serialize('session', '', {
              httpOnly: true,
              maxAge: 0,
              path: '/',
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
            }),
          },
        }),
    },
  },
})
