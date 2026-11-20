import { createFileRoute } from '@tanstack/react-router'
import { handleGoogleCallback } from '../server/auth'
import { createOAuthCallbackHandler } from '../server/oauth-callback'

const secureCookies = process.env.NODE_ENV === 'production'
const handleCallback = createOAuthCallbackHandler({
  authenticate: handleGoogleCallback,
  secureCookies,
})

export const Route = createFileRoute('/auth/callback')({
  server: {
    handlers: {
      GET: async ({ request }) => handleCallback(request),
    },
  },
})
