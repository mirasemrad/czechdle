import L from 'leaflet'
import type { City } from '../../shared/cities'
import { onThemeChange, readMapTheme } from '../../shared/mapTheme'
import krajeGeoJson from '../../data/kraje.json'

const CZ_BOUNDS = L.latLngBounds([48.55, 12.09], [51.06, 18.86])
const CZ_CENTER: L.LatLngExpression = [49.75, 15.45]
const DEFAULT_ZOOM = 7

type PlacedMarker = {
  city: City
  highlight?: boolean
  subtitle?: string
  isAnchor?: boolean
}

export type SmeryMap = {
  showAnchor: (city: City) => void
  addCity: (city: City, opts?: { highlight?: boolean; subtitle?: string }) => void
  resetView: () => void
  destroy: () => void
}

export function createSmeryMap(container: HTMLElement): SmeryMap {
  const map = L.map(container, {
    center: CZ_CENTER,
    zoom: DEFAULT_ZOOM,
    minZoom: 6,
    maxZoom: 11,
    maxBounds: CZ_BOUNDS.pad(0.2),
    maxBoundsViscosity: 1,
    zoomControl: true,
    attributionControl: false,
  })

  const borders = L.geoJSON(krajeGeoJson as GeoJSON.GeoJSON, {
    interactive: false,
  }).addTo(map)

  const markers = L.layerGroup().addTo(map)
  let placed: PlacedMarker[] = []

  const makeIcon = (color: string, border: string, large = false) =>
    L.divIcon({
      className: '',
      html: `<span style="display:block;width:${large ? 14 : 10}px;height:${large ? 14 : 10}px;border-radius:50%;background:${color};border:2px solid ${border};box-shadow:0 0 0 1px ${color}"></span>`,
      iconSize: [large ? 14 : 10, large ? 14 : 10],
      iconAnchor: [large ? 7 : 5, large ? 7 : 5],
    })

  const redrawMarkers = (): void => {
    markers.clearLayers()
    const colors = readMapTheme()
    for (const item of placed) {
      const fill = item.isAnchor
        ? colors.accent
        : item.highlight
          ? colors.truth
          : colors.guess
      const label = item.subtitle
        ? `${item.city.name}<br/><span class="smery-tooltip-sub">${item.subtitle}</span>`
        : item.city.name
      L.marker([item.city.lat, item.city.lon], {
        icon: makeIcon(fill, colors.markerBorder, Boolean(item.isAnchor)),
        interactive: false,
      })
        .bindTooltip(label, {
          permanent: true,
          direction: 'top',
          offset: [0, item.isAnchor ? -8 : -6],
          className: 'smery-tooltip',
          opacity: 1,
        })
        .addTo(markers)
    }
  }

  const applyTheme = (): void => {
    const colors = readMapTheme()
    borders.setStyle({
      color: colors.stroke,
      weight: 1.35,
      opacity: 0.9,
      fillColor: colors.fill,
      fillOpacity: 1,
    })
    redrawMarkers()
  }
  applyTheme()
  const stopTheme = onThemeChange(applyTheme)

  const invalidate = () => map.invalidateSize()
  requestAnimationFrame(invalidate)
  setTimeout(invalidate, 100)
  window.addEventListener('resize', invalidate)

  return {
    showAnchor(city) {
      placed = [{ city, isAnchor: true }]
      redrawMarkers()
      map.setView([city.lat, city.lon], 8, { animate: false })
    },

    addCity(city, opts = {}) {
      placed.push({
        city,
        highlight: opts.highlight,
        subtitle: opts.subtitle,
      })
      redrawMarkers()
    },

    resetView() {
      map.setView(CZ_CENTER, DEFAULT_ZOOM, { animate: true })
    },

    destroy() {
      stopTheme()
      window.removeEventListener('resize', invalidate)
      map.remove()
    },
  }
}
