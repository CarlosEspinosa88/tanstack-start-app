import jwt from 'jsonwebtoken'

export type JWTClaims = {
  userId: string
  email: string
}

export function verifySessionToken(token: string, secret: string): JWTClaims | null {
  try {
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] })

    if (
      typeof decoded !== 'object' ||
      typeof decoded.userId !== 'string' ||
      decoded.userId.length === 0 ||
      typeof decoded.email !== 'string'
    ) {
      return null
    }

    return {
      userId: decoded.userId,
      email: decoded.email,
    }
  } catch {
    return null
  }
}
