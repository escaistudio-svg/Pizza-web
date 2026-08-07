import Reveal from './Reveal.jsx'
import Viewport from '../three/Viewport.jsx'
import { HeroScene } from '../three/scenes.jsx'
import { getPizza } from '../data/menu.js'

const HERO_PIZZA = getPizza('margherita-dop')

export default function Hero() {
  return (
    <section className="hero" id="top">
      <Viewport className="hero__stage" eager>
        <HeroScene pizza={HERO_PIZZA} />
      </Viewport>

      <div className="hero__type">
        <span className="eyebrow hero__eyebrow reveal">Flourchild · a personal pizza studio</span>

        <p className="hero__badge reveal" style={{ '--reveal-delay': '0.15s' }}>
          Napoli, Brooklyn, Tokyo, CDMX,
          <br />
          Stockholm, São Paulo, Mumbai.
        </p>

        <Reveal as="h1" className="hero__line hero__line--a">
          Seven pies.
        </Reveal>

        <div className="hero__foot">
          <p className="lede reveal" style={{ '--reveal-delay': '0.35s' }}>
            One oven. Fired at 480°, ninety seconds, no exceptions.
          </p>
          <a href="#atlas" className="hero__scroll mono reveal" style={{ '--reveal-delay': '0.5s' }}>
            <span className="hero__scroll-line" />
            Scroll
          </a>
        </div>

        <Reveal as="h2" className="hero__line hero__line--b" delay={0.18}>
          Seven <em>countries.</em>
        </Reveal>
      </div>
    </section>
  )
}
