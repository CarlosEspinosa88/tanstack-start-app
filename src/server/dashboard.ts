export type TodoActivityDay = {
  dateKey: string
  label: string
  count: number
}

export function getUtcDayStart(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  )
}

export function buildTodoActivity(
  createdAtDates: Date[],
  today = new Date(),
): TodoActivityDay[] {
  const endDate = getUtcDayStart(today)
  const counts = new Map<string, number>()

  for (const createdAt of createdAtDates) {
    const dateKey = createdAt.toISOString().slice(0, 10)
    counts.set(dateKey, (counts.get(dateKey) ?? 0) + 1)
  }

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(endDate)
    date.setUTCDate(date.getUTCDate() - (6 - index))
    const dateKey = date.toISOString().slice(0, 10)

    return {
      dateKey,
      label: date.toLocaleDateString(undefined, {
        weekday: 'short',
        timeZone: 'UTC',
      }),
      count: counts.get(dateKey) ?? 0,
    }
  })
}

export function getUtcActivityRange(today = new Date()) {
  const endDate = getUtcDayStart(today)
  const startDate = new Date(endDate)
  startDate.setUTCDate(startDate.getUTCDate() - 6)
  const exclusiveEndDate = new Date(endDate)
  exclusiveEndDate.setUTCDate(exclusiveEndDate.getUTCDate() + 1)

  return { startDate, exclusiveEndDate }
}

export function getOwnedTodoWhere(userId: string, id: string) {
  return { id, userId }
}
