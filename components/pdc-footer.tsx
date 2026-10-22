import HalftoneWordmarkFooter, { type FooterColumn } from "@/components/ui/halftone-wordmark-footer"

// Hex values the canvas can read; keep in sync with styles/globals.css.
const THEME = {
  background: "#090a0d",
  ink: "#f8fafc",
  warm: "#8DC63F",
}

const COLUMNS: FooterColumn[] = [
  {
    title: "Explore",
    links: [
      { label: "About", href: "#about" },
      { label: "Hardware", href: "#projects" },
      { label: "Methodology", href: "#process" },
      { label: "Competitions", href: "#competitions" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "DT Vault", href: "#vault" },
      { label: "Coord Archive", href: "#archive" },
      { label: "People", href: "#team" },
      { label: "Handbook", href: "#publications" },
    ],
  },
  {
    title: "Connect",
    links: [
      { label: "Instagram", href: "https://instagram.com/thepdc_iitm" },
      { label: "LinkedIn", href: "https://linkedin.com" },
      { label: "YouTube", href: "https://youtube.com" },
      { label: "pdc_cfi@smail.iitm.ac.in", href: "mailto:pdc_cfi@smail.iitm.ac.in" },
    ],
  },
]

export default function PdcFooter() {
  // w-full matters: a flex parent left at width:auto shrinks the canvas to 0px.
  return (
    <div className="w-full">
      <HalftoneWordmarkFooter
        wordmark="PDC"
        label="Product Design Club"
        meta="CFI · IIT Madras · Disruption.Starts.Here"
        palette={THEME}
        fontFamily="Syne, -apple-system, BlinkMacSystemFont, sans-serif"
        monoFamily="Oswald, 'Arial Narrow', sans-serif"
        columns={COLUMNS}
      />
    </div>
  )
}
