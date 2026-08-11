import { useEffect, useState } from 'react'
import PizzaO from './PizzaO.jsx'
import { useStore, selectBagCount } from '../store.js'
import { scrollState } from '../scroll.js'
import { CONTACT, storeStatus } from '../data/config.js'

const LINKS = [
  { href: '#atlas', label: 'The Atlas' },
  { href: '#desserts', label: 'Desserts' },
  { href: '#studio', label: 'Build a Pie' },
  { href: '#offers', label: 'Offers' },
  { href: '#delivery', label: 'Delivery' },
  { href: '#faq', label: 'FAQ' },
]

export default function Nav() {
  const [stuck, setStuck] = useState(false)
  const count = useStore(selectBagCount)
  const lastAdded = useStore((s) => s.lastAdded)
  const openBag = useStore((s) => s.openBag)
  const status = storeStatus()

  useEffect(() => {
    let frame
    const check = () => {
      setStuck(scrollState.y > 40 || window.scrollY > 40)
      frame = requestAnimationFrame(check)
    }
    frame = requestAnimationFrame(check)
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <header className={`nav ${stuck ? 'is-stuck' : ''}`}>
      <div className="nav__inner">
        <a href="#top" className="nav__logo" aria-label="FLOURCHILD — home">
          FL
          <PizzaO progress={1} counter={stuck ? 'var(--cream)' : 'var(--cream)'} />
          URCHILD
        </a>

        <nav className="nav__links">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="nav__link">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="nav__actions">
          <a
            className="nav__call"
            href={CONTACT.phoneHref}
            aria-label={`Call ${CONTACT.phoneDisplay} — ${status.label}`}
            title={`${CONTACT.phoneDisplay} · ${status.label}`}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
            </svg>
            <span className={`nav__call-dot dot ${status.open ? 'dot--open' : 'dot--shut'}`} aria-hidden="true" />
          </a>

          <button
            type="button"
            className={`nav__bag ${lastAdded ? 'is-bumped' : ''}`}
            onClick={openBag}
            aria-label={`Open bag, ${count} item${count === 1 ? '' : 's'}`}
          >
            Bag
            <span className="nav__bag-count num">{count}</span>
          </button>
        </div>
      </div>
    </header>
  )
}
