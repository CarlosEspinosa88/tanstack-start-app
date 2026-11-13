import { timingSafeEqual } from 'node:crypto'

export function matchesOAuthState(returnedState: string | null, savedState: string | undefined) {
  if (!returnedState || !savedState) {
    return false
  }

  const returned = Buffer.from(returnedState)
  const saved = Buffer.from(savedState)

  return returned.length === saved.length && timingSafeEqual(returned, saved)
}
