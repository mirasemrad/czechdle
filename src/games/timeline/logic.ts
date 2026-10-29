import {
  compareEvents,
  eventSortKey,
  formatEventYear,
  type HistoryEvent,
} from '../../shared/events'

/**
 * Pixel widths for gaps (before / between / after).
 * Year jumps change width, but edges stay small and extremes are blended
 * so the board stays readable on one screen + light scroll.
 */
export function gapWidthsPx(line: HistoryEvent[]): number[] {
  if (line.length === 0) return [44]
  if (line.length === 1) return [56, 56]

  const keys = line.map(eventSortKey)
  const betweenRaw: number[] = []
  for (let i = 1; i < keys.length; i++) {
    const delta = Math.max(keys[i]! - keys[i - 1]!, 1)
    betweenRaw.push(Math.sqrt(delta))
  }

  const sum = betweenRaw.reduce((a, b) => a + b, 0) || 1
  const equal = sum / betweenRaw.length
  const blended = betweenRaw.map((w) => 0.4 * equal + 0.6 * w)
  const total = blended.reduce((a, b) => a + b, 0)
  const minPx = 52
  const budget = 300
  const mids = blended.map((w) => minPx + Math.round((w / total) * budget))
  const edge = 48
  return [edge, ...mids, edge]
}

/** Index where `card` belongs among already placed events (0..line.length). */
export function correctInsertIndex(
  line: HistoryEvent[],
  card: HistoryEvent,
): number {
  let i = 0
  for (; i < line.length; i++) {
    if (compareEvents(card, line[i]) < 0) return i
  }
  return line.length
}

/** Placement is OK if card sits chronologically between neighbors (ties allowed). */
export function isPlacementCorrect(
  line: HistoryEvent[],
  card: HistoryEvent,
  index: number,
): boolean {
  const left = index > 0 ? line[index - 1] : null
  const right = index < line.length ? line[index] : null
  if (left && compareEvents(card, left) < 0) return false
  if (right && compareEvents(card, right) > 0) return false
  return true
}

export function insertEvent(
  line: HistoryEvent[],
  card: HistoryEvent,
  index: number,
): HistoryEvent[] {
  const next = line.slice()
  next.splice(index, 0, card)
  return next
}

/** Short reveal text using neighbors on the line after a correct insert. */
export function revealPhrase(
  line: HistoryEvent[],
  card: HistoryEvent,
  index: number,
): string {
  const y = formatEventYear(card)
  const left = index > 0 ? line[index - 1] : null
  const right = index < line.length - 1 ? line[index + 1] : null
  if (left && right) return `${y} · mezi „${left.title}“ a „${right.title}“`
  if (left) return `${y} · po „${left.title}“`
  if (right) return `${y} · před „${right.title}“`
  return y
}
