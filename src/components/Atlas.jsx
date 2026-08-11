import { useCallback, useMemo, useState } from 'react'
import Reveal from './Reveal.jsx'
import Viewport from '../three/Viewport.jsx'
import { AtlasScene } from '../three/scenes.jsx'
import { REGIONS, getPizza, ALL_PIZZAS } from '../data/menu.js'
import { useActiveSection } from '../hooks/useReveal.js'
import { useStore } from '../store.js'
import VegMark from './VegMark.jsx'
import { inr } from '../data/config.js'

const VEG_COUNT = ALL_PIZZAS.filter((p) => p.veg).length

function Spice({ level }) {
  if (!level) return null
  return (
    <span className="spice" aria-label={`Spice level ${level} of 3`}>
      {Array.from({ length: level }, (_, i) => (
        <i key={i} />
      ))}
    </span>
  )
}

export default function Atlas() {
  const [activeId, setActiveId] = useState(REGIONS[0].id)
  const [hoveredId, setHoveredId] = useState(null)
  const [vegOnly, setVegOnly] = useState(false)
  const addToBag = useStore((s) => s.addToBag)
  const openBag = useStore((s) => s.openBag)

  const region = useMemo(
    () => REGIONS.find((r) => r.id === activeId) ?? REGIONS[0],
    [activeId]
  )

  // Hovering a flavor previews it; otherwise the region's headline pie shows.
  const shown = useMemo(
    () => (hoveredId ? getPizza(hoveredId) : region.pizzas[0]),
    [hoveredId, region]
  )

  const onSection = useCallback((id) => {
    setActiveId(id)
    setHoveredId(null)
  }, [])

  useActiveSection('.chapter[data-section]', onSection)

  const shownRegion = useMemo(
    () => REGIONS.find((r) => r.pizzas.some((p) => p.id === shown.id)) ?? region,
    [shown, region]
  )

  const quickAdd = (pizzaId) => {
    addToBag({ pizzaId, size: 'pair', crust: 'classic', qty: 1 })
    openBag()
  }

  return (
    <section
      className="atlas"
      id="atlas"
      style={{ '--accent': region.accent, '--accent-soft': `${region.accent}14` }}
    >
      <div className="atlas__head">
        <span className="eyebrow reveal">The Atlas · 42 pies</span>
        <Reveal as="h2" className="atlas__title">
          Seven countries that
          <br />
          know what they&apos;re doing.
        </Reveal>

        <div className="atlas__filter reveal">
          <button
            type="button"
            className={`vegtoggle ${vegOnly ? 'is-on' : ''}`}
            role="switch"
            aria-checked={vegOnly}
            onClick={() => setVegOnly((v) => !v)}
          >
            <span className="vegtoggle__track" aria-hidden="true">
              <span className="vegtoggle__knob" />
            </span>
            Veg only
          </button>
          <span className="atlas__count mono num">
            {vegOnly ? VEG_COUNT : 42} pies
          </span>
        </div>
      </div>

      <div className="atlas__grid">
        <div className="atlas__stage">
          <Viewport className="atlas__view">
            <AtlasScene pizza={shown} />
          </Viewport>
          <div className="atlas__caption">
            <span className="atlas__caption-flag">{shownRegion.flag}</span>
            <span className="atlas__caption-name">{shown.name}</span>
            <span className="mono" style={{ color: 'var(--ink-40)' }}>
              {shownRegion.city}
            </span>
          </div>
        </div>

        <div className="atlas__chapters">
          {REGIONS.map((chapter) => (
            <article
              className="chapter"
              key={chapter.id}
              data-section={chapter.id}
              style={{ '--accent': chapter.accent }}
            >
              <header className="chapter__head">
                <div className="chapter__index">
                  {chapter.index} · {chapter.country}
                </div>
                <h3 className="chapter__title">
                  {chapter.headline} <span>— {chapter.city}</span>
                </h3>
                <p className="chapter__note">{chapter.note}</p>
              </header>

              <ul className="chapter__list">
                {chapter.pizzas
                  .filter((pizza) => !vegOnly || pizza.veg)
                  .map((pizza) => (
                  <li key={pizza.id}>
                    <div
                      className={`flavor ${shown.id === pizza.id ? 'is-active' : ''}`}
                      onMouseEnter={() => setHoveredId(pizza.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onFocus={() => setHoveredId(pizza.id)}
                      onBlur={() => setHoveredId(null)}
                    >
                      <div>
                        <span className="flavor__name">
                          <VegMark veg={pizza.veg} egg={pizza.egg} small />
                          {pizza.name}
                          <Spice level={pizza.spice} />
                        </span>
                        <span className="flavor__tag">{pizza.tagline}</span>
                      </div>

                      <span className="flavor__price num">{inr(pizza.price)}</span>

                      <button
                        type="button"
                        className="flavor__add"
                        onClick={() => quickAdd(pizza.id)}
                        aria-label={`Add ${pizza.name} to bag`}
                      >
                        +
                      </button>
                    </div>
                  </li>
                  ))}
                {vegOnly && chapter.pizzas.every((p) => !p.veg) && (
                  <li className="chapter__empty">
                    Nothing vegetarian in this chapter yet.
                  </li>
                )}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
