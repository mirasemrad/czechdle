export type MapThemeColors = {
  fill: string
  stroke: string
  markerBorder: string
  line: string
  guess: string
  truth: string
  accent: string
}

function cssVar(name: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim()
  return value || fallback
}

export function readMapTheme(): MapThemeColors {
  return {
    fill: cssVar('--map-fill', '#2a2a2a'),
    stroke: cssVar('--map-stroke', '#d4c4a8'),
    markerBorder: cssVar('--map-marker-border', '#141414'),
    line: cssVar('--map-line', '#e8e2d6'),
    guess: cssVar('--guess', '#6eb5ff'),
    truth: cssVar('--truth', '#ff8f6b'),
    accent: cssVar('--accent-strong', '#f0e6d2'),
  }
}

export function onThemeChange(cb: () => void): () => void {
  const handler = () => cb()
  window.addEventListener('themechange', handler)
  return () => window.removeEventListener('themechange', handler)
}
