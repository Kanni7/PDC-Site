import { createRoot } from "react-dom/client"
import "@/styles/globals.css"
import PdcFooter from "@/components/pdc-footer"
import HeroWordmark from "@/components/hero-wordmark"
import VaultHero from "@/components/vault-hero"
import PdcRunner from "@/components/pdc-runner"
import PdcArcade from "@/components/pdc-arcade"

// The page itself is still the HTML blueprint; React renders a few islands into it.
const islands: [string, () => JSX.Element][] = [
  ["hero-wordmark", HeroWordmark],
  ["vault-hero", VaultHero],
  ["pdc-arcade", PdcArcade],
  ["pdc-footer", PdcFooter],
]

// Mount the PDC Runner entry experience once at the document level so ordinary island rerenders or
// future route changes cannot restart it or cover only one section of the page.
const introMount = document.createElement("div")
introMount.id = "pdc-runner-root"
document.body.prepend(introMount)
createRoot(introMount).render(<PdcRunner />)

for (const [id, Island] of islands) {
  const mount = document.getElementById(id)
  if (mount) createRoot(mount).render(<Island />)
}
