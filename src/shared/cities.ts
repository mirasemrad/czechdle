import citiesData from '../data/cities.json'

export type City = {
  name: string
  lat: number
  lon: number
  pop: number
}

export const cities = citiesData as City[]

export function getPopulationBounds(): { min: number; max: number } {
  let min = Number.POSITIVE_INFINITY
  let max = 0
  for (const city of cities) {
    if (city.pop < min) min = city.pop
    if (city.pop > max) max = city.pop
  }
  return { min, max }
}

export function filterCitiesByPop(min: number, max: number): City[] {
  const lo = Math.max(0, min)
  const hi = Math.max(lo, max)
  return cities.filter((c) => c.pop >= lo && c.pop <= hi)
}
