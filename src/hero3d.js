// Hero background: a flowing field of data points (a wavy "terrain" of particles)
// with a few brighter constellation nodes above it. Reacts to the mouse / device tilt
// and to scroll. Only loaded when WebGL works and the user is fine with motion.
import {
  WebGLRenderer, Scene, PerspectiveCamera, BufferGeometry, BufferAttribute, Points,
  ShaderMaterial, AdditiveBlending, Color, LineSegments, LineBasicMaterial, Group, Vector2,
} from 'three'

const fieldVert = /* glsl */ `
  uniform float uTime;
  uniform vec2 uMouse;     // mouse position on the ground plane (x, z)
  uniform float uPixel;
  uniform float uSize;
  attribute float aRand;
  varying float vHeight;
  varying float vFade;
  varying float vGlow;

  float wave(vec2 p, float t) {
    float h = sin(p.x * 0.32 + t * 0.55) * 0.55;
    h += sin(p.y * 0.45 - t * 0.4 + p.x * 0.12) * 0.45;
    h += sin((p.x + p.y) * 0.9 + t * 0.9) * 0.12;
    return h;
  }

  void main() {
    vec3 pos = position;
    float t = uTime;
    float h = wave(pos.xz, t);
    float d = distance(pos.xz, uMouse);
    float lift = exp(-d * d / 3.2);
    h += lift * 0.9;
    pos.y += h;
    vGlow = lift;
    vHeight = h;
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * uPixel * (0.6 + aRand * 0.6 + lift * 0.8) / -mv.z;
    // fade out far away and at the side edges
    vFade = smoothstep(-26.0, -8.0, pos.z) * (1.0 - smoothstep(10.0, 16.0, abs(pos.x)));
  }
`

const fieldFrag = /* glsl */ `
  uniform vec3 uLow;
  uniform vec3 uHigh;
  uniform vec3 uGold;
  varying float vHeight;
  varying float vFade;
  varying float vGlow;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float r = length(c);
    if (r > 0.5) discard;
    float soft = smoothstep(0.5, 0.0, r);
    float k = clamp((vHeight + 0.9) / 1.9, 0.0, 1.0);
    vec3 col = mix(uLow, uHigh, k);
    col = mix(col, uGold, clamp(k * k * 0.9 + vGlow * 0.8, 0.0, 1.0));
    gl_FragColor = vec4(col, soft * vFade * (0.55 + k * 0.45));
  }
`

const nodeVert = /* glsl */ `
  uniform float uTime;
  uniform float uPixel;
  attribute float aRand;
  varying float vTw;
  void main() {
    vec3 pos = position;
    pos.y += sin(uTime * 0.6 + aRand * 6.28) * 0.12;
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    vTw = 0.55 + 0.45 * sin(uTime * 1.3 + aRand * 20.0);
    gl_PointSize = (70.0 + aRand * 90.0) * uPixel / -mv.z;
  }
`
const nodeFrag = /* glsl */ `
  uniform vec3 uGold;
  varying float vTw;
  void main() {
    float r = length(gl_PointCoord - 0.5);
    float core = smoothstep(0.16, 0.02, r);
    float halo = pow(smoothstep(0.5, 0.0, r), 2.0) * 0.5;
    gl_FragColor = vec4(uGold, (core + halo) * vTw);
  }
`

export function startHero(container, { mobile = false } = {}) {
  let renderer
  try {
    renderer = new WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'low-power' })
  } catch {
    return null // no webgl: the css background stays
  }
  const pixel = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75)
  renderer.setPixelRatio(pixel)
  renderer.setClearColor(0x000000, 0)
  container.appendChild(renderer.domElement)

  const scene = new Scene()
  const camera = new PerspectiveCamera(55, 1, 0.1, 80)
  const base = { x: 0, y: 1.75, z: 8.5 }
  camera.position.set(base.x, base.y, base.z)

  // particle field
  const cols = mobile ? 90 : 170
  const rows = mobile ? 60 : 100
  const count = cols * rows
  const pos = new Float32Array(count * 3)
  const rnd = new Float32Array(count)
  let i = 0
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const jx = (Math.random() - 0.5) * 0.08
      pos[i * 3] = (c / (cols - 1) - 0.5) * 32 + jx
      pos[i * 3 + 1] = -1.6
      pos[i * 3 + 2] = (r / (rows - 1)) * -28 + 5
      rnd[i] = Math.random()
      i++
    }
  }
  const geo = new BufferGeometry()
  geo.setAttribute('position', new BufferAttribute(pos, 3))
  geo.setAttribute('aRand', new BufferAttribute(rnd, 1))
  const uniforms = {
    uTime: { value: 0 },
    uMouse: { value: new Vector2(99, 99) },
    uPixel: { value: pixel },
    uSize: { value: mobile ? 34 : 30 },
    uLow: { value: new Color('#1d2c5a') },
    uHigh: { value: new Color('#6f8fe0') },
    uGold: { value: new Color('#e9c987') },
  }
  const field = new Points(geo, new ShaderMaterial({
    uniforms, vertexShader: fieldVert, fragmentShader: fieldFrag,
    transparent: true, depthWrite: false, blending: AdditiveBlending,
  }))
  scene.add(field)

  // constellation: a few bright nodes linked to their nearest neighbours
  const group = new Group()
  const n = mobile ? 22 : 36
  const npos = new Float32Array(n * 3)
  const nr = new Float32Array(n)
  for (let k = 0; k < n; k++) {
    npos[k * 3] = (Math.random() - 0.3) * 24
    npos[k * 3 + 1] = 1.2 + Math.random() * 5
    npos[k * 3 + 2] = -4 - Math.random() * 12
    nr[k] = Math.random()
  }
  const ngeo = new BufferGeometry()
  ngeo.setAttribute('position', new BufferAttribute(npos, 3))
  ngeo.setAttribute('aRand', new BufferAttribute(nr, 1))
  const nodes = new Points(ngeo, new ShaderMaterial({
    uniforms: { uTime: uniforms.uTime, uPixel: uniforms.uPixel, uGold: uniforms.uGold },
    vertexShader: nodeVert, fragmentShader: nodeFrag,
    transparent: true, depthWrite: false, blending: AdditiveBlending,
  }))
  const segs = []
  for (let a = 0; a < n; a++) {
    const d = []
    for (let b = 0; b < n; b++) {
      if (a === b) continue
      const dx = npos[a * 3] - npos[b * 3], dy = npos[a * 3 + 1] - npos[b * 3 + 1], dz = npos[a * 3 + 2] - npos[b * 3 + 2]
      d.push([dx * dx + dy * dy + dz * dz, b])
    }
    d.sort((p, q) => p[0] - q[0])
    for (const [dist, b] of d.slice(0, 2)) {
      if (b > a && dist < 30) segs.push(...npos.slice(a * 3, a * 3 + 3), ...npos.slice(b * 3, b * 3 + 3))
    }
  }
  const lgeo = new BufferGeometry()
  lgeo.setAttribute('position', new BufferAttribute(new Float32Array(segs), 3))
  const lines = new LineSegments(lgeo, new LineBasicMaterial({ color: 0xd8b46a, transparent: true, opacity: 0.07, blending: AdditiveBlending, depthWrite: false }))
  group.add(nodes, lines)
  scene.add(group)

  // input: mouse / touch / device tilt, all eased
  const target = { x: 0, y: 0 }, cur = { x: 0, y: 0 }
  let mouseGround = new Vector2(99, 99)
  const onMove = (e) => {
    const p = e.touches ? e.touches[0] : e
    target.x = (p.clientX / window.innerWidth) * 2 - 1
    target.y = (p.clientY / window.innerHeight) * 2 - 1
    // rough projection of the pointer onto the ground plane
    mouseGround.set(target.x * 11, -3 + target.y * 7)
  }
  const onTilt = (e) => {
    if (e.gamma == null) return
    target.x = Math.max(-1, Math.min(1, e.gamma / 30))
    target.y = Math.max(-1, Math.min(1, (e.beta - 45) / 30))
  }
  window.addEventListener('pointermove', onMove, { passive: true })
  window.addEventListener('deviceorientation', onTilt, { passive: true })

  let scrollP = 0
  const onScroll = () => { scrollP = Math.min(window.scrollY / window.innerHeight, 1.2) }
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()

  const resize = () => {
    const w = container.clientWidth, h = container.clientHeight
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    // keep the field filling narrow screens
    camera.fov = w < 700 ? 68 : 55
    camera.updateProjectionMatrix()
  }
  resize()
  const ro = new ResizeObserver(resize)
  ro.observe(container)

  // only animate while the hero is on screen and the tab is visible
  let visible = true, raf = 0, last = performance.now(), time = Math.random() * 10
  const loop = (now) => {
    raf = requestAnimationFrame(loop)
    const dt = Math.min((now - last) / 1000, 0.05)
    last = now
    time += dt
    uniforms.uTime.value = time
    cur.x += (target.x - cur.x) * 0.04
    cur.y += (target.y - cur.y) * 0.04
    uniforms.uMouse.value.lerp(mouseGround, 0.06)
    camera.position.x = base.x + cur.x * 0.9
    camera.position.y = base.y - cur.y * 0.35 - scrollP * 1.4
    camera.position.z = base.z - scrollP * 2
    camera.lookAt(cur.x * 0.4, -0.75 - scrollP * 0.8, -4)
    group.rotation.y = time * 0.02 + cur.x * 0.05
    renderer.render(scene, camera)
  }
  const play = () => { if (!raf && visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(loop) } }
  const stop = () => { cancelAnimationFrame(raf); raf = 0 }
  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; visible ? play() : stop() })
  io.observe(container)
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : play()))

  renderer.render(scene, camera)
  play()
  requestAnimationFrame(() => renderer.domElement.classList.add('on'))
  return { stop }
}
