import { createRoot } from "react-dom/client"
import "@/styles/globals.css"
import PdcFooter from "@/components/pdc-footer"
import HeroWordmark from "@/components/hero-wordmark"
import VaultHero from "@/components/vault-hero"

// The page itself is still the HTML blueprint; React renders a few islands into it.
const islands: [string, () => JSX.Element][] = [
  ["hero-wordmark", HeroWordmark],
  ["vault-hero", VaultHero],
  ["pdc-footer", PdcFooter],
]

for (const [id, Island] of islands) {
  const mount = document.getElementById(id)
  if (mount) createRoot(mount).render(<Island />)
}
