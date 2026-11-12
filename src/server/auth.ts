import { createMiddleware } from '@tanstack/react-start'
import { OAuth2Client } from 'google-auth-library'
import jwt from 'jsonwebtoken'
import { parse } from 'cookie'
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

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET

  if (!secret) {
    throw new Error('JWT_SECRET must be configured to sign authentication tokens')
  }

  return secret
}

export function getGoogleAuthUrl(state: string) {
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: ['openid', 'email', 'profile'],
    state,
  })
}

export async function handleGoogleCallback(code: string) {
  try {
    const jwtSecret = getJwtSecret()
    const { tokens } = await client.getToken(code)

    if (!tokens.id_token) {
      throw new Error('No ID token received')
    }

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()

    if (
      !payload?.email ||
      payload.email_verified !== true ||
      !payload.sub
    ) {
      throw new Error('Google account must have a verified email address')
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
      jwtSecret,
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
  const secret = process.env.JWT_SECRET

  if (!secret) {
    return null
  }

  try {
    const decoded = jwt.verify(token, secret) as JWTClaims
    return decoded
  } catch (error) {
    console.error('Error verifying JWT:', error)
    return null
  }
}

export async function getUserFromRequest(request: Request): Promise<SessionUser | null> {
  const authorizationHeader = request.headers.get('authorization')
  const bearerToken = authorizationHeader?.startsWith('Bearer ')
    ? authorizationHeader.slice(7)
    : null
  const cookieToken = parse(request.headers.get('cookie') ?? '').session
  const token = bearerToken ?? cookieToken

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
