import { formatCzechDate } from '../../shared/dateSeed'
import { formatEventYear, type HistoryEvent } from '../../shared/events'
import { HAND_PER_ROUND } from './daily'
import type { TimelineGuess } from './storage'

export type TimelineUI = {
  root: HTMLElement
  setProgress: (placed: number, total: number) => void
  setHint: (text: string) => void
  render: (state: {
    remaining: HistoryEvent[]
    line: HistoryEvent[]
    fixedIds: Set<string>
    interactive: boolean
  }) => void
  showFeedback: (ok: boolean, detail: string) => void
  clearFeedback: () => void
  setScore: (correct: number, total: number) => void
  setNextEnabled: (enabled: boolean, label: string) => void
  onNext: (cb: () => void) => void
  onDrop: (cb: (eventId: string, index: number) => void) => void
  showResult: (opts: {
    dateKey: string
    guesses: TimelineGuess[]
    score: number
    shareText: string
  }) => void
}

type DragState = {
  id: string
  pointerId: number
  ghost: HTMLElement
  source: HTMLElement
  activeSlot: HTMLElement | null
  moved: boolean
  startX: number
  startY: number
}

export function mountModePicker(
  app: HTMLElement,
  handlers: { onDaily: () => void; onPractice: () => void },
): void {
  app.innerHTML = `
    <main class="mode-picker">
      <a class="back-link" href="/">← Domů</a>
      <h1 class="mode-brand">Timeline</h1>
      <p class="mode-lead">
        Na ose už je 5 událostí s roky. Přidej mezi ně svých 5 karet.
      </p>

      <section class="mode-section">
        <h2 class="mode-section-title">Denní výzva</h2>
        <p class="mode-section-lead">Jedna sada denně. Skóre se uloží.</p>
        <div class="mode-actions">
          <button type="button" class="mode-card mode-card-daily mode-card-amber mode-card-wide" data-daily>
            <span class="mode-card-meta">
              <span>Timeline</span>
              <span>dnes</span>
            </span>
            <h3>Doplň časovou osu.</h3>
            <p>5 daných · 5 tvých · výsledek se uloží.</p>
            <span class="mode-play">Hrát dnešní →</span>
          </button>
        </div>
      </section>

      <section class="mode-section mode-section-practice">
        <h2 class="mode-section-title">Procvičování</h2>
        <div class="mode-actions">
          <button type="button" class="mode-card mode-card-practice" data-practice>
            <h3>Náhodné sady</h3>
            <p>Neomezené kola, bez uloženého skóre</p>
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

export function mountTimelineUI(app: HTMLElement): TimelineUI {
  const practiceHref = '/timeline/?mode=practice'

  app.innerHTML = `
    <div class="game-shell timeline-shell">
      <header class="game-header">
        <div class="game-header-left">
          <a class="modes-btn" href="/timeline/">← Režimy</a>
          <h1 class="game-title">Timeline</h1>
        </div>
        <div class="progress-label" data-progress>0/${HAND_PER_ROUND}</div>
      </header>

      <section class="hud">
        <p class="city-prompt">Časová osa</p>
        <p class="hint" data-hint>Na ose je 5 událostí. Vlož mezi ně svých 5 karet.</p>
        <div class="feedback" data-feedback hidden></div>
      </section>

      <div class="timeline-main">
        <div class="pool-block">
          <p class="pool-label">Karty událostí</p>
          <div class="city-pool" data-pool></div>
        </div>

        <div class="axis-block timeline-axis">
          <div class="axis-labels">
            <span>Dříve</span>
            <span>Později</span>
          </div>
          <div class="axis-track axis-track-ew timeline-track" data-board></div>
        </div>
      </div>

      <footer class="game-footer">
        <div class="running-score" data-score>Skóre: <strong>0/0</strong></div>
        <button type="button" class="btn" data-next disabled>Další</button>
      </footer>
    </div>

    <div class="overlay" data-overlay hidden>
      <div class="result-panel" role="dialog" aria-labelledby="timeline-result-title">
        <h2 id="timeline-result-title">Denní výsledek</h2>
        <p class="result-score" data-total></p>
        <ul class="result-list" data-list></ul>
        <p class="stats" data-stats></p>
        <div class="result-actions">
          <button type="button" class="btn" data-share>Sdílet</button>
          <a class="btn btn-secondary" href="${practiceHref}">Procvičování</a>
          <button type="button" class="btn btn-secondary" data-close>Zavřít</button>
        </div>
        <p class="share-toast" data-toast aria-live="polite"></p>
      </div>
    </div>
  `

  const progressEl = app.querySelector<HTMLElement>('[data-progress]')!
  const hintEl = app.querySelector<HTMLElement>('[data-hint]')!
  const poolEl = app.querySelector<HTMLElement>('[data-pool]')!
  const boardEl = app.querySelector<HTMLElement>('[data-board]')!
  const feedbackEl = app.querySelector<HTMLElement>('[data-feedback]')!
  const scoreEl = app.querySelector<HTMLElement>('[data-score]')!
  const nextBtn = app.querySelector<HTMLButtonElement>('[data-next]')!
  const overlay = app.querySelector<HTMLElement>('[data-overlay]')!
  const totalEl = app.querySelector<HTMLElement>('[data-total]')!
  const listEl = app.querySelector<HTMLElement>('[data-list]')!
  const statsEl = app.querySelector<HTMLElement>('[data-stats]')!
  const shareBtn = app.querySelector<HTMLButtonElement>('[data-share]')!
  const closeBtn = app.querySelector<HTMLButtonElement>('[data-close]')!
  const toastEl = app.querySelector<HTMLElement>('[data-toast]')!

  let nextCb: (() => void) | null = null
  let dropCb: ((eventId: string, index: number) => void) | null = null
  let shareText = ''
  let interactive = true
  let drag: DragState | null = null
  let selectedId: string | null = null

  nextBtn.addEventListener('click', () => nextCb?.())
  closeBtn.addEventListener('click', () => {
    overlay.hidden = true
  })
  shareBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      toastEl.textContent = 'Zkopírováno do schránky.'
    } catch {
      toastEl.textContent = 'Kopírování se nepovedlo — zkus to ručně.'
    }
  })

  const clearSlotHighlight = (): void => {
    boardEl.querySelectorAll('.drop-slot.over').forEach((el) => {
      el.classList.remove('over')
      el.querySelector('.slot-preview')?.remove()
    })
  }

  const highlightSlot = (slot: HTMLElement | null): void => {
    clearSlotHighlight()
    if (!slot) return
    slot.classList.add('over')
    if (!slot.querySelector('.slot-preview')) {
      const preview = document.createElement('span')
      preview.className = 'slot-preview'
      slot.appendChild(preview)
    }
  }

  const slotAtPoint = (x: number, y: number): HTMLElement | null => {
    const slots = [
      ...boardEl.querySelectorAll<HTMLElement>('.drop-slot'),
    ]
    if (slots.length === 0) return null

    // Prefer direct hit, else nearest by midpoints along the row
    const hit = document.elementFromPoint(x, y)
    const direct = hit?.closest?.('.drop-slot') as HTMLElement | null
    if (direct && boardEl.contains(direct)) return direct

    let best: HTMLElement | null = null
    let bestDist = Infinity
    for (const slot of slots) {
      const r = slot.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      const d = (x - cx) ** 2 + (y - cy) ** 2
      if (d < bestDist) {
        bestDist = d
        best = slot
      }
    }
    return best
  }

  const endDrag = (commit: boolean): void => {
    if (!drag) return
    const { ghost, source, activeSlot, id, moved } = drag
    ghost.remove()
    source.classList.remove('is-source')
    boardEl.classList.remove('dragging-active')
    document.body.classList.remove('smery-dragging')
    clearSlotHighlight()
    drag = null

    if (commit && moved && activeSlot) {
      dropCb?.(id, Number(activeSlot.dataset.index))
      selectedId = null
      return
    }

    if (!commit && !moved) {
      selectedId = id
      source.classList.add('holding')
      boardEl.classList.add('awaiting-drop')
      hintEl.textContent = `Vybráno. Klepni mezi události na ose.`
      return
    }

    if (!commit) {
      selectedId = null
      poolEl.querySelectorAll('.city-card.holding').forEach((c) => {
        c.classList.remove('holding')
      })
      boardEl.classList.remove('awaiting-drop')
    }
  }

  const onPointerMove = (e: PointerEvent): void => {
    if (!drag || e.pointerId !== drag.pointerId) return
    const dx = e.clientX - drag.startX
    const dy = e.clientY - drag.startY
    if (!drag.moved && dx * dx + dy * dy > 25) {
      drag.moved = true
      selectedId = null
      poolEl.querySelectorAll('.city-card.holding').forEach((c) => {
        c.classList.remove('holding')
      })
      boardEl.classList.remove('awaiting-drop')
      hintEl.textContent = 'Pusť kartu mezi události na ose.'
    }
    drag.ghost.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`
    if (!drag.moved) return
    const slot = slotAtPoint(e.clientX, e.clientY)
    drag.activeSlot = slot
    highlightSlot(slot)
  }

  const onPointerUp = (e: PointerEvent): void => {
    if (!drag || e.pointerId !== drag.pointerId) return
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
    window.removeEventListener('pointercancel', onPointerUp)
    endDrag(drag.moved)
  }

  const startDrag = (
    source: HTMLElement,
    id: string,
    e: PointerEvent,
  ): void => {
    if (!interactive) return
    e.preventDefault()
    const ghost = document.createElement('div')
    ghost.className = 'drag-ghost'
    ghost.textContent = source.textContent
    ghost.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`
    document.body.appendChild(ghost)
    source.classList.add('is-source')
    source.classList.remove('holding')
    boardEl.classList.add('dragging-active')
    document.body.classList.add('smery-dragging')
    drag = {
      id,
      pointerId: e.pointerId,
      ghost,
      source,
      activeSlot: null,
      moved: false,
      startX: e.clientX,
      startY: e.clientY,
    }
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
  }

  const bindCard = (el: HTMLElement, id: string): void => {
    el.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return
      startDrag(el, id, e)
    })
  }

  const bindSlots = (): void => {
    boardEl.querySelectorAll<HTMLElement>('.drop-slot').forEach((slot) => {
      slot.addEventListener('click', () => {
        if (!selectedId || !interactive) return
        dropCb?.(selectedId, Number(slot.dataset.index))
        selectedId = null
        boardEl.classList.remove('awaiting-drop')
      })
    })
  }

  const renderPool = (items: HistoryEvent[]): void => {
    if (items.length === 0) {
      poolEl.innerHTML = `<p class="pool-empty">Všechny karty jsou umístěné.</p>`
      return
    }
    poolEl.innerHTML = items
      .map(
        (ev) =>
          `<button type="button" class="city-card timeline-card${ev.id === selectedId ? ' holding' : ''}" data-event="${ev.id}">${ev.title}</button>`,
      )
      .join('')
    poolEl.querySelectorAll<HTMLElement>('[data-event]').forEach((el) => {
      bindCard(el, el.dataset.event!)
    })
  }

  const renderBoard = (line: HistoryEvent[], fixedIds: Set<string>): void => {
    const parts: string[] = []
    const slot = (index: number) =>
      interactive
        ? `<button type="button" class="drop-slot" data-index="${index}" aria-label="Vložit sem"></button>`
        : ''

    for (let i = 0; i <= line.length; i++) {
      parts.push(slot(i))
      if (i < line.length) {
        const ev = line[i]
        const isFixed = fixedIds.has(ev.id)
        parts.push(
          `<div class="placed-card timeline-placed${isFixed ? ' timeline-fixed' : ''}"><span class="placed-card-name">${ev.title}</span><span class="axis-offset">${formatEventYear(ev)}</span></div>`,
        )
      }
    }

    boardEl.innerHTML = parts.join('')
    boardEl.classList.toggle(
      'awaiting-drop',
      Boolean(selectedId) && interactive,
    )
    if (interactive) bindSlots()
  }

  return {
    root: app,

    setProgress(placed, total) {
      progressEl.textContent = `${placed}/${total}`
    },

    setHint(text) {
      hintEl.textContent = text
      hintEl.hidden = !text
    },

    render({ remaining, line, fixedIds, interactive: canInteract }) {
      interactive = canInteract
      if (!canInteract) selectedId = null
      renderPool(remaining)
      renderBoard(line, fixedIds)
    },

    showFeedback(ok, detail) {
      feedbackEl.hidden = false
      feedbackEl.innerHTML = `<p class="distance">${ok ? 'Správně' : 'Špatně'} — <strong>${detail}</strong></p>`
      feedbackEl.dataset.ok = ok ? '1' : '0'
    },

    clearFeedback() {
      feedbackEl.hidden = true
      feedbackEl.innerHTML = ''
      delete feedbackEl.dataset.ok
    },

    setScore(correct, total) {
      scoreEl.innerHTML = `Skóre: <strong>${correct}/${total}</strong>`
    },

    setNextEnabled(enabled, label) {
      nextBtn.disabled = !enabled
      nextBtn.textContent = label
    },

    onNext(cb) {
      nextCb = cb
    },

    onDrop(cb) {
      dropCb = cb
    },

    showResult({ dateKey, guesses, score, shareText: text }) {
      shareText = text
      toastEl.textContent = ''
      totalEl.textContent = `${score}/${guesses.length}`
      listEl.innerHTML = guesses
        .map(
          (g) =>
            `<li><span>${g.eventTitle}</span><span>${g.correct ? '✓' : '✗'} ${g.year}</span></li>`,
        )
        .join('')
      statsEl.textContent = `${formatCzechDate(dateKey)} · 5 daných + 5 tvých`
      overlay.hidden = false
    },
  }
}

export function buildTimelineShare(
  dateKey: string,
  score: number,
  total: number,
  guesses: TimelineGuess[],
): string {
  const marks = guesses.map((g) => (g.correct ? '🟩' : '⬛')).join('')
  return `Czechdle Timeline ${formatCzechDate(dateKey)}\n${score}/${total}\n${marks}`
}
