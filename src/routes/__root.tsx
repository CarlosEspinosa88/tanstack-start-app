/// <reference types="vite/client" />

import type { ReactNode } from 'react'
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
} from '@tanstack/react-router'
import type { SessionUser } from '../server/auth'

export type RouterContext = {
  user: SessionUser | null
}

export const Route = createRootRoute({
  beforeLoad: async ({ context, location }) => {
    // console.log("CONTEXT", context)
  // En Start, el request del server está disponible en SSR; para client, el user
  // vendrá hidratado si lo incluyes en el HTML, o puedes pedirlo con server fn.
  // Para simplificar, dejamos `user` como venía en `context` del server.
    return { ...context }
  },
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'TanStack Start Starter',
      },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}