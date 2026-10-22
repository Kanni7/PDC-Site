"use client"

// Tilted Grid Hero — a row of images set on the inside of a cylinder, so the
// frame in the centre sits flat and far away while its neighbours curve in
// toward the viewer and fade out at the edges. The ring turns right to left
// on its own, eases to a stop under the pointer, and holds still for
// prefers-reduced-motion. Pure CSS 3D: one perspective, one preserve-3d ring.

import * as React from "react"
import { cn } from "@/lib/utils"

export interface TiltedGridItem {
  src: string
  alt: string
  href?: string
  /** Small mono line over the image, e.g. the source. */
  eyebrow?: string
  /** Caption set over the image. */
  title?: string
}

export interface TiltedGridHeroProps {
  items: TiltedGridItem[]
  eyebrow?: React.ReactNode
  title?: React.ReactNode
  description?: React.ReactNode
  /** Degrees per second the ring turns, right to left. Defaults to 5. */
  speed?: number
  /** Degrees between neighbouring frames. Defaults to 34. */
  spacing?: number
  className?: string
}

// A frame is fully visible inside FADE_START degrees and gone by FADE_END.
const FADE_START = 56
const FADE_END = 80

export default function TiltedGridHero({
  items,
  eyebrow,
  title,
  description,
  speed = 5,
  spacing = 34,
  className,
}: TiltedGridHeroProps) {
  const sceneRef = React.useRef<HTMLDivElement>(null)
  const ringRef = React.useRef<HTMLDivElement>(null)
  const itemRefs = React.useRef<(HTMLAnchorElement | null)[]>([])

  React.useEffect(() => {
    const scene = sceneRef.current
    const ring = ringRef.current
    if (!scene || !ring || items.length === 0) return

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    // The ring must span past both fade edges, or frames would wrap in view.
    const step = Math.max(spacing, (2 * FADE_END) / items.length)
    const span = step * items.length
    let radius = 960
    let offset = span / 2
    let rate = reduced ? 0 : speed
    let target = rate
    let raf = 0
    let last = 0
    let visible = true

    const layout = () => {
      const w = scene.clientWidth
      // Projected positions depend only on the perspective (x = p·tanθ), so it sets the scale.
      const perspective = Math.min(760, w * (w < 640 ? 1.15 : 0.42))
      radius = perspective * 1.6
      const cardW = radius * ((step * Math.PI) / 180) * 0.95
      const cardH = cardW * 0.62
      scene.style.perspective = `${perspective}px`
      scene.style.height = `${Math.round(perspective * 0.74)}px`
      ring.style.transform = `translateZ(${perspective}px)`
      ring.style.setProperty("--tgh-w", `${cardW}px`)
      ring.style.setProperty("--tgh-h", `${cardH}px`)
      ring.style.setProperty("--tgh-fs", `${cardW / 24}px`)
    }

    const place = () => {
      itemRefs.current.forEach((el, i) => {
        if (!el) return
        const theta = ((((i * step + offset) % span) + span) % span) - span / 2
        const away = Math.abs(theta)
        const fade = Math.min(1, Math.max(0, (FADE_END - away) / (FADE_END - FADE_START)))
        el.style.transform = `rotateY(${theta}deg) translateZ(${-radius}px)`
        el.style.opacity = String(fade)
        el.style.visibility = fade > 0 ? "visible" : "hidden"
        el.style.setProperty("--tgh-shade", String(Math.min(0.55, away / 110)))
      })
    }

    const loop = (now: number) => {
      raf = 0
      if (!visible) return
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0
      last = now
      rate += (target - rate) * Math.min(1, dt * 4)
      offset += rate * dt
      place()
      raf = requestAnimationFrame(loop)
    }
    const start = () => {
      if (!raf && visible && !reduced) {
        last = 0
        raf = requestAnimationFrame(loop)
      }
    }

    const onEnter = () => {
      target = 0
    }
    const onLeave = () => {
      target = reduced ? 0 : speed
    }

    layout()
    place()
    start()

    scene.addEventListener("pointerenter", onEnter)
    scene.addEventListener("pointerleave", onLeave)
    const ro = new ResizeObserver(() => {
      layout()
      place()
    })
    ro.observe(scene)
    const io = new IntersectionObserver((entries) => {
      visible = entries[0] ? entries[0].isIntersecting : true
      if (visible) start()
    })
    io.observe(scene)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      scene.removeEventListener("pointerenter", onEnter)
      scene.removeEventListener("pointerleave", onLeave)
    }
  }, [items, speed, spacing])

  return (
    <div className={cn("relative w-full overflow-hidden", className)}>
      {(eyebrow || title) && (
        <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center gap-5 px-6 text-center">
          {eyebrow && (
            <span className="inline-flex items-stretch border-2 border-ink font-brutal-mono text-[0.72rem] font-bold uppercase tracking-[0.08em] text-ink">
              {eyebrow}
            </span>
          )}
          {title && (
            <h2 className="font-brutal text-[clamp(2.6rem,6.6vw,5.8rem)] font-black uppercase leading-[0.86] tracking-[-0.035em] text-ink [font-stretch:112%]">
              {title}
            </h2>
          )}
        </div>
      )}

      <div className="[mask-image:linear-gradient(90deg,transparent,#000_14%,#000_86%,transparent)]">
        <div ref={sceneRef} className="relative" style={{ perspective: "600px", height: "440px" }}>
          <div ref={ringRef} className="absolute left-1/2 top-1/2 h-0 w-0 [transform-style:preserve-3d]">
            {items.map((item, i) => {
              const external = item.href?.startsWith("http")
              return (
                <a
                  key={item.src + i}
                  ref={(el) => {
                    itemRefs.current[i] = el
                  }}
                  href={item.href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noopener noreferrer" : undefined}
                  className="group absolute overflow-hidden rounded-none border-[0.14em] border-ink/80 bg-surface no-underline [backface-visibility:hidden] will-change-transform"
                  style={{
                    width: "var(--tgh-w)",
                    height: "var(--tgh-h)",
                    left: "calc(var(--tgh-w) / -2)",
                    top: "calc(var(--tgh-h) / -2)",
                    fontSize: "var(--tgh-fs)",
                  }}
                >
                  <img
                    src={item.src}
                    alt={item.alt}
                    loading="lazy"
                    draggable={false}
                    className="absolute inset-0 h-full w-full object-cover brightness-80 saturate-80 transition duration-500 group-hover:scale-[1.04] group-hover:brightness-100 group-hover:saturate-100"
                  />
                  <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,10,13,0)_40%,rgba(9,10,13,0.88)_100%)]" />
                  <span className="absolute inset-0 bg-canvas" style={{ opacity: "var(--tgh-shade, 0)" }} />
                  {(item.eyebrow || item.title) && (
                    <span className="absolute inset-x-0 bottom-0 flex flex-col gap-[0.35em] p-[1.1em] text-left">
                      {item.eyebrow && (
                        <span className="self-start bg-pdc-green px-[0.5em] py-[0.15em] font-body text-[0.62em] font-bold uppercase tracking-[0.06em] text-canvas">
                          {item.eyebrow}
                        </span>
                      )}
                      {item.title && (
                        <span className="font-brutal text-[1.25em] font-extrabold uppercase leading-[0.95] tracking-[-0.02em] text-ink [font-stretch:108%]">
                          {item.title} <span className="text-ink-muted transition group-hover:text-pdc-green">↗</span>
                        </span>
                      )}
                    </span>
                  )}
                </a>
              )
            })}
          </div>
        </div>
      </div>

      {description && (
        <p className="relative z-10 mx-auto max-w-lg px-6 text-center font-body text-[0.78rem] uppercase leading-relaxed tracking-[0.04em] text-ink-muted">
          {description}
        </p>
      )}
    </div>
  )
}
