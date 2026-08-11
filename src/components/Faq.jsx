import { useState } from 'react'
import Reveal from './Reveal.jsx'
import { CONTACT, DELIVERY, OUTLET, inr } from '../data/config.js'

const FAQS = [
  {
    q: 'Do you have Jain and no-onion-no-garlic options?',
    a: `Yes. Ask for Jain on any vegetarian pie and we'll build it without onion, garlic or root vegetables — the Margherita, Quattro Formaggi and Masala Corn take to it best. Call us rather than ordering online so the kitchen sees the note.`,
  },
  {
    q: 'Is the cheese vegetarian?',
    a: `All our mozzarella and fior di latte are made with microbial rennet, so every pie marked with the green dot is genuinely vegetarian. The gorgonzola on the Quattro Formaggi is the one exception — it uses animal rennet, and we mark it accordingly.`,
  },
  {
    q: 'How long does delivery take?',
    a: `${DELIVERY.prepMins} minutes in the kitchen, then 30–65 depending on your hub. Bandra, Khar and Santacruz are quickest. Enter your pincode above for an exact window — we'd rather quote honestly than promise thirty minutes to Sion.`,
  },
  {
    q: 'What are the delivery charges?',
    a: `${inr(DELIVERY.fee)} flat, free on orders over ${inr(DELIVERY.freeAbove)}. Minimum order is ${inr(DELIVERY.minOrder)}. Pickup from Pali Naka is always free and about twenty minutes.`,
  },
  {
    q: 'Can I order for a party or an office lunch?',
    a: `Yes — anything over eight pies, give us four hours. Call ${CONTACT.phoneDisplay} and we'll work out sizes, a veg/non-veg split and timing so everything lands hot at once.`,
  },
  {
    q: 'Why is it more expensive than a chain pizza?',
    a: `The dough ferments for 72 hours, the tomatoes are San Marzano, the mozzarella is made fresh, and every pie is stretched by hand and fired for ninety seconds. Nothing is par-baked and nothing sits under a lamp. That costs more to make.`,
  },
  {
    q: 'Do you cater to allergies?',
    a: `Tell us when you order. We can't promise a nut-free or gluten-free kitchen — flour is airborne and we use pistachio and hazelnut on the dessert menu — but we'll tell you honestly what's safe.`,
  },
  {
    q: 'Where are you, and when are you open?',
    a: `${OUTLET.line1}, ${OUTLET.line2}. Tuesday to Sunday, noon till eleven — midnight on Friday and Saturday. Closed Mondays, when the starter gets a rest.`,
  },
]

function Item({ faq, open, onToggle, id }) {
  return (
    <li className={`faq__item ${open ? 'is-open' : ''}`}>
      <h3>
        <button
          type="button"
          className="faq__q"
          aria-expanded={open}
          aria-controls={`faq-panel-${id}`}
          id={`faq-btn-${id}`}
          onClick={onToggle}
        >
          <span>{faq.q}</span>
          <span className="faq__icon" aria-hidden="true" />
        </button>
      </h3>
      <div
        className="faq__panel"
        id={`faq-panel-${id}`}
        role="region"
        aria-labelledby={`faq-btn-${id}`}
        hidden={!open}
      >
        <p>{faq.a}</p>
      </div>
    </li>
  )
}

export default function Faq() {
  const [open, setOpen] = useState(0)

  return (
    <section className="faq" id="faq">
      <div className="shell faq__grid">
        <div className="faq__intro">
          <span className="eyebrow reveal">Questions</span>
          <Reveal as="h2" className="faq__title">
            Before you ask.
          </Reveal>
          <p className="faq__aside reveal">
            Still stuck? Call {CONTACT.phoneDisplay} — a person picks up, not a menu tree.
          </p>
        </div>

        <ul className="faq__list">
          {FAQS.map((faq, i) => (
            <Item
              key={faq.q}
              id={i}
              faq={faq}
              open={open === i}
              onToggle={() => setOpen(open === i ? -1 : i)}
            />
          ))}
        </ul>
      </div>
    </section>
  )
}
