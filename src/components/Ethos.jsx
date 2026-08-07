import Reveal from './Reveal.jsx'

const STATS = [
  { value: '72', unit: 'h', label: 'Cold ferment' },
  { value: '480', unit: '°', label: 'Stone temp' },
  { value: '90', unit: 's', label: 'In the fire' },
  { value: '42', unit: '', label: 'Pies on the menu' },
]

export default function Ethos() {
  return (
    <section className="section ethos" id="story">
      <div className="shell ethos__grid">
        <Reveal as="h2" className="ethos__statement" data-speed="0.06">
          One oven. <em>Seven passports.</em> Nothing waits under a lamp.
        </Reveal>

        <p className="ethos__aside reveal" style={{ '--reveal-delay': '0.2s' }} data-speed="0.14">
          Flourchild started as one person, one Neapolitan oven, and a habit of
          eating pizza in every city that claims to make it best. The menu is
          the notebook.
        </p>

        <div className="ethos__stats">
          {STATS.map((stat, i) => (
            <div
              className="stat reveal"
              key={stat.label}
              style={{ '--reveal-delay': `${i * 0.09}s` }}
            >
              <div className="stat__value">
                {stat.value}
                {stat.unit && <sup>{stat.unit}</sup>}
              </div>
              <div className="stat__label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
