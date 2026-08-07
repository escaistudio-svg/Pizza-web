const ITEMS = [
  '72-hour cold ferment',
  '480° stone',
  'Ninety seconds in the fire',
  'Stretched by hand, never rolled',
  'Seven countries',
  'Fired to order',
  'No par-bake, no heat lamp',
]

function Run({ 'aria-hidden': hidden }) {
  return (
    <div className="ticker__run" aria-hidden={hidden}>
      {ITEMS.map((item) => (
        <span className="ticker__item" key={item}>
          <i className="ticker__dot" />
          {item}
        </span>
      ))}
    </div>
  )
}

export default function Ticker() {
  return (
    <div className="ticker">
      <Run />
      <Run aria-hidden />
    </div>
  )
}
