import { distanceKm } from '../../shared/geo'
import { todayKey } from '../../shared/dateSeed'
import {
  loadDailyResult,
  loadPracticeFilter,
  loadStats,
  saveDailyResult,
  savePracticeFilter,
  type GuessResult,
  type PracticeFilter,
} from '../../shared/storage'
import {
  CITIES_PER_DAY,
  getDailyCities,
  getPopulationBounds,
  getRandomCity,
} from './daily'
import { createGameMap } from './map'
import {
  buildShareText,
  mountGameUI,
  mountModePicker,
  mountPracticeSetup,
} from './ui'

type Phase = 'guessing' | 'revealed' | 'done'

export function startMestaApp(app: HTMLElement): void {
  const params = new URLSearchParams(window.location.search)
  const modeParam = params.get('mode')

  if (modeParam === 'daily') {
    startDailyGame(app)
    return
  }
  if (modeParam === 'practice') {
    openPracticeSetup(app)
    return
  }

  showModePicker(app)
}

function showModePicker(app: HTMLElement): void {
  history.replaceState(null, '', '/mesta/')
  mountModePicker(app, {
    onDaily: () => {
      history.replaceState(null, '', '?mode=daily')
      startDailyGame(app)
    },
    onPractice: () => {
      history.replaceState(null, '', '?mode=practice')
      openPracticeSetup(app)
    },
  })
}

function openPracticeSetup(app: HTMLElement): void {
  const bounds = getPopulationBounds()
  const initial = loadPracticeFilter({
    min: bounds.min,
    max: bounds.max,
  })

  mountPracticeSetup(app, {
    initial,
    onBack: () => showModePicker(app),
    onStart: (filter) => {
      savePracticeFilter(filter)
      startPracticeGame(app, filter)
    },
  })
}

export function startDailyGame(app: HTMLElement): void {
  const dateKey = todayKey()
  const cities = getDailyCities(dateKey)
  const existing = loadDailyResult(dateKey)

  const ui = mountGameUI(app, { mode: 'daily' })
  const map = createGameMap(ui.mapEl)

  if (existing) {
    showCompleted(ui, map, existing, dateKey)
    return
  }

  let index = 0
  let phase: Phase = 'guessing'
  const guesses: GuessResult[] = []

  const handleGuess = (lat: number, lon: number): void => {
    if (phase !== 'guessing') return
    phase = 'revealed'

    const city = cities[index]
    const dist = distanceKm({ lat, lon }, { lat: city.lat, lon: city.lon })
    guesses.push({
      cityName: city.name,
      guessLat: lat,
      guessLon: lon,
      truthLat: city.lat,
      truthLon: city.lon,
      distanceKm: dist,
    })

    map.disableGuessing()
    map.showRound({ lat, lon }, { lat: city.lat, lon: city.lon })
    ui.showFeedback(dist)
    ui.setHint('Blue = guess, coral = correct spot.')
    ui.setRunningScore(
      guesses.reduce((s, g) => s + g.distanceKm, 0),
      guesses.length,
    )
    ui.setNextEnabled(true, index >= CITIES_PER_DAY - 1 ? 'Result' : 'Next')
  }

  const startRound = (): void => {
    const city = cities[index]
    map.clearRound()
    map.resetView()
    ui.setProgress(index + 1, CITIES_PER_DAY)
    ui.setCity(city.name)
    ui.clearFeedback()
    ui.setHint('Click the map — you get one guess.')
    ui.setRunningScore(
      guesses.reduce((s, g) => s + g.distanceKm, 0),
      guesses.length,
    )
    ui.setNextEnabled(false, index >= CITIES_PER_DAY - 1 ? 'Result' : 'Next')
    phase = 'guessing'
    map.enableGuessing((p) => handleGuess(p.lat, p.lon))
  }

  ui.onNext(() => {
    if (phase !== 'revealed') return

    if (index >= CITIES_PER_DAY - 1) {
      phase = 'done'
      const totalKm = guesses.reduce((s, g) => s + g.distanceKm, 0)
      saveDailyResult({
        dateKey,
        guesses,
        totalKm,
        completedAt: new Date().toISOString(),
      })
      map.disableGuessing()
      ui.setHint("Today's challenge is done. A new set tomorrow.")
      ui.setNextEnabled(false, 'Done')
      ui.showResult({
        dateKey,
        guesses,
        totalKm,
        stats: loadStats(),
        shareText: buildShareText(dateKey, guesses, totalKm),
      })
      return
    }

    index += 1
    startRound()
  })

  startRound()
}

export function startPracticeGame(
  app: HTMLElement,
  filter: PracticeFilter,
): void {
  let map: ReturnType<typeof createGameMap> | null = null

  const ui = mountGameUI(app, {
    mode: 'practice',
    practiceFilter: filter,
    onPracticeSettings: () => {
      map?.destroy()
      openPracticeSetup(app)
    },
  })
  map = createGameMap(ui.mapEl)

  let phase: Phase = 'guessing'
  let city = getRandomCity(filter)
  let round = 0
  let totalKm = 0

  if (!city) {
    map.destroy()
    openPracticeSetup(app)
    return
  }

  const handleGuess = (lat: number, lon: number): void => {
    if (phase !== 'guessing' || !city || !map) return
    phase = 'revealed'

    const dist = distanceKm({ lat, lon }, { lat: city.lat, lon: city.lon })
    round += 1
    totalKm += dist

    map.disableGuessing()
    map.showRound({ lat, lon }, { lat: city.lat, lon: city.lon })
    ui.showFeedback(dist)
    ui.setHint('Blue = guess, coral = correct spot.')
    ui.setPracticeStats(totalKm, round)
    ui.setNextEnabled(true, 'Next city')
  }

  const startRound = (): void => {
    if (!city || !map) return
    map.clearRound()
    map.resetView()
    ui.setPracticeProgress(round + 1)
    ui.setCity(city.name)
    ui.clearFeedback()
    ui.setHint('Click the map — you get one guess.')
    ui.setPracticeStats(totalKm, round)
    ui.setNextEnabled(false, 'Next city')
    phase = 'guessing'
    map.enableGuessing((p) => handleGuess(p.lat, p.lon))
  }

  ui.onNext(() => {
    if (phase !== 'revealed' || !city) return
    const next = getRandomCity(filter, city.name)
    if (!next) {
      map?.destroy()
      openPracticeSetup(app)
      return
    }
    city = next
    startRound()
  })

  startRound()
}

function showCompleted(
  ui: ReturnType<typeof mountGameUI>,
  map: ReturnType<typeof createGameMap>,
  result: NonNullable<ReturnType<typeof loadDailyResult>>,
  dateKey: string,
): void {
  const { guesses, totalKm } = result
  const last = guesses[guesses.length - 1]

  ui.setProgress(CITIES_PER_DAY, CITIES_PER_DAY)
  ui.setCity(last.cityName)
  ui.showFeedback(last.distanceKm)
  ui.setHint("You've already finished today's challenge. A new set tomorrow.")
  ui.setRunningScore(totalKm, guesses.length)
  ui.setNextEnabled(true, 'Result')
  ui.onNext(() => {
    ui.showResult({
      dateKey,
      guesses,
      totalKm,
      stats: loadStats(),
      shareText: buildShareText(dateKey, guesses, totalKm),
    })
  })

  map.disableGuessing()
  map.showRound(
    { lat: last.guessLat, lon: last.guessLon },
    { lat: last.truthLat, lon: last.truthLon },
  )

  ui.showResult({
    dateKey,
    guesses,
    totalKm,
    stats: loadStats(),
    shareText: buildShareText(dateKey, guesses, totalKm),
  })
}
