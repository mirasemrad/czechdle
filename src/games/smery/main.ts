import '../../styles.css'
import { initTheme, mountThemeToggle } from '../../shared/theme'
import { startSmeryApp } from './game'

initTheme()
mountThemeToggle()

const app = document.querySelector<HTMLDivElement>('#app')!
startSmeryApp(app)
