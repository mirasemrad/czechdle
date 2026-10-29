export type GuessResult = {
  cityName: string
  guessLat: number
  guessLon: number
  truthLat: number
  truthLon: number
  distanceKm: number
}

export type DailyResult = {
  dateKey: string
  guesses: GuessResult[]
  totalKm: number
  completedAt: string
}

export type Stats = {
  gamesPlayed: number
  bestScore: number | null
  totalKmAllTime: number
}

export type PracticeFilter = {
  min: number
  max: number
}

const RESULT_PREFIX = 'ceskomesta:result:'
const STATS_KEY = 'ceskomesta:stats'
const PRACTICE_FILTER_KEY = 'ceskomesta:practiceFilter'

export function loadDailyResult(dateKey: string): DailyResult | null {
  try {
    const raw = localStorage.getItem(RESULT_PREFIX + dateKey)
    if (!raw) return null
    return JSON.parse(raw) as DailyResult
  } catch {
    return null
  }
}

export function saveDailyResult(result: DailyResult): void {
  localStorage.setItem(RESULT_PREFIX + result.dateKey, JSON.stringify(result))
  updateStats(result.totalKm)
}

export function loadStats(): Stats {
  try {
    const raw = localStorage.getItem(STATS_KEY)
    if (!raw) {
      return { gamesPlayed: 0, bestScore: null, totalKmAllTime: 0 }
    }
    return JSON.parse(raw) as Stats
  } catch {
    return { gamesPlayed: 0, bestScore: null, totalKmAllTime: 0 }
  }
}

function updateStats(totalKm: number): void {
  const stats = loadStats()
  stats.gamesPlayed += 1
  stats.totalKmAllTime += totalKm
  stats.bestScore =
    stats.bestScore === null ? totalKm : Math.min(stats.bestScore, totalKm)
  localStorage.setItem(STATS_KEY, JSON.stringify(stats))
}

export function loadPracticeFilter(
  fallback: PracticeFilter,
): PracticeFilter {
  try {
    const raw = localStorage.getItem(PRACTICE_FILTER_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as PracticeFilter
    if (
      typeof parsed.min !== 'number' ||
      typeof parsed.max !== 'number' ||
      !Number.isFinite(parsed.min) ||
      !Number.isFinite(parsed.max)
    ) {
      return fallback
    }
    return {
      min: Math.max(0, Math.round(parsed.min)),
      max: Math.max(0, Math.round(parsed.max)),
    }
  } catch {
    return fallback
  }
}

export function savePracticeFilter(filter: PracticeFilter): void {
  localStorage.setItem(PRACTICE_FILTER_KEY, JSON.stringify(filter))
}
