import * as React from "react"

/**
 * Projects under PDC as a scan stream, adapted from the Agent Scan Carousel.
 * Cards drift left through a glowing scanner. Right of the line is the project
 * card people see; left of it the same card is boiled down to a terminal
 * readout of the problem, the build and the outcome.
 *
 * Drag to fling (it coasts, then settles back to its drift); arrow keys nudge.
 */


type Project = {
  slug: string
  name: string
  tagline: string
  category: string
  /** Photo for the card face, e.g. "/assets/projects/blue-monitor.webp". A placeholder shows until set. */
  image?: string
  problem: string
  build: string[]
  outcome: string[]
  next?: string
  notes: string[]
  stats: [string, string][]
}

const PROJECTS: Project[] = [
  {
    slug: "blue-monitor",
    image: "/assets/projects/blue-monitor.webp",
    name: "Blue Monitor",
    tagline: "Wetland water-quality monitoring",
    category: "Environment",
    problem: "Nitrate and phosphate checks in rural wetlands still need a lab. India has lost 35-71% of its urban wetlands.",
    build: [
      "Solar-powered autonomous boat, fully off-grid",
      "pH, DO, TDS, nitrate, phosphate, turbidity, temp",
      "ESP8266 streams to a live admin dashboard",
      "Custom PVC-membrane nitrate ion-selective electrode",
    ],
    outcome: ["Shown at Research Conclave", "Live pH, turbidity, nitrate", "24-hour sensor-trend dashboard", "Talks with WWF, Fluxgen, IISc"],
    notes: ["market: aquaculture, govt, agri", "reach: 2000+ residents", "       600+ households"],
    stats: [
      ["7", "sensors on board"],
      ["600+", "households in reach"],
    ],
  },
  {
    slug: "qd-biosensor",
    image: "/assets/projects/qd-biosensor.webp",
    name: "Quantum Dot Biosensor",
    tagline: "Early diabetic neuropathy detection",
    category: "Med-tech",
    problem: "66% of diabetics develop neuropathy; 15% of foot ulcers end in amputation. Every test today is clinic-bound and costs ₹50 to ₹20,000.",
    build: [
      "Microneedle patch on the great toe, 200 µm deep",
      "Graphene QDs bind TRPV1, P2X3, Nav1.7 receptors",
      "Clip-on reader: 455 nm in, near-infrared out",
      "ESP32 sends readings to an alerting phone app",
    ],
    outcome: ["Circuit designed and validated", "Clinical feasibility + costing", "Validation with JIPMER", "Shown at Research Conclave"],
    notes: ["cost: ₹810 once", "      vs ₹2,400 a year", "dimmer NIR glow = nerve damage"],
    stats: [
      ["₹810", "one-time cost"],
      ["455 nm", "excitation light"],
    ],
  },
  {
    slug: "skywell",
    image: "/assets/projects/skywell.webp",
    name: "SkyWell",
    tagline: "Atmospheric water generator",
    category: "Water",
    problem: "Pulling water from air means cooling it to the dew point. That power bill rules out off-grid and low-income homes.",
    build: [
      "01 passive adiabatic chamber: RH 60% -> 95%",
      "02 small Peltier stage closes the last 5%",
      "03 biomimetic surface nucleates the drops",
    ],
    outcome: ["Chamber condensed water", "Peltier hit its target ΔT", "Surface nucleated droplets"],
    next: "Tune the stages together",
    notes: ["passive does the heavy lifting", "active cooling only for the", "last 5% of humidity"],
    stats: [
      ["3", "decoupled stages"],
      ["95%", "humidity at zero energy"],
    ],
  },
  {
    slug: "agilit-e",
    image: "/assets/projects/agilit-e.webp",
    name: "Agilit-E",
    tagline: "Tilting urban mobility vehicle",
    category: "Mobility",
    problem: "Two-wheelers are efficient but unsafe; cars are safe but too wide for dense cities. Rigid three-wheelers tip at speed.",
    build: [
      "Reverse trike that leans into turns",
      "Active tilt control via actuators",
      "Steer-by-wire with live telemetry",
      "Simulink dynamics model + HIL test rig",
    ],
    outcome: ["Dynamics model validated", "First mech + electronics protos", "Tilt geometry proven feasible"],
    next: "Full-scale rideable prototype",
    notes: ["open: steer-tilt coupling", "open: actuator choice", "open: sensor drift in motion"],
    stats: [
      ["3", "contact points"],
      ["HIL", "hardware-in-the-loop"],
    ],
  },
  {
    slug: "krishi",
    image: "/assets/projects/krishi.webp",
    name: "Krishi",
    tagline: "Integrated agriculture tool",
    category: "AgriTech",
    problem: "Smallholder farmers buy, store and run separate tools for sowing and harvesting, which costs them time and money.",
    build: ["One device that both sows and harvests", "Built for Tier 2 and 3 farming communities"],
    outcome: ["Entered Nirman (national)", "One of PDC's longest runs"],
    notes: ["status: wrapped up,", "        not running this year"],
    stats: [
      ["2-in-1", "sow and harvest"],
      ["Nirman", "national entry"],
    ],
  },
]

// Card geometry in design pixels; the stream scales down to fit narrow screens.
const CARD_W = 800
const CARD_H = 500
const GAP = 72
const PITCH = CARD_W + GAP
const STAGE_H = 580
const CARD_TOP = 40
const SPEED = 48
const ACCENT = "#9ee63e"
const ACCENT_RGB = "158,230,62"
const SPARK = "#ff6045"

const wrap = (x: number, period: number) => ((x % period) + period) % period
const slotX = (i: number, offset: number, pitch: number, period: number) => wrap(i * pitch + offset + pitch, period) - pitch
const fitScale = (w: number) => Math.max(0.36, Math.min(1, (w - 32) / CARD_W))
const relax = (v: number, base: number, dt: number, tau: number) => base + (v - base) * Math.exp(-dt / tau)
const pad = (k: number) => String(k).padStart(2, "0")

const css = `
.ps-root{position:relative;width:100%;overflow:hidden;padding-top:32px}
.ps-stage{position:relative;width:100%;cursor:grab;touch-action:pan-y;-webkit-user-select:none;user-select:none;outline:none}
.ps-stage[data-drag='1']{cursor:grabbing}
.ps-stage:focus-visible{outline:2px solid ${ACCENT};outline-offset:4px}
.ps-fade{position:absolute;inset:0;-webkit-mask-image:linear-gradient(to right,transparent 0,#000 6%,#000 94%,transparent 100%);mask-image:linear-gradient(to right,transparent 0,#000 6%,#000 94%,transparent 100%)}
.ps-card{position:absolute;left:0;top:0;width:${CARD_W}px;height:${CARD_H}px;transform-origin:0 0;will-change:transform}
.ps-face,.ps-code{position:absolute;inset:0;border-radius:24px;overflow:hidden;will-change:clip-path}
.ps-face{background:#0d100e}
.ps-face::after{content:"";position:absolute;inset:0;border-radius:inherit;box-shadow:inset 0 0 0 1px rgba(255,255,255,.09);pointer-events:none}
.ps-photo{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover}
.ps-ph{position:absolute;inset:0;background:radial-gradient(circle at 70% 36%,rgba(${ACCENT_RGB},.16),transparent 55%),linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px) 0 0/40px 40px,linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px) 0 0/40px 40px}
.ps-ph span{position:absolute;left:68%;top:38%;transform:translate(-50%,-50%);padding:48px 56px;border:1px dashed rgba(${ACCENT_RGB},.35);border-radius:14px;font:500 12px/1 var(--font-mono,monospace);letter-spacing:.12em;text-transform:uppercase;color:rgba(${ACCENT_RGB},.7);white-space:nowrap}
.ps-shade{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(9,10,13,.6) 0%,transparent 24%),linear-gradient(to top,rgba(9,10,13,.94) 0%,rgba(9,10,13,.55) 40%,transparent 68%)}
.ps-top{position:absolute;left:36px;right:36px;top:30px;display:flex;align-items:center;gap:14px;font:500 13px/1 var(--font-mono,monospace);letter-spacing:.08em;text-transform:uppercase;color:#94a3b8}
.ps-idx{color:${ACCENT}}
.ps-chip{display:inline-flex;align-items:center;gap:8px;padding:8px 14px;border-radius:999px;background:rgba(9,10,13,.72);border:1px solid rgba(255,255,255,.1);color:#f8fafc}
.ps-bottom{position:absolute;left:36px;right:36px;bottom:34px;display:flex;align-items:flex-end;justify-content:space-between;gap:32px}
.ps-name{margin:0;max-width:470px;font-family:var(--font-brutal,sans-serif);font-weight:900;font-stretch:112%;font-size:50px;line-height:.95;letter-spacing:-.03em;text-transform:uppercase;color:#f8fafc}
.ps-tag{margin:12px 0 0;font:500 17px/1.4 var(--font-sans,sans-serif);color:#94a3b8}
.ps-stats{display:flex;gap:28px;flex:none}
.ps-stats b{display:block;font:900 30px/1 var(--font-brutal,sans-serif);color:${ACCENT}}
.ps-stats span{display:block;margin-top:8px;max-width:110px;font:500 12px/1.3 var(--font-small,sans-serif);color:#94a3b8}
.ps-code{box-sizing:border-box;background:#07090b;border:1px solid rgba(${ACCENT_RGB},.22);font:400 13px/19px var(--font-mono,monospace);color:#cbd5e1;white-space:pre-wrap}
.ps-bar{display:flex;align-items:center;gap:8px;height:38px;padding:0 18px;background:#0e1214;border-bottom:1px solid rgba(255,255,255,.06)}
.ps-bar i{width:11px;height:11px;border-radius:50%;background:${SPARK}}
.ps-bar i:nth-child(2){background:#f5b942}
.ps-bar i:nth-child(3){background:${ACCENT}}
.ps-bar span{flex:1;margin-right:52px;text-align:center;font-size:12px;color:#64748b}
.ps-cols{display:flex;gap:28px;padding:22px 30px}
.ps-col-a{width:410px;flex:none}
.ps-col-b{flex:1;min-width:0}
.ps-p{color:${ACCENT};font-weight:600}
.ps-path{color:#7aa2ff}
.ps-h{margin-top:12px;color:#f8fafc;font-weight:700;letter-spacing:.06em}
.ps-dim{color:#64748b}
.ps-k{margin-top:14px;color:#f5b942}
.ps-li{display:flex;gap:1ch}
.ps-li>span:first-child{flex:none}
.ps-ok{color:${ACCENT}}
.ps-next{color:#f5b942}
.ps-gap{height:14px}
.ps-cursor{display:inline-block;width:8px;height:15px;vertical-align:-2px;background:${ACCENT};animation:ps-blink 1s steps(1) infinite}
@keyframes ps-blink{50%{opacity:0}}
.ps-canvas{position:absolute;left:0;top:0;pointer-events:none;z-index:3}
.ps-meter{position:absolute;z-index:4;display:flex;flex-direction:column;align-items:center;pointer-events:none;transform:translateX(-50%)}
.ps-meter-label{margin-bottom:10px;font:500 12px/20px var(--font-mono,monospace);letter-spacing:.1em;text-transform:uppercase;color:#64748b;white-space:nowrap}
.ps-pill{display:flex;align-items:center;gap:22px;height:32px;padding:6px 18px;box-sizing:border-box;border-radius:999px;background:${ACCENT};box-shadow:0 0 24px rgba(${ACCENT_RGB},.35);color:#0b1205;white-space:nowrap}
.ps-pill-n{font:500 15px/20px var(--font-mono,monospace);font-variant-numeric:tabular-nums}
.ps-pill-p{min-width:4ch;text-align:right;font:700 12px/20px var(--font-small,sans-serif);font-variant-numeric:tabular-nums}
.ps-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
@media (prefers-reduced-motion:reduce){.ps-cursor{animation:none}}
`

function Face({ p, i }: { p: Project; i: number }) {
  return (
    <>
      {p.image ? (
        <img className="ps-photo" src={p.image} alt="" draggable={false} loading="lazy" decoding="async" />
      ) : (
        <div className="ps-ph">
          <span>[ project photo ]</span>
        </div>
      )}
      <div className="ps-shade" />
      <div className="ps-top">
        <span className="ps-chip">
          <span className="ps-idx">{pad(i + 1)}</span>
          {p.category}
        </span>
      </div>
      <div className="ps-bottom">
        <div>
          <p className="ps-name">{p.name}</p>
          <p className="ps-tag">{p.tagline}</p>
        </div>
        <div className="ps-stats">
          {p.stats.map(([v, l]) => (
            <div key={l}>
              <b>{v}</b>
              <span>{l}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

const Prompt = ({ children }: { children?: React.ReactNode }) => (
  <div>
    <span className="ps-p">pdc@cfi</span>:<span className="ps-path">~/projects</span>$ {children}
  </div>
)

function Term({ p }: { p: Project }) {
  return (
    <>
      <div className="ps-bar">
        <i />
        <i />
        <i />
        <span>pdc@cfi: ~/projects/{p.slug}</span>
      </div>
      <div className="ps-cols">
        <div className="ps-col-a">
          <Prompt>cat {p.slug}/README</Prompt>
          <div className="ps-h">{p.name.toUpperCase()}</div>
          <div className="ps-dim">{p.tagline.toLowerCase()}</div>
          <div className="ps-k">## problem</div>
          <div>{p.problem}</div>
          <div className="ps-k">## build</div>
          {p.build.map((b) => (
            <div key={b} className="ps-li">
              <span className="ps-dim">-</span>
              <span>{b}</span>
            </div>
          ))}
        </div>
        <div className="ps-col-b">
          <Prompt>./status</Prompt>
          <div className="ps-gap" />
          {p.outcome.map((o) => (
            <div key={o} className="ps-li">
              <span className="ps-ok">✓</span>
              <span>{o}</span>
            </div>
          ))}
          {p.next && (
            <div className="ps-li">
              <span className="ps-next">→</span>
              <span>next: {p.next}</span>
            </div>
          )}
          <div className="ps-gap" />
          {p.notes.map((n) => (
            <div key={n} className="ps-dim">
              # {n}
            </div>
          ))}
          <div className="ps-gap" />
          <Prompt>
            <span className="ps-cursor" />
          </Prompt>
        </div>
      </div>
    </>
  )
}

type Particle = { x: number; y: number; vx: number; vy: number; age: number; life: number; size: number; spark: boolean }

export default function ProjectScan() {
  const list = PROJECTS
  const n = list.length
  const stageRef = React.useRef<HTMLDivElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const meterRef = React.useRef<HTMLDivElement>(null)
  const numRef = React.useRef<HTMLSpanElement>(null)
  const pctRef = React.useRef<HTMLSpanElement>(null)
  const cardEls = React.useRef<(HTMLDivElement | null)[]>([])
  const faceEls = React.useRef<(HTMLDivElement | null)[]>([])
  const codeEls = React.useRef<(HTMLDivElement | null)[]>([])
  const [copies, setCopies] = React.useState(2)
  const live = React.useRef({ offset: 0, vel: -SPEED, drag: false, lastX: 0, lastT: 0, dragVel: 0, scale: 1, stageW: 0, placed: false })
  const slots = n * copies

  // Layout: scale from the width, enough copies that the stream always overfills it.
  React.useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const fit = () => {
      const w = stage.clientWidth
      const s = fitScale(w)
      const L = live.current
      L.scale = s
      L.stageW = w
      stage.style.height = STAGE_H * s + "px"
      const need = Math.max(2, Math.ceil((w + 2 * PITCH * s) / (n * PITCH * s)))
      setCopies((c) => (c === need ? c : need))
      if (!L.placed) {
        // Open with the first card part-way through the scanner.
        L.offset = w / 2 - 0.42 * CARD_W * s
        L.placed = true
      }
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(stage)
    return () => ro.disconnect()
  }, [n])

  React.useEffect(() => {
    const stage = stageRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!stage || !canvas || !ctx) return
    const L = live.current
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const base = reduce ? 0 : -SPEED
    if (!L.drag) L.vel = base
    const particles: Particle[] = []
    let intensity = 0
    let spawnAcc = 0
    let last = performance.now()
    let raf = 0
    let visible = true
    let shown = ""
    let cw = 0
    let ch = 0
    let dpr = 1
    const clipCache: string[] = []
    const posCache: string[] = []
    const rgba = (a: number) => "rgba(" + ACCENT_RGB + "," + a + ")"

    const sizeCanvas = () => {
      const w = L.stageW || stage.clientWidth
      const h = STAGE_H * L.scale
      dpr = Math.min(2, window.devicePixelRatio || 1)
      if (cw !== w || ch !== h) {
        cw = w
        ch = h
        canvas.width = Math.round(w * dpr)
        canvas.height = Math.round(h * dpr)
        canvas.style.width = w + "px"
        canvas.style.height = h + "px"
      }
    }

    const drawBeam = (scanX: number, s: number) => {
      const top = (CARD_TOP - 25) * s
      const bot = (CARD_TOP + CARD_H + 40) * s
      const core = Math.max(4, 8 * s)
      const left = scanX - core / 2 - 56 * s
      const right = scanX + core / 2 + 48 * s
      const span = right - left
      const at = (x: number) => Math.min(1, Math.max(0, (x - left) / span))
      const g = ctx.createLinearGradient(left, 0, right, 0)
      g.addColorStop(0, rgba(0))
      g.addColorStop(at(scanX - core / 2 - 40 * s), rgba(0.1))
      g.addColorStop(at(scanX - core / 2 - 24 * s), rgba(0.25))
      g.addColorStop(at(scanX - core / 2 - 10 * s), rgba(0.52))
      g.addColorStop(at(scanX - core / 2 - 2 * s), rgba(0.9))
      g.addColorStop(at(scanX - core / 2), rgba(1))
      g.addColorStop(at(scanX + core / 2), rgba(1))
      g.addColorStop(at(scanX + core / 2 + 6 * s), rgba(0.62))
      g.addColorStop(at(scanX + core / 2 + 14 * s), rgba(0.36))
      g.addColorStop(at(scanX + core / 2 + 26 * s), rgba(0.14))
      g.addColorStop(1, rgba(0))
      ctx.save()
      ctx.fillStyle = g
      ctx.fillRect(left, top, span, bot - top)
      // Soft ends.
      ctx.globalCompositeOperation = "destination-out"
      const fade = 34 * s
      const gt = ctx.createLinearGradient(0, top, 0, top + fade)
      gt.addColorStop(0, "rgba(0,0,0,1)")
      gt.addColorStop(1, "rgba(0,0,0,0)")
      ctx.fillStyle = gt
      ctx.fillRect(left, top, span, fade)
      const gb = ctx.createLinearGradient(0, bot - fade, 0, bot)
      gb.addColorStop(0, "rgba(0,0,0,0)")
      gb.addColorStop(1, "rgba(0,0,0,1)")
      ctx.fillStyle = gb
      ctx.fillRect(left, bot - fade, span, fade)
      ctx.restore()
    }

    const frame = (now: number) => {
      raf = 0
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000))
      last = now
      const s = L.scale
      const pitch = PITCH * s
      const period = slots * pitch
      const scanX = Math.round((L.stageW || stage.clientWidth) / 2)
      if (!L.drag) {
        L.vel = reduce ? 0 : relax(L.vel, base, dt, 0.55)
        L.offset += L.vel * dt
      }
      L.offset = wrap(L.offset, period)

      // Cards: position plus the two complementary clips at the scanner.
      let over = -1
      let overP = 0
      for (let i = 0; i < slots; i++) {
        const el = cardEls.current[i]
        if (!el) continue
        const x = slotX(i, L.offset, pitch, period)
        const pos = "translate3d(" + x.toFixed(2) + "px," + (CARD_TOP * s).toFixed(2) + "px,0) scale(" + s + ")"
        if (posCache[i] !== pos) {
          el.style.transform = pos
          posCache[i] = pos
        }
        const local = Math.min(CARD_W, Math.max(0, (scanX - x) / s))
        const clip = local.toFixed(1)
        if (clipCache[i] !== clip) {
          clipCache[i] = clip
          const f = faceEls.current[i]
          const c = codeEls.current[i]
          if (f) f.style.clipPath = "inset(0 0 0 " + clip + "px)"
          if (c) {
            c.style.clipPath = "inset(0 " + (CARD_W - local).toFixed(1) + "px 0 0)"
            c.style.visibility = local <= 0 ? "hidden" : "visible"
          }
        }
        if (scanX >= x && scanX <= x + CARD_W * s) {
          over = i % n
          overP = (scanX - x) / (CARD_W * s)
        }
      }

      if (over >= 0) {
        const pct = Math.round(overP * 100)
        const txt = over + "|" + pct
        if (txt !== shown) {
          shown = txt
          if (numRef.current) numRef.current.textContent = pad(over + 1) + " / " + pad(n)
          if (pctRef.current) pctRef.current.textContent = pct + "%"
        }
      }

      // Beam and shed pixels.
      sizeCanvas()
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, cw, ch)
      drawBeam(scanX, s)
      if (!reduce) {
        const target = over >= 0 ? 1 : 0
        intensity += (target - intensity) * (1 - Math.exp(-dt / (target > intensity ? 1.4 : 0.55)))
        spawnAcc += 380 * intensity * s * dt
        const top = CARD_TOP * s
        const hgt = CARD_H * s
        // Pixels ride with the stream when it is dragged backwards.
        const drift = Math.min(0, L.drag ? L.dragVel : L.vel)
        while (spawnAcc >= 1 && particles.length < 3400) {
          spawnAcc -= 1
          particles.push({
            x: scanX + 5 * s + (Math.random() < 0.96 ? Math.pow(Math.random(), 1.75) * 196 : 140 + Math.random() * 140) * s,
            y: top - 32 * s + Math.random() * (hgt + 64 * s),
            vx: (4 + Math.random() * 22) * s,
            vy: (Math.random() - 0.5) * 8 * s,
            age: 0,
            life: 0.7 + Math.random() * 1.5,
            size: [2, 3, 3, 4, 4, 5, 5, 6][(Math.random() * 8) | 0] * Math.max(0.6, s),
            spark: Math.random() < 0.14,
          })
        }
        if (spawnAcc > 1) spawnAcc = 0
        const reach = 300 * s
        let k = 0
        for (let i = 0; i < particles.length; i++) {
          const q = particles[i]
          q.age += dt
          q.x += (q.vx + drift * 0.15) * dt
          q.y += q.vy * dt
          const dx = q.x - scanX
          if (q.age >= q.life || dx > reach || dx < -6) continue
          particles[k++] = q
          const a = Math.min(1, (q.life - q.age) / 0.25, q.age / 0.06) * (1 - Math.pow(Math.min(1, dx / reach), 6))
          if (a <= 0.02) continue
          ctx.globalAlpha = a
          ctx.fillStyle = q.spark ? SPARK : ACCENT
          ctx.fillRect(Math.round(q.x), Math.round(q.y), q.size, q.size)
        }
        particles.length = k
        ctx.globalAlpha = 1
      }

      if (meterRef.current) {
        meterRef.current.style.left = scanX + "px"
        meterRef.current.style.top = CARD_TOP * s - 44 + "px"
      }

      if (visible && !document.hidden && (!reduce || L.drag)) raf = requestAnimationFrame(frame)
    }

    const kick = () => {
      if (!raf && visible && !document.hidden) {
        last = performance.now()
        raf = requestAnimationFrame(frame)
      }
    }
    const io = new IntersectionObserver((e) => {
      visible = e[0] ? e[0].isIntersecting : true
      if (visible) kick()
    })
    io.observe(stage)
    const onVis = () => kick()
    document.addEventListener("visibilitychange", onVis)
    const ro = new ResizeObserver(() => {
      if (reduce) {
        last = performance.now()
        frame(last)
      } else kick()
    })
    ro.observe(stage)

    // Drag and fling.
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      L.drag = true
      L.lastX = e.clientX
      L.lastT = performance.now()
      L.dragVel = 0
      stage.dataset.drag = "1"
      try {
        stage.setPointerCapture(e.pointerId)
      } catch {}
      kick()
    }
    const onMove = (e: PointerEvent) => {
      if (!L.drag) return
      const t = performance.now()
      const dx = e.clientX - L.lastX
      const dts = Math.max(0.001, (t - L.lastT) / 1000)
      L.offset += dx
      L.dragVel = L.dragVel * 0.6 + (dx / dts) * 0.4
      L.lastX = e.clientX
      L.lastT = t
      if (reduce) {
        last = t
        frame(t)
      } else kick()
    }
    const onUp = (e: PointerEvent) => {
      if (!L.drag) return
      L.drag = false
      delete stage.dataset.drag
      const idle = performance.now() - L.lastT > 90
      L.vel = reduce ? 0 : idle ? base : Math.max(-4200, Math.min(4200, L.dragVel))
      try {
        stage.releasePointerCapture(e.pointerId)
      } catch {}
      kick()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
      e.preventDefault()
      const dir = e.key === "ArrowLeft" ? -1 : 1
      if (reduce) {
        L.offset += dir * PITCH * L.scale * 0.25
        last = performance.now()
        frame(last)
      } else {
        L.vel += dir * 900
        kick()
      }
    }
    stage.addEventListener("pointerdown", onDown)
    stage.addEventListener("pointermove", onMove)
    stage.addEventListener("pointerup", onUp)
    stage.addEventListener("pointercancel", onUp)
    stage.addEventListener("keydown", onKey)
    kick()
    if (reduce) frame(performance.now())
    return () => {
      if (raf) cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
      document.removeEventListener("visibilitychange", onVis)
      stage.removeEventListener("pointerdown", onDown)
      stage.removeEventListener("pointermove", onMove)
      stage.removeEventListener("pointerup", onUp)
      stage.removeEventListener("pointercancel", onUp)
      stage.removeEventListener("keydown", onKey)
    }
  }, [slots, n])

  return (
    <div className="ps-root">
      <style>{css}</style>
      <div
        ref={stageRef}
        className="ps-stage"
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label="PDC projects passing through a scanner that boils each one down to a terminal readout. Drag, or use the arrow keys."
        style={{ height: STAGE_H }}
      >
        <div className="ps-fade">
          {Array.from({ length: slots }, (_, i) => {
            const p = list[i % n]
            const dup = i >= n
            return (
              <div
                key={i}
                ref={(el) => {
                  cardEls.current[i] = el
                }}
                className="ps-card"
                aria-hidden={dup ? true : undefined}
              >
                <div
                  className="ps-code"
                  ref={(el) => {
                    codeEls.current[i] = el
                  }}
                  aria-hidden="true"
                  style={{ visibility: "hidden" }}
                >
                  <Term p={p} />
                </div>
                <div
                  className="ps-face"
                  role={dup ? undefined : "img"}
                  aria-label={dup ? undefined : p.name + ": " + p.tagline}
                  ref={(el) => {
                    faceEls.current[i] = el
                  }}
                >
                  <Face p={p} i={i % n} />
                </div>
              </div>
            )
          })}
        </div>
        <canvas ref={canvasRef} className="ps-canvas" aria-hidden="true" />
        <div ref={meterRef} className="ps-meter" aria-hidden="true" style={{ left: "50%", top: -4 }}>
          <div className="ps-meter-label">Boiling it down</div>
          <div className="ps-pill">
            <span ref={numRef} className="ps-pill-n">
              01 / {pad(n)}
            </span>
            <span ref={pctRef} className="ps-pill-p">
              0%
            </span>
          </div>
        </div>
      </div>
      <ul className="ps-sr">
        {list.map((p) => (
          <li key={p.slug}>
            {p.name}, {p.tagline}. Problem: {p.problem} Outcome: {p.outcome.join("; ")}.
          </li>
        ))}
      </ul>
    </div>
  )
}
