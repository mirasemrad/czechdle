/** Soft-reveal #app once the scene image is ready (or after a short fallback). */
export function revealApp(root: HTMLElement = document.querySelector('#app')!): void {
  const done = () => {
    if (root.classList.contains('is-ready')) return
    root.classList.add('is-ready')
  }

  const scene = document.querySelector<HTMLImageElement>('.scene-bg, .hub-art')
  if (!scene || scene.complete) {
    requestAnimationFrame(done)
    return
  }

  const fallback = window.setTimeout(done, 450)
  const finish = () => {
    window.clearTimeout(fallback)
    done()
  }
  scene.addEventListener('load', finish, { once: true })
  scene.addEventListener('error', finish, { once: true })
}
