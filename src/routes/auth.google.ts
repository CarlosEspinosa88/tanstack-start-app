import { randomBytes } from 'node:crypto'
import { createFileRoute } from '@tanstack/react-router'
import { serializeOAuthStateCookie } from '../server/auth-cookies'
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
            'Set-Cookie': serializeOAuthStateCookie(
              state,
              process.env.NODE_ENV === 'production',
            ),
          },
        })

        return response
      },
    },
  },
})
