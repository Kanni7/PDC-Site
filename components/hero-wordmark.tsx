import * as React from "react"
import TechText from "@/components/ui/tech-text"

// Hex the canvas can read; keep in sync with styles/globals.css.
const ACCENT = "#9ee63e"

// Lines run the width of .container, not the narrower .hero-content, and shift
// left by the 5% inset TechText keeps on left-aligned text so the letters stay
// flush with the badge above. 1.2em leaves room for the frame labels and specks;
// the -0.1em overlap pulls the lines back towards the old 0.98 line-height.
const SPAN = "min(1152px, calc(100vw - 48px))"
const LINE: React.CSSProperties = {
  width: SPAN,
  height: "1.2em",
  marginLeft: `calc(${SPAN} * -0.05)`,
  marginBottom: "-0.1em",
}

const LINES = [
  { text: "PRODUCT", className: "text-ink" },
  { text: "DESIGN", className: "text-ink" },
  { text: "CLUB", className: "text-pdc-green drop-shadow-[0_0_18px_rgba(141,198,63,0.45)]" },
]

// Renders into the hero <h1>, whose clamp() font-size sets each line's size.
export default function HeroWordmark() {
  const ref = React.useRef<HTMLDivElement>(null)
  const [fontSize, setFontSize] = React.useState(96)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setFontSize(parseFloat(getComputedStyle(el).fontSize))
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  return (
    <div ref={ref}>
      {LINES.map((line) => (
        <TechText
          key={line.text}
          text={line.text}
          fontWeight={800}
          fontSize={fontSize}
          letterSpacing={-0.04}
          align="left"
          accentColor={ACCENT}
          reveal="letter"
          sweep={false}
          className={line.className}
          style={LINE}
        />
      ))}
    </div>
  )
}
