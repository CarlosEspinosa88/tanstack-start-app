import { parse, serialize } from 'cookie'
import { createMiddleware } from '@tanstack/react-start'
import { prisma } from './db'

export type SessionUser = { 
  id: string; 
  email: string;
  role: string;
  name?: string | null
}

const COOKIE_NAME = 'auth'

export function getUserFromRequest(req: Request): Promise<SessionUser | null> {
  const header = req.headers.get('cookie') ?? ''
  const cookies = parse(header)
  const token = cookies[COOKIE_NAME]
  console.log("TOKEN", token)
  
  if (!token) return Promise.resolve(null)
  
  // para demo, el token es el email; en prod usa JWT/opaque tokens
  return prisma.user.findUnique({ where: { email: token } })
    .then((u) => u
      ? { 
          id: u.id, 
          email: u.email, 
          role: u.role, 
          name: u.name
        }
      : null,
  )
}

export function setLoginCookie(email: string) {
  return serialize(COOKIE_NAME, email, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    // secure: true, // habilitar en prod https
    maxAge: 60 * 60 * 24 * 7,
    }
  )
}


export function clearLoginCookie() {
return serialize(COOKIE_NAME, '', { path: '/', maxAge: 0 })
}

export const authMiddleware = createMiddleware().server(async ({ next, request }) => {
  const user = await getUserFromRequest(request)
  return next({ context: { user }})
})
