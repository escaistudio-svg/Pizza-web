/**
 * A masked line reveal.
 *
 * The wipe lives on an inner span rather than on the observed element itself —
 * a `clip-path` that collapses the element also collapses the box
 * IntersectionObserver measures, so a self-clipping element can never learn
 * that it's on screen. The outer box stays full-size; only its contents move.
 */
export default function Reveal({
  as: Tag = 'div',
  className = '',
  delay = 0,
  children,
  ...props
}) {
  return (
    <Tag
      className={`mask ${className}`}
      style={delay ? { '--reveal-delay': `${delay}s` } : undefined}
      {...props}
    >
      <span className="mask__inner">{children}</span>
    </Tag>
  )
}
