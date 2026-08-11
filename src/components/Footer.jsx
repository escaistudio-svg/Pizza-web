import PizzaO from './PizzaO.jsx'
import { CONTACT, OUTLET, PAYMENTS, GST_NOTE, storeStatus } from '../data/config.js'

const COLUMNS = [
  {
    title: 'Order',
    links: [
      { label: 'Build a pie', href: '#studio' },
      { label: 'The Atlas', href: '#atlas' },
      { label: 'Desserts', href: '#desserts' },
      { label: 'Check your pincode', href: '#delivery' },
    ],
  },
  {
    title: 'Kitchen',
    links: [
      { label: 'The story', href: '#story' },
      { label: 'FAQ', href: '#faq' },
      { label: CONTACT.email, href: `mailto:${CONTACT.email}` },
      { label: CONTACT.instagram, href: CONTACT.instagramHref },
    ],
  },
  {
    title: 'Visit',
    text: [OUTLET.line1, OUTLET.line2, OUTLET.maharashtra],
    mapsHref: OUTLET.mapsHref,
  },
]

export default function Footer() {
  const status = storeStatus()

  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__mark" data-speed="0.05">
          FL
          <PizzaO progress={1} spin counter="var(--ink)" />
          URCHILD
        </div>

        <div className="footer__grid">
          {COLUMNS.map((col) => (
            <div className="footer__col" key={col.title}>
              <h4>{col.title}</h4>
              {col.links && (
                <ul>
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a href={link.href}>{link.label}</a>
                    </li>
                  ))}
                </ul>
              )}
              {col.text && (
                <ul>
                  {col.text.map((line) => (
                    <li key={line}>
                      <p>{line}</p>
                    </li>
                  ))}
                  {col.mapsHref && (
                    <li>
                      <a href={col.mapsHref} target="_blank" rel="noopener noreferrer">
                        Open in Maps →
                      </a>
                    </li>
                  )}
                </ul>
              )}
            </div>
          ))}

          <div className="footer__col">
            <h4>Hours</h4>
            <ul className="footer__hours">
              {OUTLET.hours.map((h) => (
                <li key={h.day}>
                  <span>{h.day}</span>
                  <span className="num">{h.open ? `${h.open}–${h.close}` : 'Closed'}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="footer__legal">
          <span className="footer__fssai">
            <span className="footer__fssai-mark" aria-hidden="true" />
            FSSAI Lic. No. <span className="num">{OUTLET.fssai}</span>
          </span>
          <span>{GST_NOTE}</span>
          <span>{PAYMENTS.join(' · ')}</span>
        </div>

        <div className="footer__base">
          <span>© {new Date().getFullYear()} Flourchild, Mumbai. One oven, seven passports.</span>
          <span>{status.open ? 'Open now' : status.label} · Fired to order</span>
        </div>
      </div>
    </footer>
  )
}
