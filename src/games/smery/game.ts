import { todayKey } from '../../shared/dateSeed'
import type { City } from '../../shared/cities'
import {
  CITIES_PER_ROUND,
  getDailySmery,
  getRandomSmeryRound,
  type SmeryRound,
} from './daily'
import {
  axisGapPhrase,
  axisOffsetPhrase,
  axisOffsetShort,
  correctInsertIndex,
  dirLabel,
  emptyRays,
  insertCity,
  isGuessCorrect,
  sideOfAnchor,
  type Axis,
  type Rays,
} from './logic'
import { createSmeryMap } from './map'
import {
  loadSmeryResult,
  saveSmeryResult,
  type SmeryGuess,
} from './storage'
import {
  buildSmeryShare,
  mountModePicker,
  mountSmeryUI,
  type DropTarget,
  type SmeryUI,
} from './ui'

function parseAxis(value: string | null): Axis | null {
  if (value === 'ew' || value === 'ns') return value
  return null
}

export function startSmeryApp(app: HTMLElement): void {
  const params = new URLSearchParams(window.location.search)
  const mode = params.get('mode')
  const axis = parseAxis(params.get('axis'))

  if ((mode === 'daily' || mode === 'practice') && axis) {
    if (mode === 'daily') startDaily(app, axis)
    else startPractice(app, axis)
    return
  }

  showPicker(app)
}

function showPicker(app: HTMLElement): void {
  history.replaceState(null, '', '/smery/')
  mountModePicker(app, {
    onDaily: (axis) => {
      history.replaceState(null, '', `?mode=daily&axis=${axis}`)
      startDaily(app, axis)
    },
    onPractice: (axis) => {
      history.replaceState(null, '', `?mode=practice&axis=${axis}`)
      startPractice(app, axis)
    },
  })
}

function startDaily(app: HTMLElement, axis: Axis): void {
  const dateKey = todayKey()
  const existing = loadSmeryResult(dateKey, axis)
  const round = getDailySmery(axis, dateKey)

  if (existing) {
    const ui = mountSmeryUI(app, axis)
    const map = createSmeryMap(ui.mapEl)
    showCompleted(ui, map, round.anchor, existing, dateKey, axis)
    return
  }

  playRound(app, round, axis, {
    isDaily: true,
    dateKey,
    onFinished: (guesses) => {
      const score = guesses.filter((g) => g.correct).length
      saveSmeryResult({
        dateKey,
        axis,
        anchorName: round.anchor.name,
        guesses,
        score,
        completedAt: new Date().toISOString(),
      })
    },
  })
}

function startPractice(app: HTMLElement, axis: Axis): void {
  const round = getRandomSmeryRound()
  playRound(app, round, axis, {
    isDaily: false,
    dateKey: todayKey(),
    onFinished: () => undefined,
    onPlayAgain: () => startPractice(app, axis),
  })
}

function playRound(
  app: HTMLElement,
  round: SmeryRound,
  axis: Axis,
  opts: {
    isDaily: boolean
    dateKey: string
    onFinished: (guesses: SmeryGuess[]) => void
    onPlayAgain?: () => void
  },
): void {
  const ui = mountSmeryUI(app, axis)
  const map = createSmeryMap(ui.mapEl)
  map.showAnchor(round.anchor)

  let done = false
  const remaining = round.targets.slice()
  const rays: Rays = emptyRays()
  const guesses: SmeryGuess[] = []
  let correctCount = 0

  const paint = (): void => {
    ui.setProgress(guesses.length, CITIES_PER_ROUND)
    ui.render({
      remaining,
      anchor: round.anchor,
      rays,
      interactive: !done && remaining.length > 0,
    })
  }

  const finish = (): void => {
    done = true
    opts.onFinished(guesses)
    paint()
    ui.setHint(
      opts.isDaily
        ? "Today's challenge is done."
        : 'Set complete — start another set.',
    )

    const share = buildSmeryShare(
      opts.dateKey,
      axis,
      correctCount,
      guesses.length,
      guesses,
    )

    if (opts.isDaily) {
      ui.setNextEnabled(true, 'Result')
      ui.onNext(() => {
        ui.showResult({
          dateKey: opts.dateKey,
          axis,
          anchorName: round.anchor.name,
          guesses,
          score: correctCount,
          shareText: share,
        })
      })
      ui.showResult({
        dateKey: opts.dateKey,
        axis,
        anchorName: round.anchor.name,
        guesses,
        score: correctCount,
        shareText: share,
      })
    } else if (opts.onPlayAgain) {
      ui.setNextEnabled(true, 'Next set')
      ui.onNext(() => {
        map.destroy()
        opts.onPlayAgain?.()
      })
    }
  }

  const commit = (city: City, target: DropTarget): void => {
    if (done) return
    if (!remaining.some((c) => c.name === city.name)) return

    const ok = isGuessCorrect(
      round.anchor,
      rays[target.dir],
      city,
      axis,
      target.dir,
      target.index,
    )
    const rightDir = sideOfAnchor(round.anchor, city, axis)
    const rightIndex = correctInsertIndex(
      round.anchor,
      rays[rightDir],
      city,
      axis,
      rightDir,
    )

    rays[rightDir] = insertCity(rays[rightDir], city, rightIndex)

    guesses.push({
      cityName: city.name,
      guessedDir: target.dir,
      correctDir: rightDir,
      guessedIndex: target.index,
      correctIndex: rightIndex,
      correct: ok,
    })

    if (ok) correctCount += 1

    const idx = remaining.findIndex((c) => c.name === city.name)
    if (idx >= 0) remaining.splice(idx, 1)

    map.addCity(city, {
      highlight: !ok,
      subtitle: axisOffsetShort(round.anchor, city, axis),
    })
    ui.setScore(correctCount, guesses.length)

    const offset = axisOffsetPhrase(round.anchor, city, axis)
    const neighbor =
      rightIndex > 0
        ? rays[rightDir][rightIndex - 1]
        : undefined
    const gap = neighbor
      ? ` · ${axisGapPhrase(neighbor, city, axis, rightDir)}`
      : ''
    const place = `${dirLabel(axis, rightDir)}${rayLabel(rightIndex, rays[rightDir].length)}`
    const detail = ok
      ? `${place} · ${offset}${gap}`
      : `correct: ${place} · ${offset}${gap}`
    ui.showFeedback(ok, detail)

    if (remaining.length === 0) {
      finish()
      return
    }

    ui.setHint('Drag another card between cities on the axis.')
    paint()
  }

  ui.setAnchor(round.anchor.name)
  ui.setScore(0, 0)
  ui.setNextEnabled(false, 'Next')
  ui.clearFeedback()
  ui.setHint(
    axis === 'ew'
      ? 'Grab a card and drag it left/right, or between cities.'
      : 'Grab a card and drag it up/down, or between cities.',
  )
  paint()

  ui.onDrop((name, target) => {
    if (done) return
    const city = remaining.find((c) => c.name === name)
    if (!city) return
    commit(city, target)
  })
}

function rayLabel(index: number, length: number): string {
  if (length <= 1) return ''
  if (index === 0) return ' (closest)'
  if (index === length - 1) return ' (farthest)'
  return ` (#${index + 1} in line)`
}

function showCompleted(
  ui: SmeryUI,
  map: ReturnType<typeof createSmeryMap>,
  anchor: City,
  result: NonNullable<ReturnType<typeof loadSmeryResult>>,
  dateKey: string,
  axis: Axis,
): void {
  ui.setAnchor(anchor.name)
  ui.setProgress(CITIES_PER_ROUND, CITIES_PER_ROUND)
  ui.setHint("You've already finished today's challenge.")
  ui.render({
    remaining: [],
    anchor,
    rays: emptyRays(),
    interactive: false,
  })
  ui.setScore(result.score, result.guesses.length)
  ui.setNextEnabled(true, 'Result')
  map.showAnchor(anchor)

  const share = buildSmeryShare(
    dateKey,
    axis,
    result.score,
    result.guesses.length,
    result.guesses,
  )

  ui.onNext(() => {
    ui.showResult({
      dateKey,
      axis,
      anchorName: result.anchorName,
      guesses: result.guesses,
      score: result.score,
      shareText: share,
    })
  })

  ui.showResult({
    dateKey,
    axis,
    anchorName: result.anchorName,
    guesses: result.guesses,
    score: result.score,
    shareText: share,
  })
}
