import './styles.css'
import { initAnalytics } from './shared/analytics'
import { initTheme, mountThemeToggle } from './shared/theme'

initAnalytics()
initTheme()
mountThemeToggle()

const app = document.querySelector<HTMLDivElement>('#app')!

app.innerHTML = `
  <main class="hub">
    <p class="hub-kicker">Denní hádanky · mapa Česka</p>
    <h1 class="hub-brand">Czechdle</h1>
    <p class="hub-lead">
      Jedna výzva denně — nebo <em>procvičování</em> bez limitu.
    </p>
    <ul class="game-list">
      <li>
        <a class="game-tile game-tile-mesta" href="/mesta/">
          <span class="game-tile-meta">
            <span>Českoměsta</span>
            <span>mapa</span>
          </span>
          <h2>Najdi město.</h2>
          <p>Slepá mapa, jeden tip, vzdálenost v kilometrech.</p>
          <span class="game-tile-cta">Hrát →</span>
        </a>
      </li>
      <li>
        <a class="game-tile game-tile-smery" href="/smery/">
          <span class="game-tile-meta">
            <span>Směry</span>
            <span>osa</span>
          </span>
          <h2>Seřaď města.</h2>
          <p>Přetahuj kartičky západ–východ nebo sever–jih.</p>
          <span class="game-tile-cta">Hrát →</span>
        </a>
      </li>
    </ul>
  </main>
`
