import type { Axis, Dir } from './logic'

export type SmeryGuess = {
  cityName: string
  guessedDir: Dir
  correctDir: Dir
  guessedIndex: number
  correctIndex: number
  correct: boolean
}

export type SmeryDailyResult = {
  dateKey: string
  axis: Axis
  anchorName: string
  guesses: SmeryGuess[]
  score: number
  completedAt: string
}

const RESULT_PREFIX = 'smery:result:'

function resultKey(dateKey: string, axis: Axis): string {
  return `${RESULT_PREFIX}${axis}:${dateKey}`
}

export function loadSmeryResult(
  dateKey: string,
  axis: Axis,
): SmeryDailyResult | null {
  try {
    const raw = localStorage.getItem(resultKey(dateKey, axis))
    if (!raw) return null
    return JSON.parse(raw) as SmeryDailyResult
  } catch {
    return null
  }
}

export function saveSmeryResult(result: SmeryDailyResult): void {
  localStorage.setItem(resultKey(result.dateKey, result.axis), JSON.stringify(result))
}
