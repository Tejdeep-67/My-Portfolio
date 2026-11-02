// Builds the project cards (and the signature svg) from the json data.
// Used by the vite plugin in vite.config.js, so the html is static and
// the content is there even before any js runs.

const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const arrow = `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" /></svg>`
const gh = `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" /></svg>`

// Placeholder visuals until real screenshots are dropped in (set "image" in projects.json)
const art = {
  'safe-roads': `<svg viewBox="0 0 640 400" class="art" aria-hidden="true">
    <defs>
      <linearGradient id="sr-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#121a2e"/><stop offset="1" stop-color="#0b111f"/></linearGradient>
      <linearGradient id="sr-road" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2338"/><stop offset="1" stop-color="#262f45"/></linearGradient>
    </defs>
    <rect width="640" height="400" fill="url(#sr-sky)"/>
    <path d="M0 122H640" stroke="#24304b"/>
    <path d="M300 120 L340 120 L640 400 L0 400 Z" fill="url(#sr-road)"/>
    <path d="M300 120 L0 400M340 120 L640 400" stroke="#4a5677" stroke-width="2"/>
    <path d="M318 130v18M316 170v26M313 225v36M309 292v50M305 370v30" stroke="#d8b46a" stroke-width="4" stroke-linecap="round" opacity=".55"/>
    <ellipse cx="226" cy="318" rx="58" ry="16" fill="#0a0f1c" opacity=".85"/>
    <ellipse cx="402" cy="242" rx="34" ry="9" fill="#0a0f1c" opacity=".85"/>
    <g class="box b1"><rect x="160" y="290" width="132" height="56" rx="6" fill="none" stroke="#f0b44c" stroke-width="2.5"/><rect x="160" y="270" width="82" height="20" rx="4" fill="#f0b44c"/><text x="168" y="285" font-size="13" font-family="monospace" fill="#0a0f1c">pothole</text></g>
    <g class="box b2"><rect x="362" y="226" width="80" height="34" rx="5" fill="none" stroke="#ff7a59" stroke-width="2.5"/><rect x="362" y="208" width="58" height="18" rx="4" fill="#ff7a59"/><text x="368" y="221" font-size="12" font-family="monospace" fill="#0a0f1c">crack</text></g>
    <g><rect x="24" y="24" width="64" height="24" rx="12" fill="#0e1526" stroke="#2a3552"/><circle cx="40" cy="36" r="4" fill="#ff5d5d"/><text x="50" y="41" font-size="12" font-family="monospace" fill="#c9d2e6">LIVE</text></g>
    <g opacity=".9"><rect x="470" y="28" width="146" height="92" rx="12" fill="#0e1526" stroke="#2a3552"/><path d="M486 96c18-26 36 8 56-18s36-6 58-34" stroke="#6f8bd6" stroke-width="2" fill="none"/><circle cx="542" cy="78" r="6" fill="#f0b44c"/><circle cx="584" cy="58" r="5" fill="#ff7a59"/><circle cx="512" cy="84" r="4" fill="#f0b44c"/></g>
  </svg>`,
  airpulse: `<svg viewBox="0 0 640 400" class="art" aria-hidden="true">
    <defs><radialGradient id="ap-g" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#5eead4" stop-opacity=".35"/><stop offset="1" stop-color="#5eead4" stop-opacity="0"/></radialGradient></defs>
    <rect width="640" height="400" fill="#0c1424"/>
    <circle cx="200" cy="200" r="150" fill="url(#ap-g)"/>
    <circle cx="200" cy="200" r="104" fill="none" stroke="#1f2a44" stroke-width="18"/>
    <circle class="ring" cx="200" cy="200" r="104" fill="none" stroke="url(#ap-arc)" stroke-width="18" stroke-linecap="round" stroke-dasharray="420 654" transform="rotate(-90 200 200)"/>
    <linearGradient id="ap-arc"><stop offset="0" stop-color="#5ad38b"/><stop offset=".5" stop-color="#f3d46b"/><stop offset="1" stop-color="#f08a4b"/></linearGradient>
    <text x="200" y="208" text-anchor="middle" font-size="54" font-family="Georgia, serif" fill="#e9ecf3">AQI</text>
    <text x="200" y="238" text-anchor="middle" font-size="13" font-family="monospace" fill="#8fa0bf">PM2.5 · NO2 · O3</text>
    <g transform="translate(380 70)"><rect width="230" height="260" rx="14" fill="#0f1a2e" stroke="#22304d"/>
      <path class="line" d="M20 200 C50 170 70 190 95 150 S140 120 160 140 S200 90 212 70" fill="none" stroke="#5eead4" stroke-width="3"/>
      <path d="M20 210 C50 190 70 200 95 175 S140 160 160 165 S200 130 212 120" fill="none" stroke="#d8b46a" stroke-width="2" stroke-dasharray="6 6"/>
      <text x="20" y="34" font-size="13" font-family="monospace" fill="#8fa0bf">forecast vs CAMS</text></g>
  </svg>`,
  niftylens: `<svg viewBox="0 0 640 400" class="art" aria-hidden="true">
    <rect width="640" height="400" fill="#0b1120"/>
    <g stroke="#1a2440">${Array.from({ length: 7 }, (_, i) => `<path d="M30 ${60 + i * 46}H610"/>`).join('')}</g>
    <g class="candles">${[
      [60, 230, 290, 250, 270, 1], [96, 210, 280, 230, 262, 1], [132, 190, 250, 200, 236, 1], [168, 200, 262, 214, 248, 0],
      [204, 170, 240, 180, 222, 1], [240, 150, 218, 160, 200, 1], [276, 160, 226, 172, 210, 0], [312, 130, 200, 140, 184, 1],
      [348, 118, 180, 126, 166, 1], [384, 128, 196, 140, 178, 0], [420, 104, 170, 112, 156, 1], [456, 90, 150, 98, 140, 1],
    ].map(([x, hi, lo, o, c, up]) => `<path d="M${x} ${hi}V${lo}" stroke="${up ? '#3ccf91' : '#ef6a6a'}" stroke-width="2"/><rect x="${x - 9}" y="${Math.min(o, c)}" width="18" height="${Math.abs(c - o)}" rx="2" fill="${up ? '#3ccf91' : '#ef6a6a'}"/>`).join('')}</g>
    <g transform="translate(500 250)"><path d="M-70 0a70 70 0 0 1 140 0" fill="none" stroke="#1f2a44" stroke-width="14"/><path class="gauge" d="M-70 0a70 70 0 0 1 112-56" fill="none" stroke="#d8b46a" stroke-width="14" stroke-linecap="round"/><text y="-12" text-anchor="middle" font-size="13" font-family="monospace" fill="#8fa0bf">mood</text></g>
    <text x="30" y="40" font-size="14" font-family="monospace" fill="#8fa0bf">NIFTY 50</text>
  </svg>`,
}

export function featuredCard(p, i) {
  const visual = p.image
    ? `<img src="${esc(p.image)}" alt="${esc(p.name)} screenshot" loading="lazy" decoding="async" width="1280" height="800">`
    : art[p.slug] || ''
  return `
<article class="feature reveal${i % 2 ? ' flip' : ''}" data-slug="${esc(p.slug)}">
  <a class="feature-visual tilt" href="${esc(p.live)}" target="_blank" rel="noopener" aria-label="Open ${esc(p.name)} live">
    <div class="tilt-inner">${visual}</div>
    <span class="glare" aria-hidden="true"></span>
  </a>
  <div class="feature-body">
    <p class="kicker"><span class="num">0${i + 1}</span>${esc(p.kicker)}</p>
    <h3>${esc(p.name)}</h3>
    ${p.note ? `<p class="note">${esc(p.note)}</p>` : ''}
    <p class="summary">${esc(p.summary)}</p>
    <ul class="points">${p.highlights.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>
    <ul class="stack" aria-label="Tech used">${p.stack.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
    <div class="links">
      <a class="btn btn-gold magnetic" href="${esc(p.live)}" target="_blank" rel="noopener">Live demo ${arrow}</a>
      <a class="btn btn-ghost magnetic" href="${esc(p.code)}" target="_blank" rel="noopener">${gh} Code</a>
    </div>
  </div>
</article>`
}

export function otherCard(p) {
  return `
<article class="mini reveal" data-slug="${esc(p.slug)}">
  <div class="mini-card tilt">
    <div class="tilt-inner">
      <p class="kicker">${esc(p.kicker)}</p>
      <h3>${esc(p.name)}</h3>
      <p class="summary">${esc(p.summary)}</p>
      ${p.highlights?.length ? `<p class="hl">${esc(p.highlights[0])}</p>` : ''}
      <ul class="stack">${p.stack.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
      <div class="links">
        <a href="${esc(p.live)}" target="_blank" rel="noopener">Live ${arrow}</a>
        <a href="${esc(p.code)}" target="_blank" rel="noopener">${gh} Code</a>
      </div>
    </div>
    <span class="glare" aria-hidden="true"></span>
  </div>
</article>`
}

export function renderProjects(data) {
  return {
    featured: data.featured.map(featuredCard).join('\n'),
    others: data.others.map(otherCard).join('\n'),
  }
}

// ---------- signature ----------
// The signature json comes from tools/signature (font outline + traced pen strokes).
// The outline is the visible ink; the pen strokes are drawn into a mask with
// stroke-dashoffset, so the ink appears in writing order.

const WRITE_MS = 1400 // time spent writing the letters
const LIFT_MS = 55 // pen lift between strokes

function strokeTimings(strokes) {
  const w = strokes.map((s) => Math.pow(s.len, 0.8))
  const sum = w.reduce((a, b) => a + b, 0)
  let t = 80
  return strokes.map((s, i) => {
    const small = s.len < 30 // the dot of the j: small pause, quick tap
    if (small) t += 90
    const dur = small ? 110 : Math.max(90, Math.round((WRITE_MS * w[i]) / sum))
    const out = { delay: t, dur }
    t += dur + LIFT_MS
    return out
  })
}

export function signatureDefs(sig) {
  return `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
<linearGradient id="sig-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6e5bd"/><stop offset=".5" stop-color="#e2c27f"/><stop offset="1" stop-color="#bf9550"/></linearGradient>
<path id="sig-ink" d="${sig.outline}"/>
<path id="sig-swoosh" d="${sig.flourish.shape}"/>
</defs></svg>`
}

export function signatureIntro(sig) {
  const [x, y, w, h] = sig.viewBox
  const times = strokeTimings(sig.strokes)
  const last = times[times.length - 1]
  const fStart = last.delay + last.dur - 40
  const fDur = 360
  const total = fStart + fDur
  const paths = sig.strokes
    .map((s, i) => `<path d="${s.d}" pathLength="1" style="--t:${times[i].delay}ms;--d:${times[i].dur}ms"/>`)
    .join('')
  return `<svg class="sig sig-anim" viewBox="${x} ${y} ${w} ${h}" data-total="${total}" role="img" aria-label="Tejdeep">
<defs>
<mask id="sig-write" maskUnits="userSpaceOnUse" x="${x}" y="${y}" width="${w}" height="${h}"><g class="pen" fill="none" stroke="#fff" stroke-width="${sig.pen}" stroke-linecap="round" stroke-linejoin="round">${paths}</g></mask>
<mask id="sig-write-2" maskUnits="userSpaceOnUse" x="${x}" y="${y}" width="${w}" height="${h}"><g class="pen" fill="none" stroke="#fff" stroke-width="16" stroke-linecap="round"><path d="${sig.flourish.center}" pathLength="1" style="--t:${fStart}ms;--d:${fDur}ms"/></g></mask>
</defs>
<use href="#sig-ink" fill="url(#sig-gold)" mask="url(#sig-write)"/>
<use href="#sig-swoosh" fill="url(#sig-gold)" mask="url(#sig-write-2)"/>
</svg>`
}

export function signatureLogo(sig) {
  const [x, y, w, h] = sig.viewBox
  return `<svg class="sig" viewBox="${x} ${y} ${w} ${h}" aria-hidden="true" focusable="false"><use href="#sig-ink" fill="currentColor"/><use href="#sig-swoosh" fill="currentColor"/></svg>`
}
