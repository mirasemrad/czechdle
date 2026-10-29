export type LatLon = {
  lat: number
  lon: number
}

const EARTH_RADIUS_KM = 6371

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/** Great-circle distance in kilometres (Haversine), rounded to whole km. */
export function distanceKm(a: LatLon, b: LatLon): number {
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2

  const km = 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)))
  return Math.round(km)
}

/**
 * Signed offset along one map axis only (not full distance).
 * East–west: positive = farther east. North–south: positive = farther north.
 */
export function axisOffsetKm(
  from: LatLon,
  to: LatLon,
  axis: 'ew' | 'ns',
): number {
  if (axis === 'ew') {
    const midLat = toRad((from.lat + to.lat) / 2)
    return EARTH_RADIUS_KM * Math.cos(midLat) * toRad(to.lon - from.lon)
  }
  return EARTH_RADIUS_KM * toRad(to.lat - from.lat)
}

export function formatKm(km: number): string {
  const abs = Math.abs(km)
  if (abs < 0.5) return '0'
  if (abs < 10) return (Math.round(abs * 10) / 10).toString()
  return Math.round(abs).toString()
}
