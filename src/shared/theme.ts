export type Theme = 'dark' | 'light'

const KEY = 'ceska-geografie:theme'

export function getTheme(): Theme {
  try {
    return localStorage.getItem(KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

export function setTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    /* ignore */
  }
  syncToggleLabels()
  window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }))
}

export function toggleTheme(): Theme {
  const next: Theme = getTheme() === 'dark' ? 'light' : 'dark'
  setTheme(next)
  return next
}

export function initTheme(): void {
  setTheme(getTheme())
}

function labelFor(theme: Theme): string {
  return theme === 'dark' ? 'Světlý režim' : 'Tmavý režim'
}

function syncToggleLabels(): void {
  const theme = getTheme()
  document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]').forEach((btn) => {
    btn.setAttribute('aria-label', labelFor(theme))
    btn.title = labelFor(theme)
    btn.dataset.themeActive = theme
  })
}

export function mountThemeToggle(): void {
  if (document.querySelector('[data-theme-toggle]')) return

  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'theme-toggle'
  btn.dataset.themeToggle = ''
  btn.innerHTML = `
    <svg class="theme-toggle-icon theme-toggle-icon-sun" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/>
      <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"
        d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6"/>
    </svg>
    <svg class="theme-toggle-icon theme-toggle-icon-moon" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"
        d="M18.5 14.2A7.2 7.2 0 0 1 9.8 5.5 7.4 7.4 0 1 0 18.5 14.2z"/>
    </svg>
  `
  btn.addEventListener('click', () => toggleTheme())
  document.body.appendChild(btn)
  syncToggleLabels()
}
