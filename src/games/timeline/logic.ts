import {
  compareEvents,
  eventSortKey,
  formatEventYear,
  type HistoryEvent,
} from '../../shared/events'

/**
 * Fit card centers into 0..1 across the board width (no horizontal scroll).
 * Keeps year-ish spacing, but enforces a minimum gap so tickets don't overlap.
 */
export function fitCardPositions(line: HistoryEvent[]): number[] {
  const n = line.length
  if (n === 0) return []
  if (n === 1) return [0.5]

  const keys = line.map(eventSortKey)
  const min = keys[0]!
  const max = keys[n - 1]!
  const span = Math.max(max - min, 1)
  let pos = keys.map((k) => (k - min) / span)

  const minGap = Math.min(0.1, 0.82 / (n - 1))
  for (let iter = 0; iter < 24; iter++) {
    for (let i = 1; i < pos.length; i++) {
      const gap = pos[i]! - pos[i - 1]!
      if (gap >= minGap) continue
      const mid = (pos[i]! + pos[i - 1]!) / 2
      pos[i - 1] = mid - minGap / 2
      pos[i] = mid + minGap / 2
    }
    const lo = pos[0]!
    const hi = pos[pos.length - 1]!
    const localSpan = Math.max(hi - lo, 1e-6)
    pos = pos.map((p) => (p - lo) / localSpan)
  }

  const pad = 0.06
  return pos.map((p) => pad + p * (1 - 2 * pad))
}

/** Absolute slot bands as left/width fractions (n cards → n+1 slots). */
export function fitSlotRanges(
  positions: number[],
): { left: number; width: number }[] {
  if (positions.length === 0) return [{ left: 0, width: 1 }]

  const out: { left: number; width: number }[] = [
    { left: 0, width: positions[0]! },
  ]
  for (let i = 1; i < positions.length; i++) {
    out.push({
      left: positions[i - 1]!,
      width: positions[i]! - positions[i - 1]!,
    })
  }
  const last = positions[positions.length - 1]!
  out.push({ left: last, width: 1 - last })
  return out
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
