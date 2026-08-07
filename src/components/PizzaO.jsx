import { useMemo } from 'react'

/**
 * The FLOURCHILD logo mark: the "O" of the wordmark, drawn as a pizza.
 *
 * It's an annulus — crust on the outside, the letter's counter punched through
 * the middle — so it reads as an O in the wordmark and as a pizza on its own.
 * `progress` (0..1) reveals the toppings, which is what the loader animates.
 */

const TOPPINGS = [
  { a: -68, r: 33, kind: 'pep' },
  { a: 12, r: 35, kind: 'basil' },
  { a: 74, r: 32, kind: 'pep' },
  { a: 138, r: 34, kind: 'olive' },
  { a: 196, r: 33, kind: 'pep' },
  { a: 248, r: 35, kind: 'basil' },
  { a: 300, r: 32, kind: 'olive' },
  { a: 340, r: 34, kind: 'pep' },
]

export default function PizzaO({
  progress = 1,
  spin = false,
  counter = 'var(--cream)',
  className = '',
  ...props
}) {
  const revealed = Math.round(progress * TOPPINGS.length)

  const cheeseBlobs = useMemo(
    () => [
      { cx: 50, cy: 20, r: 7.5 },
      { cx: 76, cy: 42, r: 6.2 },
      { cx: 66, cy: 74, r: 7 },
      { cx: 32, cy: 74, r: 6 },
      { cx: 22, cy: 44, r: 7.2 },
    ],
    []
  )

  return (
    <svg
      viewBox="0 0 100 100"
      className={`pizza-o ${spin ? '' : 'pizza-o--static'} ${className}`}
      role="img"
      aria-label="FLOURCHILD"
      {...props}
    >
      <defs>
        <radialGradient id="po-crust" cx="38%" cy="30%" r="78%">
          <stop offset="0%" stopColor="#F3C87E" />
          <stop offset="62%" stopColor="#E9A63C" />
          <stop offset="100%" stopColor="#C9822A" />
        </radialGradient>
        <radialGradient id="po-sauce" cx="42%" cy="34%" r="72%">
          <stop offset="0%" stopColor="#E24A2E" />
          <stop offset="100%" stopColor="#B32718" />
        </radialGradient>
        <mask id="po-hole">
          <rect width="100" height="100" fill="#fff" />
          <circle cx="50" cy="50" r="17" fill="#000" />
        </mask>
      </defs>

      <g className="pizza-o__spin">
        <g mask="url(#po-hole)">
          {/* crust */}
          <circle cx="50" cy="50" r="48" fill="url(#po-crust)" />
          {/* char spots on the rim */}
          {[18, 62, 110, 168, 214, 268, 322].map((a, i) => {
            const rad = (a * Math.PI) / 180
            return (
              <circle
                key={a}
                cx={50 + Math.cos(rad) * 43.5}
                cy={50 + Math.sin(rad) * 43.5}
                r={i % 2 ? 2.6 : 3.4}
                fill="#A9691F"
                opacity="0.55"
              />
            )
          })}
          {/* sauce */}
          <circle cx="50" cy="50" r="40" fill="url(#po-sauce)" />
          {/* cheese */}
          {cheeseBlobs.map((b, i) => (
            <circle key={i} {...b} fill="#F6E3B4" opacity="0.92" />
          ))}
          <circle cx="50" cy="50" r="30" fill="#F4E0AE" opacity="0.55" />

          {/* toppings — revealed by `progress` */}
          {TOPPINGS.map((t, i) => {
            const rad = (t.a * Math.PI) / 180
            const cx = 50 + Math.cos(rad) * t.r
            const cy = 50 + Math.sin(rad) * t.r
            const on = i < revealed
            return (
              <g
                key={i}
                className="pizza-o__topping"
                data-on={on}
                style={{ transitionDelay: `${i * 45}ms` }}
              >
                {t.kind === 'pep' && (
                  <>
                    <circle cx={cx} cy={cy} r="5.6" fill="#B32718" />
                    <circle cx={cx - 1.4} cy={cy - 1.4} r="1.5" fill="#D9573C" opacity="0.8" />
                  </>
                )}
                {t.kind === 'basil' && (
                  <ellipse
                    cx={cx}
                    cy={cy}
                    rx="3.2"
                    ry="5.4"
                    fill="#2F6B3C"
                    transform={`rotate(${t.a + 40} ${cx} ${cy})`}
                  />
                )}
                {t.kind === 'olive' && (
                  <>
                    <circle cx={cx} cy={cy} r="4.2" fill="#2B2119" />
                    <circle cx={cx} cy={cy} r="1.7" fill="#8E5A2E" />
                  </>
                )}
              </g>
            )
          })}
        </g>

        {/* the letter's counter */}
        <circle cx="50" cy="50" r="17" fill={counter} />
      </g>
    </svg>
  )
}
