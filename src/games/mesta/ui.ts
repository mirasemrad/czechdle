import type {
  DailyResult,
  GuessResult,
  PracticeFilter,
  Stats,
} from '../../shared/storage'
import { getScoreboard } from '../../shared/storage'
import { formatCzechDate } from '../../shared/dateSeed'
import {
  filterCitiesByPop,
  getPopulationBounds,
  type PopFilter,
} from './daily'

export type GameMode = 'daily' | 'practice'

function formatPop(n: number): string {
  return n.toLocaleString('cs-CZ')
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

function renderScoreRows(results: DailyResult[]): string {
  if (results.length === 0) return ''
  return results
    .map(
      (r, i) => `<tr>
        <td class="scoreboard-rank">#${i + 1}</td>
        <td>${formatCzechDate(r.dateKey)}</td>
        <td class="scoreboard-km">${r.totalKm} km</td>
      </tr>`,
    )
    .join('')
}

function renderScoreboardHtml(): string {
  const board = getScoreboard({ bestCount: 5, worstCount: 3 })
  if (board.gamesPlayed === 0) {
    return `
      <section class="mode-section scoreboard" data-scoreboard>
        <h2 class="mode-section-title">Tvoje skóre</h2>
        <p class="mode-section-lead">Zatím žádná dokončená denní výzva. Zahraj si první!</p>
      </section>
    `
  }

  const historyRows = board.history
    .map(
      (r) => `<tr>
        <td>${formatCzechDate(r.dateKey)}</td>
        <td class="scoreboard-km">${r.totalKm} km</td>
      </tr>`,
    )
    .join('')

  return `
    <section class="mode-section scoreboard" data-scoreboard>
      <h2 class="mode-section-title">Tvoje skóre</h2>
      <p class="mode-section-lead">Jen denní výzvy · čím méně km, tím lépe.</p>

      <div class="scoreboard-summary">
        <div class="scoreboard-stat">
          <span class="scoreboard-stat-label">Odehráno</span>
          <span class="scoreboard-stat-value">${board.gamesPlayed}×</span>
        </div>
        <div class="scoreboard-stat">
          <span class="scoreboard-stat-label">Průměr</span>
          <span class="scoreboard-stat-value">${board.averageKm} km</span>
        </div>
        <div class="scoreboard-stat">
          <span class="scoreboard-stat-label">Nejlepší</span>
          <span class="scoreboard-stat-value">${board.bestKm} km</span>
        </div>
        <div class="scoreboard-stat">
          <span class="scoreboard-stat-label">Nejhorší</span>
          <span class="scoreboard-stat-value">${board.worstKm} km</span>
        </div>
      </div>

      <div class="scoreboard-grid">
        <div class="scoreboard-block">
          <h3 class="scoreboard-heading">Top 5 nejlepších</h3>
          <table class="scoreboard-table">
            <thead><tr><th></th><th>Datum</th><th>Skóre</th></tr></thead>
            <tbody>${renderScoreRows(board.best)}</tbody>
          </table>
        </div>
        <div class="scoreboard-block">
          <h3 class="scoreboard-heading">3 nejhorší</h3>
          <table class="scoreboard-table">
            <thead><tr><th></th><th>Datum</th><th>Skóre</th></tr></thead>
            <tbody>${renderScoreRows(board.worst)}</tbody>
          </table>
        </div>
      </div>

      <details class="scoreboard-history">
        <summary>Celá historie (${board.gamesPlayed})</summary>
        <table class="scoreboard-table scoreboard-table-history">
          <thead><tr><th>Datum</th><th>Skóre</th></tr></thead>
          <tbody>${historyRows}</tbody>
        </table>
      </details>
    </section>
  `
}

export function mountModePicker(
  app: HTMLElement,
  handlers: { onDaily: () => void; onPractice: () => void },
): void {
  app.innerHTML = `
    <main class="mode-picker">
      <a class="back-link" href="/">← Domů</a>
      <h1 class="mode-brand">Slepá mapa</h1>
      <p class="mode-lead">Najdi město na slepé mapě. Jeden tip, vzdálenost v km.</p>

      <section class="mode-section">
        <h2 class="mode-section-title">Denní výzva</h2>
        <p class="mode-section-lead">5 měst, jedno skóre na den. Čím méně km, tím lépe.</p>
        <div class="mode-actions">
          <button type="button" class="mode-card mode-card-daily mode-card-forest mode-card-wide" data-daily>
            <span class="mode-card-meta">
              <span>Slepá mapa</span>
              <span>dnes</span>
            </span>
            <h3>Uhodni polohu.</h3>
            <p>Jedna výzva denně · výsledek se uloží.</p>
            <span class="mode-play">Hrát dnešní →</span>
          </button>
        </div>
      </section>

      <section class="mode-section mode-section-practice">
        <h2 class="mode-section-title">Procvičování</h2>
        <div class="mode-actions">
          <button type="button" class="mode-card mode-card-practice" data-practice>
            <h3>Náhodná města</h3>
            <p>Bez limitu, volitelně podle počtu obyvatel</p>
          </button>
        </div>
      </section>

      ${renderScoreboardHtml()}
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
      <button type="button" class="modes-btn back-btn" data-back>← Režimy</button>
      <h1 class="mode-brand">Procvičování</h1>
      <p class="mode-lead">Nastav rozsah obyvatel měst, která chceš hádat.</p>

      <form class="pop-form" data-form>
        <div class="pop-fields">
          <label class="pop-field">
            <span>Minimum obyvatel</span>
            <input type="number" name="min" min="0" max="${bounds.max}" step="1" value="${initialMin}" required />
          </label>
          <label class="pop-field">
            <span>Maximum obyvatel</span>
            <input type="number" name="max" min="0" max="${bounds.max}" step="1" value="${initialMax}" required />
          </label>
        </div>

        <div class="pop-presets" role="group" aria-label="Rychlé volby">
          <button type="button" class="preset-btn" data-preset="all">Všechna</button>
          <button type="button" class="preset-btn" data-preset="small">Do 10 tis.</button>
          <button type="button" class="preset-btn" data-preset="mid">10–50 tis.</button>
          <button type="button" class="preset-btn" data-preset="large">Nad 50 tis.</button>
        </div>

        <p class="pop-count" data-count></p>
        <p class="pop-hint">Data měst: cca ${formatPop(bounds.min)}–${formatPop(bounds.max)} obyvatel.</p>

        <button type="submit" class="btn pop-start" data-start>Spustit</button>
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
        ? 'V tomto rozsahu není žádné město — uprav limity.'
        : `V rozsahu ${formatPop(filter.min)}–${formatPop(filter.max)} je ${count} měst.`
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
    ? `${formatPop(options.practiceFilter.min)}–${formatPop(options.practiceFilter.max)} obyv.`
    : ''

  app.innerHTML = `
    <div class="game-shell">
      <header class="game-header">
        <div class="game-header-left">
          <a class="modes-btn" href="${modesHref}">← Režimy</a>
          <h1 class="game-title">Slepá mapa</h1>
        </div>
        <div class="progress-label" data-progress>
          ${isPractice ? 'Procvičování' : 'Město 1/5'}
        </div>
      </header>

      <section class="hud">
        ${
          isPractice
            ? `<div class="practice-meta">
                <span data-filter-label>${filterLabel}</span>
                <button type="button" class="text-btn" data-settings>Změnit filtr</button>
              </div>`
            : ''
        }
        <p class="city-prompt">Najdi na mapě</p>
        <h2 class="city-name" data-city>—</h2>
        <p class="hint" data-hint>Klikni na mapu — máš jeden tip.</p>
        <div class="feedback" data-feedback hidden></div>
      </section>

      <div class="map-wrap">
        <div id="map"></div>
      </div>

      <footer class="game-footer">
        <div class="running-score" data-running>
          ${isPractice ? 'Průměr: <strong>—</strong>' : 'Součet: <strong>0 km</strong>'}
        </div>
        <button type="button" class="btn" data-next disabled>
          ${isPractice ? 'Další město' : 'Další'}
        </button>
      </footer>
    </div>

    <div class="overlay" data-overlay hidden>
      <div class="result-panel" role="dialog" aria-labelledby="result-title">
        <h2 id="result-title">Denní výsledek</h2>
        <p class="result-score" data-total></p>
        <ul class="result-list" data-list></ul>
        <p class="stats" data-stats></p>
        <div class="result-actions">
          <button type="button" class="btn" data-share>Sdílet</button>
          <a class="btn btn-secondary" href="/mesta/">Tvoje skóre</a>
          <a class="btn btn-secondary" href="/mesta/?mode=practice">Procvičování</a>
          <button type="button" class="btn btn-secondary" data-close>Zavřít</button>
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
      toastEl.textContent = 'Zkopírováno do schránky.'
    } catch {
      toastEl.textContent = 'Kopírování se nepovedlo — zkus to ručně.'
    }
  })

  return {
    root: app,
    mapEl,

    setProgress(index, total) {
      progressEl.textContent = `Město ${index}/${total}`
    },

    setPracticeProgress(round) {
      progressEl.textContent = `Tip ${round}`
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
      feedbackEl.innerHTML = `<p class="distance">Vzdálenost: <strong>${distanceKm} km</strong></p>`
    },

    clearFeedback() {
      feedbackEl.hidden = true
      feedbackEl.innerHTML = ''
    },

    setRunningScore(km, roundsPlayed) {
      if (roundsPlayed === 0) {
        runningEl.innerHTML = `Součet: <strong>0 km</strong>`
      } else {
        runningEl.innerHTML = `Součet po ${roundsPlayed}: <strong>${km} km</strong>`
      }
    },

    setPracticeStats(totalKm, roundsPlayed) {
      if (roundsPlayed === 0) {
        runningEl.innerHTML = `Průměr: <strong>—</strong>`
      } else {
        const avg = Math.round(totalKm / roundsPlayed)
        runningEl.innerHTML = `Průměr: <strong>${avg} km</strong> · ${roundsPlayed} tipů`
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

      const board = getScoreboard()
      const avg = board.averageKm ?? totalKm
      const best = board.bestKm ?? stats.bestScore ?? totalKm
      const played = board.gamesPlayed || stats.gamesPlayed
      statsEl.innerHTML = `
        ${formatCzechDate(dateKey)} · odehráno ${played}×<br />
        Nejlepší: ${best} km · průměr: ${avg} km
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
  return `Czechdle Slepá mapa ${formatCzechDate(dateKey)}\n${lines}\nCelkem: ${totalKm} km`
}
