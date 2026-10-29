import '../../styles.css'
import { initTheme, mountThemeToggle } from '../../shared/theme'
import { startMestaApp } from './game'

initTheme()
mountThemeToggle()

const app = document.querySelector<HTMLDivElement>('#app')!
startMestaApp(app)
