import { cities, type City } from '../../shared/cities'
import { pickIndices, todayKey } from '../../shared/dateSeed'
import type { Axis } from './logic'

export const CITIES_PER_ROUND = 5

export type SmeryRound = {
  anchor: City
  targets: City[]
}

/** 1 anchor + 5 targets, all distinct, seeded by date + axis. */
export function getDailySmery(
  axis: Axis,
  dateKey = todayKey(),
): SmeryRound {
  const indices = pickIndices(
    cities.length,
    CITIES_PER_ROUND + 1,
    `smery:${axis}:${dateKey}`,
  )
  const picked = indices.map((i) => cities[i])
  return {
    anchor: picked[0],
    targets: picked.slice(1),
  }
}

export function getRandomSmeryRound(excludeNames: string[] = []): SmeryRound {
  const exclude = new Set(excludeNames)
  const pool = cities.filter((c) => !exclude.has(c.name))
  const source = pool.length >= CITIES_PER_ROUND + 1 ? pool : cities

  const shuffled = source.slice()
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  return {
    anchor: shuffled[0],
    targets: shuffled.slice(1, CITIES_PER_ROUND + 1),
  }
}
