import { useEffect } from 'react'
import PizzaO from './PizzaO.jsx'
import { useStore, selectBagCount, selectSubtotal, linePrice } from '../store.js'
import { useScrollLock } from '../hooks/useSmoothScroll.js'
import { getPizza, SIZES, CRUSTS } from '../data/menu.js'

const DELIVERY = 6

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

  const total = bag.length ? subtotal + DELIVERY : 0

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
                const pizza = getPizza(line.pizzaId)
                const size = SIZES.find((s) => s.id === line.size)
                const crust = CRUSTS.find((c) => c.id === line.crust)
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
                      {pizza.flag}
                    </span>

                    <div>
                      <div className="bag-line__name">{pizza.name}</div>
                      <div className="bag-line__meta">
                        {size?.label} {size?.inches}" · {crust?.label}
                      </div>
                    </div>

                    <div className="bag-line__right">
                      <span className="bag-line__price num">
                        ${(linePrice(line) * line.qty).toFixed(2)}
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
          <div className="bag__row">
            <span>Subtotal</span>
            <span className="num">${subtotal.toFixed(2)}</span>
          </div>
          <div className="bag__row">
            <span>Delivery — within 4 miles</span>
            <span className="num">{bag.length ? `$${DELIVERY.toFixed(2)}` : '—'}</span>
          </div>
          <div className="bag__row bag__row--total">
            <span>Total</span>
            <span className="num">${total.toFixed(2)}</span>
          </div>
          <button type="button" className="btn btn--block" disabled={!bag.length}>
            Checkout
          </button>
          <p className="mono" style={{ color: 'var(--ink-40)', textAlign: 'center' }}>
            Fired to order · 25–35 min
          </p>
        </div>
      </aside>
    </>
  )
}
