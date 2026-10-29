import L from 'leaflet'
import type { LatLon } from '../../shared/geo'
import krajeGeoJson from '../../data/kraje.json'

const CZ_BOUNDS = L.latLngBounds([48.55, 12.09], [51.06, 18.86])
const CZ_CENTER: L.LatLngExpression = [49.75, 15.45]
const DEFAULT_ZOOM = 7

const MAP_STROKE = '#d4c4a8'
const MAP_FILL = '#2a2a2a'
const GUESS_COLOR = '#6eb5ff'
const TRUTH_COLOR = '#ff8f6b'
const LINE_COLOR = '#e8e2d6'

export type MapController = {
  enableGuessing: (onGuess: (latlon: LatLon) => void) => void
  disableGuessing: () => void
  showRound: (guess: LatLon, truth: LatLon) => void
  clearRound: () => void
  resetView: () => void
  destroy: () => void
}

export function createGameMap(container: HTMLElement): MapController {
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

  // Travle-like blind map: dark fill, thin gold kraj outlines
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

  const layer = L.layerGroup().addTo(map)
  let clickHandler: ((e: L.LeafletMouseEvent) => void) | null = null

  const guessIcon = L.divIcon({
    className: '',
    html: `<span style="display:block;width:12px;height:12px;border-radius:50%;background:${GUESS_COLOR};border:2px solid #141414;box-shadow:0 0 0 1px ${GUESS_COLOR}"></span>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  })

  const truthIcon = L.divIcon({
    className: '',
    html: `<span style="display:block;width:12px;height:12px;border-radius:50%;background:${TRUTH_COLOR};border:2px solid #141414;box-shadow:0 0 0 1px ${TRUTH_COLOR}"></span>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  })

  return {
    enableGuessing(onGuess) {
      this.disableGuessing()
      map.getContainer().style.cursor = 'crosshair'
      clickHandler = (e) => {
        onGuess({ lat: e.latlng.lat, lon: e.latlng.lng })
      }
      map.on('click', clickHandler)
    },

    disableGuessing() {
      map.getContainer().style.cursor = ''
      if (clickHandler) {
        map.off('click', clickHandler)
        clickHandler = null
      }
    },

    showRound(guess, truth) {
      layer.clearLayers()
      const g = L.latLng(guess.lat, guess.lon)
      const t = L.latLng(truth.lat, truth.lon)

      L.marker(g, { icon: guessIcon, interactive: false }).addTo(layer)
      L.marker(t, { icon: truthIcon, interactive: false }).addTo(layer)
      L.polyline([g, t], {
        color: LINE_COLOR,
        weight: 1.5,
        opacity: 0.7,
        dashArray: '5 6',
      }).addTo(layer)

      map.fitBounds(L.latLngBounds([g, t]).pad(0.45), {
        maxZoom: 9,
        animate: true,
      })
    },

    clearRound() {
      layer.clearLayers()
    },

    resetView() {
      map.setView(CZ_CENTER, DEFAULT_ZOOM, { animate: true })
    },

    destroy() {
      this.disableGuessing()
      window.removeEventListener('resize', invalidate)
      map.remove()
    },
  }
}
