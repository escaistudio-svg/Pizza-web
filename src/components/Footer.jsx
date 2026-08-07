import PizzaO from './PizzaO.jsx'

const COLUMNS = [
  {
    title: 'Order',
    links: [
      { label: 'Build a pie', href: '#studio' },
      { label: 'The Atlas', href: '#atlas' },
      { label: 'Delivery — 4 mile radius', href: '#studio' },
      { label: 'Pickup — 20 min', href: '#studio' },
    ],
  },
  {
    title: 'Kitchen',
    links: [
      { label: 'The story', href: '#story' },
      { label: 'Sourcing', href: '#story' },
      { label: 'Fermentation log', href: '#story' },
    ],
  },
  {
    title: 'Visit',
    text: ['218 Fulton Street', 'Brooklyn, NY', 'Wed–Sun · 5pm till the dough runs out'],
  },
]

export default function Footer() {
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
                </ul>
              )}
            </div>
          ))}

          <div className="footer__col">
            <h4>Say hello</h4>
            <ul>
              <li>
                <a href="mailto:hello@flourchild.pizza">hello@flourchild.pizza</a>
              </li>
              <li>
                <a href="#top">@flourchild</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer__base">
          <span>© {new Date().getFullYear()} Flourchild. One oven, seven passports.</span>
          <span>Fired to order · Never par-baked</span>
        </div>
      </div>
    </footer>
  )
}
