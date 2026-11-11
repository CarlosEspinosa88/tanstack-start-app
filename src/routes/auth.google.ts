import { randomBytes } from 'node:crypto'
import { createFileRoute } from '@tanstack/react-router'
import { serialize } from 'cookie'
import { getGoogleAuthUrl } from '../server/auth'

export const Route = createFileRoute('/auth/google')({
  server: {
    handlers: {
      GET: async () => {
        const state = randomBytes(32).toString('hex')
        const response = new Response(null, {
          status: 302,
          headers: {
            Location: getGoogleAuthUrl(state),
            'Set-Cookie': serialize('oauth_state', state, {
              httpOnly: true,
              maxAge: 600,
              path: '/auth/callback',
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
            }),
          },
        })

        return response
      },
    },
  },
})
