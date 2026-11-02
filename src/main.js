import './styles.css'
import { runIntro } from './intro.js'
import { initNav, initReveal, initCounters, initCopy } from './ui.js'

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

document.getElementById('year').textContent = new Date().getFullYear()
initNav()
initReveal()
initCounters(reduced)
initCopy()
runIntro(() => {
  requestAnimationFrame(() => document.documentElement.classList.add('ready'))
})
