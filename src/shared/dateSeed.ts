/** Local calendar date as YYYY-MM-DD. */
export function todayKey(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function formatCzechDate(dateKey: string): string {
  const [y, m, d] = dateKey.split('-')
  return `${Number(d)}. ${Number(m)}. ${y}`
}

/** Simple deterministic PRNG (mulberry32). */
export function mulberry32(seed: number): () => number {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

export function seedFromDateKey(dateKey: string): number {
  let h = 2166136261
  for (let i = 0; i < dateKey.length; i++) {
    h ^= dateKey.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Pick `count` distinct indices from `0..length-1` using a seeded shuffle. */
export function pickIndices(length: number, count: number, dateKey: string): number[] {
  if (count > length) {
    throw new Error('Not enough items to pick from')
  }

  const rng = mulberry32(seedFromDateKey(dateKey))
  const indices = Array.from({ length }, (_, i) => i)

  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }

  return indices.slice(0, count)
}
