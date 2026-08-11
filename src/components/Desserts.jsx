import { useMemo, useState } from 'react'
import Viewport from '../three/Viewport.jsx'
import { DessertScene } from '../three/scenes.jsx'
import Reveal from './Reveal.jsx'
import VegMark from './VegMark.jsx'
import SwapText from './SwapText.jsx'
import { DESSERTS } from '../data/menu.js'
import { inr } from '../data/config.js'
import { useStore } from '../store.js'

/**
 * The sweet half of the menu.
 *
 * These are modelled as real desserts rather than sweet pizzas — see
 * src/three/Dessert.jsx. Each rides a banked orbit so it travels through the
 * scene instead of spinning on the spot.
 */
export default function Desserts() {
  const [index, setIndex] = useState(0)
  const addToBag = useStore((s) => s.addToBag)
  const openBag = useStore((s) => s.openBag)

  const dessert = DESSERTS[index]
  const accent = dessert.accent

  const step = (dir) =>
    setIndex((i) => (i + dir + DESSERTS.length) % DESSERTS.length)

  const add = (d) => {
    addToBag({ pizzaId: d.id, size: 'solo', crust: 'classic', qty: 1 })
    openBag()
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      step(1)
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      step(-1)
    }
  }

  const counter = useMemo(
    () => `${String(index + 1).padStart(2, '0')} / ${String(DESSERTS.length).padStart(2, '0')}`,
    [index]
  )

  return (
    <section
      className="sweet"
      id="desserts"
      style={{ '--accent': accent }}
      onKeyDown={onKeyDown}
    >
      <div className="shell">
        <div className="sweet__head">
          <div>
            <span className="eyebrow">Something sweet</span>
            <Reveal as="h2" className="sweet__title">
              Then something
              <br />
              sweet.
            </Reveal>
          </div>
          <p className="sweet__note reveal">
            Five, made in the same kitchen. The lava cake goes back in the oven
            to order, so give it eight minutes.
          </p>
        </div>

        <div className="sweet__grid">
          <div className="sweet__stage">
            <Viewport fill>
              <DessertScene dessert={dessert} />
            </Viewport>
          </div>

          <div className="sweet__panel">
            <div className="sweet__meta">
              <VegMark veg={dessert.veg} egg={dessert.egg} />
              <span className="mono sweet__counter num">{counter}</span>
            </div>

            <SwapText text={dessert.name} className="swap swap--sweet" />
            <p className="sweet__tagline">{dessert.tagline}</p>

            <div className="sweet__actions">
              <span className="sweet__price num">{inr(dessert.price)}</span>
              <button type="button" className="btn" onClick={() => add(dessert)}>
                Add to bag
              </button>
            </div>

            <div className="sweet__nav">
              <button
                type="button"
                className="sweet__arrow"
                onClick={() => step(-1)}
                aria-label="Previous dessert"
              >
                ←
              </button>
              <button
                type="button"
                className="sweet__arrow"
                onClick={() => step(1)}
                aria-label="Next dessert"
              >
                →
              </button>
            </div>
          </div>
        </div>

        <ul className="sweet__list" role="tablist" aria-label="Desserts">
          {DESSERTS.map((d, i) => (
            <li key={d.id}>
              <button
                type="button"
                role="tab"
                aria-selected={i === index}
                className={`sweet__chip ${i === index ? 'is-active' : ''}`}
                onClick={() => setIndex(i)}
              >
                <VegMark veg={d.veg} egg={d.egg} small />
                <span className="sweet__chip-name">{d.name}</span>
                <span className="sweet__chip-price num">{inr(d.price)}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
