import { useRef, useState } from 'react'
import { checkPincode, DELIVERY, inr, OUTLET, storeStatus } from '../data/config.js'
import { ORDER_MODES } from '../data/menu.js'
import { useStore } from '../store.js'
import OrderMode from './OrderMode.jsx'

/**
 * "Do you deliver to me?" — the first question anyone actually has.
 *
 * Answers with a real ETA per hub rather than a flat promise, and stays useful
 * when the answer is no: an out-of-zone Mumbai pincode gets a warmer reply than
 * an out-of-city one.
 */
export default function Serviceability() {
  const [value, setValue] = useState('')
  const [result, setResult] = useState(null)
  const inputRef = useRef(null)
  const status = storeStatus()
  const mode = useStore((s) => s.orderMode)
  const modeInfo = ORDER_MODES.find((m) => m.id === mode) ?? ORDER_MODES[0]

  const submit = (e) => {
    e.preventDefault()
    setResult(checkPincode(value))
  }

  const onChange = (e) => {
    // Pincodes are digits only; strip anything pasted in.
    const next = e.target.value.replace(/\D/g, '').slice(0, 6)
    setValue(next)
    if (result) setResult(null)
  }

  return (
    <section className="serve" id="delivery">
      <div className="shell serve__grid">
        <div className="serve__intro">
          <span className="eyebrow reveal">Delivery</span>
          <h2 className="serve__title reveal">
            {modeInfo.needsPincode ? 'Are we in your neighbourhood?' : 'Come and get it.'}
          </h2>

          <OrderMode />
          <p className="serve__hours reveal">
            <span className={`dot ${status.open ? 'dot--open' : 'dot--shut'}`} aria-hidden="true" />
            {status.label}
            {status.open && status.until ? ` · till ${status.until}` : ''}
            <span className="serve__sep">·</span>
            {OUTLET.line2}
          </p>
        </div>

        {modeInfo.needsPincode ? (
        <form className="serve__form reveal" onSubmit={submit}>
          <div className="pinbox">
            <label htmlFor="pincode" className="pinbox__label">
              Pincode
            </label>
            <input
              id="pincode"
              ref={inputRef}
              className="pinbox__input num"
              type="text"
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="400050"
              maxLength={6}
              value={value}
              onChange={onChange}
              aria-describedby="pincode-result"
            />
            <button type="submit" className="btn pinbox__go" disabled={value.length !== 6}>
              Check
            </button>
          </div>

          <div
            id="pincode-result"
            className={`serve__result ${result ? `is-${result.status}` : ''}`}
            role="status"
            aria-live="polite"
          >
            {result ? (
              <>
                <strong>{result.message}</strong>
                {result.status === 'yes' && (
                  <span>
                    {result.zone.label} · {result.eta} · delivery {inr(DELIVERY.fee)}, free over{' '}
                    {inr(DELIVERY.freeAbove)}
                  </span>
                )}
                {result.status === 'soon' && (
                  <span>Order for pickup from Bandra, or call us — we make exceptions.</span>
                )}
                {result.status === 'no' && <span>Pickup is always available at Pali Naka.</span>}
              </>
            ) : (
              <span className="serve__hint">
                Six digits. We cover Bandra to Sion, {DELIVERY.prepMins} min in the oven.
              </span>
            )}
          </div>
        </form>
        ) : (
          <div className="serve__pickup reveal">
            <p className="serve__pickup-eta mono">{modeInfo.eta}</p>
            <p className="serve__pickup-addr">
              {OUTLET.line1}
              <br />
              {OUTLET.line2}
            </p>
            <a
              className="btn btn--ghost"
              href={OUTLET.mapsHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open in Maps
            </a>
          </div>
        )}
      </div>
    </section>
  )
}
