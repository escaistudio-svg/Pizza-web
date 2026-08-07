import { useCallback, useMemo } from 'react'
import Viewport from '../three/Viewport.jsx'
import { StudioScene } from '../three/scenes.jsx'
import SwapText from './SwapText.jsx'
import { SIGNATURES, SIGNATURE_IDS, SIZES, CRUSTS, getPizza } from '../data/menu.js'
import { useStore } from '../store.js'

/** Sliding-pill segmented control. Equal-width cells, so no measuring needed. */
function Segmented({ options, value, onChange, label, hint }) {
  const activeIndex = Math.max(
    0,
    options.findIndex((o) => o.id === value)
  )
  const active = options[activeIndex]

  return (
    <div className="opts">
      <div className="opts__label">
        <span>{label}</span>
        {hint && <span>{hint}</span>}
      </div>

      <div
        className="seg"
        style={{ '--count': options.length, '--active': activeIndex }}
        role="radiogroup"
        aria-label={label}
      >
        <span className="seg__pill" aria-hidden="true" />
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={option.id === value}
            className={`seg__btn ${option.id === value ? 'is-active' : ''}`}
            onClick={() => onChange(option.id)}
          >
            {option.label}
            {option.inches ? <span className="num">{` ${option.inches}"`}</span> : null}
          </button>
        ))}
      </div>

      <p className="opts__note">{active?.note}</p>
    </div>
  )
}

export default function Studio() {
  const flavorId = useStore((s) => s.flavorId)
  const setFlavor = useStore((s) => s.setFlavor)
  const stepFlavor = useStore((s) => s.stepFlavor)
  const size = useStore((s) => s.size)
  const setSize = useStore((s) => s.setSize)
  const crust = useStore((s) => s.crust)
  const setCrust = useStore((s) => s.setCrust)
  const qty = useStore((s) => s.qty)
  const setQty = useStore((s) => s.setQty)
  const addToBag = useStore((s) => s.addToBag)
  const openBag = useStore((s) => s.openBag)

  const pizza = useMemo(() => getPizza(flavorId) ?? SIGNATURES[0], [flavorId])
  const activeIndex = SIGNATURE_IDS.indexOf(flavorId)

  const price = useMemo(() => {
    const s = SIZES.find((x) => x.id === size)
    const c = CRUSTS.find((x) => x.id === crust)
    return pizza.price * (s?.mult ?? 1) + (c?.add ?? 0)
  }, [pizza, size, crust])

  // ← / → cycle flavors while the studio has focus.
  const onKeyDown = useCallback(
    (e) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        stepFlavor(1)
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        stepFlavor(-1)
      }
    },
    [stepFlavor]
  )

  const add = () => {
    addToBag({ pizzaId: flavorId, size, crust, qty })
    openBag()
  }

  return (
    <section
      className="studio"
      id="studio"
      style={{ '--accent': pizza.accent }}
      onKeyDown={onKeyDown}
    >
      <div className="studio__glow" aria-hidden="true" />

      <div className="studio__inner">
        <div className="studio__head">
          <div>
            <span className="eyebrow" style={{ color: 'var(--ink-40)' }}>
              The Studio
            </span>
            <h2 className="studio__kicker">Build your pie.</h2>
          </div>
          <p className="mono" style={{ color: 'var(--ink-40)' }}>
            Seven signatures — one from each country
          </p>
        </div>

        <div className="studio__grid">
          <div className="studio__stage">
            <Viewport fill>
              <StudioScene pizza={pizza} />
            </Viewport>
            <span key={flavorId} className="studio__pulse is-firing" aria-hidden="true" />
          </div>

          <div className="studio__panel">
            <div
              className="rail"
              style={{ '--active': activeIndex }}
              role="tablist"
              aria-label="Choose a signature"
            >
              <span className="rail__indicator" aria-hidden="true" />
              {SIGNATURES.map((sig) => (
                <button
                  key={sig.id}
                  type="button"
                  role="tab"
                  aria-selected={sig.id === flavorId}
                  className={`rail__chip ${sig.id === flavorId ? 'is-active' : ''}`}
                  onClick={() => setFlavor(sig.id)}
                  title={`${sig.name} — ${sig.country}`}
                >
                  <span>{sig.flag}</span>
                </button>
              ))}
            </div>

            <div>
              <div className="studio__origin">
                {pizza.city}, {pizza.country}
                {pizza.spice > 0 && (
                  <span className="spice">
                    {Array.from({ length: pizza.spice }, (_, i) => (
                      <i key={i} style={{ background: 'currentColor' }} />
                    ))}
                  </span>
                )}
              </div>
              <SwapText text={pizza.name} className="swap" />
              <p className="studio__tagline">{pizza.tagline}</p>
            </div>

            <Segmented
              label="Size"
              options={SIZES}
              value={size}
              onChange={setSize}
              hint={`${SIZES.find((s) => s.id === size)?.inches}"`}
            />

            <Segmented label="Crust" options={CRUSTS} value={crust} onChange={setCrust} />

            <div className="studio__foot">
              <span className="stepper">
                <button type="button" onClick={() => setQty(qty - 1)} aria-label="One fewer">
                  −
                </button>
                <span className="num">{qty}</span>
                <button type="button" onClick={() => setQty(qty + 1)} aria-label="One more">
                  +
                </button>
              </span>

              <button type="button" className="btn btn--block" onClick={add}>
                Add to bag
                <span className="studio__price num">${(price * qty).toFixed(2)}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
