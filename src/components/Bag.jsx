import { useEffect } from 'react'
import PizzaO from './PizzaO.jsx'
import { useStore, selectBagCount, selectSubtotal, linePrice, lineItem, isDessert } from '../store.js'
import { useScrollLock } from '../hooks/useSmoothScroll.js'
import { SIZES, CRUSTS } from '../data/menu.js'
import { DELIVERY, inr, GST_NOTE, PAYMENTS, CONTACT } from '../data/config.js'
import VegMark from './VegMark.jsx'

export default function Bag() {
  const open = useStore((s) => s.bagOpen)
  const close = useStore((s) => s.closeBag)
  const bag = useStore((s) => s.bag)
  const bump = useStore((s) => s.bumpLine)
  const count = useStore(selectBagCount)
  const subtotal = useStore(selectSubtotal)

  useScrollLock(open)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

  const freeShipping = subtotal >= DELIVERY.freeAbove
  const shipping = !bag.length || freeShipping ? 0 : DELIVERY.fee
  const total = bag.length ? subtotal + shipping : 0
  const belowMin = bag.length > 0 && subtotal < DELIVERY.minOrder
  const toFree = Math.max(0, DELIVERY.freeAbove - subtotal)

  return (
    <>
      <div
        className={`scrim ${open ? 'is-open' : ''}`}
        onClick={close}
        aria-hidden="true"
      />

      <aside
        className={`bag ${open ? 'is-open' : ''}`}
        aria-hidden={!open}
        aria-label="Your bag"
      >
        <div className="bag__head">
          <h2 className="bag__title">
            Your bag
            {count > 0 && <span className="num"> ({count})</span>}
          </h2>
          <button type="button" className="bag__close" onClick={close}>
            Close
          </button>
        </div>

        <div className="bag__body">
          {bag.length === 0 ? (
            <div className="bag__empty">
              <PizzaO progress={0.25} counter="var(--paper)" />
              <p>Nothing in here yet.</p>
              <p className="mono">Seven countries are waiting.</p>
            </div>
          ) : (
            <ul>
              {bag.map((line, i) => {
                const pizza = lineItem(line.pizzaId)
                const size = SIZES.find((s) => s.id === line.size)
                const crust = CRUSTS.find((c) => c.id === line.crust)
                const sweet = isDessert(line.pizzaId)
                if (!pizza) return null
                return (
                  <li
                    key={line.id}
                    className="bag-line"
                    style={{ animationDelay: `${i * 45}ms` }}
                  >
                    <span
                      className="bag-line__chip"
                      style={{ '--accent-soft': `${pizza.accent}1a` }}
                    >
                      {sweet ? '🍰' : pizza.flag}
                    </span>

                    <div>
                      <div className="bag-line__name">
                        <VegMark veg={pizza.veg} egg={pizza.egg} small />
                        {pizza.name}
                      </div>
                      <div className="bag-line__meta">
                        {sweet ? 'Dessert · one size' : `${size?.label} ${size?.inches}" · ${crust?.label}`}
                      </div>
                    </div>

                    <div className="bag-line__right">
                      <span className="bag-line__price num">
                        {inr(linePrice(line) * line.qty)}
                      </span>
                      <span className="stepper">
                        <button
                          type="button"
                          onClick={() => bump(line.id, -1)}
                          aria-label={`Remove one ${pizza.name}`}
                        >
                          −
                        </button>
                        <span className="num">{line.qty}</span>
                        <button
                          type="button"
                          onClick={() => bump(line.id, 1)}
                          aria-label={`Add one ${pizza.name}`}
                        >
                          +
                        </button>
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="bag__foot">
          {bag.length > 0 && !freeShipping && (
            <p className="bag__nudge">
              Add <strong className="num">{inr(toFree)}</strong> more for free delivery.
            </p>
          )}

          <div className="bag__row">
            <span>Subtotal</span>
            <span className="num">{inr(subtotal)}</span>
          </div>
          <div className="bag__row">
            <span>Delivery</span>
            <span className="num">
              {!bag.length ? '—' : freeShipping ? 'Free' : inr(DELIVERY.fee)}
            </span>
          </div>
          <div className="bag__row bag__row--total">
            <span>Total</span>
            <span className="num">{inr(total)}</span>
          </div>

          {belowMin && (
            <p className="bag__warn">
              Minimum order is {inr(DELIVERY.minOrder)}.
            </p>
          )}

          <button type="button" className="btn btn--block" disabled={!bag.length || belowMin}>
            Checkout
          </button>

          <a className="btn btn--ghost btn--block" href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer">
            Order on WhatsApp
          </a>

          <p className="mono bag__fine">
            {GST_NOTE} · {PAYMENTS.join(' · ')}
          </p>
        </div>
      </aside>
    </>
  )
}
