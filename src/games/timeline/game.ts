import { todayKey } from '../../shared/dateSeed'
import type { HistoryEvent } from '../../shared/events'
import {
  HAND_PER_ROUND,
  getDailyTimeline,
  getRandomTimelineRound,
  type TimelineRound,
} from './daily'
import {
  correctInsertIndex,
  insertEvent,
  isPlacementCorrect,
  revealPhrase,
} from './logic'
import {
  loadTimelineResult,
  saveTimelineResult,
  type TimelineGuess,
} from './storage'
import {
  buildTimelineShare,
  mountModePicker,
  mountTimelineUI,
  type TimelineUI,
} from './ui'

export function startTimelineApp(app: HTMLElement): void {
  const params = new URLSearchParams(window.location.search)
  const mode = params.get('mode')

  if (mode === 'daily') {
    startDaily(app)
    return
  }
  if (mode === 'practice') {
    startPractice(app)
    return
  }

  history.replaceState(null, '', '/timeline/')
  mountModePicker(app, {
    onDaily: () => {
      history.replaceState(null, '', '?mode=daily')
      startDaily(app)
    },
    onPractice: () => {
      history.replaceState(null, '', '?mode=practice')
      startPractice(app)
    },
  })
}

function startDaily(app: HTMLElement): void {
  const dateKey = todayKey()
  const existing = loadTimelineResult(dateKey)
  const round = getDailyTimeline(dateKey)
  const ui = mountTimelineUI(app)

  if (existing) {
    showCompleted(ui, round.fixed, existing, dateKey)
    return
  }

  playRound(ui, round, {
    isDaily: true,
    dateKey,
    onFinished: (guesses) => {
      const score = guesses.filter((g) => g.correct).length
      saveTimelineResult({
        dateKey,
        fixedIds: round.fixed.map((e) => e.id),
        guesses,
        score,
        completedAt: new Date().toISOString(),
      })
    },
  })
}

function startPractice(app: HTMLElement): void {
  const dateKey = todayKey()
  const round = getRandomTimelineRound()
  const ui = mountTimelineUI(app)
  playRound(ui, round, {
    isDaily: false,
    dateKey,
    onFinished: () => {},
    onPlayAgain: () => startPractice(app),
  })
}

function playRound(
  ui: TimelineUI,
  round: TimelineRound,
  opts: {
    isDaily: boolean
    dateKey: string
    onFinished: (guesses: TimelineGuess[]) => void
    onPlayAgain?: () => void
  },
): void {
  const fixedIds = new Set(round.fixed.map((e) => e.id))
  let line: HistoryEvent[] = round.fixed.slice()
  let remaining = round.targets.slice()
  const guesses: TimelineGuess[] = []
  let correctCount = 0
  let done = false

  const paint = (): void => {
    ui.setProgress(guesses.length, HAND_PER_ROUND)
    ui.render({
      remaining,
      line,
      fixedIds,
      interactive: !done && remaining.length > 0,
    })
  }

  const finish = (): void => {
    done = true
    opts.onFinished(guesses)
    paint()
    ui.setHint(
      opts.isDaily
        ? 'Dnešní výzva je hotová.'
        : 'Sada hotová — spusť další.',
    )

    const share = buildTimelineShare(
      opts.dateKey,
      correctCount,
      guesses.length,
      guesses,
    )

    if (opts.isDaily) {
      ui.setNextEnabled(true, 'Výsledek')
      ui.onNext(() => {
        ui.showResult({
          dateKey: opts.dateKey,
          guesses,
          score: correctCount,
          shareText: share,
        })
      })
      ui.showResult({
        dateKey: opts.dateKey,
        guesses,
        score: correctCount,
        shareText: share,
      })
    } else if (opts.onPlayAgain) {
      ui.setNextEnabled(true, 'Další sada')
      ui.onNext(() => {
        opts.onPlayAgain?.()
      })
    }
  }

  const commit = (event: HistoryEvent, guessedIndex: number): void => {
    if (done) return
    if (!remaining.some((e) => e.id === event.id)) return

    const ok = isPlacementCorrect(line, event, guessedIndex)
    const rightIndex = correctInsertIndex(line, event)
    line = insertEvent(line, event, rightIndex)

    guesses.push({
      eventId: event.id,
      eventTitle: event.title,
      year: event.year,
      guessedIndex,
      correctIndex: rightIndex,
      correct: ok,
    })

    if (ok) correctCount += 1

    remaining = remaining.filter((e) => e.id !== event.id)
    ui.setScore(correctCount, guesses.length)

    const detail = ok
      ? revealPhrase(line, event, rightIndex)
      : `správně: ${revealPhrase(line, event, rightIndex)}`
    ui.showFeedback(ok, detail)

    if (remaining.length === 0) {
      finish()
      return
    }

    ui.setHint('Přetáhni další kartu mezi události na ose.')
    paint()
  }

  ui.setScore(0, 0)
  ui.setNextEnabled(false, 'Další')
  ui.clearFeedback()
  ui.setHint('Na ose je 5 událostí. Vlož mezi ně svých 5 karet.')
  paint()

  ui.onDrop((id, index) => {
    if (done) return
    const event = remaining.find((e) => e.id === id)
    if (!event) return
    commit(event, index)
  })
}

function showCompleted(
  ui: TimelineUI,
  fixed: HistoryEvent[],
  result: NonNullable<ReturnType<typeof loadTimelineResult>>,
  dateKey: string,
): void {
  ui.setProgress(HAND_PER_ROUND, HAND_PER_ROUND)
  ui.setHint('Dnešní výzvu už máš hotovou.')
  ui.render({
    remaining: [],
    line: fixed,
    fixedIds: new Set(fixed.map((e) => e.id)),
    interactive: false,
  })
  ui.setScore(result.score, result.guesses.length)
  ui.setNextEnabled(true, 'Výsledek')

  const share = buildTimelineShare(
    dateKey,
    result.score,
    result.guesses.length,
    result.guesses,
  )

  ui.onNext(() => {
    ui.showResult({
      dateKey,
      guesses: result.guesses,
      score: result.score,
      shareText: share,
    })
  })

  ui.showResult({
    dateKey,
    guesses: result.guesses,
    score: result.score,
    shareText: share,
  })
}
