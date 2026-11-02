import './styles.css'
import { runIntro } from './intro.js'
import { initNav, initReveal, initCounters, initCopy } from './ui.js'

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

document.getElementById('year').textContent = new Date().getFullYear()
initNav()
initReveal()
initCounters(reduced)
initCopy()
// 3d background: loaded lazily, skipped for reduced motion or when webgl is missing
function webglOk() {
  try {
    const c = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')))
  } catch {
    return false
  }
}
function loadHero() {
  const bg = document.getElementById('hero-bg')
  if (reduced || !webglOk()) {
    document.documentElement.classList.add('static-bg')
    return
  }
  const mobile = window.matchMedia('(max-width: 760px), (pointer: coarse)').matches
  import('./hero3d.js')
    .then(({ startHero }) => { if (!startHero(bg, { mobile })) document.documentElement.classList.add('static-bg') })
    .catch(() => document.documentElement.classList.add('static-bg'))
}

runIntro(() => {
  requestAnimationFrame(() => document.documentElement.classList.add('ready'))
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 200))
  idle(loadHero, { timeout: 1200 })
})
