// Checks on the built site (run `npm run build` first, then `npm test`)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { renderProjects } from '../src/render.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const html = readFileSync(join(dist, 'index.html'), 'utf8')
const esc = (s) => s.replace(/&/g, '&amp;')
const projects = JSON.parse(readFileSync(join(root, 'src/data/projects.json'), 'utf8'))

test('page has title, description, viewport and og tags', () => {
  assert.match(html, /<title>Tejdeep Kellampalli[^<]*<\/title>/)
  assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1"/)
  assert.match(html, /<meta name="description" content="[^"]{60,}"/)
  assert.match(html, /<link rel="canonical" href="https:\/\/tejdeepkellampalli\.netlify\.app\/"/)
  assert.match(html, /property="og:image" content="https:\/\/tejdeepkellampalli\.netlify\.app\/og\.png"/)
})

test('every project from projects.json is on the page with its live and code links', () => {
  for (const p of [...projects.featured, ...projects.others]) {
    assert.ok(html.includes(`>${esc(p.name)}</h3>`), `missing ${p.name}`)
    assert.ok(html.includes(`href="${p.live}"`), `missing live link for ${p.name}`)
    assert.ok(html.includes(`href="${p.code}"`), `missing code link for ${p.name}`)
    assert.match(p.live, /^https:\/\/[a-z0-9-]+\.netlify\.app$/)
  }
})

test('android app links point at the github release apk', () => {
  const withApp = projects.featured.filter((p) => p.app)
  assert.deepEqual(withApp.map((p) => p.slug), ['safe-roads', 'airpulse'])
  for (const p of withApp) {
    assert.match(p.app.android, /^https:\/\/github\.com\/Tejdeep-67\/[\w-]+\/releases\/latest\/download\/[\w-]+\.apk$/)
    assert.ok(html.includes(`href="${p.app.android}"`), `missing android link for ${p.name}`)
  }
})

test('the page does not call him an analyst (he is a student)', () => {
  const text = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/Retail Sales Analytics|retail-analytics|analytics/gi, '')
  assert.doesNotMatch(text, /analyst/i)
})

test('featured projects keep their order: Safe Roads, AirPulse, NiftyLens', () => {
  const order = ['Safe Roads', 'AirPulse', 'NiftyLens'].map((n) => html.indexOf(`>${n}</h3>`))
  assert.deepEqual([...order].sort((a, b) => a - b), order)
  assert.ok(order[0] > 0)
})

test('signature intro and logo are rendered into the html', () => {
  assert.match(html, /class="sig sig-anim"[^>]*data-total="\d+"/)
  // both lines of the signature (Tejdeep, Kellampalli) in the intro and the nav logo
  assert.ok((html.match(/<use href="#sig-ink-1"/g) || []).length >= 2)
  assert.ok((html.match(/<use href="#sig-ink-2"/g) || []).length >= 2)
  assert.match(html, /class="sig sig-anim"[^>]*aria-label="Tejdeep Kellampalli"/)
  assert.ok(!html.includes('<!-- @'), 'a build placeholder was left in the page')
})

test('local files referenced by the page exist', () => {
  const refs = [...html.matchAll(/(?:href|src)="(\/[^"#?]+)"/g)].map((m) => m[1])
  const srcsets = [...html.matchAll(/srcset="([^"]+)"/g)].flatMap((m) => m[1].split(',').map((s) => s.trim().split(' ')[0]))
  for (const r of new Set([...refs, ...srcsets])) {
    if (r === '/') continue
    assert.ok(existsSync(join(dist, r)), `missing file ${r}`)
  }
  assert.ok(existsSync(join(dist, '404.html')))
  assert.ok(existsSync(join(dist, 'og.png')))
  for (const f of ['favicon.svg', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'site.webmanifest']) {
    assert.ok(existsSync(join(dist, f)), `missing ${f}`)
  }
})

test('contact links: email, linkedin, github, resume', () => {
  assert.ok(html.includes('mailto:kellampallitejdeep@gmail.com'))
  assert.ok(html.includes('https://in.linkedin.com/in/tejdeep-kellampalli-6510a8355'))
  assert.ok(html.includes('https://github.com/Tejdeep-67'))
  assert.ok(html.includes('href="/resume.pdf"'))
})

test('render escapes text from the json', () => {
  const out = renderProjects({ featured: [{ slug: 'x', name: '<b>x</b>', kicker: 'k', summary: 's', highlights: [], stack: [], live: 'https://a.netlify.app', code: 'https://github.com/a' }], others: [] })
  assert.ok(!out.featured.includes('<b>x</b>'))
  assert.ok(out.featured.includes('&lt;b&gt;x&lt;/b&gt;'))
})
