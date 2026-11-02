// Small page behaviours: nav state, mobile menu, scroll reveals, counters, copy email

export function initNav() {
  const nav = document.getElementById('nav')
  const btn = document.getElementById('menu-btn')
  const links = document.getElementById('nav-links')

  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 30)
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })

  const setMenu = (open) => {
    btn.setAttribute('aria-expanded', String(open))
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu')
    links.classList.toggle('open', open)
    document.body.style.overflow = open ? 'hidden' : ''
  }
  btn.addEventListener('click', () => setMenu(btn.getAttribute('aria-expanded') !== 'true'))
  links.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false) })
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false) })

  // highlight the section in view
  const map = new Map()
  links.querySelectorAll('a[href^="#"]').forEach((a) => map.set(a.getAttribute('href').slice(1), a))
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return
      map.forEach((a) => a.classList.remove('active'))
      map.get(en.target.id)?.classList.add('active')
    })
  }, { rootMargin: '-45% 0px -50% 0px' })
  map.forEach((_, id) => { const s = document.getElementById(id); if (s) spy.observe(s) })
}

export function initReveal() {
  const items = document.querySelectorAll('.reveal')
  if (!('IntersectionObserver' in window)) { items.forEach((el) => el.classList.add('in')); return }
  // stagger siblings that come in together
  const io = new IntersectionObserver((entries) => {
    let n = 0
    entries.forEach((en) => {
      if (!en.isIntersecting) return
      en.target.style.setProperty('--rd', `${Math.min(n++, 4) * 0.08}s`)
      en.target.classList.add('in')
      io.unobserve(en.target)
    })
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })
  items.forEach((el) => io.observe(el))
}

export function initCounters(reduced) {
  const els = document.querySelectorAll('.count')
  const run = (el) => {
    const to = parseFloat(el.dataset.to)
    const dec = Number(el.dataset.dec || 0)
    const suffix = el.dataset.suffix || ''
    if (reduced) return
    const t0 = performance.now(), dur = 1600
    const step = (t) => {
      const k = Math.min((t - t0) / dur, 1)
      const e = 1 - Math.pow(1 - k, 4)
      el.textContent = (to * e).toFixed(dec) + suffix
      if (k < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { run(en.target); io.unobserve(en.target) } })
  }, { threshold: 0.6 })
  els.forEach((el) => io.observe(el))
}

export function initCopy() {
  const toast = document.getElementById('toast')
  let timer
  const show = (msg) => {
    toast.textContent = msg
    toast.classList.add('show')
    clearTimeout(timer)
    timer = setTimeout(() => toast.classList.remove('show'), 1800)
  }
  document.querySelectorAll('[data-copy]').forEach((b) => {
    b.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(b.dataset.copy)
        show('Email copied')
      } catch {
        show(b.dataset.copy)
      }
    })
  })
}
