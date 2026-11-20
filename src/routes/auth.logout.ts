import { createFileRoute } from '@tanstack/react-router'
import { createLogoutHandler } from '../server/auth-logout'

const handleLogout = createLogoutHandler(process.env.NODE_ENV === 'production')

export const Route = createFileRoute('/auth/logout')({
  server: {
    handlers: {
      POST: handleLogout,
    },
  },
})
