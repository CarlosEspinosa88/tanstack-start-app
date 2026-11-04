import { createMiddleware } from '@tanstack/react-start'
import { OAuth2Client } from 'google-auth-library'
import jwt from 'jsonwebtoken'
import { prisma } from './db'

export type SessionUser = {
  id: string
  email: string
  name: string | null
  picture: string | null
  googleId: string
  role: string
}

type JWTClaims = {
  userId: string
  email: string
}

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
)

const JWT_SECRET = process.env.JWT_SECRET ?? 'development-secret'

export function getGoogleAuthUrl() {
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ]

  return client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
  })
}

export async function handleGoogleCallback(code: string) {
  try {
    const { tokens } = await client.getToken(code)

    if (!tokens.id_token) {
      throw new Error('No ID token received')
    }

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()

    if (!payload || !payload.email) {
      throw new Error('No email in token payload')
    }

    const user = await prisma.user.upsert({
      where: { email: payload.email },
      update: {
        name: payload.name,
        picture: payload.picture,
        googleId: payload.sub,
      },
      create: {
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        googleId: payload.sub,
      },
    })

    const jwtToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: '7d' },
    )

    return {
      user,
      token: jwtToken,
    }
  } catch (error) {
    console.error('Error handling Google callback:', error)
    throw error
  }
}

export function verifyJWT(token: string): JWTClaims | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTClaims
    return decoded
  } catch (error) {
    console.error('Error verifying JWT:', error)
    return null
  }
}

export async function getUserFromRequest(request: Request): Promise<SessionUser | null> {
  const authorizationHeader = request.headers.get('authorization')
  const token = authorizationHeader?.startsWith('Bearer ')
    ? authorizationHeader.slice(7)
    : null

  if (!token) {
    return null
  }

  const claims = verifyJWT(token)

  if (!claims?.userId) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: claims.userId },
  })

  if (!user) {
    return null
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    picture: user.picture,
    googleId: user.googleId,
    role: user.role,
  }
}

export const authMiddleware = createMiddleware({ type: 'request' }).server(async ({ request, context, next }) => {
  const user = await getUserFromRequest(request)

  if (!user) {
    return {
      request,
      pathname: new URL(request.url).pathname,
      context,
      response: new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    }
  }

  return next({
    context: {
      ...((context ?? {}) as Record<string, unknown>),
      user,
    } as any,
  })
})
