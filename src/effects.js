// Hover micro-interactions: magnetic buttons and 3d tilt on cards.
// Only for mouse/trackpad users who haven't asked for reduced motion.

export function initMagnetic() {
  document.querySelectorAll('.magnetic').forEach((el) => {
    const strength = el.classList.contains('mail') ? 0.12 : 0.25
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect()
      const x = e.clientX - (r.left + r.width / 2)
      const y = e.clientY - (r.top + r.height / 2)
      el.style.setProperty('--mx', `${(x * strength).toFixed(1)}px`)
      el.style.setProperty('--my', `${(y * strength).toFixed(1)}px`)
    })
    el.addEventListener('pointerleave', () => {
      el.style.setProperty('--mx', '0px')
      el.style.setProperty('--my', '0px')
    })
  })
}

export function initTilt() {
  document.querySelectorAll('.tilt').forEach((el) => {
    const max = Number(el.dataset.tiltMax || 8)
    let frame = 0
    el.addEventListener('pointermove', (e) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect()
        const px = (e.clientX - r.left) / r.width
        const py = (e.clientY - r.top) / r.height
        el.classList.add('moving')
        el.style.setProperty('--ry', `${((px - 0.5) * max * 2).toFixed(2)}deg`)
        el.style.setProperty('--rx', `${((0.5 - py) * max * 2).toFixed(2)}deg`)
        el.style.setProperty('--gx', `${(px * 100).toFixed(1)}%`)
        el.style.setProperty('--gy', `${(py * 100).toFixed(1)}%`)
      })
    })
    el.addEventListener('pointerleave', () => {
      cancelAnimationFrame(frame)
      el.classList.remove('moving')
      el.style.setProperty('--rx', '0deg')
      el.style.setProperty('--ry', '0deg')
    })
  })
}
