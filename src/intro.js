// Signature intro: the writing itself is pure css (see .sig-anim in styles.css),
// this file only handles timing, skipping and the move into the nav logo.

export function runIntro(onReveal) {
  const root = document.documentElement
  const intro = document.getElementById('intro')
  if (!root.classList.contains('intro-on') || !intro) {
    intro?.remove()
    onReveal()
    return
  }

  const box = document.getElementById('intro-sig')
  const svg = box.querySelector('svg')
  const total = Number(svg?.dataset.total || 2400)
  let done = false

  const finish = () => {
    root.classList.remove('intro-on')
    try { sessionStorage.setItem('intro-seen', '1') } catch {}
    intro.remove()
  }

  const settle = (fast) => {
    if (done) return
    done = true
    clearTimeout(timer)
    removeListeners()
    if (fast) intro.classList.add('skip')

    // FLIP: same viewBox in both svgs, so line up the top-left corners and scale
    const from = svg.getBoundingClientRect()
    const to = document.querySelector('#logo-sig svg').getBoundingClientRect()
    const scale = to.width / from.width
    const dx = to.left - from.left
    const dy = to.top - from.top

    intro.classList.add('leaving')
    onReveal()
    const anim = box.animate(
      [{ transform: 'translate(0,0) scale(1)' }, { transform: `translate(${dx}px, ${dy}px) scale(${scale})` }],
      { duration: fast ? 600 : 850, easing: 'cubic-bezier(0.7, 0, 0.2, 1)', fill: 'forwards' }
    )
    anim.onfinish = finish
    // safety net in case the animation never reports back (background tab etc.)
    setTimeout(finish, fast ? 900 : 1400)
  }

  const skip = () => settle(true)
  const onKey = (e) => { if (['Escape', 'Enter', ' '].includes(e.key)) skip() }
  const removeListeners = () => {
    window.removeEventListener('keydown', onKey)
    window.removeEventListener('wheel', skip)
    window.removeEventListener('touchmove', skip)
  }
  document.getElementById('intro-skip').addEventListener('click', skip)
  window.addEventListener('keydown', onKey)
  window.addEventListener('wheel', skip, { passive: true })
  window.addEventListener('touchmove', skip, { passive: true })

  const timer = setTimeout(() => settle(false), total + 250)
}
