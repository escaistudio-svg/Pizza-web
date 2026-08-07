/**
 * Re-mounts on every text change so each character rolls in on its own beat.
 * The `key` is the whole string — that's the trick that restarts the CSS
 * animation without any JS timeline.
 */
export default function SwapText({ text, className = '', stagger = 22 }) {
  return (
    <span key={text} className={className}>
      {Array.from(text).map((char, i) => (
        <span
          key={i}
          className="swap__char"
          style={{ '--i': i, animationDelay: `${i * stagger}ms` }}
          aria-hidden={char === ' '}
        >
          {char}
        </span>
      ))}
    </span>
  )
}
