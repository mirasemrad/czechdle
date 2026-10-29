import './styles.css'
import { initTheme, mountThemeToggle } from './shared/theme'

initTheme()
mountThemeToggle()

const app = document.querySelector<HTMLDivElement>('#app')!

app.innerHTML = `
  <main class="hub">
    <p class="hub-kicker">Daily puzzles · map of Czechia</p>
    <h1 class="hub-brand">Czech<br />Geography</h1>
    <p class="hub-lead">
      One challenge a day — or <em>practice</em> with no limit.
    </p>
    <ul class="game-list">
      <li>
        <a class="game-tile game-tile-mesta" href="/mesta/">
          <span class="game-tile-meta">
            <span>Czech Cities</span>
            <span>map</span>
          </span>
          <h2>Find the city.</h2>
          <p>Blind map, one guess, distance in kilometers.</p>
          <span class="game-tile-cta">Play →</span>
        </a>
      </li>
      <li>
        <a class="game-tile game-tile-smery" href="/smery/">
          <span class="game-tile-meta">
            <span>Directions</span>
            <span>axis</span>
          </span>
          <h2>Sort the cities.</h2>
          <p>Drag cards west–east or north–south.</p>
          <span class="game-tile-cta">Play →</span>
        </a>
      </li>
    </ul>
  </main>
`
