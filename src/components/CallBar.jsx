import { useEffect, useState } from 'react'
import { CONTACT, storeStatus } from '../data/config.js'
import { useStore, selectBagCount } from '../store.js'
import { scrollState } from '../scroll.js'

const waHref = `${CONTACT.whatsappHref}?text=${encodeURIComponent(CONTACT.whatsappMessage)}`

/**
 * Phone-first ordering, which is still how a lot of India orders food.
 *
 * On mobile this docks to the bottom of the screen once you're past the hero —
 * thumb reach, always one tap from a call or a WhatsApp. It hides itself while
 * the bag drawer is open so it can't sit on top of the checkout button.
 */
export default function CallBar() {
  const [visible, setVisible] = useState(false)
  const bagOpen = useStore((s) => s.bagOpen)
  const openBag = useStore((s) => s.openBag)
  const count = useStore(selectBagCount)
  const status = storeStatus()

  useEffect(() => {
    let frame
    const check = () => {
      const y = scrollState.y || window.scrollY
      setVisible(y > window.innerHeight * 0.75)
      frame = requestAnimationFrame(check)
    }
    frame = requestAnimationFrame(check)
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div className={`callbar ${visible && !bagOpen ? 'is-up' : ''}`}>
      <a className="callbar__btn callbar__btn--call" href={CONTACT.phoneHref}>
        <span className="callbar__ico" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
          </svg>
        </span>
        <span className="callbar__label">
          Call
          <em>{status.open ? 'Open now' : status.label}</em>
        </span>
      </a>

      <a
        className="callbar__btn callbar__btn--wa"
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="callbar__ico" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Zm5.6 14.2c-.2.7-1.3 1.3-1.9 1.3-.5 0-1.1.2-3.6-.8-3-1.3-5-4.4-5.1-4.6-.2-.2-1.2-1.6-1.2-3s.8-2.1 1-2.4c.3-.3.6-.4.8-.4h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .6l-.4.5-.3.4c-.1.2-.3.3-.1.6.2.3.8 1.4 1.8 2.3 1.3 1.1 2.3 1.5 2.6 1.6.2.1.4.1.6-.1l.8-1c.2-.2.3-.2.6-.1l2 1c.3.1.5.2.5.3.1.2.1.7-.2 1.2Z" />
          </svg>
        </span>
        <span className="callbar__label">
          WhatsApp
          <em>Order in chat</em>
        </span>
      </a>

      <button type="button" className="callbar__btn callbar__btn--bag" onClick={openBag}>
        <span className="callbar__label">
          Bag
          <em>{count} item{count === 1 ? '' : 's'}</em>
        </span>
      </button>
    </div>
  )
}
