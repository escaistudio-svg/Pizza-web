import { ORDER_MODES } from '../data/menu.js'
import { useStore } from '../store.js'

/**
 * Delivery / Takeaway / Dine-in.
 *
 * The first choice on any Indian food site, and it changes what the rest of
 * the page should even ask you — a takeaway order has no pincode to check and
 * no delivery fee. Everything downstream reads `orderMode` from the store.
 */
export default function OrderMode({ compact = false }) {
  const mode = useStore((s) => s.orderMode)
  const setMode = useStore((s) => s.setOrderMode)
  const activeIndex = Math.max(0, ORDER_MODES.findIndex((m) => m.id === mode))
  const active = ORDER_MODES[activeIndex]

  return (
    <div className={`modes ${compact ? 'modes--compact' : ''}`}>
      <div
        className="modes__switch"
        style={{ '--count': ORDER_MODES.length, '--active': activeIndex }}
        role="radiogroup"
        aria-label="How would you like your order?"
      >
        <span className="modes__pill" aria-hidden="true" />
        {ORDER_MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={m.id === mode}
            className={`modes__btn ${m.id === mode ? 'is-active' : ''}`}
            onClick={() => setMode(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>

      {!compact && (
        <p className="modes__blurb">
          {active.blurb}
          <span className="modes__eta">{active.eta}</span>
        </p>
      )}
    </div>
  )
}
