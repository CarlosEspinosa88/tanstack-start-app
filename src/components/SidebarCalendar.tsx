import { useEffect, useState } from 'react'
import { monthRange, shiftMonth } from '../lib/calendar'

type SidebarCalendarProps = {
  month: string
  selectedDate?: string
  dueDateCounts: { date: string; count: number }[]
  onMonthChange: (month: string) => void
  onSelectDate: (date: string | undefined) => void
}

const monthFormat = new Intl.DateTimeFormat('en-US', {
  month: 'long', year: 'numeric', timeZone: 'UTC',
})
const dateFormat = new Intl.DateTimeFormat('en-US', {
  weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
})

export function SidebarCalendar({
  month, selectedDate, dueDateCounts, onMonthChange, onSelectDate,
}: SidebarCalendarProps) {
  const [isHydrated, setIsHydrated] = useState(false)
  useEffect(() => {
    setIsHydrated(true)
  }, [])
  const { start, end } = monthRange(month)
  const days = (end.getTime() - start.getTime()) / 86_400_000
  const counts = new Map(dueDateCounts.map(({ date, count }) => [date, count]))
  const previous = shiftMonth(month, -1)
  const next = shiftMonth(month, 1)

  return (
    <section className="sidebar-calendar" aria-label="Task due date calendar">
      <div className="calendar-heading">
        <button type="button" aria-label="Previous month" disabled={!isHydrated || !previous} onClick={() => previous && onMonthChange(previous)}>‹</button>
        <strong aria-live="polite">{monthFormat.format(start)}</strong>
        <button type="button" aria-label="Next month" disabled={!isHydrated || !next} onClick={() => next && onMonthChange(next)}>›</button>
      </div>
      <div className="calendar-grid">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <span className="calendar-weekday" key={day} aria-label={day}>{day.slice(0, 1)}</span>
        ))}
        {Array.from({ length: start.getUTCDay() }, (_, index) => <span key={`blank-${index}`} />)}
        {Array.from({ length: days }, (_, index) => {
          const date = `${month}-${String(index + 1).padStart(2, '0')}`
          const count = counts.get(date) ?? 0
          return (
            <button
              type="button"
              key={date}
              className={count ? 'calendar-day has-tasks' : 'calendar-day'}
              aria-label={`${dateFormat.format(new Date(`${date}T00:00:00.000Z`))}, ${count} ${count === 1 ? 'task' : 'tasks'} due`}
              aria-pressed={selectedDate === date}
              disabled={!isHydrated}
              onClick={() => onSelectDate(date)}
            >
              {index + 1}
            </button>
          )
        })}
      </div>
      {dueDateCounts.length === 0 && <p>No tasks due this month.</p>}
      {selectedDate && (
        <div className="calendar-selection">
          <span>Selected: {selectedDate}</span>
          <button type="button" disabled={!isHydrated} onClick={() => onSelectDate(undefined)}>Clear date</button>
        </div>
      )}
    </section>
  )
}
