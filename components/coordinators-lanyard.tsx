import TeamLanyardRail, { type LanyardMember } from "@/components/ui/team-lanyard-rail"

const CONTACT = { label: "Email", href: "mailto:pdc_cfi@smail.iitm.ac.in" }

type Coordinator = { slug: string; name: string; usp: string; energy: string; bugs: string; artifact: string }

// From the PDC "Coordinator 26-27" Instagram cards. Kanishk is card 5 and Shruti card 6; the rest keep the post order.
const PEOPLE: Coordinator[] = [
  { slug: "hermina", name: "Hermina", usp: "Curious, creative and always up for a side quest", energy: "Chocolate milkshakes, cookies and sitcoms", bugs: "Memoryspan of a goldfish", artifact: "Google Maps - the reason I'm not a long-lost wanderer yet!" },
  { slug: "kriyansh", name: "Kriyansh", usp: "Working hard (or hardly working) and spending most of my time sleeping and watching movies", energy: "Runs on ice cream and gobi manchurian from Zaitoon", bugs: "Hate 8 am classes", artifact: "Wrist watches - look cool and keep the time on your wrist" },
  { slug: "riddhi", name: "Riddhi", usp: "Can talk the whole day but still won't finish Death Note (been half a decade)", energy: "Any chicken dish in the campus (except what mess gives on Wednesday 💔)", bugs: "You'll see me anywhere except the mess, researches everything except what's needed", artifact: "Airfryerrr because healthy junk food (I'm trying to cope 😌)" },
  { slug: "govind", name: "Govind Srinivasan", usp: "Wicket-keeping all-rounder in cricket, works hard, debates harder", energy: "Any dessert (not sugary) and paneer", bugs: "Procrastination", artifact: "The Nintendo Wii - it is innovative, a massive success and loads of fun" },
  { slug: "kanishk", name: "Kanishk", usp: "Works hard (vibe coder) and party's harder (drunk calls everyone)", energy: "Ice creams, chocolates, Amul doodh (I don't like Nandini)", bugs: "Perfectionist", artifact: "Football - who thought kicking around a ball would be so fun!" },
  { slug: "shruti", name: "Shruti", usp: "Chronically curious, constructively chaotic", energy: "Runs on ginger chai, KitKat bars and blasting a Taylor Swift playlist", bugs: "Opens 10 tabs for a minor task and never closes them", artifact: "Ships (navarch bias?) and airplanes - fly or float and explore the world" },
  { slug: "stuti", name: "Stuti Goyal", usp: "To give anything less than my best is injustice to myself", energy: "Dance! Moving to the beat recharges my battery and clears my mind", bugs: "Aiming for perfection even when it's not required", artifact: "Book: no electricity, infinite battery life and builds your imagination" },
  { slug: "tanmay", name: "Tanmay", usp: "I question everything except my Spotify playlist", energy: "Adrak vaali chai (I wish I could get a good one in insti 🥲)", bugs: "Sleepy 20*7", artifact: "Smartphone, because of the convenience it brings with almost everything" },
  { slug: "abhinav", name: "Abhinav Rastogi", usp: "Interested in puzzles, curious about science, tech, people and everything else", energy: "CCD coffee", bugs: "Dependent on reminders to get something done", artifact: "Noise-cancelling headphones, because why not" },
]

const COORDINATORS: LanyardMember[] = PEOPLE.map((p) => ({
  id: `coordinator-${p.slug}`,
  name: p.name,
  role: "Coordinator 26-27",
  team: "PDC · CFI IITM",
  image: `assets/coordinators/${p.slug}.jpg`,
  bio: p.usp,
  facts: [
    { label: "Source of energy", value: p.energy },
    { label: "Known bugs", value: p.bugs },
    { label: "Favourite artifact", value: p.artifact },
  ],
  links: [CONTACT],
}))

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
