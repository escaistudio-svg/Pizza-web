import Loader from './components/Loader.jsx'
import Nav from './components/Nav.jsx'
import Hero from './components/Hero.jsx'
import Ticker from './components/Ticker.jsx'
import Ethos from './components/Ethos.jsx'
import Atlas from './components/Atlas.jsx'
import Studio from './components/Studio.jsx'
import Footer from './components/Footer.jsx'
import Bag from './components/Bag.jsx'
import { useStore } from './store.js'
import { useSmoothScroll } from './hooks/useSmoothScroll.js'
import { useReveal } from './hooks/useReveal.js'

export default function App() {
  const loaded = useStore((s) => s.loaded)

  // Smooth scroll and reveals both wait for the loader so the first frame of
  // the site is the one the loader wipes away from.
  useSmoothScroll(loaded)
  useReveal(loaded)

  return (
    <>
      <Loader />
      <Nav />

      <main>
        <Hero />
        <Ticker />
        <Ethos />
        <Atlas />
        <Studio />
      </main>

      <Footer />
      <Bag />
    </>
  )
}
