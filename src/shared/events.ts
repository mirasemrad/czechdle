import raw from '../data/events.json'

export type EventCategory =
  | 'politika'
  | 'sport'
  | 'kultura'
  | 'svet'
  | 'zabava'

export type HistoryEvent = {
  id: string
  title: string
  year: number
  month?: number
  day?: number
  category: EventCategory
}

export const events = raw as HistoryEvent[]

/** Sort key: earlier = smaller. Same calendar day → equal. */
export function eventSortKey(e: HistoryEvent): number {
  const m = e.month ?? 0
  const d = e.day ?? 0
  return e.year * 10000 + m * 100 + d
}

export function compareEvents(a: HistoryEvent, b: HistoryEvent): number {
  return eventSortKey(a) - eventSortKey(b)
}

export function formatEventYear(e: HistoryEvent): string {
  if (e.year < 0) return `${Math.abs(e.year)} př. n. l.`
  return String(e.year)
}
