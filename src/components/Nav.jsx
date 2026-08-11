import { useEffect, useState } from 'react'
import PizzaO from './PizzaO.jsx'
import { useStore, selectBagCount } from '../store.js'
import { scrollState } from '../scroll.js'
import { CONTACT, storeStatus } from '../data/config.js'

const LINKS = [
  { href: '#atlas', label: 'The Atlas' },
  { href: '#desserts', label: 'Desserts' },
  { href: '#studio', label: 'Build a Pie' },
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
          <a className="nav__call" href={CONTACT.phoneHref}>
            <span className={`dot ${status.open ? 'dot--open' : 'dot--shut'}`} aria-hidden="true" />
            <span className="nav__call-num">{CONTACT.phoneDisplay}</span>
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
