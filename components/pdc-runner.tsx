import * as React from "react"
import { createSynth } from "@/lib/retro-audio"

/**
 * PDC RUNNER: BUILD MODE
 * An optional endless-runner entry experience shown over the homepage.
 * "Enter website" is always available and simply dismisses the overlay.
 */

type Mode = "menu" | "playing" | "paused" | "over"

const LOGO_SRC = "/assets/pdc_dragon_watermark.png"
const BEST_KEY = "pdc-runner-best"
const MUSIC_SRC = "/assets/runner-music.mp3"
const MUSIC_VOLUME = 0.35

const GREEN = "#91CC3F"
const RED = "#F04B35"

// World tuning (world units; 1 sprite pixel = 2 units)
const PX = 2
const PLAYER_X = 54
const BASE_SPEED = 380
const MAX_SPEED = 920
const ACCEL = 9
const GRAVITY = 2600
const JUMP_V = 820
const JUMP_CUT = 380
const SCORE_RATE = 0.025
const TOKEN_BONUS = 25

/* -------------------------------------------------------------------------- */
/* Pixel-art sprites                                                          */
/* -------------------------------------------------------------------------- */

const PALETTE: Record<string, string> = {
  G: GREEN,
  D: "#30491D",
  d: "#1c2b12",
  L: "#c8ec8a",
  R: RED,
  r: "#a33122",
  W: "#F5F6F7",
  w: "rgba(245,246,247,0.35)",
  K: "#080A0B",
  S: "#89919A",
  s: "#4b535b",
  m: "#c7ccd1",
  Y: "#c9a24a",
  O: "#ff9a4d",
  B: "#1a2329",
  b: "#2c3a42",
  C: "#3a4248",
  c: "#2a3035",
}

const DRAGON_HEAD = [
  "............D...D.....",
  "...........DGGGGGGGGD.",
  "...........GGGGWKGGGGG",
  "...........GGGGKKGGGGG",
  "...........GGGGGGGGGGG",
  "...........GGGGGGGDDDD",
]
const DRAGON_HEAD_HIT = [
  "............D...D.....",
  "...........DGGGGGGGGD.",
  "...........GGGKGKGGGGG",
  "...........GGGGKGGGGGG",
  "...........GGGKGKGGGGG",
  "...........GGGGGGGDDDD",
]
const SCARF_A = ["........rr.GGGGGGGGG..", ".......rRRRRRRRRRR...."]
const SCARF_B = ["...........GGGGGGGGG..", ".....rrRRRRRRRRRRR...."]
const DRAGON_BODY = [
  "....D.D.D..RRRRRRG....",
  "...DGGGGGGGGGGGGGG....",
  "G..GGGGGGGGGGGGGGGGG..",
  "GG.GGGGGGGGLLLLGGG.G..",
  ".GGGGGGGGGLLLLLLGG....",
  "..GGGGGGGGLLLLLLGG....",
  "...GGGGGGGGLLLLGGG....",
  "....GGGGGGGGGGGGG.....",
]
const LEGS_A = ["....GGG.....GG........", "....GG.......GGG......", "....GG................", "....GGG..............."]
const LEGS_B = [".....GG.....GGG.......", "...GGG......GG........", "............GG........", "............GGG......."]
const LEGS_AIR = ["....GGG.....GGG.......", "....GG......GG........", "....GG......GG........", "....GGG.....GGG......."]

const DUCK_TOP = [
  "..................D...D.....",
  ".....rrr.........DGGGGGGGGD.",
  "..D.D.D.rRRRRRRRGGGGGWKGGGGG",
  ".GGGGGGGGGGGGGGRRGGGGKKGGGGG",
  "GGGGGGGGLLLLLLGRRGGGGGGGGGGG",
  "G.GGGGGLLLLLLLGRRGGGGGGGDDDD",
  "...GGGGGGGGGGGGGGGGGGGGG....",
]
const DUCK_LEGS_A = ["....GGG.....GG..............", "....GG.......GGG............"]
const DUCK_LEGS_B = [".....GG.....GGG.............", "...GGG......GG.............."]

const PCB = [
  "dDDDDDDDDDDDDDDd",
  "DYGGGGGDDDYGGGYD",
  "DDDDDDGDDDDDDDGD",
  "DYDKKKKKKDDYGGGD",
  "DGDKKKKKKDDDDDGD",
  "DGDKKKKKKDGGGGYD",
  "DGDKKKKKKDGDDDDD",
  "DGDDSDSDSDGDYDYD",
  "DGGGGGGDDDGDGDGD",
  "DDDDDDGDDDDDGDGD",
  "DYGGDDGGGGGGGDGD",
  "DDDGDDDDDDDDDDGD",
  "DYDGGGGYDDYGGGGD",
  "DGDDDDDDDDDDDDDD",
  "DGGGGGGGGGYDDYRD",
  "dDDDDDDDDDDDDDDd",
  ".....ssssss.....",
  "....ssssssss....",
]
const MCU = [
  ".S.S.S.S.S.S.S.S.S.S..",
  ".S.S.S.S.S.S.S.S.S.S..",
  "bbbbbbbbbbbbbbbbbbbbbb",
  "bmmmmmmmmmmmmBBBBBBBBb",
  "bmssssssssssmBGGGGGGBb",
  "bmsmmmmmmmmsmBGBBBBGBb",
  "bmsmmmmmmmmsmBBBGGGGBb",
  "bmssssssssssmBBBBBBRBb",
  "bmmmmmmmmmmmmBBBBBBBBb",
  "mmmBBBBBBBBBBBBBBBBBBb",
  "mmmBBBBKKKBBBBBBBBBBBb",
  "bbbbbbbbbbbbbbbbbbbbbb",
  ".ss...............ss..",
  ".ss...............ss..",
]
const ARM = [
  "...s.....s......",
  "...ss...ss......",
  "....sssss.......",
  "......m.........",
  ".....mmm........",
  ".....mGm........",
  "....mGm.........",
  "...mGm..........",
  "..mGm...........",
  ".sKKs...........",
  ".KRKK...........",
  ".sKKs...........",
  "..mmGm..........",
  "...mmGm.........",
  "....mmGm........",
  ".....mmGm.......",
  "......mmGm......",
  ".......sKKs.....",
  ".......KRKK.....",
  ".......sKKs.....",
  "........mm......",
  ".......mmmm.....",
  "....SSSSSSSSSS..",
  "...SGSSSSSSSSGS.",
  "...ssssssssssss.",
]
const PRINT = [
  "..D.D.D.D.D...",
  "..............",
  ".D..........D.",
  "..............",
  ".LLLLLLL.D....",
  ".GGGGGGGGGGGD.",
  "..LLLLLLLLLD..",
  "..GGGGGGGGGD..",
  "...LLLLLLLD...",
  "...GGGGGGGD...",
  "..LLLLLLLLLD..",
  "..GGGGGGGGGD..",
  ".LLLLLLLLLLLD.",
  ".GGGGGGGGGGGD.",
  ".LLLLLLLLLLLD.",
  "..GGGGGGGGGD..",
  "ssssssssssssss",
]
const SOLDER = [
  "..............w...",
  "...............w..",
  "..............w...",
  "..............RO..",
  ".............mR...",
  "............mm....",
  "...........mm.....",
  "..........KK......",
  ".........KGK......",
  "........KGK.......",
  ".......KGK........",
  "......sKK.s.......",
  ".....s.s.s........",
  "....s.s.s.........",
  "bbbbbbbbbbbbbbbbbb",
  "bBGGGGBBBBBBBRRBBb",
  "bBGDGGBBBBBBBRRBBb",
  "bbbbbbbbbbbbbbbbbb",
]
const CRATE = [
  "ssssssssssssssss",
  "sCCCCCCCCCCCCCCs",
  "sCccccccccccccCs",
  "sCccccccccccccCs",
  "sCcGGGcGGccGGGCs",
  "sCcGcGcGcGcGccCs",
  "sCcGGGcGcGcGccCs",
  "sCcGcccGcGcGccCs",
  "sCcGcccGGccGGGCs",
  "sCccccccccccccCs",
  "sCCCCCCCCCCCCCCs",
  "sCcSScccccccccCs",
  "sCccccccccccccCs",
  "sCCCCCCCCCCCCCCs",
  "ssssssssssssssss",
]
const DRONE_BODY = [
  "..ss..........ss..",
  "..ssssKKKKKKssss..",
  "....sKKGGKKRKs....",
  ".....KKKKKKKK.....",
  "......s....s......",
  ".....ss....ss.....",
]
const ROTOR_A = "mmmmmm......mmmmmm"
const ROTOR_B = "..mm..........mm.."

function makeSprite(rows: string[]): HTMLCanvasElement {
  const w = Math.max(...rows.map((r) => r.length))
  const cv = document.createElement("canvas")
  cv.width = w
  cv.height = rows.length
  const c = cv.getContext("2d")!
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const col = PALETTE[row[x]]
      if (col) {
        c.fillStyle = col
        c.fillRect(x, y, 1, 1)
      }
    }
  })
  return cv
}

function buildSprites() {
  return {
    runA: makeSprite([...DRAGON_HEAD, ...SCARF_A, ...DRAGON_BODY, ...LEGS_A]),
    runB: makeSprite([...DRAGON_HEAD, ...SCARF_B, ...DRAGON_BODY, ...LEGS_B]),
    air: makeSprite([...DRAGON_HEAD, ...SCARF_B, ...DRAGON_BODY, ...LEGS_AIR]),
    hit: makeSprite([...DRAGON_HEAD_HIT, ...SCARF_A, ...DRAGON_BODY, ...LEGS_AIR]),
    duckA: makeSprite([...DUCK_TOP, ...DUCK_LEGS_A]),
    duckB: makeSprite([...DUCK_TOP, ...DUCK_LEGS_B]),
    pcb: makeSprite(PCB),
    mcu: makeSprite(MCU),
    arm: makeSprite(ARM),
    print: makeSprite(PRINT),
    solder: makeSprite(SOLDER),
    crate: makeSprite(CRATE),
    droneA: makeSprite([ROTOR_A, ...DRONE_BODY]),
    droneB: makeSprite([ROTOR_B, ...DRONE_BODY]),
  }
}
type Sprites = ReturnType<typeof buildSprites>

/* -------------------------------------------------------------------------- */
/* Game engine (plain canvas, no React state per frame)                       */
/* -------------------------------------------------------------------------- */

type Box = { x: number; y: number; w: number; h: number }
type Kind = "crate" | "crate2" | "pcb" | "mcu" | "gear" | "print" | "solder" | "arm" | "drone"
type Obstacle = { kind: Kind; x: number; y: number; w: number; h: number; boxes: Box[]; r?: number; teeth?: number }
type Token = { x: number; y: number; glyph: number; phase: number }
type Particle = { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number }
type FloatText = { x: number; y: number; life: number; text: string }

type Hooks = {
  onMode: (m: Mode) => void
  onScore: (n: number) => void
  onBump: () => void
  onOver: (score: number) => void
  onGround: (px: number) => void
  sound: (name: SoundName) => void
}

const RUN_BOXES: Box[] = [
  { x: 24, y: 26, w: 18, h: 12 },
  { x: 22, y: 18, w: 10, h: 10 },
  { x: 8, y: 8, w: 24, h: 14 },
  { x: 12, y: 0, w: 16, h: 8 },
]
const DUCK_BOXES: Box[] = [{ x: 4, y: 0, w: 50, h: 14 }]
const SYMBOLS = ["</>", "{ }", "0x3F", "//", "<>", "01", "Δ", "Ω", "++", "λ", "#!", "Σ"]

const hash = (i: number, k: number) => {
  const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453
  return v - Math.floor(v)
}

function createRunner(canvas: HTMLCanvasElement, initialBest: number, hooks: Hooks) {
  const ctx = canvas.getContext("2d")!
  const sp: Sprites = buildSprites()
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false

  let W = 0, H = 0, dpr = 1, scale = 1, groundY = 0, viewW = 0
  let mode: Mode = "menu"
  let raf = 0, last = 0, time = 0, alive = true, pausedDrawn = false
  let scroll = 0, speed = BASE_SPEED, score = 0, lastShown = -1, milestone = 0
  let obstacles: Obstacle[] = [], tokens: Token[] = [], particles: Particle[] = [], texts: FloatText[] = []
  let nextGap = 0, shake = 0, flash = 0, overAt = 0, overTime = 0, attractHop = 2
  let best = initialBest
  const p = { y: 0, vy: 0, duck: false, ground: true, anim: 0 }

  // Faint green silhouette of the mascot for the far background layer
  let ghost: HTMLCanvasElement | null = null
  const img = new Image()
  img.onload = () => {
    const c = document.createElement("canvas")
    c.width = img.naturalWidth
    c.height = img.naturalHeight
    const g = c.getContext("2d")!
    g.drawImage(img, 0, 0)
    g.globalCompositeOperation = "source-in"
    g.fillStyle = GREEN
    g.fillRect(0, 0, c.width, c.height)
    ghost = c
  }
  img.src = LOGO_SRC

  function resize() {
    W = canvas.clientWidth
    H = canvas.clientHeight
    dpr = Math.min(2, window.devicePixelRatio || 1)
    canvas.width = Math.round(W * dpr)
    canvas.height = Math.round(H * dpr)
    const portrait = H > W
    scale = Math.max(0.5, Math.min(2.4, W / (W < 700 ? 540 : 660), H / 330))
    groundY = Math.round(H * (portrait ? 0.7 : 0.76))
    viewW = W / scale
    hooks.onGround(groundY)
    pausedDrawn = false
  }

  // world -> screen helpers
  const sx = (x: number) => x * scale
  const sy = (y: number) => groundY - y * scale

  function drawSprite(img: CanvasImageSource, w: number, h: number, x: number, y: number) {
    ctx.drawImage(img, Math.round(sx(x)), Math.round(sy(y + h)), Math.round(w * PX * scale), Math.round(h * PX * scale))
  }

  function reset() {
    scroll = 0; speed = BASE_SPEED; score = 0; lastShown = -1; milestone = 0
    obstacles = []; tokens = []; particles = []; texts = []
    nextGap = 320; shake = 0; flash = 0
    p.y = 0; p.vy = 0; p.duck = false; p.ground = true
    hooks.onScore(0)
  }

  function setMode(m: Mode) {
    mode = m
    pausedDrawn = false
    hooks.onMode(m)
  }

  function makeObstacle(kind: Kind, x: number): Obstacle {
    switch (kind) {
      case "crate": return { kind, x, y: 0, w: 32, h: 30, boxes: [{ x: 2, y: 0, w: 28, h: 28 }] }
      case "crate2": return { kind, x, y: 0, w: 32, h: 60, boxes: [{ x: 2, y: 0, w: 28, h: 58 }] }
      case "pcb": return { kind, x, y: 0, w: 32, h: 36, boxes: [{ x: 2, y: 4, w: 28, h: 30 }, { x: 8, y: 0, w: 16, h: 4 }] }
      case "mcu": return { kind, x, y: 0, w: 44, h: 28, boxes: [{ x: 2, y: 0, w: 40, h: 24 }] }
      case "print": return { kind, x, y: 0, w: 28, h: 34, boxes: [{ x: 3, y: 0, w: 22, h: 24 }] }
      case "solder": return { kind, x, y: 0, w: 36, h: 36, boxes: [{ x: 1, y: 0, w: 34, h: 8 }, { x: 14, y: 8, w: 16, h: 18 }] }
      case "arm": return { kind, x, y: 0, w: 32, h: 50, boxes: [{ x: 6, y: 0, w: 24, h: 10 }, { x: 4, y: 10, w: 18, h: 24 }, { x: 4, y: 34, w: 14, h: 14 }] }
      case "drone": {
        const y = Math.random() < 0.55 ? 22 : 64
        return { kind, x, y, w: 36, h: 14, boxes: [{ x: 3, y: 1, w: 30, h: 11 }] }
      }
      case "gear": {
        const r = Math.random() < 0.5 ? 12 : 18
        const s = (r + 4) * 2
        return { kind, x, y: 0, w: s, h: s, r, teeth: r > 14 ? 12 : 8, boxes: [{ x: 6, y: 4, w: s - 12, h: s - 8 }] }
      }
    }
  }

  function spawn() {
    const pool: Kind[] = ["crate", "pcb", "mcu", "gear", "print", "solder"]
    if (score > 120) pool.push("arm", "gear")
    if (score > 250) pool.push("drone", "drone")
    if (score > 450) pool.push("crate2")
    const o = makeObstacle(pool[Math.floor(Math.random() * pool.length)], viewW + 40)
    obstacles.push(o)
    const minGap = 260 + speed * 0.42
    const gap = minGap + Math.random() * (260 + speed * 0.25)
    nextGap = gap + o.w
    if (Math.random() < 0.6) {
      tokens.push({ x: o.x + o.w + gap * 0.5, y: Math.random() < 0.4 ? 96 : 24, glyph: Math.floor(Math.random() * 4), phase: Math.random() * 6 })
    }
  }

  function burst(x: number, y: number, n: number, colors: string[], power = 1) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2
      const v = (60 + Math.random() * 200) * power
      const max = 0.4 + Math.random() * 0.4
      particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v + 80, life: max, max, color: colors[i % colors.length], size: 2 + Math.random() * 3 })
    }
  }

  const overlap = (a: Box, ax: number, ay: number, b: Box, bx: number, by: number) =>
    ax + a.x < bx + b.x + b.w && ax + a.x + a.w > bx + b.x && ay + a.y < by + b.y + b.h && ay + a.y + a.h > by + b.y

  function die() {
    setMode("over")
    overAt = performance.now()
    overTime = time
    shake = reducedMotion ? 0 : 0.35
    flash = 0.3
    hooks.sound("hit")
    burst(PLAYER_X + 30, p.y + 24, 22, [RED, GREEN, "#F5F6F7"], 1.3)
    const final = Math.floor(score)
    if (final > best) best = final
    hooks.onOver(final)
  }

  function update(dt: number) {
    time += dt
    if (mode === "paused") return

    const v = mode === "playing" ? speed : mode === "menu" ? BASE_SPEED * (reducedMotion ? 0.25 : 0.6) : 0
    scroll += v * dt
    if (v > 0) p.anim += dt * (v / 45)

    // Player physics (menu = idle attract run with the occasional hop)
    if (mode === "menu" && !reducedMotion) {
      attractHop -= dt
      if (attractHop <= 0 && p.ground) {
        p.vy = JUMP_V * 0.75; p.ground = false
        attractHop = 2.4 + Math.random() * 2
      }
    }
    if (mode !== "over" && !p.ground) {
      const g = p.duck && mode === "playing" ? GRAVITY * 2.6 : GRAVITY
      p.vy -= g * dt
      p.y += p.vy * dt
      if (p.y <= 0) {
        p.y = 0; p.vy = 0; p.ground = true
        if (mode === "playing") burst(PLAYER_X + 20, 0, 5, ["rgba(145,204,63,0.6)"], 0.4)
      }
    }

    if (mode === "playing") {
      speed = Math.min(MAX_SPEED, speed + ACCEL * dt)
      score += v * dt * SCORE_RATE

      nextGap -= v * dt
      if (nextGap <= 0) spawn()

      for (const o of obstacles) o.x -= (o.kind === "drone" ? v + 40 : v) * dt
      obstacles = obstacles.filter((o) => o.x + o.w > -80)
      for (const t of tokens) t.x -= v * dt

      const ducking = p.duck && p.ground
      const boxes = ducking ? DUCK_BOXES : RUN_BOXES

      // Collect tokens
      tokens = tokens.filter((t) => {
        if (t.x < -40) return false
        const ty = t.y + Math.sin(time * 3 + t.phase) * 4
        const tb = { x: -10, y: -10, w: 20, h: 20 }
        if (boxes.some((b) => overlap(b, PLAYER_X, p.y, tb, t.x, ty))) {
          score += TOKEN_BONUS
          burst(t.x, ty, 14, [GREEN, "#c8ec8a", "#F5F6F7"])
          texts.push({ x: t.x, y: ty + 14, life: 0.8, text: `+${TOKEN_BONUS}` })
          hooks.onBump()
          hooks.sound("token")
          return false
        }
        return true
      })

      // Collisions
      for (const o of obstacles) {
        const oy = o.kind === "drone" ? o.y + Math.sin(time * 6 + o.x * 0.01) * 3 : o.y
        if (o.boxes.some((ob) => boxes.some((pb) => overlap(pb, PLAYER_X, p.y, ob, o.x, oy)))) {
          die()
          break
        }
      }

      const shown = Math.floor(score)
      if (shown !== lastShown) {
        lastShown = shown
        hooks.onScore(shown)
      }
      const ms = Math.floor(score / 100)
      if (ms > milestone) {
        milestone = ms
        hooks.onBump()
        hooks.sound("point")
      }
    }

    for (const q of particles) {
      q.life -= dt
      q.vy -= 500 * dt
      q.x += q.vx * dt - (mode === "playing" ? v * dt * 0.5 : 0)
      q.y += q.vy * dt
    }
    particles = particles.filter((q) => q.life > 0)
    for (const t of texts) { t.life -= dt; t.y += 40 * dt }
    texts = texts.filter((t) => t.life > 0)
    shake = Math.max(0, shake - dt)
    flash = Math.max(0, flash - dt)
  }

  /* ----------------------------- rendering ------------------------------ */

  function drawBackground() {
    // Distant dragon silhouette, drifting very slowly
    if (ghost) {
      const seg = 1500, off = scroll * 0.06
      const first = Math.floor(off / seg) - 1
      for (let i = first; i <= first + Math.ceil(viewW / seg) + 1; i++) {
        if (hash(i, 9) < 0.55) continue
        const h = 230, w = (ghost.width / ghost.height) * h
        ctx.globalAlpha = 0.05
        ctx.drawImage(ghost, sx(i * seg - off + 200), sy(70 + h), w * scale, h * scale)
      }
      ctx.globalAlpha = 1
    }

    // Circuit traces in the sky
    {
      const seg = 150, off = scroll * 0.18
      const first = Math.floor(off / seg) - 1
      ctx.strokeStyle = "rgba(145,204,63,0.08)"
      ctx.fillStyle = "rgba(145,204,63,0.12)"
      ctx.lineWidth = Math.max(1, scale * 0.8)
      for (let i = first; i <= first + Math.ceil(viewW / seg) + 1; i++) {
        const x0 = i * seg - off + hash(i, 1) * 40
        const y0 = 120 + hash(i, 2) * 160
        const a = 30 + hash(i, 3) * 40, d = (hash(i, 4) < 0.5 ? -1 : 1) * 20, b = 20 + hash(i, 5) * 40
        ctx.beginPath()
        ctx.moveTo(sx(x0), sy(y0))
        ctx.lineTo(sx(x0 + a), sy(y0))
        ctx.lineTo(sx(x0 + a + 20), sy(y0 + d))
        ctx.lineTo(sx(x0 + a + 20 + b), sy(y0 + d))
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(sx(x0 + a + 20 + b), sy(y0 + d), Math.max(1.5, 2.5 * scale), 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Lab skyline
    {
      const seg = 190, off = scroll * 0.3
      const first = Math.floor(off / seg) - 1
      for (let i = first; i <= first + Math.ceil(viewW / seg) + 1; i++) {
        const x0 = i * seg - off + hash(i, 3) * 30
        const w = 70 + hash(i, 2) * 90
        const h = 40 + hash(i, 1) * 110
        ctx.fillStyle = "#0d140f"
        ctx.fillRect(sx(x0), sy(h), w * scale, h * scale)
        ctx.fillStyle = "rgba(145,204,63,0.14)"
        ctx.fillRect(sx(x0), sy(h), w * scale, Math.max(1, scale * 0.8))
        // windows
        ctx.fillStyle = "rgba(145,204,63,0.10)"
        for (let wy = 12; wy < h - 8; wy += 14) {
          for (let wx = 8; wx < w - 8; wx += 14) {
            if (hash(i * 31 + wx, wy) < 0.32) ctx.fillRect(sx(x0 + wx), sy(h - wy), 5 * scale, 4 * scale)
          }
        }
        const f = hash(i, 4)
        ctx.fillStyle = "#0d140f"
        if (f < 0.3) {
          // antenna with blinking beacon
          ctx.fillRect(sx(x0 + w * 0.6), sy(h + 36), 2 * scale, 36 * scale)
          ctx.fillStyle = `rgba(240,75,53,${0.35 + 0.35 * Math.sin(time * 3 + i)})`
          ctx.fillRect(sx(x0 + w * 0.6 - 1), sy(h + 38), 4 * scale, 3 * scale)
        } else if (f < 0.55) {
          // tank
          ctx.beginPath()
          ctx.arc(sx(x0 + w * 0.35), sy(h + 12), 14 * scale, 0, Math.PI * 2)
          ctx.fill()
        } else if (f < 0.75) {
          // crane arm
          ctx.fillRect(sx(x0 + 10), sy(h + 40), 3 * scale, 40 * scale)
          ctx.fillRect(sx(x0 + 10), sy(h + 40), 50 * scale, 3 * scale)
        } else {
          ctx.fillRect(sx(x0 + w * 0.7), sy(h + 26), 8 * scale, 26 * scale)
        }
      }
    }

    // Floating technical symbols
    {
      const seg = 210, off = scroll * 0.5
      const first = Math.floor(off / seg) - 1
      ctx.font = `600 ${Math.round(13 * scale)}px "JetBrains Mono", monospace`
      ctx.textAlign = "center"
      for (let i = first; i <= first + Math.ceil(viewW / seg) + 1; i++) {
        const y = 170 + hash(i, 7) * 110 + Math.sin(time * 0.8 + i) * 6
        ctx.fillStyle = hash(i, 8) < 0.8 ? "rgba(145,204,63,0.13)" : "rgba(137,145,154,0.14)"
        ctx.fillText(SYMBOLS[Math.floor(hash(i, 6) * SYMBOLS.length)], sx(i * seg - off), sy(y))
      }
    }
  }

  function drawGround() {
    // floor glow and circuit texture
    const grad = ctx.createLinearGradient(0, groundY, 0, H)
    grad.addColorStop(0, "rgba(145,204,63,0.07)")
    grad.addColorStop(1, "rgba(145,204,63,0)")
    ctx.fillStyle = grad
    ctx.fillRect(0, groundY, W, H - groundY)

    const seg = 64, off = scroll
    const first = Math.floor(off / seg) - 1
    for (let i = first; i <= first + Math.ceil(viewW / seg) + 1; i++) {
      const x0 = i * seg - off
      ctx.fillStyle = "rgba(145,204,63,0.35)"
      ctx.fillRect(sx(x0 + hash(i, 1) * 50), sy(-4 - hash(i, 2) * 8), (2 + hash(i, 3) * 6) * scale, 1.5 * scale)
      ctx.fillStyle = "rgba(145,204,63,0.12)"
      const ty = -22 - Math.floor(hash(i, 4) * 3) * 10
      ctx.fillRect(sx(x0), sy(ty), (40 + hash(i, 5) * 20) * scale, Math.max(1, scale * 0.8))
      ctx.beginPath()
      ctx.arc(sx(x0 + 2), sy(ty), Math.max(1.5, 2 * scale), 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.fillStyle = "rgba(145,204,63,0.16)"
    ctx.fillRect(0, groundY - 4, W, 8)
    ctx.fillStyle = GREEN
    ctx.fillRect(0, groundY - 1, W, 2)
  }

  function drawGear(o: Obstacle) {
    const r = o.r!, cx = sx(o.x + o.w / 2), cy = sy(o.h / 2), R = r * scale
    const rot = (scroll / (r + 4)) * -1
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(rot)
    ctx.fillStyle = "#4b535b"
    for (let i = 0; i < o.teeth!; i++) {
      ctx.rotate((Math.PI * 2) / o.teeth!)
      ctx.fillRect(-2.5 * scale, -R - 4 * scale, 5 * scale, 6 * scale)
    }
    ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = "#89919A"
    ctx.beginPath(); ctx.arc(0, 0, R * 0.72, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = GREEN
    ctx.lineWidth = Math.max(1, scale)
    ctx.beginPath(); ctx.arc(0, 0, R * 0.5, 0, Math.PI * 2); ctx.stroke()
    ctx.fillStyle = "#080A0B"
    ctx.beginPath(); ctx.arc(0, 0, R * 0.22, 0, Math.PI * 2); ctx.fill()
    ctx.restore()
  }

  function drawObstacle(o: Obstacle) {
    switch (o.kind) {
      case "crate": drawSprite(sp.crate, 16, 15, o.x, 0); break
      case "crate2": drawSprite(sp.crate, 16, 15, o.x, 0); drawSprite(sp.crate, 16, 15, o.x, 30); break
      case "pcb": drawSprite(sp.pcb, 16, 18, o.x, 0); break
      case "mcu": drawSprite(sp.mcu, 22, 14, o.x, 0); break
      case "print": drawSprite(sp.print, 14, 17, o.x, 0); break
      case "solder": drawSprite(sp.solder, 18, 18, o.x, 0); break
      case "arm": drawSprite(sp.arm, 16, 25, o.x, 0); break
      case "gear": drawGear(o); break
      case "drone": {
        const y = o.y + Math.sin(time * 6 + o.x * 0.01) * 3
        drawSprite(Math.floor(time * 20) % 2 ? sp.droneA : sp.droneB, 18, 7, o.x, y)
        break
      }
    }
  }

  function drawToken(t: Token) {
    const y = t.y + Math.sin(time * 3 + t.phase) * 4
    const x = sx(t.x), cy = sy(y), u = scale
    ctx.save()
    ctx.shadowColor = GREEN
    ctx.shadowBlur = 14 * Math.min(1.5, u)
    ctx.fillStyle = GREEN
    ctx.strokeStyle = GREEN
    ctx.lineWidth = Math.max(1, 1.6 * u)
    if (t.glyph < 2) {
      ctx.font = `700 ${Math.round(14 * u)}px "JetBrains Mono", monospace`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(t.glyph === 0 ? "</>" : "{ }", x, cy)
    } else if (t.glyph === 2) {
      ctx.strokeRect(x - 6 * u, cy - 6 * u, 12 * u, 12 * u)
      ctx.fillRect(x - 3 * u, cy - 3 * u, 6 * u, 6 * u)
      for (let k = -1; k <= 1; k++) {
        ctx.fillRect(x + k * 4 * u - u / 2, cy - 9 * u, u, 3 * u)
        ctx.fillRect(x + k * 4 * u - u / 2, cy + 6 * u, u, 3 * u)
        ctx.fillRect(x - 9 * u, cy + k * 4 * u - u / 2, 3 * u, u)
        ctx.fillRect(x + 6 * u, cy + k * 4 * u - u / 2, 3 * u, u)
      }
    } else {
      ctx.translate(x, cy)
      ctx.rotate(time * 2)
      for (let k = 0; k < 6; k++) {
        ctx.rotate(Math.PI / 3)
        ctx.fillRect(-1.5 * u, -9 * u, 3 * u, 4 * u)
      }
      ctx.beginPath(); ctx.arc(0, 0, 6 * u, 0, Math.PI * 2); ctx.stroke()
      ctx.beginPath(); ctx.arc(0, 0, 2 * u, 0, Math.PI * 2); ctx.fill()
    }
    ctx.restore()
  }

  function drawPlayer() {
    const ducking = p.duck && p.ground && mode === "playing"
    const frame = Math.floor(p.anim) % 2
    if (mode === "over") {
      if (Math.floor(time * 10) % 2 === 0 || time - overTime > 0.6) drawSprite(sp.hit, 22, 20, PLAYER_X, p.y)
      return
    }
    if (ducking) drawSprite(frame ? sp.duckA : sp.duckB, 28, 9, PLAYER_X, p.y)
    else if (!p.ground) drawSprite(sp.air, 22, 20, PLAYER_X, p.y)
    else drawSprite(frame ? sp.runA : sp.runB, 22, 20, PLAYER_X, p.y)
  }

  function render() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, W, H)
    ctx.imageSmoothingEnabled = false
    if (shake > 0) ctx.translate((Math.random() - 0.5) * shake * 30, (Math.random() - 0.5) * shake * 30)

    drawBackground()
    drawGround()
    for (const t of tokens) if (t.x < viewW + 40) drawToken(t)
    for (const o of obstacles) if (o.x < viewW + 60) drawObstacle(o)
    drawPlayer()

    for (const q of particles) {
      ctx.globalAlpha = Math.max(0, q.life / q.max)
      ctx.fillStyle = q.color
      ctx.fillRect(sx(q.x), sy(q.y), q.size * scale, q.size * scale)
    }
    ctx.globalAlpha = 1
    ctx.font = `700 ${Math.round(12 * scale)}px "JetBrains Mono", monospace`
    ctx.textAlign = "center"
    for (const t of texts) {
      ctx.fillStyle = `rgba(145,204,63,${Math.min(1, t.life * 1.5)})`
      ctx.fillText(t.text, sx(t.x), sy(t.y))
    }

    if (flash > 0) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.fillStyle = `rgba(240,75,53,${flash * 0.5})`
      ctx.fillRect(0, 0, W, H)
    }
  }

  function loop(now: number) {
    if (!alive) return
    const dt = Math.min(1 / 30, (now - last) / 1000 || 0)
    last = now
    if (mode === "paused") {
      if (!pausedDrawn) { render(); pausedDrawn = true }
    } else {
      update(dt)
      render()
    }
    raf = requestAnimationFrame(loop)
  }

  resize()
  raf = requestAnimationFrame((t) => { last = t; loop(t) })

  return {
    mode: () => mode,
    resize,
    start() {
      reset()
      setMode("playing")
    },
    jump() {
      if (mode !== "playing" || !p.ground) return
      p.vy = JUMP_V
      p.ground = false
      hooks.sound("jump")
    },
    release() {
      if (mode === "playing" && !p.ground && p.vy > JUMP_CUT) p.vy = JUMP_CUT
    },
    setDuck(on: boolean) {
      p.duck = on && mode === "playing"
    },
    pause() {
      if (mode === "playing") { p.duck = false; setMode("paused") }
    },
    resume() {
      if (mode === "paused") { last = performance.now(); setMode("playing") }
    },
    canRestart: () => performance.now() - overAt > 450,
    destroy() {
      alive = false
      cancelAnimationFrame(raf)
      img.onload = null
    },
  }
}
type Runner = ReturnType<typeof createRunner>

/* -------------------------------------------------------------------------- */
/* Retro sound effects (synthesised with Web Audio, no audio files)           */
/* -------------------------------------------------------------------------- */

type SoundName = "jump" | "point" | "token" | "hit"
const MUTE_KEY = "pdc-runner-muted"

function createSfx(initialMuted: boolean) {
  const synth = createSynth(initialMuted)
  const { tone } = synth

  const sounds: Record<SoundName, () => void> = {
    jump: () => tone(480, 0.09, { to: 860, vol: 0.045 }),
    point: () => {
      tone(988, 0.07, { vol: 0.04 })
      tone(1319, 0.16, { vol: 0.04, delay: 0.08 })
    },
    token: () => {
      tone(1047, 0.05, { type: "triangle", vol: 0.08 })
      tone(1568, 0.1, { type: "triangle", vol: 0.08, delay: 0.05 })
    },
    hit: () => {
      tone(220, 0.28, { type: "sawtooth", to: 55, vol: 0.06 })
      tone(140, 0.22, { vol: 0.04, delay: 0.06, to: 45 })
    },
  }

  return {
    play(name: SoundName) {
      sounds[name]()
    },
    unlock: synth.unlock,
    setMuted: synth.setMuted,
    dispose: synth.dispose,
  }
}

/* -------------------------------------------------------------------------- */
/* React overlay                                                              */
/* -------------------------------------------------------------------------- */

const pad = (n: number) => String(n).padStart(5, "0")

function readBest() {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0
  } catch {
    return 0
  }
}

function readMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === "1"
  } catch {
    return false
  }
}

function bump(el: HTMLElement | null) {
  if (!el) return
  el.classList.remove("is-bump")
  void el.offsetWidth
  el.classList.add("is-bump")
}

export default function PdcRunner() {
  const [phase, setPhase] = React.useState<"open" | "exiting" | "gone">("open")
  const [mode, setMode] = React.useState<Mode>("menu")
  const [best, setBest] = React.useState(readBest)
  const [result, setResult] = React.useState({ score: 0, record: false })
  const [muted, setMuted] = React.useState(readMuted)
  const sfxRef = React.useRef<ReturnType<typeof createSfx> | null>(null)
  if (!sfxRef.current) sfxRef.current = createSfx(muted)
  const mutedRef = React.useRef(muted)
  mutedRef.current = muted
  const modeRef = React.useRef<Mode>(mode)
  modeRef.current = mode

  // Background music: only downloads once the visitor presses Play, then loops forever
  const musicRef = React.useRef<HTMLAudioElement | null>(null)
  const playMusic = React.useCallback(() => {
    if (mutedRef.current) return
    if (!musicRef.current) {
      const a = new Audio(MUSIC_SRC)
      a.loop = true
      a.volume = MUSIC_VOLUME
      musicRef.current = a
    }
    void musicRef.current.play().catch(() => undefined)
  }, [])
  const pauseMusic = React.useCallback(() => musicRef.current?.pause(), [])

  const rootRef = React.useRef<HTMLDivElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const scoreRef = React.useRef<HTMLElement>(null)
  const gameRef = React.useRef<Runner | null>(null)
  const phaseRef = React.useRef(phase)
  phaseRef.current = phase
  const bestRef = React.useRef(best)
  bestRef.current = best

  // Lock page scroll while the overlay is open
  React.useEffect(() => {
    const html = document.documentElement
    const prev = html.style.overflow
    html.style.overflow = "hidden"
    return () => { html.style.overflow = prev }
  }, [])

  React.useEffect(() => {
    const canvas = canvasRef.current!
    const game = createRunner(canvas, bestRef.current, {
      onMode: (m) => {
        setMode(m)
        if (m === "paused") musicRef.current?.pause()
      },
      onScore: (n) => { if (scoreRef.current) scoreRef.current.textContent = pad(n) },
      onBump: () => bump(scoreRef.current),
      onGround: (px) => rootRef.current?.style.setProperty("--pr-ground", `${px}px`),
      sound: (name) => sfxRef.current?.play(name),
      onOver: (score) => {
        const record = score > bestRef.current
        if (record) {
          setBest(score)
          try { localStorage.setItem(BEST_KEY, String(score)) } catch { /* storage unavailable */ }
        }
        setResult({ score, record })
      },
    })
    gameRef.current = game
    const onResize = () => game.resize()
    const onVisibility = () => {
      if (document.hidden) {
        game.pause()
        musicRef.current?.pause()
      } else if (modeRef.current === "over" && !mutedRef.current) {
        void musicRef.current?.play().catch(() => undefined)
      }
    }
    window.addEventListener("resize", onResize)
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      window.removeEventListener("resize", onResize)
      document.removeEventListener("visibilitychange", onVisibility)
      game.destroy()
      gameRef.current = null
      sfxRef.current?.dispose()
      musicRef.current?.pause()
      musicRef.current = null
    }
  }, [])

  const blurActive = () => (document.activeElement as HTMLElement | null)?.blur?.()

  const play = React.useCallback(() => {
    blurActive()
    sfxRef.current?.unlock()
    playMusic()
    gameRef.current?.start()
  }, [playMusic])

  const toggleMute = React.useCallback(() => {
    const next = !mutedRef.current
    mutedRef.current = next
    setMuted(next)
    sfxRef.current?.setMuted(next)
    if (!next) sfxRef.current?.unlock()
    try { localStorage.setItem(MUTE_KEY, next ? "1" : "0") } catch { /* storage unavailable */ }
    if (next) pauseMusic()
    else if (modeRef.current === "playing" || modeRef.current === "over") playMusic()
  }, [playMusic, pauseMusic])

  const resume = React.useCallback(() => {
    blurActive()
    playMusic()
    gameRef.current?.resume()
  }, [playMusic])

  const enter = React.useCallback(() => {
    if (phaseRef.current !== "open") return
    gameRef.current?.destroy()
    sfxRef.current?.dispose()
    // fade the music out with the overlay
    const music = musicRef.current
    musicRef.current = null
    if (music && !music.paused) {
      const t0 = performance.now()
      const fade = () => {
        const k = Math.min(1, (performance.now() - t0) / 600)
        music.volume = MUSIC_VOLUME * (1 - k)
        if (k < 1) requestAnimationFrame(fade)
        else music.pause()
      }
      requestAnimationFrame(fade)
    }
    document.documentElement.style.overflow = ""
    window.scrollTo(0, 0)
    setPhase("exiting")
    window.setTimeout(() => setPhase("gone"), 700)
  }, [])

  // Keyboard controls
  React.useEffect(() => {
    const isControl = (t: EventTarget | null) => t instanceof HTMLElement && !!t.closest("button, a")
    const down = (e: KeyboardEvent) => {
      const g = gameRef.current
      if (phaseRef.current !== "open" || !g) return
      const m = g.mode()
      switch (e.code) {
        case "Space":
        case "ArrowUp":
        case "KeyW":
          if (isControl(e.target)) return // let a focused button activate natively
          e.preventDefault()
          if (e.repeat) return
          if (m === "playing") g.jump()
          else if (m === "menu") play()
          else if (m === "over" && g.canRestart()) play()
          else if (m === "paused") resume()
          break
        case "ArrowDown":
        case "KeyS":
          if (m === "playing") { e.preventDefault(); g.setDuck(true) }
          break
        case "KeyM":
          if (!e.repeat) toggleMute()
          break
        case "Escape":
        case "KeyP":
          if (m === "playing") g.pause()
          else if (m === "paused") resume()
          break
      }
    }
    const up = (e: KeyboardEvent) => {
      const g = gameRef.current
      if (!g) return
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") g.release()
      if (e.code === "ArrowDown" || e.code === "KeyS") g.setDuck(false)
    }
    window.addEventListener("keydown", down)
    window.addEventListener("keyup", up)
    return () => {
      window.removeEventListener("keydown", down)
      window.removeEventListener("keyup", up)
    }
  }, [play, resume, toggleMute])

  if (phase === "gone") return null

  const enterBtn = (extra = "") => (
    <button type="button" className={`pr-btn pr-btn--enter ${extra}`} onClick={enter}>
      Enter website <span aria-hidden="true">→</span>
    </button>
  )

  return (
    <div
      ref={rootRef}
      className={`pdc-runner${phase === "exiting" ? " is-exiting" : ""}`}
      data-mode={mode}
      role="dialog"
      aria-modal="true"
      aria-label="PDC Runner: Build Mode. An optional game; use Enter website to skip it."
    >
      <div className="pr-bg" aria-hidden="true">
        <img className="pr-watermark" src={LOGO_SRC} alt="" />
      </div>

      <canvas
        ref={canvasRef}
        className="pr-canvas"
        aria-hidden="true"
        onPointerDown={(e) => {
          if (gameRef.current?.mode() !== "playing") return
          e.preventDefault()
          gameRef.current.jump()
        }}
        onPointerUp={() => gameRef.current?.release()}
        onPointerCancel={() => gameRef.current?.release()}
      />

      <header className="pr-header">
        <div className="pr-brand">
          <img src={LOGO_SRC} alt="PDC dragon logo" />
          <div>
            <span className="pr-brand-title">PDC <span>· CFI</span></span>
            <span className="pr-brand-sub">Product Design Club | IIT Madras</span>
          </div>
        </div>
        <button
          type="button"
          className="pr-mute"
          onClick={toggleMute}
          aria-pressed={muted}
          aria-label={muted ? "Unmute game sounds" : "Mute game sounds"}
          title={muted ? "Sound off (M)" : "Sound on (M)"}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M11 5 6 9H2v6h4l5 4V5z" />
            {muted ? <path d="m22 9-6 6M16 9l6 6" /> : <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" />}
          </svg>
        </button>
        {enterBtn("pr-btn--top")}
      </header>

      <div className="pr-hud" aria-live="off">
        <span className="pr-hud-item">Score <b ref={scoreRef}>00000</b></span>
        <span className="pr-hud-item pr-hud-best">Hi <b>{pad(best)}</b></span>
        <button
          type="button"
          className="pr-icon-btn"
          aria-label="Pause game"
          onClick={() => gameRef.current?.pause()}
        >
          II
        </button>
      </div>

      {mode === "menu" && (
        <section className="pr-center">
          <div className="pr-intro">
            <p className="pr-eyebrow">// PDC Runner: Build mode</p>
            <h1 className="pr-title">PDC <span>Runner</span></h1>
            <p className="pr-tagline">Build. Break. Innovate. Repeat.</p>
            <p className="pr-copy">A little innovation before the real innovation.</p>
            <div className="pr-actions">
              <button type="button" className="pr-btn pr-btn--play" onClick={play}>
                <span aria-hidden="true">▶</span> Play game
              </button>
              {enterBtn("pr-btn--lg")}
            </div>
            <p className="pr-hint">
              <span className="pr-hint-key">Press SPACE to jump</span>
              <span className="pr-hint-touch">Tap to jump</span> | Avoid obstacles | Collect code
            </p>
            {best > 0 && <p className="pr-best">Best build: {pad(best)}</p>}
          </div>
        </section>
      )}

      {mode === "paused" && (
        <section className="pr-center">
          <div className="pr-panel">
            <p className="pr-eyebrow">// System halted</p>
            <h2 className="pr-panel-title">Paused</h2>
            <div className="pr-actions">
              <button type="button" className="pr-btn pr-btn--play" onClick={resume}>Resume</button>
              <button type="button" className="pr-btn pr-btn--play" onClick={play}>Restart</button>
              {enterBtn()}
            </div>
            <p className="pr-hint">Press ESC to resume</p>
          </div>
        </section>
      )}

      {mode === "over" && (
        <section className="pr-center">
          <div className="pr-panel" role="alert">
            <p className="pr-eyebrow pr-eyebrow--red">// Build error</p>
            <h2 className="pr-panel-title">Prototype <span>failed.</span></h2>
            <p className="pr-copy">Every great product starts with a few failures.</p>
            <dl className="pr-stats">
              <div><dt>Final score</dt><dd>{pad(result.score)}</dd></div>
              <div><dt>Best score</dt><dd>{pad(best)}{result.record && <em>New best</em>}</dd></div>
            </dl>
            <div className="pr-actions">
              <button type="button" className="pr-btn pr-btn--play" onClick={play}>
                <span aria-hidden="true">↻</span> Rebuild
              </button>
              {enterBtn("pr-btn--lg")}
            </div>
            <p className="pr-hint"><span className="pr-hint-key">Press SPACE to rebuild</span></p>
          </div>
        </section>
      )}

      {mode === "playing" && (
        <button
          type="button"
          className="pr-duck"
          aria-label="Duck"
          onPointerDown={(e) => { e.preventDefault(); gameRef.current?.setDuck(true) }}
          onPointerUp={() => gameRef.current?.setDuck(false)}
          onPointerLeave={() => gameRef.current?.setDuck(false)}
          onPointerCancel={() => gameRef.current?.setDuck(false)}
        >
          ▼ Duck
        </button>
      )}

      <footer className="pr-footer">Built different. Designed to innovate.</footer>
    </div>
  )
}
