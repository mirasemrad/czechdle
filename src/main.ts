import './styles.css'
import { initAnalytics } from './shared/analytics'
import { revealApp } from './shared/reveal'
import { initTheme, mountThemeToggle } from './shared/theme'

initAnalytics()
initTheme()
mountThemeToggle()

const app = document.querySelector<HTMLDivElement>('#app')!

const czFlag = `
  <svg class="hub-flag" viewBox="0 0 24 16" shape-rendering="crispEdges" aria-hidden="true">
    <rect width="24" height="16" fill="#0b1220"/>
    <rect x="1" y="1" width="22" height="7" fill="#f4f7fb"/>
    <rect x="1" y="8" width="22" height="7" fill="#d42b2b"/>
    <polygon points="1,1 12,8 1,15" fill="#1a4f9c"/>
  </svg>
`

app.innerHTML = `
  <main class="hub hub-pixel">
    <div class="hub-content">
      <header class="hub-header">
        <p class="hub-kicker">
          ${czFlag}
          <span>Denní hádanky · Česko i svět</span>
          ${czFlag}
        </p>
        <h1 class="hub-brand"><span class="hub-brand-glow">Czechdle</span></h1>
        <p class="hub-lead">
          Jedna výzva denně — nebo <em>procvičování</em> bez limitu.
        </p>
      </header>

      <ul class="game-list">
        <li>
          <a class="game-tile game-tile-mesta" href="/mesta/">
            <span class="game-tile-icon" aria-hidden="true">
              <svg viewBox="0 0 48 48" shape-rendering="crispEdges">
                <rect x="4" y="8" width="36" height="28" fill="#0b2a22"/>
                <rect x="6" y="10" width="32" height="24" fill="#1f6b52"/>
                <rect x="8" y="12" width="12" height="10" fill="#3f9a74"/>
                <rect x="22" y="16" width="14" height="12" fill="#2d8464"/>
                <rect x="10" y="24" width="10" height="8" fill="#2d8464"/>
                <rect x="8" y="12" width="2" height="2" fill="#8fd6b0"/>
                <rect x="28" y="18" width="2" height="2" fill="#8fd6b0"/>
                <rect x="24" y="10" width="4" height="4" fill="#e24b4b"/>
                <rect x="25" y="14" width="2" height="4" fill="#e24b4b"/>
                <rect x="38" y="30" width="6" height="10" fill="#6b4420"/>
                <rect x="40" y="28" width="2" height="2" fill="#8a5a2b"/>
              </svg>
            </span>
            <span class="game-tile-meta">
              <span>Slepá mapa</span>
              <span>mapa</span>
            </span>
            <h2>Najdi město.</h2>
            <p>Slepá mapa, jeden tip, vzdálenost v kilometrech.</p>
            <span class="game-tile-cta">Hrát →</span>
          </a>
        </li>
        <li>
          <a class="game-tile game-tile-smery" href="/smery/">
            <span class="game-tile-icon" aria-hidden="true">
              <svg viewBox="0 0 48 48" shape-rendering="crispEdges">
                <rect x="22" y="4" width="4" height="40" fill="#d7c29a"/>
                <rect x="4" y="22" width="40" height="4" fill="#d7c29a"/>
                <rect x="22" y="4" width="4" height="4" fill="#f0e2c0"/>
                <rect x="22" y="40" width="4" height="4" fill="#f0e2c0"/>
                <rect x="4" y="22" width="4" height="4" fill="#f0e2c0"/>
                <rect x="40" y="22" width="4" height="4" fill="#f0e2c0"/>
                <rect x="16" y="16" width="16" height="16" fill="#1c3f6e"/>
                <rect x="18" y="18" width="12" height="12" fill="#2f6fb3"/>
                <rect x="22" y="14" width="4" height="8" fill="#e24b4b"/>
                <rect x="22" y="26" width="4" height="8" fill="#e8edf2"/>
                <rect x="14" y="22" width="8" height="4" fill="#e8edf2"/>
                <rect x="26" y="22" width="8" height="4" fill="#e24b4b"/>
                <rect x="20" y="20" width="8" height="8" fill="#ffd76a"/>
                <rect x="22" y="22" width="4" height="4" fill="#1c222b"/>
              </svg>
            </span>
            <span class="game-tile-meta">
              <span>Směry</span>
              <span>osa</span>
            </span>
            <h2>Seřaď města.</h2>
            <p>Přetahuj kartičky západ–východ nebo sever–jih.</p>
            <span class="game-tile-cta">Hrát →</span>
          </a>
        </li>
        <li>
          <a class="game-tile game-tile-timeline" href="/timeline/">
            <span class="game-tile-icon" aria-hidden="true">
              <svg viewBox="0 0 48 48" shape-rendering="crispEdges">
                <rect x="10" y="6" width="16" height="4" fill="#c9a46a"/>
                <rect x="14" y="10" width="8" height="10" fill="#8ec8e8"/>
                <rect x="12" y="10" width="2" height="10" fill="#6b4420"/>
                <rect x="22" y="10" width="2" height="10" fill="#6b4420"/>
                <rect x="14" y="20" width="8" height="2" fill="#c9a46a"/>
                <rect x="14" y="22" width="8" height="10" fill="#e0a86a"/>
                <rect x="12" y="22" width="2" height="10" fill="#6b4420"/>
                <rect x="22" y="22" width="2" height="10" fill="#6b4420"/>
                <rect x="10" y="32" width="16" height="4" fill="#c9a46a"/>
                <rect x="28" y="14" width="14" height="18" fill="#b8c0c8"/>
                <rect x="30" y="16" width="10" height="14" fill="#d8dee6"/>
                <rect x="32" y="18" width="6" height="8" fill="#d42b2b"/>
                <rect x="33" y="20" width="4" height="4" fill="#ffd76a"/>
                <rect x="40" y="10" width="3" height="26" fill="#9aa3ad"/>
                <rect x="39" y="8" width="5" height="3" fill="#c9a46a"/>
              </svg>
            </span>
            <span class="game-tile-meta">
              <span>Timeline</span>
              <span>historie</span>
            </span>
            <h2>Doplň časovou osu.</h2>
            <p>5 daných událostí — přidej mezi ně svých 5 karet.</p>
            <span class="game-tile-cta">Hrát →</span>
          </a>
        </li>
      </ul>
    </div>
  </main>
`

revealApp(app)
