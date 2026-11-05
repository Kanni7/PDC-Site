import TeamLanyardRail, { type LanyardMember } from "@/components/ui/team-lanyard-rail"

const CONTACT = { label: "Email", href: "mailto:pdc_cfi@smail.iitm.ac.in" }

// Focus areas carried over from the old coordinator cards; the rest are still to be filled in.
const FOCUS: Record<number, string> = {
  0: "Design Thinking & Ops",
  1: "CAD / CAE & DFMA",
}

// Nine coordinators. Photos are left empty for now, so each badge shows the silhouette.
const COORDINATORS: LanyardMember[] = Array.from({ length: 9 }, (_, i) => {
  const n = String(i + 1).padStart(2, "0")
  return {
    id: `coordinator-${n}`,
    name: `Coordinator ${n}`,
    role: "Coordinator",
    team: "PDC · CFI IITM",
    image: "",
    bio: "Bio coming soon: focus area, current projects and what to ask them about.",
    tags: FOCUS[i] ? ["3rd Year", FOCUS[i]] : ["3rd Year"],
    links: [CONTACT],
  }
})

// The rail breaks out of the 1200px page container (up to 1680px) so the nine badges can hang larger.
const WIDE = "min(calc(100vw - 32px), 1680px)"

export default function CoordinatorsLanyard() {
  return (
    <div
      className="dark"
      style={{
        width: WIDE,
        marginLeft: `calc(50% - ${WIDE} / 2)`,
        fontFamily: "var(--font-small)",
        fontVariationSettings: "'opsz' 32",
      }}
    >
      <TeamLanyardRail
        items={COORDINATORS}
        caption="Hover a badge to bring it forward · click to flip it"
        className="rounded-2xl border border-border py-6"
      />
    </div>
  )
}
