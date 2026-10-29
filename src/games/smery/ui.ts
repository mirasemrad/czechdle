import type { City } from '../../shared/cities'
import { formatCzechDate } from '../../shared/dateSeed'
import { CITIES_PER_ROUND } from './daily'
import {
  AXIS_LABEL,
  axisOffsetShort,
  dirLabel,
  type Axis,
  type Dir,
  type Rays,
} from './logic'
import type { SmeryGuess } from './storage'

export type DropTarget = {
  dir: Dir
  index: number
}

export type SmeryUI = {
  root: HTMLElement
  mapEl: HTMLElement
  setProgress: (placed: number, total: number) => void
  setAnchor: (name: string) => void
  setHint: (text: string) => void
  render: (state: {
    remaining: City[]
    anchor: City
    rays: Rays
    interactive: boolean
  }) => void
  showFeedback: (ok: boolean, detail: string) => void
  clearFeedback: () => void
  setScore: (correct: number, total: number) => void
  setNextEnabled: (enabled: boolean, label: string) => void
  onNext: (cb: () => void) => void
  onDrop: (cb: (name: string, target: DropTarget) => void) => void
  showResult: (opts: {
    dateKey: string
    axis: Axis
    anchorName: string
    guesses: SmeryGuess[]
    score: number
    shareText: string
  }) => void
}

type DragState = {
  name: string
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
  handlers: {
    onDaily: (axis: Axis) => void
    onPractice: (axis: Axis) => void
  },
): void {
  app.innerHTML = `
    <main class="mode-picker">
      <a class="back-link" href="/">← Home</a>
      <h1 class="mode-brand">Directions</h1>
      <p class="mode-lead">
        Drag 5 city cards onto the axis from the starting city — in the right order.
      </p>

      <section class="mode-section">
        <h2 class="mode-section-title">Daily challenge</h2>
        <p class="mode-section-lead">One set per day. Your score is saved.</p>
        <div class="mode-actions mode-actions-daily">
          <button type="button" class="mode-card mode-card-daily mode-card-forest" data-daily-ew>
            <span class="mode-card-meta">
              <span>Daily</span>
              <span>W–E</span>
            </span>
            <h3>West–East</h3>
            <p>Horizontal axis from the starting city.</p>
            <span class="mode-play">Play today's →</span>
          </button>
          <button type="button" class="mode-card mode-card-daily mode-card-sky" data-daily-ns>
            <span class="mode-card-meta">
              <span>Daily</span>
              <span>N–S</span>
            </span>
            <h3>North–South</h3>
            <p>Vertical axis from the starting city.</p>
            <span class="mode-play">Play today's →</span>
          </button>
        </div>
      </section>

      <section class="mode-section mode-section-practice">
        <h2 class="mode-section-title">Practice</h2>
        <div class="mode-actions mode-actions-practice">
          <button type="button" class="mode-card mode-card-practice" data-practice-ew>
            <h3>West–East</h3>
            <p>Random sets</p>
          </button>
          <button type="button" class="mode-card mode-card-practice" data-practice-ns>
            <h3>North–South</h3>
            <p>Random sets</p>
          </button>
        </div>
      </section>
    </main>
  `

  app.querySelector<HTMLButtonElement>('[data-daily-ew]')!.addEventListener(
    'click',
    () => handlers.onDaily('ew'),
  )
  app.querySelector<HTMLButtonElement>('[data-daily-ns]')!.addEventListener(
    'click',
    () => handlers.onDaily('ns'),
  )
  app.querySelector<HTMLButtonElement>('[data-practice-ew]')!.addEventListener(
    'click',
    () => handlers.onPractice('ew'),
  )
  app.querySelector<HTMLButtonElement>('[data-practice-ns]')!.addEventListener(
    'click',
    () => handlers.onPractice('ns'),
  )
}

export function mountSmeryUI(app: HTMLElement, axis: Axis): SmeryUI {
  const labels = AXIS_LABEL[axis]
  const vertical = axis === 'ns'
  const practiceHref = `/smery/?mode=practice&axis=${axis}`

  app.innerHTML = `
    <div class="game-shell smery-shell">
      <header class="game-header">
        <div class="game-header-left">
          <a class="modes-btn" href="/smery/">← Modes</a>
          <h1 class="game-title">Directions · ${labels.title}</h1>
        </div>
        <div class="progress-label" data-progress>0/${CITIES_PER_ROUND}</div>
      </header>

      <section class="hud smery-hud">
        <p class="city-prompt">Starting city</p>
        <h2 class="city-name" data-anchor>—</h2>
        <p class="hint" data-hint>Grab a card and drag it between cities on the axis.</p>
        <div class="feedback" data-feedback hidden></div>
      </section>

      <div class="smery-main smery-main-stack">
        <div class="map-wrap smery-map-wrap">
          <div id="map"></div>
        </div>

        <aside class="smery-panel">
          <div class="pool-block">
            <p class="pool-label">City cards</p>
            <div class="city-pool" data-pool></div>
          </div>

          <div class="axis-block">
            <div class="axis-labels ${vertical ? 'axis-labels-ns' : ''}">
              <span>${vertical ? labels.pos : labels.neg}</span>
              <span>${vertical ? labels.neg : labels.pos}</span>
            </div>
            <div class="axis-track ${vertical ? 'axis-track-ns' : 'axis-track-ew'}" data-board></div>
          </div>
        </aside>
      </div>

      <footer class="game-footer">
        <div class="running-score" data-score>Score: <strong>0/0</strong></div>
        <button type="button" class="btn" data-next disabled>Next</button>
      </footer>
    </div>

    <div class="overlay" data-overlay hidden>
      <div class="result-panel" role="dialog" aria-labelledby="smery-result-title">
        <h2 id="smery-result-title">Daily result</h2>
        <p class="result-score" data-total></p>
        <ul class="result-list" data-list></ul>
        <p class="stats" data-stats></p>
        <div class="result-actions">
          <button type="button" class="btn" data-share>Share</button>
          <a class="btn btn-secondary" href="${practiceHref}">Practice</a>
          <button type="button" class="btn btn-secondary" data-close>Close</button>
        </div>
        <p class="share-toast" data-toast aria-live="polite"></p>
      </div>
    </div>
  `

  const progressEl = app.querySelector<HTMLElement>('[data-progress]')!
  const anchorEl = app.querySelector<HTMLElement>('[data-anchor]')!
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
  const mapEl = app.querySelector<HTMLElement>('#map')!

  let nextCb: (() => void) | null = null
  let dropCb: ((name: string, target: DropTarget) => void) | null = null
  let shareText = ''
  let interactive = true
  let drag: DragState | null = null
  let selectedName: string | null = null

  nextBtn.addEventListener('click', () => nextCb?.())
  closeBtn.addEventListener('click', () => {
    overlay.hidden = true
  })
  shareBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      toastEl.textContent = 'Copied to clipboard.'
    } catch {
      toastEl.textContent = 'Copy failed — try it manually.'
    }
  })

  const clearSlotPreview = (): void => {
    boardEl.querySelectorAll('.drop-slot').forEach((slot) => {
      slot.classList.remove('over')
      slot.querySelector('.slot-preview')?.remove()
    })
  }

  const setSlotPreview = (slot: HTMLElement | null, name: string): void => {
    boardEl.querySelectorAll('.drop-slot').forEach((s) => {
      if (s !== slot) {
        s.classList.remove('over')
        s.querySelector('.slot-preview')?.remove()
      }
    })

    if (!slot) return
    slot.classList.add('over')
    if (!slot.querySelector('.slot-preview')) {
      const preview = document.createElement('span')
      preview.className = 'slot-preview'
      preview.textContent = name
      slot.appendChild(preview)
    }
  }

  const isStableCard = (el: HTMLElement): boolean =>
    el.classList.contains('placed-card') || el.classList.contains('anchor-card')

  const axisMid = (el: HTMLElement): number => {
    const r = el.getBoundingClientRect()
    return vertical ? r.top + r.height / 2 : r.left + r.width / 2
  }

  /** Pick insert gap by pointer position between cards — not tiny slot hitboxes. */
  const findSlotAt = (x: number, y: number): HTMLElement | null => {
    const boardRect = boardEl.getBoundingClientRect()
    const pad = 56
    if (
      x < boardRect.left - pad ||
      x > boardRect.right + pad ||
      y < boardRect.top - pad ||
      y > boardRect.bottom + pad
    ) {
      return null
    }

    const children = Array.from(boardEl.children) as HTMLElement[]
    const slots = children.filter((el) => el.classList.contains('drop-slot'))
    if (slots.length === 0) return null

    const coord = vertical ? y : x
    const boardStart = (vertical ? boardRect.top : boardRect.left) - pad
    const boardEnd = (vertical ? boardRect.bottom : boardRect.right) + pad

    for (let i = 0; i < children.length; i++) {
      const el = children[i]
      if (!el.classList.contains('drop-slot')) continue

      let prevStable: HTMLElement | null = null
      for (let j = i - 1; j >= 0; j--) {
        if (isStableCard(children[j])) {
          prevStable = children[j]
          break
        }
      }

      let nextStable: HTMLElement | null = null
      for (let j = i + 1; j < children.length; j++) {
        if (isStableCard(children[j])) {
          nextStable = children[j]
          break
        }
      }

      const start = prevStable ? axisMid(prevStable) : boardStart
      const end = nextStable ? axisMid(nextStable) : boardEnd

      if (coord >= start && coord < end) return el
    }

    // Fallback: nearest gap along the axis (e.g. past the last card edge).
    let best: HTMLElement | null = null
    let bestDist = Infinity
    for (const slot of slots) {
      const dist = Math.abs(coord - axisMid(slot))
      if (dist < bestDist) {
        bestDist = dist
        best = slot
      }
    }
    return best
  }

  const endDrag = (commit: boolean): void => {
    if (!drag) return
    const { name, ghost, source, activeSlot, pointerId } = drag

    try {
      source.releasePointerCapture(pointerId)
    } catch {
      /* ignore */
    }

    ghost.remove()
    source.classList.remove('is-source')
    boardEl.classList.remove('dragging-active')
    document.body.classList.remove('smery-dragging')

    const targetSlot = activeSlot
    clearSlotPreview()
    drag = null

    if (commit && targetSlot) {
      dropCb?.(name, {
        dir: targetSlot.dataset.dir as Dir,
        index: Number(targetSlot.dataset.index),
      })
      selectedName = null
      return
    }

    if (!commit) {
      selectedName = name
      source.classList.add('holding')
      boardEl.classList.add('awaiting-drop')
      hintEl.textContent = `Selected: ${name}. Tap between cities on the axis.`
    }
  }

  const onPointerMove = (e: PointerEvent): void => {
    if (!drag || e.pointerId !== drag.pointerId) return

    const dx = e.clientX - drag.startX
    const dy = e.clientY - drag.startY
    if (!drag.moved && dx * dx + dy * dy > 25) {
      drag.moved = true
      selectedName = null
      poolEl.querySelectorAll('.city-card.holding').forEach((c) => {
        c.classList.remove('holding')
      })
      boardEl.classList.remove('awaiting-drop')
      hintEl.textContent = 'Drop the card between cities on the axis.'
    }

    drag.ghost.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`
    if (!drag.moved) return

    const slot = findSlotAt(e.clientX, e.clientY)
    drag.activeSlot = slot
    setSlotPreview(slot, drag.name)
  }

  const onPointerUp = (e: PointerEvent): void => {
    if (!drag || e.pointerId !== drag.pointerId) return
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
    window.removeEventListener('pointercancel', onPointerUp)
    endDrag(drag.moved && Boolean(drag.activeSlot))
  }

  const startDrag = (source: HTMLElement, name: string, e: PointerEvent): void => {
    if (!interactive || drag) return

    const rect = source.getBoundingClientRect()
    const ghost = document.createElement('div')
    ghost.className = 'drag-ghost'
    ghost.textContent = name
    ghost.style.width = `${Math.max(rect.width, 96)}px`
    ghost.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`
    document.body.appendChild(ghost)

    source.classList.add('is-source')
    source.classList.remove('holding')
    boardEl.classList.add('dragging-active')
    document.body.classList.add('smery-dragging')

    drag = {
      name,
      pointerId: e.pointerId,
      ghost,
      source,
      activeSlot: null,
      moved: false,
      startX: e.clientX,
      startY: e.clientY,
    }

    source.setPointerCapture(e.pointerId)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
  }

  const bindCard = (el: HTMLElement, name: string): void => {
    el.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return
      e.preventDefault()
      startDrag(el, name, e)
    })
  }

  const bindSlots = (): void => {
    boardEl.onclick = (e) => {
      if (drag || !selectedName || !interactive) return
      const slot = findSlotAt(e.clientX, e.clientY)
      if (!slot) return
      dropCb?.(selectedName, {
        dir: slot.dataset.dir as Dir,
        index: Number(slot.dataset.index),
      })
      selectedName = null
    }
  }

  const renderPool = (cities: City[]): void => {
    if (cities.length === 0) {
      poolEl.innerHTML = `<p class="pool-empty">All cards have been placed.</p>`
      return
    }

    poolEl.innerHTML = cities
      .map(
        (c) =>
          `<button type="button" class="city-card${c.name === selectedName ? ' holding' : ''}" data-city="${c.name}">${c.name}</button>`,
      )
      .join('')

    poolEl.querySelectorAll<HTMLElement>('[data-city]').forEach((el) => {
      bindCard(el, el.dataset.city!)
    })
  }

  const renderBoard = (anchor: City, rays: Rays): void => {
    const parts: string[] = []
    const slot = (dir: Dir, index: number, label: string) =>
      interactive
        ? `<button type="button" class="drop-slot" data-dir="${dir}" data-index="${index}" aria-label="${label}"></button>`
        : ''

    const placed = (city: City) => {
      const offset = axisOffsetShort(anchor, city, axis)
      return `<span class="placed-card"><span class="placed-card-name">${city.name}</span><span class="axis-offset">${offset}</span></span>`
    }

    if (vertical) {
      // Top = North (pos, farthest → closest), then anchor, then South (neg, closest → farthest)
      for (let visual = 0; visual <= rays.pos.length; visual++) {
        const insertIndex = rays.pos.length - visual
        parts.push(slot('pos', insertIndex, 'Insert north'))
        if (visual < rays.pos.length) {
          parts.push(placed(rays.pos[rays.pos.length - 1 - visual]))
        }
      }

      parts.push(
        `<div class="anchor-card" title="Starting city"><span class="placed-card-name">${anchor.name}</span><span class="axis-offset">start</span></div>`,
      )

      for (let i = 0; i <= rays.neg.length; i++) {
        parts.push(slot('neg', i, 'Insert south'))
        if (i < rays.neg.length) {
          parts.push(placed(rays.neg[i]))
        }
      }
    } else {
      // Left = West (neg, farthest → closest), anchor, East (pos, closest → farthest)
      for (let visual = 0; visual <= rays.neg.length; visual++) {
        const insertIndex = rays.neg.length - visual
        parts.push(slot('neg', insertIndex, 'Insert west'))
        if (visual < rays.neg.length) {
          parts.push(placed(rays.neg[rays.neg.length - 1 - visual]))
        }
      }

      parts.push(
        `<div class="anchor-card" title="Starting city"><span class="placed-card-name">${anchor.name}</span><span class="axis-offset">start</span></div>`,
      )

      for (let i = 0; i <= rays.pos.length; i++) {
        parts.push(slot('pos', i, 'Insert east'))
        if (i < rays.pos.length) {
          parts.push(placed(rays.pos[i]))
        }
      }
    }

    boardEl.innerHTML = parts.join('')
    boardEl.classList.toggle('awaiting-drop', Boolean(selectedName) && interactive)
    if (interactive) bindSlots()
  }

  return {
    root: app,
    mapEl,

    setProgress(placed, total) {
      progressEl.textContent = `${placed}/${total}`
    },

    setAnchor(name) {
      anchorEl.textContent = name
    },

    setHint(text) {
      hintEl.textContent = text
      hintEl.hidden = !text
    },

    render({ remaining, anchor, rays, interactive: canInteract }) {
      interactive = canInteract
      if (!canInteract) selectedName = null
      renderPool(remaining)
      renderBoard(anchor, rays)
    },

    showFeedback(ok, detail) {
      feedbackEl.hidden = false
      feedbackEl.innerHTML = `<p class="distance">${ok ? 'Correct' : 'Wrong'} — <strong>${detail}</strong></p>`
      feedbackEl.dataset.ok = ok ? '1' : '0'
    },

    clearFeedback() {
      feedbackEl.hidden = true
      feedbackEl.innerHTML = ''
      delete feedbackEl.dataset.ok
    },

    setScore(correct, total) {
      scoreEl.innerHTML = `Score: <strong>${correct}/${total}</strong>`
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

    showResult({ dateKey, axis: resultAxis, anchorName, guesses, score, shareText: text }) {
      shareText = text
      toastEl.textContent = ''
      totalEl.textContent = `${score}/${guesses.length}`
      listEl.innerHTML = guesses
        .map(
          (g) =>
            `<li><span>${g.cityName}</span><span>${g.correct ? '✓' : '✗'} ${dirLabel(resultAxis, g.correctDir)}</span></li>`,
        )
        .join('')
      statsEl.textContent = `${formatCzechDate(dateKey)} · ${AXIS_LABEL[resultAxis].title} · start: ${anchorName}`
      overlay.hidden = false
    },
  }
}

export function buildSmeryShare(
  dateKey: string,
  axis: Axis,
  score: number,
  total: number,
  guesses: SmeryGuess[],
): string {
  const marks = guesses.map((g) => (g.correct ? '🟩' : '⬛')).join('')
  return `Directions ${AXIS_LABEL[axis].title} ${formatCzechDate(dateKey)}\n${score}/${total}\n${marks}`
}
