import TiltedGridHero, { type TiltedGridItem } from "@/components/ui/tilted-grid-hero"

const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=70`

// Same six resources as the vault cards in index.html.
const RESOURCES: TiltedGridItem[] = [
  {
    src: unsplash("1552664730-d307ca884978"),
    alt: "Team mapping ideas with sticky notes on a wall",
    href: "https://dschool.stanford.edu/resources/design-thinking-bootleg",
    eyebrow: "Stanford d.school",
    title: "Design Thinking Bootleg",
  },
  {
    src: unsplash("1531403009284-440f080d1e12"),
    alt: "Hand pointing at a journey map pinned to a whiteboard",
    href: "https://www.designkit.org/methods.html",
    eyebrow: "IDEO.org",
    title: "Human-Centered Design Field Guide",
  },
  {
    src: unsplash("1545454675-3531b543be5d"),
    alt: "Minimal bookshelf speaker against a teal wall",
    href: "https://www.vitsoe.com/us/about/good-design",
    eyebrow: "Dieter Rams",
    title: "Ten Principles for Good Design",
  },
  {
    src: unsplash("1581291518857-4e27b48ff24e"),
    alt: "Hand sketching mobile UI wireframes on paper",
    href: "https://lawsofux.com/",
    eyebrow: "Jon Yablonski",
    title: "Laws of UX",
  },
  {
    src: unsplash("1586023492125-27b2c045efd7"),
    alt: "Yellow armchair and floor lamp in a plain room",
    href: "https://jnd.org/",
    eyebrow: "Don Norman",
    title: "The Design of Everyday Things",
  },
  {
    src: unsplash("1581092160562-40aa08e78837"),
    alt: "Engineer reviewing technical drawings beside a toolbox",
    href: "https://ocw.mit.edu/courses/2-007-design-and-manufacturing-i-spring-2009/",
    eyebrow: "MIT OpenCourseWare",
    title: "2.007: Design & Manufacturing I",
  },
]

export default function VaultHero() {
  return (
    <TiltedGridHero
      items={RESOURCES}
      eyebrow={
        <>
          <span className="bg-pdc-green px-2 py-1 text-canvas">004</span>
          <span className="px-2 py-1">Resource Vault</span>
        </>
      }
      title={
        <>
          <span className="block">Curated Design</span>
          <mark className="mt-[0.14em] inline-block bg-pdc-green px-[0.12em] pt-[0.04em] leading-[0.92] text-canvas">
            Resources
          </mark>
        </>
      }
      description="Hover to pause the ring. Click any frame to open the resource."
    />
  )
}
