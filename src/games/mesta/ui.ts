import type { GuessResult, PracticeFilter, Stats } from '../../shared/storage'
import { formatCzechDate } from '../../shared/dateSeed'
import {
  filterCitiesByPop,
  getPopulationBounds,
  type PopFilter,
} from './daily'

export type GameMode = 'daily' | 'practice'

function formatPop(n: number): string {
  return n.toLocaleString('en-US')
}

export type GameUI = {
  root: HTMLElement
  mapEl: HTMLElement
  setProgress: (index: number, total: number) => void
  setPracticeProgress: (round: number) => void
  setCity: (name: string) => void
  setHint: (text: string) => void
  showFeedback: (distanceKm: number) => void
  clearFeedback: () => void
  setRunningScore: (km: number, roundsPlayed: number) => void
  setPracticeStats: (totalKm: number, roundsPlayed: number) => void
  setNextEnabled: (enabled: boolean, label: string) => void
  onNext: (cb: () => void) => void
  showResult: (opts: {
    dateKey: string
    guesses: GuessResult[]
    totalKm: number
    stats: Stats
    shareText: string
  }) => void
  hideResult: () => void
}

export function mountModePicker(
  app: HTMLElement,
  handlers: { onDaily: () => void; onPractice: () => void },
): void {
  app.innerHTML = `
    <main class="mode-picker">
      <a class="back-link" href="/">← Home</a>
      <h1 class="mode-brand">Czech Cities</h1>
      <p class="mode-lead">Find a city on a blind map. One guess, distance in km.</p>

      <section class="mode-section">
        <h2 class="mode-section-title">Daily challenge</h2>
        <p class="mode-section-lead">5 cities, one score per day. Lower km is better.</p>
        <div class="mode-actions">
          <button type="button" class="mode-card mode-card-daily mode-card-forest mode-card-wide" data-daily>
            <span class="mode-card-meta">
              <span>Czech Cities</span>
              <span>today</span>
            </span>
            <h3>Guess the location.</h3>
            <p>One challenge a day · your result is saved.</p>
            <span class="mode-play">Play today's →</span>
          </button>
        </div>
      </section>

      <section class="mode-section mode-section-practice">
        <h2 class="mode-section-title">Practice</h2>
        <div class="mode-actions">
          <button type="button" class="mode-card mode-card-practice" data-practice>
            <h3>Random cities</h3>
            <p>No limit, optionally filter by population</p>
          </button>
        </div>
      </section>
    </main>
  `

  app.querySelector<HTMLButtonElement>('[data-daily]')!.addEventListener(
    'click',
    handlers.onDaily,
  )
  app.querySelector<HTMLButtonElement>('[data-practice]')!.addEventListener(
    'click',
    handlers.onPractice,
  )
}

export function mountPracticeSetup(
  app: HTMLElement,
  options: {
    initial: PracticeFilter
    onStart: (filter: PopFilter) => void
    onBack: () => void
  },
): void {
  const bounds = getPopulationBounds()
  const initialMin = Math.min(
    Math.max(options.initial.min, bounds.min),
    bounds.max,
  )
  const initialMax = Math.min(
    Math.max(options.initial.max, initialMin),
    bounds.max,
  )

  app.innerHTML = `
    <main class="mode-picker practice-setup">
      <button type="button" class="modes-btn back-btn" data-back>← Modes</button>
      <h1 class="mode-brand">Practice</h1>
      <p class="mode-lead">Set the population range for cities you want to guess.</p>

      <form class="pop-form" data-form>
        <div class="pop-fields">
          <label class="pop-field">
            <span>Minimum population</span>
            <input type="number" name="min" min="0" max="${bounds.max}" step="1" value="${initialMin}" required />
          </label>
          <label class="pop-field">
            <span>Maximum population</span>
            <input type="number" name="max" min="0" max="${bounds.max}" step="1" value="${initialMax}" required />
          </label>
        </div>

        <div class="pop-presets" role="group" aria-label="Quick presets">
          <button type="button" class="preset-btn" data-preset="all">All</button>
          <button type="button" class="preset-btn" data-preset="small">Under 10k</button>
          <button type="button" class="preset-btn" data-preset="mid">10–50k</button>
          <button type="button" class="preset-btn" data-preset="large">Over 50k</button>
        </div>

        <p class="pop-count" data-count></p>
        <p class="pop-hint">City data: about ${formatPop(bounds.min)}–${formatPop(bounds.max)} people.</p>

        <button type="submit" class="btn pop-start" data-start>Start</button>
      </form>
    </main>
  `

  const form = app.querySelector<HTMLFormElement>('[data-form]')!
  const minInput = form.elements.namedItem('min') as HTMLInputElement
  const maxInput = form.elements.namedItem('max') as HTMLInputElement
  const countEl = app.querySelector<HTMLElement>('[data-count]')!
  const startBtn = app.querySelector<HTMLButtonElement>('[data-start]')!

  const readFilter = (): PopFilter => {
    let min = Number(minInput.value)
    let max = Number(maxInput.value)
    if (!Number.isFinite(min)) min = bounds.min
    if (!Number.isFinite(max)) max = bounds.max
    min = Math.round(min)
    max = Math.round(max)
    if (min > max) [min, max] = [max, min]
    return { min, max }
  }

  const refreshCount = (): void => {
    const filter = readFilter()
    const count = filterCitiesByPop(filter).length
    countEl.textContent =
      count === 0
        ? 'No cities in this range — adjust the limits.'
        : `${count} cities between ${formatPop(filter.min)}–${formatPop(filter.max)}.`
    startBtn.disabled = count === 0
  }

  minInput.addEventListener('input', refreshCount)
  maxInput.addEventListener('input', refreshCount)

  app.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const preset = btn.dataset.preset
      if (preset === 'all') {
        minInput.value = String(bounds.min)
        maxInput.value = String(bounds.max)
      } else if (preset === 'small') {
        minInput.value = String(bounds.min)
        maxInput.value = '10000'
      } else if (preset === 'mid') {
        minInput.value = '10000'
        maxInput.value = '50000'
      } else if (preset === 'large') {
        minInput.value = '50000'
        maxInput.value = String(bounds.max)
      }
      refreshCount()
    })
  })

  app.querySelector<HTMLButtonElement>('[data-back]')!.addEventListener(
    'click',
    options.onBack,
  )

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const filter = readFilter()
    if (filterCitiesByPop(filter).length === 0) return
    options.onStart(filter)
  })

  refreshCount()
}

export function mountGameUI(
  app: HTMLElement,
  options: {
    mode: GameMode
    practiceFilter?: PracticeFilter
    onPracticeSettings?: () => void
  },
): GameUI {
  const isPractice = options.mode === 'practice'
  const modesHref = '/mesta/'
  const filterLabel = options.practiceFilter
    ? `${formatPop(options.practiceFilter.min)}–${formatPop(options.practiceFilter.max)} pop.`
    : ''

  app.innerHTML = `
    <div class="game-shell">
      <header class="game-header">
        <div class="game-header-left">
          <a class="modes-btn" href="${modesHref}">← Modes</a>
          <h1 class="game-title">Czech Cities</h1>
        </div>
        <div class="progress-label" data-progress>
          ${isPractice ? 'Practice' : 'City 1/5'}
        </div>
      </header>

      <section class="hud">
        ${
          isPractice
            ? `<div class="practice-meta">
                <span data-filter-label>${filterLabel}</span>
                <button type="button" class="text-btn" data-settings>Change filter</button>
              </div>`
            : ''
        }
        <p class="city-prompt">Find on the map</p>
        <h2 class="city-name" data-city>—</h2>
        <p class="hint" data-hint>Click the map — you get one guess.</p>
        <div class="feedback" data-feedback hidden></div>
      </section>

      <div class="map-wrap">
        <div id="map"></div>
      </div>

      <footer class="game-footer">
        <div class="running-score" data-running>
          ${isPractice ? 'Average: <strong>—</strong>' : 'Total: <strong>0 km</strong>'}
        </div>
        <button type="button" class="btn" data-next disabled>
          ${isPractice ? 'Next city' : 'Next'}
        </button>
      </footer>
    </div>

    <div class="overlay" data-overlay hidden>
      <div class="result-panel" role="dialog" aria-labelledby="result-title">
        <h2 id="result-title">Daily result</h2>
        <p class="result-score" data-total></p>
        <ul class="result-list" data-list></ul>
        <p class="stats" data-stats></p>
        <div class="result-actions">
          <button type="button" class="btn" data-share>Share</button>
          <a class="btn btn-secondary" href="/mesta/?mode=practice">Practice</a>
          <button type="button" class="btn btn-secondary" data-close>Close</button>
        </div>
        <p class="share-toast" data-toast aria-live="polite"></p>
      </div>
    </div>
  `

  const progressEl = app.querySelector<HTMLElement>('[data-progress]')!
  const cityEl = app.querySelector<HTMLElement>('[data-city]')!
  const hintEl = app.querySelector<HTMLElement>('[data-hint]')!
  const feedbackEl = app.querySelector<HTMLElement>('[data-feedback]')!
  const runningEl = app.querySelector<HTMLElement>('[data-running]')!
  const nextBtn = app.querySelector<HTMLButtonElement>('[data-next]')!
  const overlay = app.querySelector<HTMLElement>('[data-overlay]')!
  const totalEl = app.querySelector<HTMLElement>('[data-total]')!
  const listEl = app.querySelector<HTMLElement>('[data-list]')!
  const statsEl = app.querySelector<HTMLElement>('[data-stats]')!
  const shareBtn = app.querySelector<HTMLButtonElement>('[data-share]')!
  const closeBtn = app.querySelector<HTMLButtonElement>('[data-close]')!
  const toastEl = app.querySelector<HTMLElement>('[data-toast]')!
  const mapEl = app.querySelector<HTMLElement>('#map')!

  let nextCb: (() => void) | null = null
  let currentShareText = ''

  nextBtn.addEventListener('click', () => nextCb?.())
  app.querySelector<HTMLButtonElement>('[data-settings]')?.addEventListener(
    'click',
    () => options.onPracticeSettings?.(),
  )
  closeBtn.addEventListener('click', () => {
    overlay.hidden = true
  })
  shareBtn.addEventListener('click', async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(currentShareText)
      } else {
        const ta = document.createElement('textarea')
        ta.value = currentShareText
        ta.style.position = 'fixed'
        ta.style.left = '-9999px'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        ta.remove()
      }
      toastEl.textContent = 'Copied to clipboard.'
    } catch {
      toastEl.textContent = 'Copy failed — try it manually.'
    }
  })

  return {
    root: app,
    mapEl,

    setProgress(index, total) {
      progressEl.textContent = `City ${index}/${total}`
    },

    setPracticeProgress(round) {
      progressEl.textContent = `Guess ${round}`
    },

    setCity(name) {
      cityEl.textContent = name
    },

    setHint(text) {
      hintEl.textContent = text
      hintEl.hidden = !text
    },

    showFeedback(distanceKm) {
      feedbackEl.hidden = false
      feedbackEl.innerHTML = `<p class="distance">Distance: <strong>${distanceKm} km</strong></p>`
    },

    clearFeedback() {
      feedbackEl.hidden = true
      feedbackEl.innerHTML = ''
    },

    setRunningScore(km, roundsPlayed) {
      if (roundsPlayed === 0) {
        runningEl.innerHTML = `Total: <strong>0 km</strong>`
      } else {
        runningEl.innerHTML = `Total after ${roundsPlayed}: <strong>${km} km</strong>`
      }
    },

    setPracticeStats(totalKm, roundsPlayed) {
      if (roundsPlayed === 0) {
        runningEl.innerHTML = `Average: <strong>—</strong>`
      } else {
        const avg = Math.round(totalKm / roundsPlayed)
        runningEl.innerHTML = `Average: <strong>${avg} km</strong> · ${roundsPlayed} guesses`
      }
    },

    setNextEnabled(enabled, label) {
      nextBtn.disabled = !enabled
      nextBtn.textContent = label
    },

    onNext(cb) {
      nextCb = cb
    },

    showResult({ dateKey, guesses, totalKm, stats, shareText }) {
      currentShareText = shareText
      toastEl.textContent = ''
      totalEl.textContent = `${totalKm} km`
      listEl.innerHTML = guesses
        .map(
          (g) =>
            `<li><span>${g.cityName}</span><span>${g.distanceKm} km</span></li>`,
        )
        .join('')

      const avg =
        stats.gamesPlayed > 0
          ? Math.round(stats.totalKmAllTime / stats.gamesPlayed)
          : totalKm
      const best = stats.bestScore ?? totalKm
      statsEl.innerHTML = `
        ${formatCzechDate(dateKey)} · played ${stats.gamesPlayed}×<br />
        Best score: ${best} km · average: ${avg} km
      `
      overlay.hidden = false
    },

    hideResult() {
      overlay.hidden = true
    },
  }
}

export function buildShareText(
  dateKey: string,
  guesses: GuessResult[],
  totalKm: number,
): string {
  const lines = guesses.map((g) => `${g.distanceKm} km`).join('\n')
  return `Czech Cities ${formatCzechDate(dateKey)}\n${lines}\nTotal: ${totalKm} km`
}
