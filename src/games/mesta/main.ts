import '../../styles.css'
import { initAnalytics } from '../../shared/analytics'
import { initTheme, mountThemeToggle } from '../../shared/theme'
import { startMestaApp } from './game'

initAnalytics()
initTheme()
mountThemeToggle()

const app = document.querySelector<HTMLDivElement>('#app')!
startMestaApp(app)
