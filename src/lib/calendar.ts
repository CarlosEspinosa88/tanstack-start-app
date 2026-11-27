import { z } from 'zod'

export const calendarDateSchema = z.iso.date().refine((date) => date >= '0001-01-01')
export const calendarMonthSchema = z.string().regex(/^(?!0000)\d{4}-(0[1-9]|1[0-2])$/)

export function monthRange(month: string) {
  const start = new Date(`${month}-01T00:00:00.000Z`)
  const end = new Date(start)
  end.setUTCMonth(end.getUTCMonth() + 1)
  return { start, end }
}

export function shiftMonth(month: string, offset: number) {
  const { start } = monthRange(month)
  start.setUTCMonth(start.getUTCMonth() + offset)
  const year = start.getUTCFullYear()
  if (year < 1 || year > 9999) return undefined
  return `${String(year).padStart(4, '0')}-${String(start.getUTCMonth() + 1).padStart(2, '0')}`
}
