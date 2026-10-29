import { compareEvents, events, type HistoryEvent } from '../../shared/events'
import { pickIndices, todayKey } from '../../shared/dateSeed'

/** Cards already on the timeline (years visible). */
export const FIXED_PER_ROUND = 5
/** Cards the player must place. */
export const HAND_PER_ROUND = 5

export type TimelineRound = {
  fixed: HistoryEvent[]
  targets: HistoryEvent[]
}

function buildRound(picked: HistoryEvent[]): TimelineRound {
  const fixed = picked.slice(0, FIXED_PER_ROUND).slice().sort(compareEvents)
  const targets = picked.slice(FIXED_PER_ROUND, FIXED_PER_ROUND + HAND_PER_ROUND)
  return { fixed, targets }
}

export function getDailyTimeline(dateKey = todayKey()): TimelineRound {
  const indices = pickIndices(
    events.length,
    FIXED_PER_ROUND + HAND_PER_ROUND,
    `timeline:v2:${dateKey}`,
  )
  return buildRound(indices.map((i) => events[i]))
}

export function getRandomTimelineRound(
  excludeIds: string[] = [],
): TimelineRound {
  const exclude = new Set(excludeIds)
  const pool = events.filter((e) => !exclude.has(e.id))
  const need = FIXED_PER_ROUND + HAND_PER_ROUND
  const source = pool.length >= need ? pool : events

  const shuffled = source.slice()
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  return buildRound(shuffled.slice(0, need))
}
