import L from 'leaflet'
import type { LatLon } from '../../shared/geo'
import { onThemeChange, readMapTheme } from '../../shared/mapTheme'
import krajeGeoJson from '../../data/kraje.json'

const CZ_BOUNDS = L.latLngBounds([48.55, 12.09], [51.06, 18.86])
const CZ_CENTER: L.LatLngExpression = [49.75, 15.45]
const DEFAULT_ZOOM = 7

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

  const borders = L.geoJSON(krajeGeoJson as GeoJSON.GeoJSON, {
    interactive: false,
  }).addTo(map)

  const layer = L.layerGroup().addTo(map)
  let clickHandler: ((e: L.LeafletMouseEvent) => void) | null = null
  let lastRound: { guess: LatLon; truth: LatLon } | null = null

  const makeIcon = (fill: string, border: string) =>
    L.divIcon({
      className: '',
      html: `<span style="display:block;width:12px;height:12px;border-radius:50%;background:${fill};border:2px solid ${border};box-shadow:0 0 0 1px ${fill}"></span>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    })

  const paintRound = (guess: LatLon, truth: LatLon): void => {
    layer.clearLayers()
    const colors = readMapTheme()
    const g = L.latLng(guess.lat, guess.lon)
    const t = L.latLng(truth.lat, truth.lon)

    L.marker(g, {
      icon: makeIcon(colors.guess, colors.markerBorder),
      interactive: false,
    }).addTo(layer)
    L.marker(t, {
      icon: makeIcon(colors.truth, colors.markerBorder),
      interactive: false,
    }).addTo(layer)
    L.polyline([g, t], {
      color: colors.line,
      weight: 1.5,
      opacity: 0.75,
      dashArray: '5 6',
    }).addTo(layer)
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
    if (lastRound) paintRound(lastRound.guess, lastRound.truth)
  }
  applyTheme()
  const stopTheme = onThemeChange(applyTheme)

  const invalidate = () => map.invalidateSize()
  requestAnimationFrame(invalidate)
  setTimeout(invalidate, 100)
  window.addEventListener('resize', invalidate)

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
      lastRound = { guess, truth }
      paintRound(guess, truth)
      map.fitBounds(
        L.latLngBounds(
          [guess.lat, guess.lon],
          [truth.lat, truth.lon],
        ).pad(0.45),
        {
          maxZoom: 9,
          animate: true,
        },
      )
    },

    clearRound() {
      lastRound = null
      layer.clearLayers()
    },

    resetView() {
      map.setView(CZ_CENTER, DEFAULT_ZOOM, { animate: true })
    },

    destroy() {
      this.disableGuessing()
      stopTheme()
      window.removeEventListener('resize', invalidate)
      map.remove()
    },
  }
}
