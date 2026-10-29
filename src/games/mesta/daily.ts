import {
  cities,
  filterCitiesByPop as filterByPopRange,
  getPopulationBounds,
  type City,
} from '../../shared/cities'
import { pickIndices, todayKey } from '../../shared/dateSeed'

export type { City }
export type PopFilter = {
  min: number
  max: number
}

const CITIES_PER_DAY = 5

export function getDailyCities(dateKey = todayKey()): City[] {
  const indices = pickIndices(cities.length, CITIES_PER_DAY, dateKey)
  return indices.map((i) => cities[i])
}

export { getPopulationBounds }

export function filterCitiesByPop(filter: PopFilter): City[] {
  return filterByPopRange(filter.min, filter.max)
}

/** Random city for practice; avoids repeating the previous one when possible. */
export function getRandomCity(
  filter: PopFilter,
  excludeName?: string,
): City | null {
  const pool = filterCitiesByPop(filter)
  if (pool.length === 0) return null

  if (pool.length === 1 || !excludeName) {
    return pool[Math.floor(Math.random() * pool.length)]
  }

  let city = pool[Math.floor(Math.random() * pool.length)]
  let guard = 0
  while (city.name === excludeName && guard < 20) {
    city = pool[Math.floor(Math.random() * pool.length)]
    guard += 1
  }
  return city
}

export { CITIES_PER_DAY, cities }
