export type TimelineGuess = {
  eventId: string
  eventTitle: string
  year: number
  guessedIndex: number
  correctIndex: number
  correct: boolean
}

export type TimelineDailyResult = {
  dateKey: string
  fixedIds: string[]
  guesses: TimelineGuess[]
  score: number
  completedAt: string
}

const RESULT_PREFIX = 'timeline:v2:result:'

function resultKey(dateKey: string): string {
  return `${RESULT_PREFIX}${dateKey}`
}

export function loadTimelineResult(
  dateKey: string,
): TimelineDailyResult | null {
  try {
    const raw = localStorage.getItem(resultKey(dateKey))
    if (!raw) return null
    return JSON.parse(raw) as TimelineDailyResult
  } catch {
    return null
  }
}

export function saveTimelineResult(result: TimelineDailyResult): void {
  localStorage.setItem(resultKey(result.dateKey), JSON.stringify(result))
}
