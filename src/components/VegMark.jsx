/**
 * The FSSAI veg / non-veg mark.
 *
 * Indian packaging and menu rules require a filled circle inside a square
 * outline — green for vegetarian, brown for non-vegetarian. It's a legal
 * requirement, not decoration, so it renders at every size the menu uses and
 * always carries a text label for screen readers.
 *
 * Egg is marked non-vegetarian under the FSSAI amendment, but diners still
 * want to know the difference, so `egg` adds a note without changing the mark.
 */
export default function VegMark({ veg, egg, small = false, label = true }) {
  const kind = veg ? 'veg' : 'nonveg'
  const text = veg
    ? 'Vegetarian'
    : egg
      ? 'Contains egg — non-vegetarian'
      : 'Non-vegetarian'

  return (
    <span
      className={`vegmark vegmark--${kind} ${small ? 'vegmark--sm' : ''}`}
      title={text}
    >
      <span className="vegmark__box" aria-hidden="true">
        <span className="vegmark__dot" />
      </span>
      {label && <span className="sr-only">{text}</span>}
      {egg && !small && <span className="vegmark__egg">egg</span>}
    </span>
  )
}
