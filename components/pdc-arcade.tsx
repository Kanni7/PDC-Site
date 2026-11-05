import * as React from "react"
import { createPortal } from "react-dom"
import { createSynth, type Synth } from "@/lib/retro-audio"

/**
 * PDC Circuit Chase — an optional maze-chase arcade game at the end of the page.
 * The invite section lives in the page flow; the game opens in a full-screen overlay
 * and closing it returns the visitor to the same scroll position.
 */

const LOGO_SRC = "/assets/pdc_dragon_watermark.png"
const BEST_KEY = "pdc-arcade-best"
const MUTE_KEY = "pdc-arcade-muted"
const GAME_TITLE = "PDC Circuit Chase"

const GREEN = "#91CC3F"
const RED = "#F04B35"
const WHITE = "#F5F6F7"
const BG = "#080A0B"

/* -------------------------------------------------------------------------- */
/* Maze                                                                        */
/* -------------------------------------------------------------------------- */
// # wall · . pellet · o power cell · - ghost door · G ghost house · P player start
const MAZE = [
  "#####################",
  "#.........#.........#",
  "#o##.####.#.####.##o#",
  "#...................#",
  "#.##.#.#######.#.##.#",
  "#....#....#....#....#",
  "####.#### # ####.####",
  "####.#         #.####",
  "####.# ###-### #.####",
  "    .  #GGGGG#  .    ",
  "####.# ####### #.####",
  "####.#         #.####",
  "####.# ####### #.####",
  "#.........#.........#",
  "#.##.####.#.####.##.#",
  "#o.#......P......#.o#",
  "##.#.#.#######.#.#.##",
  "#....#....#....#....#",
  "#.#######.#.#######.#",
  "#...................#",
  "#####################",
]
const COLS = 21
const ROWS = 21
const TUNNEL_ROW = 9
const PLAYER_START = { x: 10, y: 15 }
const HOUSE_EXIT = { x: 10, y: 7 }
const HOUSE_Y = 9

type Dir = { x: number; y: number }
const NONE: Dir = { x: 0, y: 0 }
const UP: Dir = { x: 0, y: -1 }
const DOWN: Dir = { x: 0, y: 1 }
const LEFT: Dir = { x: -1, y: 0 }
const RIGHT: Dir = { x: 1, y: 0 }
const DIRS = [UP, LEFT, DOWN, RIGHT]

type IconKind = "code" | "gear" | "cube" | "wrench" | "chip" | "board"

// Bonus collectibles (50 pts) sit on top of these pellet cells
const SPECIALS: { x: number; y: number; kind: IconKind }[] = [
  { x: 5, y: 1, kind: "chip" },
  { x: 15, y: 1, kind: "cube" },
  { x: 7, y: 5, kind: "board" },
  { x: 13, y: 17, kind: "wrench" },
  { x: 3, y: 19, kind: "code" },
  { x: 17, y: 19, kind: "gear" },
]

type GhostDef = { id: string; name: string; color: string; icon: IconKind; start: Dir; corner: Dir; release: number }
const GHOSTS: GhostDef[] = [
  { id: "code", name: "Code Ghost", color: "#E5432F", icon: "code", start: { x: 10, y: 7 }, corner: { x: 19, y: -2 }, release: 0 },
  { id: "gear", name: "Gear Ghost", color: "#3D8BFF", icon: "gear", start: { x: 9, y: 9 }, corner: { x: 1, y: -2 }, release: 2 },
  { id: "proto", name: "Prototype Ghost", color: "#FF9A3D", icon: "cube", start: { x: 10, y: 9 }, corner: { x: 19, y: 22 }, release: 5 },
  { id: "tool", name: "Tool Ghost", color: "#8B5CF6", icon: "wrench", start: { x: 11, y: 9 }, corner: { x: 1, y: 22 }, release: 8 },
]

const charAt = (x: number, y: number) => {
  if (y < 0 || y >= ROWS) return "#"
  if (x < 0 || x >= COLS) return y === TUNNEL_ROW ? " " : "#"
  return MAZE[y][x]
}
const isWall = (x: number, y: number) => charAt(x, y) === "#"

function passable(x: number, y: number, house = false) {
  const ch = charAt(x, y)
  if (ch === "#") return false
  if (ch === "-" || ch === "G") return house
  return true
}

/* -------------------------------------------------------------------------- */
/* Art: pixel sprites + vector icons                                           */
/* -------------------------------------------------------------------------- */

function makeCanvas(w: number, h: number) {
  const c = document.createElement("canvas")
  c.width = Math.max(1, Math.round(w))
  c.height = Math.max(1, Math.round(h))
  return c
}

function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16)
  const ch = (v: number) => Math.round(Math.min(255, Math.max(0, amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)))
  return `rgb(${ch(n >> 16)},${ch((n >> 8) & 255)},${ch(n & 255)})`
}

/** Vector icons used on ghosts, collectibles and the UI. `hole` is the colour behind the icon. */
function drawIcon(c: CanvasRenderingContext2D, kind: IconKind, cx: number, cy: number, size: number, color: string, hole = BG) {
  const h = size / 2
  c.save()
  c.translate(cx, cy)
  c.strokeStyle = color
  c.fillStyle = color
  c.lineWidth = Math.max(1, size * 0.11)
  c.lineCap = "round"
  c.lineJoin = "round"
  switch (kind) {
    case "code":
      c.beginPath()
      c.moveTo(-h * 0.42, -h * 0.5); c.lineTo(-h * 0.92, 0); c.lineTo(-h * 0.42, h * 0.5)
      c.moveTo(h * 0.42, -h * 0.5); c.lineTo(h * 0.92, 0); c.lineTo(h * 0.42, h * 0.5)
      c.moveTo(h * 0.18, -h * 0.66); c.lineTo(-h * 0.18, h * 0.66)
      c.stroke()
      break
    case "gear":
      for (let i = 0; i < 8; i++) {
        c.save()
        c.rotate((i * Math.PI) / 4)
        c.fillRect(-h * 0.15, -h * 0.95, h * 0.3, h * 0.4)
        c.restore()
      }
      c.beginPath(); c.arc(0, 0, h * 0.64, 0, Math.PI * 2); c.fill()
      c.fillStyle = hole
      c.beginPath(); c.arc(0, 0, h * 0.27, 0, Math.PI * 2); c.fill()
      break
    case "cube":
      c.beginPath()
      c.moveTo(0, -h * 0.9); c.lineTo(h * 0.8, -h * 0.45); c.lineTo(h * 0.8, h * 0.45); c.lineTo(0, h * 0.9)
      c.lineTo(-h * 0.8, h * 0.45); c.lineTo(-h * 0.8, -h * 0.45); c.closePath()
      c.moveTo(-h * 0.8, -h * 0.45); c.lineTo(0, 0); c.lineTo(h * 0.8, -h * 0.45)
      c.moveTo(0, 0); c.lineTo(0, h * 0.9)
      c.stroke()
      break
    case "wrench":
      c.rotate(-Math.PI / 4)
      c.lineWidth = size * 0.17
      c.beginPath(); c.moveTo(0, -h * 0.15); c.lineTo(0, h * 0.92); c.stroke()
      c.lineWidth = size * 0.14
      c.beginPath(); c.arc(0, -h * 0.48, h * 0.36, -0.2 * Math.PI, 1.2 * Math.PI); c.stroke()
      break
    case "chip":
      c.lineWidth = Math.max(1, size * 0.09)
      c.strokeRect(-h * 0.55, -h * 0.55, h * 1.1, h * 1.1)
      c.fillRect(-h * 0.24, -h * 0.24, h * 0.48, h * 0.48)
      c.beginPath()
      for (let i = -1; i <= 1; i++) {
        const o = i * h * 0.32
        c.moveTo(o, -h * 0.55); c.lineTo(o, -h * 0.92)
        c.moveTo(o, h * 0.55); c.lineTo(o, h * 0.92)
        c.moveTo(-h * 0.55, o); c.lineTo(-h * 0.92, o)
        c.moveTo(h * 0.55, o); c.lineTo(h * 0.92, o)
      }
      c.stroke()
      break
    case "board":
      c.lineWidth = Math.max(1, size * 0.09)
      c.strokeRect(-h * 0.92, -h * 0.62, h * 1.84, h * 1.24)
      c.beginPath()
      c.moveTo(-h * 0.6, -h * 0.22); c.lineTo(-h * 0.12, -h * 0.22); c.lineTo(h * 0.14, h * 0.22); c.lineTo(h * 0.6, h * 0.22)
      c.stroke()
      c.beginPath(); c.arc(-h * 0.6, -h * 0.22, h * 0.11, 0, Math.PI * 2); c.fill()
      c.beginPath(); c.arc(h * 0.6, h * 0.22, h * 0.11, 0, Math.PI * 2); c.fill()
      c.fillRect(h * 0.2, -h * 0.45, h * 0.4, h * 0.3)
      break
  }
  c.restore()
}

/** Procedural pixel dragon head with an open mouth, facing right. 18×18 px. */
function dragonBase(mouth: number, opts: { dead?: boolean; flutter?: number } = {}) {
  const N = 18, cx = 9, cy = 10, R = 7.3
  const cv = makeCanvas(N, N)
  const c = cv.getContext("2d")!
  const inside = (x: number, y: number) => {
    const dx = x + 0.5 - cx, dy = y + 0.5 - cy
    if (dx * dx + dy * dy > R * R) return false
    return !(dx > 0 && Math.abs(Math.atan2(dy, dx)) < mouth)
  }
  const px = (x: number, y: number, col: string) => { c.fillStyle = col; c.fillRect(x, y, 1, 1) }
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (!inside(x, y)) continue
      const edge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1)
      px(x, y, edge ? "#5c8a22" : y > cy + 1 && x > cx - 3 ? "#c8ec8a" : GREEN)
    }
  }
  // spiky mane along the top and back of the head
  const mane: [number, number][] = [
    [3, 1], [4, 2], [5, 2], [4, 3], [5, 3],
    [6, 0], [6, 1], [7, 1], [7, 2], [8, 2],
    [9, 0], [9, 1], [10, 1], [10, 2],
    [1, 4], [2, 4], [2, 5], [3, 5], [3, 4],
    [0, 7], [1, 7], [1, 8], [2, 8],
  ]
  mane.forEach(([x, y], i) => px(x, y, i % 5 === 0 ? "#c8ec8a" : "#7fb52f"))
  // red scarf around the neck, trailing behind
  const f = opts.flutter ?? 0
  const scarf: [number, number, string][] = [
    [3, 12, RED], [4, 13, RED], [5, 14, RED], [6, 15, RED], [3, 13, "#a33122"], [4, 14, "#a33122"], [5, 15, "#a33122"],
    [2, 13, RED], [1, 13 + f, RED], [0, 12 + f * 2, RED], [2, 14, "#a33122"], [1, 14 + f, "#a33122"],
  ]
  scarf.forEach(([x, y, col]) => px(x, y, col))
  // eye
  if (opts.dead) {
    ;[[11, 5], [13, 5], [12, 6], [11, 7], [13, 7]].forEach(([x, y]) => px(x, y, BG))
  } else {
    px(11, 5, WHITE); px(12, 5, WHITE); px(11, 6, WHITE); px(12, 6, BG)
  }
  // nostril
  px(15, 7, "#5c8a22")
  return cv
}

const GHOST_BODY = [
  "......##......",
  "......##......",
  ".....####.....",
  "...########...",
  "..##########..",
  ".############.",
  ".############.",
  "##############",
  "##############",
  "##############",
  "##############",
  "##############",
  "##############",
  "##############",
]
const GHOST_FEET = [
  ["##.###..###.##", "#...##..##...#"],
  ["###.##..##.###", ".#...#..#...#."],
]

/** Pixel ghost body (14×16) in the given colours */
function ghostBase(frame: number, body: string, edge: string, tip: string) {
  const rows = [...GHOST_BODY, ...GHOST_FEET[frame]]
  const cv = makeCanvas(14, rows.length)
  const c = cv.getContext("2d")!
  const on = (x: number, y: number) => rows[y]?.[x] === "#"
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < 14; x++) {
      if (!on(x, y)) continue
      const isEdge = !on(x - 1, y) || !on(x + 1, y) || !on(x, y - 1) || !on(x, y + 1)
      c.fillStyle = y < 2 ? tip : isEdge ? edge : y >= 3 && y <= 5 && x >= 3 && x <= 5 ? shade(body, 0.25) : body
      c.fillRect(x, y, 1, 1)
    }
  }
  return cv
}

type GhostSprites = { normal: HTMLCanvasElement[]; scared: HTMLCanvasElement[]; flash: HTMLCanvasElement[] }

/** Builds ghost sprites (body + white icon) at display size `s` */
function buildGhostSprites(def: GhostDef, s: number): GhostSprites {
  const w = s, h = (s * 16) / 14
  const compose = (frame: number, body: string, edge: string, tip: string, face: "icon" | "scared" | "flash") => {
    const cv = makeCanvas(w, h)
    const c = cv.getContext("2d")!
    c.imageSmoothingEnabled = false
    c.drawImage(ghostBase(frame, body, edge, tip), 0, 0, cv.width, cv.height)
    const cx = cv.width / 2, cy = cv.height * 0.56
    if (face === "icon") {
      drawIcon(c, def.icon, cx, cy, cv.width * 0.46, WHITE, body)
    } else {
      const ink = face === "flash" ? RED : WHITE
      const u = cv.width / 14
      c.fillStyle = ink
      c.fillRect(cx - u * 3.5, cy - u * 2.5, u * 2, u * 2)
      c.fillRect(cx + u * 1.5, cy - u * 2.5, u * 2, u * 2)
      for (let i = 0; i < 4; i++) c.fillRect(cx - u * 4 + i * u * 2, cy + u * (i % 2 ? 1.5 : 0.5), u * 2, u)
    }
    return cv
  }
  return {
    normal: [0, 1].map((f) => compose(f, def.color, shade(def.color, -0.35), shade(def.color, 0.4), "icon")),
    scared: [0, 1].map((f) => compose(f, "#1d2b12", GREEN, GREEN, "scared")),
    flash: [0, 1].map((f) => compose(f, WHITE, RED, RED, "flash")),
  }
}

function drawEyes(c: CanvasRenderingContext2D, cx: number, cy: number, s: number, dir: Dir) {
  const u = s / 14
  for (const side of [-1, 1]) {
    const ex = cx + side * u * 2.6
    c.fillStyle = WHITE
    c.fillRect(ex - u * 1.6, cy - u * 2, u * 3.2, u * 4)
    c.fillStyle = "#3D8BFF"
    c.fillRect(ex - u * 0.8 + dir.x * u * 0.8, cy - u * 0.8 + dir.y * u * 1.1, u * 1.6, u * 1.6)
  }
}

/* -------------------------------------------------------------------------- */
/* Game engine                                                                 */
/* -------------------------------------------------------------------------- */

type GhostState = "house" | "leaving" | "active" | "eaten" | "entering"
type Ghost = { def: GhostDef; x: number; y: number; dir: Dir; state: GhostState; scared: boolean; releaseAt: number; sprites?: GhostSprites }
type Mover = { x: number; y: number; dir: Dir }
type Phase = "idle" | "ready" | "play" | "dying" | "clear" | "over"
export type SoundName = "pellet" | "special" | "power" | "eatGhost" | "death" | "clear" | "start"

type EngineHooks = {
  onScore: (score: number) => void
  onLives: (lives: number) => void
  onLevel: (level: number) => void
  onOver: (score: number) => void
  onComplete: (level: number, score: number) => void
  sound: (name: SoundName) => void
}

function advance(m: Mover, dist: number, onCenter: (m: Mover) => void) {
  for (let guard = 0; dist > 1e-6 && guard < 10; guard++) {
    const atCenter = Math.abs(m.x - Math.round(m.x)) < 1e-4 && Math.abs(m.y - Math.round(m.y)) < 1e-4
    if (atCenter) {
      m.x = Math.round(m.x)
      m.y = Math.round(m.y)
      if (m.y === TUNNEL_ROW) {
        if (m.x <= 0 && m.dir.x < 0) m.x = COLS - 1
        else if (m.x >= COLS - 1 && m.dir.x > 0) m.x = 0
      }
      onCenter(m)
      if (!m.dir.x && !m.dir.y) return
    }
    const tx = m.dir.x ? (atCenter ? m.x + m.dir.x : m.dir.x > 0 ? Math.ceil(m.x) : Math.floor(m.x)) : m.x
    const ty = m.dir.y ? (atCenter ? m.y + m.dir.y : m.dir.y > 0 ? Math.ceil(m.y) : Math.floor(m.y)) : m.y
    const d = Math.abs(tx - m.x) + Math.abs(ty - m.y)
    const step = Math.min(d, dist)
    m.x += m.dir.x * step
    m.y += m.dir.y * step
    dist -= step
    if (step >= d - 1e-6) { m.x = tx; m.y = ty }
  }
}

/** Moves directly toward a point (x first, then y). Returns true on arrival. */
function moveToward(g: Mover, tx: number, ty: number, dist: number) {
  const dx = tx - g.x
  if (Math.abs(dx) > 1e-4) {
    const s = Math.min(Math.abs(dx), dist)
    g.x += Math.sign(dx) * s
    dist -= s
    g.dir = { x: Math.sign(dx), y: 0 }
  }
  const dy = ty - g.y
  if (dist > 0 && Math.abs(dy) > 1e-4) {
    const s = Math.min(Math.abs(dy), dist)
    g.y += Math.sign(dy) * s
    g.dir = { x: 0, y: Math.sign(dy) }
  }
  return Math.abs(tx - g.x) < 1e-4 && Math.abs(ty - g.y) < 1e-4
}

const MODE_SCHEDULE = [7, 20, 7, 20, 5, Infinity] // scatter, chase, scatter, chase…

function createEngine(canvas: HTMLCanvasElement, hooks: EngineHooks, reducedMotion: boolean) {
  const ctx = canvas.getContext("2d")!
  let T = 24, dpr = 1
  let alive = true, raf = 0, last = 0, time = 0
  let paused = false
  let phase: Phase = "idle", phaseTime = 0
  let level = 1, score = 0, lives = 3
  let cells = new Uint8Array(COLS * ROWS) // 0 empty · 1 pellet · 2 power · 3 special
  const specialKind = new Map<number, IconKind>()
  let pelletsLeft = 0
  let playTime = 0, modeIndex = 0, modeTime = 0
  let scaredTime = 0, eatChain = 0

  const player = { x: PLAYER_START.x, y: PLAYER_START.y, dir: NONE as Dir, facing: RIGHT as Dir, want: NONE as Dir, anim: 0 }
  const ghosts: Ghost[] = GHOSTS.map((def) => ({ def, x: def.start.x, y: def.start.y, dir: LEFT, state: "house", scared: false, releaseAt: 0 }))
  let particles: { x: number; y: number; vx: number; vy: number; life: number; color: string }[] = []
  let texts: { x: number; y: number; text: string; life: number }[] = []

  // Cached art (rebuilt on resize)
  let mazeLayer: HTMLCanvasElement | null = null
  let dragonFrames: HTMLCanvasElement[] = []
  let dragonDead: HTMLCanvasElement | null = null
  let iconSprites = new Map<IconKind, HTMLCanvasElement>()

  const idx = (x: number, y: number) => y * COLS + x

  function resetMaze() {
    cells = new Uint8Array(COLS * ROWS)
    specialKind.clear()
    pelletsLeft = 0
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const ch = MAZE[y][x]
        if (ch === ".") { cells[idx(x, y)] = 1; pelletsLeft++ }
        if (ch === "o") { cells[idx(x, y)] = 2; pelletsLeft++ }
      }
    }
    for (const s of SPECIALS) {
      if (cells[idx(s.x, s.y)] === 1) pelletsLeft--
      cells[idx(s.x, s.y)] = 3
      specialKind.set(idx(s.x, s.y), s.kind)
    }
  }

  const levelScale = (base: number, step: number, cap: number) => Math.min(cap, base * (1 + step * (level - 1)))

  function resetActors() {
    Object.assign(player, { x: PLAYER_START.x, y: PLAYER_START.y, dir: NONE, facing: RIGHT, want: NONE, anim: 0 })
    const releaseScale = Math.max(0.35, 1 - 0.15 * (level - 1))
    for (const g of ghosts) {
      Object.assign(g, { x: g.def.start.x, y: g.def.start.y, dir: LEFT, scared: false, releaseAt: g.def.release * releaseScale })
      g.state = g.def.release === 0 ? "active" : "house"
    }
    playTime = 0; modeIndex = 0; modeTime = 0; scaredTime = 0
  }

  function setPhase(p: Phase) {
    phase = p
    phaseTime = 0
  }

  function buildArt() {
    // Maze walls: glowing neon tubes along the edge walls, with via dots at the ends
    mazeLayer = makeCanvas(COLS * T * dpr, ROWS * T * dpr)
    const m = mazeLayer.getContext("2d")!
    m.scale(dpr, dpr)
    const edge = (x: number, y: number) => {
      if (!isWall(x, y)) return false
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && !isWall(x + dx, y + dy)) return true
      return false
    }
    const segs: [number, number, number, number][] = []
    const ends: [number, number][] = []
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (!edge(x, y)) continue
        const n = [edge(x + 1, y), edge(x - 1, y), edge(x, y + 1), edge(x, y - 1)].filter(Boolean).length
        if (edge(x + 1, y) && x + 1 < COLS) segs.push([x, y, x + 1, y])
        if (edge(x, y + 1) && y + 1 < ROWS) segs.push([x, y, x, y + 1])
        if (n <= 1) ends.push([x, y])
      }
    }
    const path = new Path2D()
    for (const [x1, y1, x2, y2] of segs) {
      path.moveTo((x1 + 0.5) * T, (y1 + 0.5) * T)
      path.lineTo((x2 + 0.5) * T, (y2 + 0.5) * T)
    }
    for (const [x, y] of ends) {
      path.moveTo((x + 0.5) * T + 0.01, (y + 0.5) * T)
      path.lineTo((x + 0.5) * T, (y + 0.5) * T)
    }
    m.lineCap = "round"
    m.lineJoin = "round"
    m.shadowColor = "rgba(145,204,63,0.7)"
    m.shadowBlur = T * 0.45
    m.strokeStyle = GREEN
    m.lineWidth = T * 0.42
    m.stroke(path)
    m.shadowBlur = 0
    m.strokeStyle = "#0c120d"
    m.lineWidth = T * 0.42 - Math.max(2, T * 0.1)
    m.stroke(path)
    // inner circuit trace
    m.strokeStyle = "rgba(145,204,63,0.22)"
    m.lineWidth = Math.max(1, T * 0.05)
    m.stroke(path)
    // vias at wall ends
    m.fillStyle = GREEN
    for (const [x, y] of ends) {
      m.beginPath()
      m.arc((x + 0.5) * T, (y + 0.5) * T, T * 0.08, 0, Math.PI * 2)
      m.fill()
    }
    // ghost door
    m.fillStyle = RED
    m.fillRect(HOUSE_EXIT.x * T + T * 0.1, (HOUSE_EXIT.y + 1.5) * T - T * 0.07, T * 0.8, T * 0.14)

    // Player frames
    dragonFrames = [0.06, 0.42, 0.78].map((mouth, i) => dragonBase(mouth, { flutter: i % 2 }))
    dragonDead = dragonBase(0.06, { dead: true })

    // Icons (glowing)
    iconSprites = new Map()
    const s = Math.round(T * 0.82)
    for (const kind of ["code", "gear", "cube", "wrench", "chip", "board"] as IconKind[]) {
      const cv = makeCanvas(s * 2 * dpr, s * 2 * dpr)
      const c = cv.getContext("2d")!
      c.scale(dpr, dpr)
      c.shadowColor = GREEN
      c.shadowBlur = s * 0.4
      drawIcon(c, kind, s, s, s, GREEN)
      iconSprites.set(kind, cv)
    }

    // Ghosts
    const gs = Math.round(T * 1.2 * dpr)
    for (const g of ghosts) g.sprites = buildGhostSprites(g.def, gs)
  }

  function resize(availW: number, availH: number) {
    T = Math.max(10, Math.floor(Math.min(availW / COLS, availH / ROWS)))
    dpr = Math.min(2, window.devicePixelRatio || 1)
    canvas.style.width = `${COLS * T}px`
    canvas.style.height = `${ROWS * T}px`
    canvas.width = Math.round(COLS * T * dpr)
    canvas.height = Math.round(ROWS * T * dpr)
    buildArt()
    render()
  }

  /* ------------------------------- logic -------------------------------- */

  function addScore(n: number) {
    score += n
    hooks.onScore(score)
  }

  function burst(x: number, y: number, color: string, n = 10) {
    if (reducedMotion) return
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = 2 + Math.random() * 4
      particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.5 + Math.random() * 0.3, color })
    }
  }

  function eat() {
    const x = ((Math.round(player.x) % COLS) + COLS) % COLS
    const y = Math.round(player.y)
    const i = idx(x, y)
    const v = cells[i]
    if (!v) return
    cells[i] = 0
    if (v === 1) {
      addScore(10)
      pelletsLeft--
      hooks.sound("pellet")
    } else if (v === 2) {
      addScore(100)
      pelletsLeft--
      hooks.sound("power")
      burst(x, y, GREEN, 16)
      scaredTime = Math.max(2.5, 7 - (level - 1))
      eatChain = 0
      for (const g of ghosts) {
        if (g.state === "active" || g.state === "house" || g.state === "leaving") {
          g.scared = true
          if (g.state === "active") g.dir = { x: -g.dir.x, y: -g.dir.y }
        }
      }
    } else if (v === 3) {
      addScore(50)
      hooks.sound("special")
      burst(x, y, GREEN, 14)
      texts.push({ x, y, text: "+50", life: 0.9 })
    }
    if (pelletsLeft <= 0) {
      setPhase("clear")
      hooks.sound("clear")
    }
  }

  function ghostTarget(g: Ghost): Dir {
    const scatter = modeIndex % 2 === 0
    if (scatter) return g.def.corner
    const p = { x: Math.round(player.x), y: Math.round(player.y) }
    switch (g.def.id) {
      case "gear": // cut the player off a few tiles ahead
        return { x: p.x + player.facing.x * 4, y: p.y + player.facing.y * 4 }
      case "proto": // alternates between chasing and wandering home every few seconds
        return Math.floor(playTime / 4) % 2 ? g.def.corner : p
      case "tool": { // guards the power cell nearest the player
        let best: Dir | null = null, bd = Infinity
        for (let i = 0; i < cells.length; i++) {
          if (cells[i] !== 2) continue
          const cx = i % COLS, cy = Math.floor(i / COLS)
          const d = (cx - p.x) ** 2 + (cy - p.y) ** 2
          if (d < bd) { bd = d; best = { x: cx, y: cy } }
        }
        return best && bd < 64 ? best : p
      }
      default: // code: straight for the player
        return p
    }
  }

  function steerGhost(g: Ghost, target: Dir | null) {
    return (m: Mover) => {
      if (g.state === "eaten" && m.x === HOUSE_EXIT.x && m.y === HOUSE_EXIT.y) {
        g.state = "entering"
        m.dir = NONE
        return
      }
      let opts = DIRS.filter((d) => !(d.x === -m.dir.x && d.y === -m.dir.y) && passable(m.x + d.x, m.y + d.y))
      if (!opts.length) opts = DIRS.filter((d) => passable(m.x + d.x, m.y + d.y))
      if (!opts.length) { m.dir = NONE; return }
      if (!target) { m.dir = opts[Math.floor(Math.random() * opts.length)]; return }
      let best = opts[0], bd = Infinity
      for (const d of opts) {
        const dd = (m.x + d.x - target.x) ** 2 + (m.y + d.y - target.y) ** 2
        if (dd < bd) { bd = dd; best = d }
      }
      m.dir = best
    }
  }

  function updateGhost(g: Ghost, dt: number) {
    const inTunnel = Math.round(g.y) === TUNNEL_ROW && (g.x < 4 || g.x > COLS - 5)
    const base = levelScale(5.3, 0.06, 6.9)
    switch (g.state) {
      case "house":
        g.y = HOUSE_Y + (reducedMotion ? 0 : Math.sin(time * 5 + g.def.start.x) * 0.22)
        if (playTime >= g.releaseAt) g.state = "leaving"
        break
      case "leaving": {
        const sp = 2.6 * dt
        const done = Math.abs(g.x - HOUSE_EXIT.x) > 1e-4 ? (moveToward(g, HOUSE_EXIT.x, HOUSE_Y, sp), false) : moveToward(g, HOUSE_EXIT.x, HOUSE_EXIT.y, sp)
        if (done) {
          g.state = "active"
          g.dir = Math.random() < 0.5 ? LEFT : RIGHT
        }
        break
      }
      case "entering":
        if (moveToward(g, HOUSE_EXIT.x, HOUSE_Y, 6 * dt)) {
          g.state = "house"
          g.scared = false
          g.releaseAt = playTime + 0.6
        }
        break
      case "eaten":
        advance(g, 12 * dt, steerGhost(g, HOUSE_EXIT))
        break
      case "active": {
        const sp = g.scared ? 3.3 : inTunnel ? 3.1 : base
        advance(g, sp * dt, steerGhost(g, g.scared ? null : ghostTarget(g)))
        break
      }
    }
  }

  function update(dt: number) {
    time += dt
    phaseTime += dt
    for (const p of particles) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.92; p.vy *= 0.92 }
    particles = particles.filter((p) => p.life > 0)
    for (const t of texts) { t.life -= dt; t.y -= dt * 0.8 }
    texts = texts.filter((t) => t.life > 0)

    if (phase === "ready" && phaseTime > 1.6) setPhase("play")
    if (phase === "dying" && phaseTime > 1.5) {
      lives--
      hooks.onLives(lives)
      if (lives <= 0) {
        setPhase("over")
        hooks.onOver(score)
      } else {
        resetActors()
        setPhase("ready")
      }
    }
    if (phase === "clear" && phaseTime > 1.8) {
      setPhase("idle")
      hooks.onComplete(level, score)
    }
    if (phase !== "play") return

    playTime += dt

    // scatter/chase cycle (paused while ghosts are scared)
    if (scaredTime > 0) {
      scaredTime -= dt
      if (scaredTime <= 0) for (const g of ghosts) g.scared = false
    } else {
      modeTime += dt
      if (modeTime > MODE_SCHEDULE[modeIndex]) {
        modeTime = 0
        modeIndex = Math.min(modeIndex + 1, MODE_SCHEDULE.length - 1)
        for (const g of ghosts) if (g.state === "active") g.dir = { x: -g.dir.x, y: -g.dir.y }
      }
    }

    // player
    const want = player.want
    if ((want.x || want.y) && want.x === -player.dir.x && want.y === -player.dir.y) player.dir = want
    advance(player, levelScale(6, 0.05, 7.2) * dt, (m) => {
      if ((want.x || want.y) && passable(m.x + want.x, m.y + want.y)) m.dir = want
      else if (!passable(m.x + m.dir.x, m.y + m.dir.y)) m.dir = NONE
    })
    if (player.dir.x || player.dir.y) {
      player.facing = player.dir
      player.anim += dt * 14
    }
    eat()
    if (phase !== "play") return

    for (const g of ghosts) updateGhost(g, dt)

    // collisions
    for (const g of ghosts) {
      if (g.state !== "active") continue
      if (Math.hypot(g.x - player.x, g.y - player.y) > 0.62) continue
      if (g.scared) {
        const pts = 200 * 2 ** Math.min(eatChain, 3)
        eatChain++
        addScore(pts)
        g.state = "eaten"
        g.scared = false
        texts.push({ x: g.x, y: g.y, text: String(pts), life: 1 })
        burst(g.x, g.y, g.def.color, 12)
        hooks.sound("eatGhost")
      } else {
        setPhase("dying")
        hooks.sound("death")
        burst(player.x, player.y, RED, 18)
        return
      }
    }
  }

  /* ------------------------------ rendering ----------------------------- */

  function render() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, COLS * T, ROWS * T)
    ctx.imageSmoothingEnabled = false
    if (!mazeLayer) return

    // maze (flashes when a level is cleared)
    ctx.globalAlpha = phase === "clear" && Math.floor(phaseTime * 6) % 2 ? 0.35 : 1
    ctx.drawImage(mazeLayer, 0, 0, COLS * T, ROWS * T)
    ctx.globalAlpha = 1

    // pellets, power cells, specials
    const ps = Math.max(2, Math.round(T * 0.16))
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const v = cells[idx(x, y)]
        if (!v) continue
        const cx = (x + 0.5) * T, cy = (y + 0.5) * T
        if (v === 1) {
          ctx.fillStyle = "#f3e3a1"
          ctx.fillRect(Math.round(cx - ps / 2), Math.round(cy - ps / 2), ps, ps)
        } else if (v === 2) {
          const r = T * (reducedMotion ? 0.28 : 0.24 + Math.sin(time * 6) * 0.05)
          ctx.save()
          ctx.shadowColor = GREEN
          ctx.shadowBlur = T * 0.6
          ctx.fillStyle = GREEN
          ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill()
          ctx.restore()
        } else {
          const icon = iconSprites.get(specialKind.get(idx(x, y))!)
          const bob = reducedMotion ? 0 : Math.sin(time * 3 + x) * T * 0.06
          const s = T * 0.82
          if (icon) ctx.drawImage(icon, cx - s, cy - s + bob, s * 2, s * 2)
        }
      }
    }

    if (phase === "ready") {
      ctx.font = `700 ${Math.round(T * 0.75)}px "Silkscreen", "JetBrains Mono", monospace`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillStyle = GREEN
      ctx.fillText("BUILD READY!", (HOUSE_EXIT.x + 0.5) * T, 11.5 * T)
    }

    // ghosts
    const hideGhosts = (phase === "dying" && phaseTime > 0.3) || phase === "over"
    if (!hideGhosts && phase !== "clear") {
      const frame = Math.floor(time * 6) % 2
      for (const g of ghosts) {
        const cx = (g.x + 0.5) * T, cy = (g.y + 0.5) * T
        if (g.state === "eaten" || g.state === "entering") {
          drawEyes(ctx, cx, cy, T * 1.2, g.dir)
          continue
        }
        const sp = g.sprites
        if (!sp) continue
        const flashing = g.scared && scaredTime < 2 && Math.floor(time * 8) % 2 === 0
        const img = g.scared ? (flashing ? sp.flash : sp.scared)[frame] : sp.normal[frame]
        const w = T * 1.2, h = (w * 16) / 14
        ctx.drawImage(img, cx - w / 2, cy - h / 2 - T * 0.08, w, h)
      }
    }

    // player
    if (phase !== "idle" || score > 0) {
      const cx = (player.x + 0.5) * T, cy = (player.y + 0.5) * T
      const s = T * 1.35
      ctx.save()
      ctx.translate(cx, cy)
      if (phase === "dying" || phase === "over") {
        const k = phase === "over" ? 1 : Math.min(1, phaseTime / 1.2)
        ctx.rotate(k * Math.PI * 2)
        ctx.scale(1 - k * 0.6, 1 - k * 0.6)
        if (dragonDead) ctx.drawImage(dragonDead, -s / 2, -s / 2, s, s)
      } else {
        const f = player.facing
        if (f.x < 0) ctx.scale(-1, 1)
        else if (f.y < 0) ctx.rotate(-Math.PI / 2)
        else if (f.y > 0) ctx.rotate(Math.PI / 2)
        const seq = [0, 1, 2, 1]
        const frame = player.dir.x || player.dir.y ? seq[Math.floor(player.anim) % 4] : 1
        ctx.drawImage(dragonFrames[frame], -s / 2, -s / 2, s, s)
      }
      ctx.restore()
    }

    // particles & score popups
    for (const p of particles) {
      ctx.globalAlpha = Math.min(1, p.life * 2)
      ctx.fillStyle = p.color
      const sz = Math.max(2, T * 0.12)
      ctx.fillRect((p.x + 0.5) * T - sz / 2, (p.y + 0.5) * T - sz / 2, sz, sz)
    }
    ctx.globalAlpha = 1
    ctx.font = `700 ${Math.round(T * 0.55)}px "Silkscreen", "JetBrains Mono", monospace`
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    for (const t of texts) {
      ctx.fillStyle = `rgba(245,246,247,${Math.min(1, t.life * 1.5)})`
      ctx.fillText(t.text, (t.x + 0.5) * T, (t.y + 0.5) * T)
    }
  }

  function loop(now: number) {
    if (!alive) return
    const dt = Math.min(1 / 30, (now - last) / 1000 || 0)
    last = now
    if (!paused) {
      update(dt)
      render()
    }
    raf = requestAnimationFrame(loop)
  }
  raf = requestAnimationFrame((t) => { last = t; loop(t) })

  function beginLevel() {
    resetMaze()
    resetActors()
    particles = []
    texts = []
    hooks.onLevel(level)
    setPhase("ready")
  }

  return {
    resize,
    start() {
      level = 1; score = 0; lives = 3
      hooks.onScore(0)
      hooks.onLives(lives)
      paused = false
      beginLevel()
      hooks.sound("start")
    },
    nextLevel() {
      level++
      paused = false
      beginLevel()
      hooks.sound("start")
    },
    setDir(d: Dir) {
      player.want = d
    },
    pause() { paused = true },
    resume() { paused = false; last = performance.now() },
    destroy() {
      alive = false
      cancelAnimationFrame(raf)
    },
  }
}
type Engine = ReturnType<typeof createEngine>

/* -------------------------------------------------------------------------- */
/* Sounds                                                                       */
/* -------------------------------------------------------------------------- */

function playSound(synth: Synth, name: SoundName, alt: number) {
  const { tone } = synth
  switch (name) {
    case "pellet":
      tone(alt ? 620 : 780, 0.045, { vol: 0.022 })
      break
    case "special":
      tone(1047, 0.06, { type: "triangle", vol: 0.08 })
      tone(1568, 0.12, { type: "triangle", vol: 0.08, delay: 0.06 })
      break
    case "power":
      ;[523, 659, 784, 1047].forEach((f, i) => tone(f, 0.08, { vol: 0.05, delay: i * 0.05 }))
      break
    case "eatGhost":
      tone(300, 0.18, { type: "triangle", to: 1400, vol: 0.08 })
      break
    case "death":
      tone(880, 0.9, { to: 90, vol: 0.06 })
      tone(440, 0.9, { type: "triangle", to: 60, vol: 0.05, delay: 0.1 })
      break
    case "clear":
      ;[523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.12, { type: "triangle", vol: 0.07, delay: i * 0.11 }))
      break
    case "start":
      tone(659, 0.08, { vol: 0.045 })
      tone(988, 0.14, { vol: 0.045, delay: 0.09 })
      break
  }
}

/* -------------------------------------------------------------------------- */
/* Marquee: dragon chomping dots, ghosts lined up (invite + start screen)      */
/* -------------------------------------------------------------------------- */

function Marquee({ className, active = true }: { className?: string; active?: boolean }) {
  const ref = React.useRef<HTMLCanvasElement>(null)

  React.useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const c = canvas.getContext("2d")!
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
    let W = 0, H = 0, dpr = 1, raf = 0, visible = true, t0 = performance.now()
    let ghostArt: GhostSprites[] = []
    let dragon: HTMLCanvasElement[] = []
    let chip: HTMLCanvasElement | null = null
    // Sizes shrink on narrow screens so the dragon, dots and ghosts never overlap
    const ghostSize = () => Math.min(H * 0.5, (W * 0.5) / (GHOSTS.length + (GHOSTS.length - 1) * 0.32))
    const dragonSize = () => Math.min(H * 0.82, W * 0.2)

    const build = () => {
      W = canvas.clientWidth
      H = canvas.clientHeight
      dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
      ghostArt = GHOSTS.map((g) => buildGhostSprites(g, Math.round(ghostSize() * dpr)))
      dragon = [0.06, 0.42, 0.78].map((m, i) => dragonBase(m, { flutter: i % 2 }))
      const s = Math.min(H * 0.42, W * 0.07)
      chip = makeCanvas(s * 2 * dpr, s * 2 * dpr)
      const cc = chip.getContext("2d")!
      cc.scale(dpr, dpr)
      cc.shadowColor = GREEN
      cc.shadowBlur = s * 0.4
      drawIcon(cc, "chip", s, s, s, GREEN)
    }

    const draw = (now: number) => {
      const t = reduced ? 0 : Math.max(0, now - t0) / 1000
      c.setTransform(dpr, 0, 0, dpr, 0, 0)
      c.clearRect(0, 0, W, H)
      c.imageSmoothingEnabled = false
      const ds = dragonSize()
      const dx = Math.max(ds * 0.6, W * 0.06)
      const gs = ghostSize(), gap = gs * 0.32
      const ghostsW = GHOSTS.length * gs + (GHOSTS.length - 1) * gap
      const gx0 = W - ghostsW - Math.max(8, W * 0.03)
      // dots flowing into the dragon's mouth
      const startX = dx + ds * 0.35, endX = gx0 - gs * 0.5
      const spacing = Math.max(16, Math.min(H * 0.28, W * 0.05))
      const offset = (t * spacing * 1.6) % spacing
      const count = Math.floor((endX - startX) / spacing)
      const chipAt = Math.floor(count / 2)
      for (let i = 0; i <= count; i++) {
        const x = startX + i * spacing - offset
        if (x < startX) continue
        if (i === chipAt && chip) {
          const s = Math.min(H * 0.42, W * 0.07)
          c.drawImage(chip, x - s, H / 2 - s, s * 2, s * 2)
        } else {
          const p = Math.max(3, H * 0.06)
          c.fillStyle = "#f3e3a1"
          c.fillRect(Math.round(x - p / 2), Math.round(H / 2 - p / 2), p, p)
        }
      }
      // dragon
      const frame = [0, 1, 2, 1][Math.floor(t * 9) % 4]
      c.drawImage(dragon[reduced ? 2 : frame], dx - ds / 2, H / 2 - ds / 2, ds, ds)
      // ghosts
      ghostArt.forEach((g, i) => {
        const x = gx0 + i * (gs + gap)
        const bob = reduced ? 0 : Math.sin(t * 4 + i) * H * 0.03
        const h = (gs * 16) / 14
        c.drawImage(g.normal[Math.floor(t * 5) % 2], x, H / 2 - h / 2 + bob, gs, h)
      })
    }

    const loop = (now: number) => {
      if (visible && active) draw(now)
      if (!reduced) raf = requestAnimationFrame(loop)
    }

    build()
    draw(performance.now())
    if (!reduced) raf = requestAnimationFrame(loop)

    const ro = new ResizeObserver(() => { build(); draw(performance.now()) })
    ro.observe(canvas)
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting })
    io.observe(canvas)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
    }
  }, [active])

  return <canvas ref={ref} className={className} aria-hidden="true" />
}

/** A single static sprite (used for the dead dragon and life icons) */
function SpriteImage({ kind, className }: { kind: "dragon" | "dead"; className?: string }) {
  const src = React.useMemo(() => (kind === "dead" ? dragonBase(0.06, { dead: true }) : dragonBase(0.6)).toDataURL(), [kind])
  return <img src={src} alt="" className={className} aria-hidden="true" />
}

/* -------------------------------------------------------------------------- */
/* Overlay                                                                      */
/* -------------------------------------------------------------------------- */

type Mode = "start" | "playing" | "paused" | "over" | "complete"

const readNumber = (key: string) => {
  try { return Number(localStorage.getItem(key)) || 0 } catch { return 0 }
}
const pad = (n: number) => String(n).padStart(6, "0")

function ArcadeOverlay({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = React.useState<Mode>("start")
  const [best, setBest] = React.useState(() => readNumber(BEST_KEY))
  const [lives, setLives] = React.useState(3)
  const [level, setLevel] = React.useState(1)
  const [final, setFinal] = React.useState({ score: 0, record: false })
  const [muted, setMuted] = React.useState(() => readNumber(MUTE_KEY) === 1)

  const rootRef = React.useRef<HTMLDivElement>(null)
  const stageRef = React.useRef<HTMLDivElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const scoreRef = React.useRef<HTMLElement>(null)
  const engineRef = React.useRef<Engine | null>(null)
  const synthRef = React.useRef<Synth | null>(null)
  if (!synthRef.current) synthRef.current = createSynth(muted)
  const modeRef = React.useRef(mode)
  modeRef.current = mode
  const bestRef = React.useRef(best)
  bestRef.current = best

  // Scroll lock, restoring the exact position on close
  React.useEffect(() => {
    const html = document.documentElement
    const y = window.scrollY
    const prev = { overflow: html.style.overflow, paddingRight: html.style.paddingRight }
    const scrollbar = window.innerWidth - html.clientWidth
    html.style.overflow = "hidden"
    if (scrollbar > 0) html.style.paddingRight = `${scrollbar}px`
    rootRef.current?.focus({ preventScroll: true })
    return () => {
      html.style.overflow = prev.overflow
      html.style.paddingRight = prev.paddingRight
      window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior })
    }
  }, [])

  const saveBest = React.useCallback((score: number) => {
    const record = score > bestRef.current
    if (record) {
      setBest(score)
      try { localStorage.setItem(BEST_KEY, String(score)) } catch { /* storage unavailable */ }
    }
    return record
  }, [])

  React.useEffect(() => {
    const canvas = canvasRef.current!
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
    let alt = 0
    const engine = createEngine(canvas, {
      onScore: (n) => {
        if (scoreRef.current) {
          scoreRef.current.textContent = pad(n)
          scoreRef.current.classList.remove("is-bump")
          void scoreRef.current.offsetWidth
          scoreRef.current.classList.add("is-bump")
        }
      },
      onLives: setLives,
      onLevel: setLevel,
      onOver: (score) => {
        setFinal({ score, record: saveBest(score) })
        setMode("over")
      },
      onComplete: (_lvl, score) => {
        setFinal({ score, record: saveBest(score) })
        setMode("complete")
      },
      sound: (name) => {
        if (name === "pellet") alt ^= 1
        playSound(synthRef.current!, name, alt)
      },
    }, reduced)
    engineRef.current = engine

    const stage = stageRef.current!
    const fit = () => engine.resize(stage.clientWidth - 8, stage.clientHeight - 8)
    const ro = new ResizeObserver(fit)
    ro.observe(stage)
    fit()

    const onVisibility = () => {
      if (document.hidden && modeRef.current === "playing") {
        engine.pause()
        setMode("paused")
      }
    }
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      ro.disconnect()
      document.removeEventListener("visibilitychange", onVisibility)
      engine.destroy()
      synthRef.current?.dispose()
    }
  }, [saveBest])

  const blurActive = () => (document.activeElement as HTMLElement | null)?.blur?.()

  const play = React.useCallback(() => {
    blurActive()
    rootRef.current?.focus()
    synthRef.current?.unlock()
    engineRef.current?.start()
    setMode("playing")
  }, [])

  const next = React.useCallback(() => {
    blurActive()
    rootRef.current?.focus()
    engineRef.current?.nextLevel()
    setMode("playing")
  }, [])

  const pause = React.useCallback(() => {
    if (modeRef.current !== "playing") return
    engineRef.current?.pause()
    setMode("paused")
  }, [])

  const resume = React.useCallback(() => {
    blurActive()
    rootRef.current?.focus()
    engineRef.current?.resume()
    setMode("playing")
  }, [])

  const toggleMute = React.useCallback(() => {
    setMuted((m) => {
      const nextMuted = !m
      synthRef.current?.setMuted(nextMuted)
      if (!nextMuted) synthRef.current?.unlock()
      try { localStorage.setItem(MUTE_KEY, nextMuted ? "1" : "0") } catch { /* storage unavailable */ }
      return nextMuted
    })
  }, [])

  // Keyboard
  React.useEffect(() => {
    const dirFor: Record<string, Dir> = {
      ArrowUp: UP, KeyW: UP, ArrowDown: DOWN, KeyS: DOWN, ArrowLeft: LEFT, KeyA: LEFT, ArrowRight: RIGHT, KeyD: RIGHT,
    }
    const onKey = (e: KeyboardEvent) => {
      const m = modeRef.current
      const onControl = e.target instanceof HTMLElement && !!e.target.closest("button, a")
      const d = dirFor[e.code]
      if (d) {
        e.preventDefault()
        if (m === "playing") engineRef.current?.setDir(d)
        return
      }
      switch (e.code) {
        case "Escape":
          e.preventDefault()
          if (m === "playing") pause()
          else if (m === "paused") resume()
          else onClose()
          break
        case "KeyP":
          if (m === "playing") pause()
          else if (m === "paused") resume()
          break
        case "KeyM":
          if (!e.repeat) toggleMute()
          break
        case "Space":
        case "Enter":
          if (onControl || e.repeat) return
          e.preventDefault()
          if (m === "start" || m === "over") play()
          else if (m === "complete") next()
          else if (m === "paused") resume()
          break
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [play, next, pause, resume, toggleMute, onClose])

  // Swipe on the maze
  const swipe = React.useRef<{ x: number; y: number } | null>(null)
  const onPointerDown = (e: React.PointerEvent) => { swipe.current = { x: e.clientX, y: e.clientY } }
  const onPointerMove = (e: React.PointerEvent) => {
    const s = swipe.current
    if (!s || modeRef.current !== "playing") return
    const dx = e.clientX - s.x, dy = e.clientY - s.y
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return
    engineRef.current?.setDir(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? RIGHT : LEFT) : dy > 0 ? DOWN : UP)
    swipe.current = { x: e.clientX, y: e.clientY }
  }
  const onPointerUp = () => { swipe.current = null }

  const dpad = (d: Dir, label: string, cls: string, glyph: string) => (
    <button
      type="button"
      className={`pa-dpad-btn ${cls}`}
      aria-label={label}
      onPointerDown={(e) => { e.preventDefault(); engineRef.current?.setDir(d) }}
    >
      {glyph}
    </button>
  )

  const backBtn = (cls = "pa-btn pa-btn--ghost") => (
    <button type="button" className={cls} onClick={onClose}>
      Back to website <span aria-hidden="true">→</span>
    </button>
  )

  const inGame = mode !== "start"

  return (
    <div
      ref={rootRef}
      className="pa-overlay"
      data-mode={mode}
      role="dialog"
      aria-modal="true"
      aria-label={`${GAME_TITLE} arcade game`}
      tabIndex={-1}
    >
      <div className="pa-bg" aria-hidden="true">
        <img className="pa-watermark" src={LOGO_SRC} alt="" />
        <svg className="pa-circuits" viewBox="0 0 1200 800" preserveAspectRatio="none">
          <path d="M0 120 H180 L240 180 H420 M0 300 H90 L150 240 H260" />
          <path d="M1200 90 H1010 L950 150 H820 M1200 260 H1100 L1050 310 H930" />
          <path d="M0 720 H120 L140 700 H200 V660 H240 V700 H320 L340 680 H420 V700 H520 M1200 720 H1080 V650 H1100 V620 H1110 V650 H1130 V720 H1000 L980 700 H880" />
          <circle cx="420" cy="180" r="4" /><circle cx="260" cy="240" r="4" /><circle cx="820" cy="150" r="4" /><circle cx="930" cy="310" r="4" />
        </svg>
      </div>

      <header className="pa-top">
        <div className="pa-brand">
          <img src={LOGO_SRC} alt="PDC dragon logo" />
          <div>
            <span className="pa-brand-title">PDC <span>· CFI</span></span>
            <span className="pa-brand-sub">IIT Madras</span>
          </div>
        </div>

        {inGame && (
          <dl className="pa-hud">
            <div><dt>Score</dt><dd><b ref={scoreRef}>{pad(0)}</b></dd></div>
            <div><dt>High</dt><dd>{pad(best)}</dd></div>
            <div><dt>Level</dt><dd>{String(level).padStart(2, "0")}</dd></div>
            <div className="pa-lives">
              <dt>Lives</dt>
              <dd aria-label={`${lives} lives`}>
                {Array.from({ length: 3 }, (_, i) => (
                  <SpriteImage key={i} kind="dragon" className={i < lives ? "" : "is-lost"} />
                ))}
              </dd>
            </div>
          </dl>
        )}

        <div className="pa-actions">
          <button
            type="button"
            className="pa-icon-btn"
            onClick={toggleMute}
            aria-pressed={muted}
            aria-label={muted ? "Unmute sound" : "Mute sound"}
            title={muted ? "Sound off (M)" : "Sound on (M)"}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11 5 6 9H2v6h4l5 4V5z" />
              {muted ? <path d="m22 9-6 6M16 9l6 6" /> : <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" />}
            </svg>
          </button>
          {mode === "playing" && (
            <button type="button" className="pa-icon-btn" onClick={pause} aria-label="Pause game" title="Pause (Esc)">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><rect x="5" y="4" width="5" height="16" /><rect x="14" y="4" width="5" height="16" /></svg>
            </button>
          )}
          <button type="button" className="pa-btn pa-btn--close" onClick={onClose}>
            Close game <span aria-hidden="true">✕</span>
          </button>
        </div>
      </header>

      <div
        ref={stageRef}
        className="pa-stage"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <canvas ref={canvasRef} className="pa-canvas" aria-hidden="true" />

        {mode === "start" && (
          <section className="pa-screen pa-start">
            <h2 className="pa-title">PDC <span>Circuit Chase</span></h2>
            <p className="pa-tagline">Collect · Design · Build · Repeat</p>
            <Marquee className="pa-marquee" />
            <ul className="pa-cast">
              {GHOSTS.map((g) => (
                <li key={g.id} style={{ "--c": g.color } as React.CSSProperties}>{g.name}</li>
              ))}
            </ul>
            <div className="pa-row">
              <button type="button" className="pa-btn pa-btn--primary" onClick={play}>
                <span aria-hidden="true">▶</span> Play game
              </button>
              {backBtn()}
            </div>
            <p className="pa-hint">
              <span className="pa-hint-key">Arrows / WASD to move · Esc to pause · M for sound</span>
              <span className="pa-hint-touch">Swipe or use the D-pad to move</span>
            </p>
            <p className="pa-legend">Pellet 10 · Bonus part 50 · Power cell 100 · Scared ghost 200+</p>
          </section>
        )}

        {mode === "paused" && (
          <section className="pa-screen pa-panel" aria-live="polite">
            <p className="pa-eyebrow">// System halted</p>
            <h2 className="pa-panel-title">Paused</h2>
            <div className="pa-row">
              <button type="button" className="pa-btn pa-btn--primary" onClick={resume}>Resume</button>
              <button type="button" className="pa-btn pa-btn--ghost" onClick={play}>Restart</button>
              {backBtn()}
            </div>
            <p className="pa-hint">Press Esc to resume</p>
          </section>
        )}

        {mode === "over" && (
          <section className="pa-screen pa-panel" role="alert">
            <SpriteImage kind="dead" className="pa-dead" />
            <h2 className="pa-panel-title">Prototype <span className="is-red">failed.</span></h2>
            <p className="pa-copy">Every great product starts with a few failures.</p>
            <dl className="pa-stats">
              <div><dt>Score</dt><dd>{final.score.toLocaleString()}</dd></div>
              <div><dt>High score</dt><dd>{best.toLocaleString()}{final.record && <em>New best</em>}</dd></div>
            </dl>
            <div className="pa-row">
              <button type="button" className="pa-btn pa-btn--primary" onClick={play}>
                Play again <span aria-hidden="true">↻</span>
              </button>
              {backBtn()}
            </div>
          </section>
        )}

        {mode === "complete" && (
          <section className="pa-screen pa-panel" role="alert">
            <p className="pa-eyebrow">// Level {String(level).padStart(2, "0")} shipped</p>
            <h2 className="pa-panel-title">Prototype <span>complete!</span></h2>
            <p className="pa-copy">Another idea successfully brought to life.</p>
            <dl className="pa-stats">
              <div><dt>Score</dt><dd>{final.score.toLocaleString()}</dd></div>
              <div><dt>High score</dt><dd>{best.toLocaleString()}{final.record && <em>New best</em>}</dd></div>
            </dl>
            <div className="pa-row">
              <button type="button" className="pa-btn pa-btn--primary" onClick={next}>
                Next level <span aria-hidden="true">→</span>
              </button>
              {backBtn()}
            </div>
          </section>
        )}
      </div>

      {mode === "playing" && (
        <div className="pa-dpad" aria-label="Direction controls">
          {dpad(UP, "Move up", "is-up", "▲")}
          {dpad(LEFT, "Move left", "is-left", "◀")}
          {dpad(DOWN, "Move down", "is-down", "▼")}
          {dpad(RIGHT, "Move right", "is-right", "▶")}
        </div>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Invite section (in the page, right after the "join PDC" banner)              */
/* -------------------------------------------------------------------------- */

export default function PdcArcade() {
  const [open, setOpen] = React.useState(false)
  const ctaRef = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    void document.fonts?.load('700 1em "Silkscreen"').catch(() => undefined)
  }, [])

  const close = React.useCallback(() => {
    setOpen(false)
    requestAnimationFrame(() => ctaRef.current?.focus({ preventScroll: true }))
  }, [])

  return (
    <>
      <section className="arcade-invite" aria-labelledby="arcade-invite-title">
        <div className="container">
          <div className="arcade-card">
            <div className="arcade-card-bg" aria-hidden="true">
              <img src={LOGO_SRC} alt="" />
            </div>
            <p className="arcade-label">The PDC Arcade</p>
            <h2 id="arcade-invite-title" className="arcade-heading">Done exploring?</h2>
            <p className="arcade-sub">Collect. Build. Design. Repeat.</p>
            <p className="arcade-copy">Before you leave, take a little detour into the world of PDC. Ready to play?</p>
            <Marquee className="arcade-marquee" active={!open} />
            <button ref={ctaRef} type="button" className="arcade-cta" onClick={() => setOpen(true)}>
              Play {GAME_TITLE} <span aria-hidden="true">→</span>
            </button>
            <p className="arcade-note">An arcade experience by Product Design Club, IIT Madras.</p>
          </div>
        </div>
      </section>
      {open && createPortal(<ArcadeOverlay onClose={close} />, document.body)}
    </>
  )
}
