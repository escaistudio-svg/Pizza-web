import { useState } from 'react'
import Reveal from './Reveal.jsx'
import { OFFERS } from '../data/menu.js'
import { CONTACT, inr } from '../data/config.js'

function Card({ offer }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    if (!offer.code) return
    try {
      await navigator.clipboard.writeText(offer.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard can be blocked; the code is on screen either way.
      setCopied(false)
    }
  }

  return (
    <article className={`offer offer--${offer.kind}`}>
      <div className="offer__top">
        <h3 className="offer__title">{offer.title}</h3>
        {offer.note && <span className="offer__note">{offer.note}</span>}
      </div>

      <p className="offer__blurb">{offer.blurb}</p>

      <div className="offer__foot">
        {offer.price ? (
          <span className="offer__price">
            <span className="num">{inr(offer.price)}</span>
            {offer.was && <s className="num offer__was">{inr(offer.was)}</s>}
          </span>
        ) : (
          <span className="offer__price offer__price--none" />
        )}

        {offer.code ? (
          <button type="button" className="offer__code" onClick={copy}>
            <span className="num">{offer.code}</span>
            <em>{copied ? 'Copied' : 'Tap to copy'}</em>
          </button>
        ) : (
          <a className="offer__code offer__code--call" href={CONTACT.phoneHref}>
            <span>Call to book</span>
            <em>{CONTACT.phoneDisplay}</em>
          </a>
        )}
      </div>
    </article>
  )
}

export default function Offers() {
  return (
    <section className="offers" id="offers">
      <div className="shell">
        <div className="offers__head">
          <div>
            <span className="eyebrow">Offers</span>
            <Reveal as="h2" className="offers__title">
              Worth ordering on a Tuesday.
            </Reveal>
          </div>
          <p className="offers__aside reveal">
            No app, no membership. Codes go in at checkout.
          </p>
        </div>

        <div className="offers__grid">
          {OFFERS.map((offer) => (
            <Card key={offer.id} offer={offer} />
          ))}
        </div>
      </div>
    </section>
  )
}
