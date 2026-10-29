import L from 'leaflet'
import type { City } from '../../shared/cities'
import krajeGeoJson from '../../data/kraje.json'

const CZ_BOUNDS = L.latLngBounds([48.55, 12.09], [51.06, 18.86])
const CZ_CENTER: L.LatLngExpression = [49.75, 15.45]
const DEFAULT_ZOOM = 7

const MAP_STROKE = '#d4c4a8'
const MAP_FILL = '#2a2a2a'
const ANCHOR_COLOR = '#f0e6d2'
const CITY_COLOR = '#6eb5ff'

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

  L.geoJSON(krajeGeoJson as GeoJSON.GeoJSON, {
    style: {
      color: MAP_STROKE,
      weight: 1.35,
      opacity: 0.85,
      fillColor: MAP_FILL,
      fillOpacity: 1,
    },
    interactive: false,
  }).addTo(map)

  const invalidate = () => map.invalidateSize()
  requestAnimationFrame(invalidate)
  setTimeout(invalidate, 100)
  window.addEventListener('resize', invalidate)

  const markers = L.layerGroup().addTo(map)

  const makeIcon = (color: string, large = false) =>
    L.divIcon({
      className: '',
      html: `<span style="display:block;width:${large ? 14 : 10}px;height:${large ? 14 : 10}px;border-radius:50%;background:${color};border:2px solid #141414;box-shadow:0 0 0 1px ${color}"></span>`,
      iconSize: [large ? 14 : 10, large ? 14 : 10],
      iconAnchor: [large ? 7 : 5, large ? 7 : 5],
    })

  return {
    showAnchor(city) {
      markers.clearLayers()
      L.marker([city.lat, city.lon], {
        icon: makeIcon(ANCHOR_COLOR, true),
        interactive: false,
      })
        .bindTooltip(city.name, {
          permanent: true,
          direction: 'top',
          offset: [0, -8],
          className: 'smery-tooltip',
        })
        .addTo(markers)
      map.setView([city.lat, city.lon], 8, { animate: false })
    },

    addCity(city, opts = {}) {
      const label = opts.subtitle
        ? `${city.name}<br/><span class="smery-tooltip-sub">${opts.subtitle}</span>`
        : city.name
      L.marker([city.lat, city.lon], {
        icon: makeIcon(opts.highlight ? '#ff8f6b' : CITY_COLOR),
        interactive: false,
      })
        .bindTooltip(label, {
          permanent: true,
          direction: 'top',
          offset: [0, -6],
          className: 'smery-tooltip',
          opacity: 1,
        })
        .addTo(markers)
    },

    resetView() {
      map.setView(CZ_CENTER, DEFAULT_ZOOM, { animate: true })
    },

    destroy() {
      window.removeEventListener('resize', invalidate)
      map.remove()
    },
  }
}
