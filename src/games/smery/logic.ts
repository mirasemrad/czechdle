import type { City } from '../../shared/cities'
import { axisOffsetKm, formatKm } from '../../shared/geo'

export type Axis = 'ew' | 'ns'

/** Positive side = East or North; negative = West or South. */
export type Dir = 'pos' | 'neg'

export const AXIS_LABEL: Record<Axis, { neg: string; pos: string; title: string }> = {
  ew: { neg: 'West', pos: 'East', title: 'West–East' },
  ns: { neg: 'South', pos: 'North', title: 'North–South' },
}

export function dirLabel(axis: Axis, dir: Dir): string {
  return dir === 'pos' ? AXIS_LABEL[axis].pos : AXIS_LABEL[axis].neg
}

/** Compact label for cards/map, e.g. "47 km E" or "3.2 km W". */
export function axisOffsetShort(anchor: City, city: City, axis: Axis): string {
  const km = axisOffsetKm(anchor, city, axis)
  const value = formatKm(km)
  if (value === '0') return '≈0 km'
  if (axis === 'ew') return `${value} km ${km >= 0 ? 'E' : 'W'}`
  return `${value} km ${km >= 0 ? 'N' : 'S'}`
}

/** Readable offset from the starting city, e.g. "3 km farther east". */
export function axisOffsetPhrase(anchor: City, city: City, axis: Axis): string {
  const km = axisOffsetKm(anchor, city, axis)
  const value = formatKm(km)
  if (value === '0') return 'almost due in line with the start'
  const dir =
    axis === 'ew'
      ? km >= 0
        ? 'east'
        : 'west'
      : km >= 0
        ? 'north'
        : 'south'
  return `${value} km ${dir} of ${anchor.name}`
}

/** Gap along the axis between two cities, toward `dir`. */
export function axisGapPhrase(
  closer: City,
  farther: City,
  axis: Axis,
  dir: Dir,
): string {
  const gap = Math.abs(axisOffsetKm(closer, farther, axis))
  const value = formatKm(gap)
  if (value === '0') return `almost even with ${closer.name}`
  return `${value} km farther ${dirLabel(axis, dir).toLowerCase()} than ${closer.name}`
}

export type Rays = {
  pos: City[]
  neg: City[]
}

export function emptyRays(): Rays {
  return { pos: [], neg: [] }
}

export function sideOfAnchor(anchor: City, city: City, axis: Axis): Dir {
  if (axis === 'ew') {
    return city.lon >= anchor.lon ? 'pos' : 'neg'
  }
  return city.lat >= anchor.lat ? 'pos' : 'neg'
}

/** Distance from anchor along the ray (always ≥ 0 on the correct side). */
export function axisDistance(
  anchor: City,
  city: City,
  axis: Axis,
  dir: Dir,
): number {
  if (axis === 'ew') {
    return dir === 'pos' ? city.lon - anchor.lon : anchor.lon - city.lon
  }
  return dir === 'pos' ? city.lat - anchor.lat : anchor.lat - city.lat
}

export function correctInsertIndex(
  anchor: City,
  ray: City[],
  city: City,
  axis: Axis,
  dir: Dir,
): number {
  const key = axisDistance(anchor, city, axis, dir)
  let i = 0
  while (i < ray.length && axisDistance(anchor, ray[i], axis, dir) < key) {
    i += 1
  }
  return i
}

export function isGuessCorrect(
  anchor: City,
  ray: City[],
  city: City,
  axis: Axis,
  dir: Dir,
  insertIndex: number,
): boolean {
  if (sideOfAnchor(anchor, city, axis) !== dir) return false
  return correctInsertIndex(anchor, ray, city, axis, dir) === insertIndex
}

export function insertCity(ray: City[], city: City, index: number): City[] {
  const next = ray.slice()
  next.splice(index, 0, city)
  return next
}
